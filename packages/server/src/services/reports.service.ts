import { getDB } from "../db/adapters";
import { AppError } from "../api/middleware/error.middleware";
import { computePF, computeESI } from "./compliance/india-statutory.service";

export class ReportsService {
  private db = getDB();

  /** PF ECR (Electronic Challan cum Return) format */
  async generatePFECR(runId: string, orgId: string): Promise<{ filename: string; content: string }> {
    const { payslips, employees, org } = await this.getRunData(runId, orgId);

    const lines: string[] = [];
    // ECR Header
    lines.push(`#~#${org?.pf_establishment_code || ""}#~#TRRN#~#${org?.name || ""}#~#`);

    for (const ps of payslips) {
      const emp = employees[ps.employee_id];
      if (!emp) continue;
      const pfDetails = this.parseJSON(emp.pf_details);
      const components = this.parseJSON(
        (await this.db.findOne<any>("employee_salaries", { employee_id: emp.id, is_active: true }))?.components
      );
      const basicMonthly = components.find((c: any) => c.code === "BASIC")?.monthlyAmount || 0;

      const pf = computePF({
        employeeId: emp.id,
        month: ps.month,
        year: ps.year,
        basicSalary: basicMonthly,
      });

      // UAN, Name, Gross Wages, EPF Wages, EPS Wages, EDLI Wages, EPF Contribution, EPS Contribution, Diff
      lines.push([
        (this.parseJSON(emp.tax_info)).uan || "",
        `${emp.first_name} ${emp.last_name}`,
        Math.round(Number(ps.gross_earnings)),
        pf.pfWages,
        pf.pfWages,
        pf.pfWages,
        pf.employeeEPF,
        pf.employerEPS,
        0,
        pfDetails.pfNumber || "",
      ].join("#~#"));
    }

    return {
      filename: `PF-ECR-${ps_period(payslips[0])}.txt`,
      content: lines.join("\n"),
    };
  }

  /** ESI Monthly Return */
  async generateESIReturn(runId: string, orgId: string): Promise<{ filename: string; content: string }> {
    const { payslips, employees, org } = await this.getRunData(runId, orgId);

    const headers = ["IP Number", "IP Name", "No of Days", "Total Wages", "IP Contribution", "Employer Contribution", "Total"];
    const rows: string[] = [headers.join(",")];

    for (const ps of payslips) {
      const emp = employees[ps.employee_id];
      if (!emp) continue;

      const esi = computeESI({
        employeeId: emp.id,
        month: ps.month,
        year: ps.year,
        grossSalary: Number(ps.gross_earnings),
      });

      if (!esi) continue;

      const esiDetails = this.parseJSON(emp.esi_details);
      rows.push([
        `"${esiDetails?.esiNumber || ""}"`,
        `"${emp.first_name} ${emp.last_name}"`,
        ps.paid_days,
        ps.gross_earnings,
        esi.employeeContribution,
        esi.employerContribution,
        esi.total,
      ].join(","));
    }

    return {
      filename: `ESI-Return-${ps_period(payslips[0])}.csv`,
      content: rows.join("\n"),
    };
  }

  /** TDS Summary (Form 24Q data) */
  async generateTDSSummary(runId: string, orgId: string): Promise<any[]> {
    const { payslips, employees } = await this.getRunData(runId, orgId);

    return payslips.map((ps: any) => {
      const emp = employees[ps.employee_id];
      if (!emp) return null;
      const taxInfo = this.parseJSON(emp.tax_info);
      const deductions = this.parseJSON(ps.deductions);
      const tds = deductions.find((d: any) => d.code === "TDS");

      return {
        employeeCode: emp.employee_code,
        name: `${emp.first_name} ${emp.last_name}`,
        pan: taxInfo.pan || "",
        grossSalary: Number(ps.gross_earnings),
        tdsDeducted: tds?.amount || 0,
        month: ps.month,
        year: ps.year,
      };
    }).filter(Boolean);
  }

  /** PT Return */
  async generatePTReturn(runId: string, orgId: string): Promise<{ filename: string; content: string }> {
    const { payslips, employees } = await this.getRunData(runId, orgId);

    const headers = ["Employee Code", "Name", "Gross Salary", "PT Amount"];
    const rows: string[] = [headers.join(",")];

    for (const ps of payslips) {
      const emp = employees[ps.employee_id];
      if (!emp) continue;
      const deductions = this.parseJSON(ps.deductions);
      const pt = deductions.find((d: any) => d.code === "PT");
      if (!pt || pt.amount <= 0) continue;

      rows.push([
        `"${emp.employee_code}"`,
        `"${emp.first_name} ${emp.last_name}"`,
        ps.gross_earnings,
        pt.amount,
      ].join(","));
    }

    return {
      filename: `PT-Return-${ps_period(payslips[0])}.csv`,
      content: rows.join("\n"),
    };
  }

  private async getRunData(runId: string, orgId: string) {
    const run = await this.db.findOne<any>("payroll_runs", { id: runId, org_id: orgId });
    if (!run) throw new AppError(404, "NOT_FOUND", "Payroll run not found");

    const payslipsResult = await this.db.findMany<any>("payslips", {
      filters: { payroll_run_id: runId },
      limit: 10000,
    });
    const payslips = payslipsResult.data;

    const empIds = [...new Set(payslips.map((p: any) => p.employee_id))];
    const employees: Record<string, any> = {};
    for (const empId of empIds) {
      const emp = await this.db.findById<any>("employees", empId as string);
      if (emp) employees[empId as string] = emp;
    }

    const org = await this.db.findById<any>("organizations", orgId);
    return { run, payslips, employees, org };
  }

  private parseJSON(val: any): any {
    if (!val) return {};
    if (typeof val === "string") try { return JSON.parse(val); } catch { return {}; }
    return val;
  }
}

function ps_period(ps: any): string {
  const months = ["", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${months[ps?.month || 1]}-${ps?.year || 2026}`;
}
