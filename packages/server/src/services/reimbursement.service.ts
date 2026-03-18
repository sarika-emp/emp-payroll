import { getDB } from "../db/adapters";
import { AppError } from "../api/middleware/error.middleware";

export class ReimbursementService {
  private db = getDB();

  async list(orgId: string, filters?: { status?: string; employeeId?: string }) {
    // Get employees for this org, then filter reimbursements
    const employees = await this.db.findMany<any>("employees", {
      filters: { org_id: orgId, is_active: true },
      limit: 10000,
    });
    const empIds = employees.data.map((e: any) => e.id);
    if (empIds.length === 0) return { data: [], total: 0, page: 1, limit: 50, totalPages: 0 };

    const queryFilters: any = { employee_id: empIds };
    if (filters?.status) queryFilters.status = filters.status;
    if (filters?.employeeId) queryFilters.employee_id = filters.employeeId;

    const result = await this.db.findMany<any>("reimbursements", {
      filters: queryFilters,
      sort: { field: "created_at", order: "desc" },
      limit: 100,
    });

    // Attach employee names
    const empMap: Record<string, any> = {};
    for (const emp of employees.data) empMap[emp.id] = emp;

    const enriched = result.data.map((r: any) => ({
      ...r,
      employee_name: empMap[r.employee_id]
        ? `${empMap[r.employee_id].first_name} ${empMap[r.employee_id].last_name}`
        : "Unknown",
      employee_code: empMap[r.employee_id]?.employee_code || "",
    }));

    return { ...result, data: enriched };
  }

  async getByEmployee(employeeId: string) {
    return this.db.findMany<any>("reimbursements", {
      filters: { employee_id: employeeId },
      sort: { field: "created_at", order: "desc" },
      limit: 100,
    });
  }

  async submit(employeeId: string, data: {
    category: string;
    description: string;
    amount: number;
    expenseDate: string;
  }) {
    return this.db.create("reimbursements", {
      employee_id: employeeId,
      category: data.category,
      description: data.description,
      amount: data.amount,
      expense_date: data.expenseDate,
      status: "pending",
    });
  }

  async approve(id: string, approverId: string, amount?: number) {
    const claim = await this.db.findById<any>("reimbursements", id);
    if (!claim) throw new AppError(404, "NOT_FOUND", "Claim not found");
    if (claim.status !== "pending") throw new AppError(400, "INVALID_STATUS", "Only pending claims can be approved");

    return this.db.update("reimbursements", id, {
      status: "approved",
      approved_by: approverId,
      approved_at: new Date(),
      amount: amount || claim.amount,
    });
  }

  async reject(id: string, approverId: string) {
    const claim = await this.db.findById<any>("reimbursements", id);
    if (!claim) throw new AppError(404, "NOT_FOUND", "Claim not found");
    if (claim.status !== "pending") throw new AppError(400, "INVALID_STATUS", "Only pending claims can be rejected");

    return this.db.update("reimbursements", id, {
      status: "rejected",
      approved_by: approverId,
      approved_at: new Date(),
    });
  }

  async markPaid(id: string, month: number, year: number) {
    return this.db.update("reimbursements", id, {
      status: "paid",
      paid_in_month: month,
      paid_in_year: year,
    });
  }
}
