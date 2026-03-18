import { getDB } from "../db/adapters";
import { AppError } from "../api/middleware/error.middleware";

const DEFAULT_LEAVE_POLICY = [
  { leaveType: "earned", annual: 15, carryForward: true },
  { leaveType: "casual", annual: 7, carryForward: false },
  { leaveType: "sick", annual: 7, carryForward: false },
];

const LEAVE_TYPE_LABELS: Record<string, string> = {
  earned: "Earned Leave",
  casual: "Casual Leave",
  sick: "Sick Leave",
  privilege: "Privilege Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  comp_off: "Compensatory Off",
};

// Leaves that count as paid leave in attendance
const PAID_LEAVE_TYPES = ["earned", "casual", "sick", "privilege", "maternity", "paternity"];

export class LeaveService {
  private db = getDB();

  // -------------------------------------------------------------------------
  // Balances
  // -------------------------------------------------------------------------
  async getBalances(employeeId: string, financialYear?: string) {
    const fy = financialYear || this.currentFY();
    const result = await this.db.findMany<any>("leave_balances", {
      filters: { employee_id: employeeId, financial_year: fy },
    });

    if (result.data.length === 0) {
      const balances = [];
      for (const policy of DEFAULT_LEAVE_POLICY) {
        const balance = await this.db.create("leave_balances", {
          employee_id: employeeId,
          leave_type: policy.leaveType,
          financial_year: fy,
          opening_balance: 0,
          accrued: policy.annual,
          used: 0,
          lapsed: 0,
          closing_balance: policy.annual,
        });
        balances.push(balance);
      }
      return { data: balances, total: balances.length, page: 1, limit: 20, totalPages: 1 };
    }

    return result;
  }

  async getOrgBalances(orgId: string, financialYear?: string) {
    const fy = financialYear || this.currentFY();
    const employees = await this.db.findMany<any>("employees", {
      filters: { org_id: orgId, is_active: true },
      limit: 1000,
    });

    const results = [];
    for (const emp of employees.data) {
      const balances = await this.getBalances(emp.id, fy);
      results.push({
        employeeId: emp.id,
        employeeName: `${emp.first_name} ${emp.last_name}`,
        employeeCode: emp.employee_code,
        department: emp.department,
        balances: balances.data,
      });
    }
    return results;
  }

  async recordLeave(employeeId: string, leaveType: string, days: number, fy?: string) {
    const financialYear = fy || this.currentFY();
    const balance = await this.db.findOne<any>("leave_balances", {
      employee_id: employeeId,
      leave_type: leaveType,
      financial_year: financialYear,
    });

    if (!balance) throw new AppError(404, "NOT_FOUND", "Leave balance not found");
    if (Number(balance.closing_balance) < days) {
      throw new AppError(400, "INSUFFICIENT_BALANCE", `Only ${balance.closing_balance} ${leaveType} leaves available`);
    }

    return this.db.update("leave_balances", balance.id, {
      used: Number(balance.used) + days,
      closing_balance: Number(balance.closing_balance) - days,
    });
  }

  async adjustBalance(employeeId: string, leaveType: string, adjustment: number, fy?: string) {
    const financialYear = fy || this.currentFY();
    const balance = await this.db.findOne<any>("leave_balances", {
      employee_id: employeeId,
      leave_type: leaveType,
      financial_year: financialYear,
    });

    if (!balance) throw new AppError(404, "NOT_FOUND", "Leave balance not found");
    return this.db.update("leave_balances", balance.id, {
      accrued: Number(balance.accrued) + adjustment,
      closing_balance: Number(balance.closing_balance) + adjustment,
    });
  }

  // -------------------------------------------------------------------------
  // Leave Requests (Application workflow)
  // -------------------------------------------------------------------------
  async applyLeave(employeeId: string, orgId: string, data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    isHalfDay?: boolean;
    halfDayPeriod?: "first_half" | "second_half";
  }) {
    const days = this.calculateDays(data.startDate, data.endDate, data.isHalfDay);

    // Check balance
    const balances = await this.getBalances(employeeId);
    const bal = balances.data.find((b: any) => b.leave_type === data.leaveType);
    if (!bal) throw new AppError(400, "INVALID_TYPE", `Leave type '${data.leaveType}' not found`);
    if (Number(bal.closing_balance) < days) {
      throw new AppError(400, "INSUFFICIENT_BALANCE",
        `Insufficient ${LEAVE_TYPE_LABELS[data.leaveType] || data.leaveType} balance. Available: ${bal.closing_balance}, Requested: ${days}`);
    }

    // Check for overlapping requests (pending or approved)
    const existing = await this.db.findMany<any>("leave_requests", {
      filters: { employee_id: employeeId },
    });
    const overlap = existing.data.find((r: any) => {
      if (r.status === "rejected" || r.status === "cancelled") return false;
      const rStart = new Date(r.start_date).getTime();
      const rEnd = new Date(r.end_date).getTime();
      const newStart = new Date(data.startDate).getTime();
      const newEnd = new Date(data.endDate).getTime();
      return newStart <= rEnd && newEnd >= rStart;
    });
    if (overlap) throw new AppError(400, "OVERLAP", "You already have a pending/approved leave for overlapping dates");

    return this.db.create("leave_requests", {
      employee_id: employeeId,
      org_id: orgId,
      leave_type: data.leaveType,
      start_date: data.startDate,
      end_date: data.endDate,
      days,
      is_half_day: data.isHalfDay || false,
      half_day_period: data.isHalfDay ? (data.halfDayPeriod || "first_half") : null,
      reason: data.reason,
      status: "pending",
    });
  }

  async getMyRequests(employeeId: string, status?: string) {
    const filters: any = { employee_id: employeeId };
    if (status) filters.status = status;
    return this.db.findMany<any>("leave_requests", {
      filters,
      sort: { field: "created_at", order: "desc" },
      limit: 100,
    });
  }

  async getOrgRequests(orgId: string, status?: string) {
    const filters: any = { org_id: orgId };
    if (status) filters.status = status;
    const requests = await this.db.findMany<any>("leave_requests", {
      filters,
      sort: { field: "created_at", order: "desc" },
      limit: 200,
    });

    const enriched = [];
    for (const req of requests.data) {
      const emp = await this.db.findOne<any>("employees", { id: req.employee_id });
      enriched.push({
        ...req,
        employeeName: emp ? `${emp.first_name} ${emp.last_name}` : "Unknown",
        employeeCode: emp?.employee_code,
        department: emp?.department,
      });
    }

    return { data: enriched, total: requests.total };
  }

  async approveLeave(requestId: string, approverId: string, remarks?: string) {
    const request = await this.db.findOne<any>("leave_requests", { id: requestId });
    if (!request) throw new AppError(404, "NOT_FOUND", "Leave request not found");
    if (request.status !== "pending") throw new AppError(400, "INVALID_STATUS", `Cannot approve a ${request.status} request`);

    // Deduct from balance
    await this.recordLeave(request.employee_id, request.leave_type, Number(request.days));

    // Sync with attendance
    await this.syncAttendanceOnApprove(request);

    return this.db.update("leave_requests", requestId, {
      status: "approved",
      approved_by: approverId,
      approver_remarks: remarks || null,
      approved_at: new Date(),
    });
  }

  async rejectLeave(requestId: string, approverId: string, remarks?: string) {
    const request = await this.db.findOne<any>("leave_requests", { id: requestId });
    if (!request) throw new AppError(404, "NOT_FOUND", "Leave request not found");
    if (request.status !== "pending") throw new AppError(400, "INVALID_STATUS", `Cannot reject a ${request.status} request`);

    return this.db.update("leave_requests", requestId, {
      status: "rejected",
      approved_by: approverId,
      approver_remarks: remarks || null,
      approved_at: new Date(),
    });
  }

  // -------------------------------------------------------------------------
  // Leave Cancellation (two-step for approved leaves)
  // -------------------------------------------------------------------------

  /**
   * Employee cancels a pending or approved leave.
   * - Pending: cancelled immediately
   * - Approved: cancelled immediately, balance restored, attendance reversed
   * No admin approval needed.
   */
  async cancelLeave(requestId: string, employeeId: string, reason: string) {
    const request = await this.db.findOne<any>("leave_requests", { id: requestId });
    if (!request) throw new AppError(404, "NOT_FOUND", "Leave request not found");
    if (request.employee_id !== employeeId) throw new AppError(403, "FORBIDDEN", "Not your leave request");

    if (request.status === "cancelled") {
      throw new AppError(400, "ALREADY_CANCELLED", "Already cancelled");
    }
    if (request.status === "rejected") {
      throw new AppError(400, "INVALID_STATUS", "Cannot cancel a rejected request");
    }

    // If approved: restore balance and reverse attendance
    if (request.status === "approved") {
      await this.adjustBalance(request.employee_id, request.leave_type, Number(request.days));
      await this.syncAttendanceOnCancel(request);
    }

    return this.db.update("leave_requests", requestId, {
      status: "cancelled",
      cancellation_reason: reason,
      cancellation_requested_at: new Date(),
    });
  }

  // -------------------------------------------------------------------------
  // Attendance <-> Leave Sync
  // -------------------------------------------------------------------------

  /**
   * When a leave is approved, update/create attendance_summaries for each
   * month covered by the leave to reflect paid_leave / present_days.
   */
  private async syncAttendanceOnApprove(request: any) {
    const months = this.getMonthsCovered(request.start_date, request.end_date);
    const isPaid = PAID_LEAVE_TYPES.includes(request.leave_type);

    for (const { month, year, days } of months) {
      const existing = await this.db.findOne<any>("attendance_summaries", {
        employee_id: request.employee_id,
        month,
        year,
      });

      if (existing) {
        const updates: any = {};
        if (isPaid) {
          updates.paid_leave = Number(existing.paid_leave || 0) + days;
        } else {
          updates.unpaid_leave = Number(existing.unpaid_leave || 0) + days;
          updates.lop_days = Number(existing.lop_days || 0) + days;
        }
        // Reduce present_days
        updates.present_days = Math.max(0, Number(existing.present_days || 0) - days);
        await this.db.update("attendance_summaries", existing.id, updates);
      } else {
        // Create attendance record with leave data
        const totalDays = this.getWorkingDaysInMonth(month, year);
        await this.db.create("attendance_summaries", {
          employee_id: request.employee_id,
          month,
          year,
          total_days: totalDays,
          present_days: totalDays - days,
          absent_days: 0,
          half_days: request.is_half_day ? 1 : 0,
          paid_leave: isPaid ? days : 0,
          unpaid_leave: isPaid ? 0 : days,
          holidays: 0,
          weekoffs: 0,
          lop_days: isPaid ? 0 : days,
          overtime_hours: 0,
          overtime_rate: 0,
          overtime_amount: 0,
        });
      }
    }
  }

  /**
   * When an approved leave is cancelled, reverse the attendance changes.
   */
  private async syncAttendanceOnCancel(request: any) {
    const months = this.getMonthsCovered(request.start_date, request.end_date);
    const isPaid = PAID_LEAVE_TYPES.includes(request.leave_type);

    for (const { month, year, days } of months) {
      const existing = await this.db.findOne<any>("attendance_summaries", {
        employee_id: request.employee_id,
        month,
        year,
      });

      if (existing) {
        const updates: any = {};
        if (isPaid) {
          updates.paid_leave = Math.max(0, Number(existing.paid_leave || 0) - days);
        } else {
          updates.unpaid_leave = Math.max(0, Number(existing.unpaid_leave || 0) - days);
          updates.lop_days = Math.max(0, Number(existing.lop_days || 0) - days);
        }
        // Restore present_days
        updates.present_days = Number(existing.present_days || 0) + days;
        await this.db.update("attendance_summaries", existing.id, updates);
      }
    }
  }

  /**
   * Get leave summary for attendance page: per employee, per month.
   * Returns approved leaves that fall within the given month.
   */
  async getLeaveSummaryForMonth(orgId: string, month: number, year: number) {
    const startOfMonth = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const endOfMonth = new Date(year, month, 0).toISOString().split("T")[0];

    // Get all approved leaves for this org
    const allLeaves = await this.db.findMany<any>("leave_requests", {
      filters: { org_id: orgId, status: "approved" },
      limit: 1000,
    });

    // Filter to those overlapping with the target month
    const monthLeaves = allLeaves.data.filter((l: any) => {
      const lStart = l.start_date.split("T")[0];
      const lEnd = l.end_date.split("T")[0];
      return lStart <= endOfMonth && lEnd >= startOfMonth;
    });

    // Group by employee
    const byEmployee: Record<string, any[]> = {};
    for (const leave of monthLeaves) {
      if (!byEmployee[leave.employee_id]) byEmployee[leave.employee_id] = [];
      byEmployee[leave.employee_id].push({
        leaveType: leave.leave_type,
        startDate: leave.start_date,
        endDate: leave.end_date,
        days: Number(leave.days),
        isHalfDay: leave.is_half_day,
      });
    }

    return byEmployee;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Break a leave period into per-month day counts.
   * E.g., leave from Mar 28 to Apr 3 → [{month:3, year:2026, days:2}, {month:4, year:2026, days:3}]
   */
  private getMonthsCovered(startDate: string, endDate: string): { month: number; year: number; days: number }[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months: Map<string, { month: number; year: number; days: number }> = new Map();

    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // Skip weekends
        const key = `${current.getFullYear()}-${current.getMonth() + 1}`;
        if (!months.has(key)) {
          months.set(key, { month: current.getMonth() + 1, year: current.getFullYear(), days: 0 });
        }
        months.get(key)!.days++;
      }
      current.setDate(current.getDate() + 1);
    }

    return Array.from(months.values());
  }

  private getWorkingDaysInMonth(month: number, year: number): number {
    let days = 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month - 1, d).getDay();
      if (day !== 0 && day !== 6) days++;
    }
    return days;
  }

  private calculateDays(startDate: string, endDate: string, isHalfDay?: boolean): number {
    if (isHalfDay) return 0.5;
    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) days++;
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  private currentFY(): string {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}-${year + 1}`;
  }
}
