import { getDB } from "../db/adapters";
import { AppError } from "../api/middleware/error.middleware";

export class AttendanceService {
  private db = getDB();

  async getSummary(employeeId: string, month?: number, year?: number) {
    const filters: any = { empcloud_user_id: Number(employeeId) };
    if (month) filters.month = month;
    if (year) filters.year = year;

    if (month && year) {
      const record = await this.db.findOne<any>("attendance_summaries", filters);
      if (!record) throw new AppError(404, "NOT_FOUND", "Attendance summary not found");
      return record;
    }

    return this.db.findMany<any>("attendance_summaries", {
      filters,
      sort: { field: "year", order: "desc" },
    });
  }

  async bulkSummary(orgId: string, month: number, year: number) {
    // Get empcloud user IDs for this org from payroll profiles
    const profiles = await this.db.findMany<any>("employee_payroll_profiles", {
      filters: { empcloud_org_id: Number(orgId), is_active: true },
      limit: 1000,
    });
    const empcloudUserIds = profiles.data.map((p: any) => p.empcloud_user_id);
    if (empcloudUserIds.length === 0)
      return { data: [], total: 0, page: 1, limit: 1000, totalPages: 0 };

    return this.db.findMany<any>("attendance_summaries", {
      filters: { empcloud_user_id: empcloudUserIds, month, year },
      limit: 1000,
    });
  }

  async importRecords(orgId: string, month: number, year: number, records: any[]) {
    const results = [];
    for (const record of records) {
      const empcloudUserId = Number(record.employeeId);
      const existing = await this.db.findOne<any>("attendance_summaries", {
        empcloud_user_id: empcloudUserId,
        month,
        year,
      });

      const data = {
        employee_id: "00000000-0000-0000-0000-000000000000",
        empcloud_user_id: empcloudUserId,
        month,
        year,
        total_days: record.totalDays,
        present_days: record.presentDays,
        absent_days: record.absentDays || 0,
        half_days: record.halfDays || 0,
        paid_leave: record.paidLeave || 0,
        unpaid_leave: record.unpaidLeave || 0,
        holidays: record.holidays || 0,
        weekoffs: record.weekoffs || 0,
        lop_days: record.lopDays || 0,
        overtime_hours: record.overtimeHours || 0,
        overtime_rate: record.overtimeRate || 0,
        overtime_amount: (record.overtimeHours || 0) * (record.overtimeRate || 0),
      };

      if (existing) {
        results.push(await this.db.update("attendance_summaries", existing.id, data));
      } else {
        results.push(await this.db.create("attendance_summaries", data));
      }
    }
    return { imported: results.length, records: results };
  }

  async getLopDays(employeeId: string, month: number, year: number) {
    const record = await this.db.findOne<any>("attendance_summaries", {
      empcloud_user_id: Number(employeeId),
      month,
      year,
    });
    return { lopDays: record?.lop_days || 0 };
  }

  async overrideLop(employeeId: string, month: number, year: number, lopDays: number) {
    const record = await this.db.findOne<any>("attendance_summaries", {
      empcloud_user_id: Number(employeeId),
      month,
      year,
    });
    if (!record) throw new AppError(404, "NOT_FOUND", "Attendance record not found");
    return this.db.update("attendance_summaries", record.id, { lop_days: lopDays });
  }

  async computeOvertimePay(employeeId: string, month: number, year: number, monthlyBasic: number) {
    const record = await this.db.findOne<any>("attendance_summaries", {
      empcloud_user_id: Number(employeeId),
      month,
      year,
    });

    if (!record || !Number(record.overtime_hours)) {
      return { overtimeHours: 0, overtimePay: 0, breakdown: [] };
    }

    const hourlyRate = Math.round(monthlyBasic / 26 / 8);
    const otHours = Number(record.overtime_hours);
    const otRate = Number(record.overtime_rate) || 1.5;

    const overtimePay = Math.round(otHours * hourlyRate * otRate);

    return {
      overtimeHours: otHours,
      hourlyRate,
      multiplier: otRate,
      overtimePay,
      breakdown: [
        { type: "Regular OT", hours: otHours, rate: hourlyRate * otRate, amount: overtimePay },
      ],
    };
  }
}
