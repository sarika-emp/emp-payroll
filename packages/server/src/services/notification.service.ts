import { getDB } from "../db/adapters";
import { EmailService } from "./email.service";
import { EmailTemplateService } from "./email-template.service";
import { logger } from "../utils/logger";

export class NotificationService {
  private db = getDB();
  private emailSvc = new EmailService();
  private tmplSvc = new EmailTemplateService();

  /**
   * Send tax declaration deadline reminders to all employees who haven't
   * submitted their proofs yet for the given financial year.
   */
  async sendDeclarationReminders(orgId: string, params: {
    financialYear: string;
    deadlineDate: string;
  }): Promise<{ sent: number; skipped: number }> {
    const employees = await this.db.findMany<any>("employees", {
      filters: { org_id: orgId, is_active: true },
      limit: 10000,
    });

    const org = await this.db.findById<any>("organizations", orgId);
    const template = await this.tmplSvc.getTemplate("declaration_reminder", orgId);
    let sent = 0;
    let skipped = 0;

    for (const emp of employees.data) {
      // Check if employee has any pending (unsubmitted) declarations
      const declarations = await this.db.findMany<any>("tax_declarations", {
        filters: { employee_id: emp.id, financial_year: params.financialYear },
        limit: 1,
      });

      // Send reminder if no declarations submitted or if proofs pending
      const hasSubmitted = declarations.data.length > 0;
      if (!hasSubmitted) {
        try {
          const subject = this.tmplSvc.render(template.subject, {
            org_name: org?.name || "EMP Payroll",
            employee_name: emp.first_name,
          });
          const body = this.tmplSvc.render(template.body, {
            employee_name: emp.first_name,
            org_name: org?.name || "EMP Payroll",
            financial_year: params.financialYear,
            deadline_date: new Date(params.deadlineDate).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
            }),
          });
          await this.emailSvc.sendRaw({ to: emp.email, subject, html: body });
          sent++;
        } catch {
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    logger.info(`Declaration reminders: sent=${sent}, skipped=${skipped}`);
    return { sent, skipped };
  }

  /**
   * Send welcome email to a newly created employee.
   */
  async sendWelcomeEmail(employeeId: string): Promise<boolean> {
    const emp = await this.db.findById<any>("employees", employeeId);
    if (!emp) return false;

    const org = await this.db.findById<any>("organizations", emp.org_id);
    const template = await this.tmplSvc.getTemplate("welcome", emp.org_id);

    const subject = this.tmplSvc.render(template.subject, {
      org_name: org?.name || "EMP Payroll",
    });
    const body = this.tmplSvc.render(template.body, {
      employee_name: emp.first_name,
      employee_code: emp.employee_code,
      email: emp.email,
      org_name: org?.name || "EMP Payroll",
    });

    return this.emailSvc.sendRaw({ to: emp.email, subject, html: body });
  }

  /**
   * Send payroll approved notification to HR admin.
   */
  async sendPayrollApprovedNotification(runId: string, orgId: string): Promise<boolean> {
    const run = await this.db.findById<any>("payroll_runs", runId);
    if (!run) return false;

    const org = await this.db.findById<any>("organizations", orgId);
    const template = await this.tmplSvc.getTemplate("payroll_approved", orgId);
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const fmt = (n: number) => new Intl.NumberFormat("en-IN", {
      style: "currency", currency: org?.currency || "INR", maximumFractionDigits: 0,
    }).format(n);

    // Find HR admins to notify
    const admins = await this.db.findMany<any>("employees", {
      filters: { org_id: orgId, role: "hr_admin", is_active: true },
      limit: 10,
    });

    for (const admin of admins.data) {
      const subject = this.tmplSvc.render(template.subject, {
        period: `${monthNames[run.month]} ${run.year}`,
        org_name: org?.name || "EMP Payroll",
      });
      const body = this.tmplSvc.render(template.body, {
        period: `${monthNames[run.month]} ${run.year}`,
        employee_count: String(run.employee_count || 0),
        gross_pay: fmt(run.total_gross),
        net_pay: fmt(run.total_net),
        org_name: org?.name || "EMP Payroll",
      });
      await this.emailSvc.sendRaw({ to: admin.email, subject, html: body });
    }

    return true;
  }
}
