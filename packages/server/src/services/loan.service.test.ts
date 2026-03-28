import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db/adapters", () => ({ getDB: vi.fn() }));

import { LoanService } from "./loan.service";
import { getDB } from "../db/adapters";

const mockedGetDB = vi.mocked(getDB);

function makeMockDb(overrides: Record<string, unknown> = {}) {
  return {
    findOne: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    findById: vi.fn().mockResolvedValue(null),
    create: vi
      .fn()
      .mockImplementation((_t: string, data: Record<string, unknown>) =>
        Promise.resolve({ id: "loan-1", ...data }),
      ),
    update: vi
      .fn()
      .mockImplementation((_t: string, _id: string, data: Record<string, unknown>) =>
        Promise.resolve(data),
      ),
    updateMany: vi.fn().mockResolvedValue(undefined),
    raw: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("LoanService", () => {
  let service: LoanService;
  let mockDb: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = makeMockDb();
    mockedGetDB.mockReturnValue(mockDb as any);
    service = new LoanService();
  });

  // ── create ────────────────────────────────────────────────────────────

  describe("create", () => {
    it("should create a zero-interest loan with flat EMI", async () => {
      const result = await service.create("org-1", "admin-1", {
        employeeId: "emp-1",
        type: "salary_advance",
        description: "Salary advance",
        principalAmount: 50000,
        tenureMonths: 10,
        interestRate: 0,
        startDate: "2026-04-01",
      });

      expect(mockDb.create).toHaveBeenCalledWith(
        "loans",
        expect.objectContaining({
          principal_amount: 50000,
          outstanding_amount: 50000,
          tenure_months: 10,
          emi_amount: 5000, // 50000 / 10
          interest_rate: 0,
          status: "active",
        }),
      );
    });

    it("should compute EMI with simple interest", async () => {
      await service.create("org-1", "admin-1", {
        employeeId: "emp-1",
        type: "personal",
        description: "Personal loan",
        principalAmount: 100000,
        tenureMonths: 12,
        interestRate: 12,
        startDate: "2026-04-01",
      });

      // EMI = (100000 * (1 + 12/100 * 12/12)) / 12 = (100000 * 1.12) / 12 = 9333
      expect(mockDb.create).toHaveBeenCalledWith(
        "loans",
        expect.objectContaining({
          emi_amount: 9333,
          interest_rate: 12,
        }),
      );
    });

    it("should default interest rate to 0 if not provided", async () => {
      await service.create("org-1", "admin-1", {
        employeeId: "emp-1",
        type: "salary_advance",
        description: "Advance",
        principalAmount: 30000,
        tenureMonths: 6,
        startDate: "2026-04-01",
      });

      expect(mockDb.create).toHaveBeenCalledWith(
        "loans",
        expect.objectContaining({
          interest_rate: 0,
          emi_amount: 5000, // 30000 / 6
        }),
      );
    });

    it("should set approved_by and approved_at", async () => {
      await service.create("org-1", "admin-1", {
        employeeId: "emp-1",
        type: "personal",
        description: "Test",
        principalAmount: 10000,
        tenureMonths: 5,
        startDate: "2026-01-01",
      });

      expect(mockDb.create).toHaveBeenCalledWith(
        "loans",
        expect.objectContaining({
          approved_by: "admin-1",
          approved_at: expect.any(Date),
        }),
      );
    });
  });

  // ── recordPayment ─────────────────────────────────────────────────────

  describe("recordPayment", () => {
    it("should record EMI payment and reduce outstanding", async () => {
      mockDb.findById.mockResolvedValue({
        id: "loan-1",
        emi_amount: 5000,
        outstanding_amount: 50000,
        installments_paid: 0,
        status: "active",
      });

      await service.recordPayment("loan-1");

      expect(mockDb.update).toHaveBeenCalledWith(
        "loans",
        "loan-1",
        expect.objectContaining({
          outstanding_amount: 45000,
          installments_paid: 1,
        }),
      );
    });

    it("should accept custom payment amount", async () => {
      mockDb.findById.mockResolvedValue({
        id: "loan-1",
        emi_amount: 5000,
        outstanding_amount: 50000,
        installments_paid: 2,
        status: "active",
      });

      await service.recordPayment("loan-1", 10000);

      expect(mockDb.update).toHaveBeenCalledWith(
        "loans",
        "loan-1",
        expect.objectContaining({
          outstanding_amount: 40000,
          installments_paid: 3,
        }),
      );
    });

    it("should mark loan completed when outstanding reaches zero", async () => {
      mockDb.findById.mockResolvedValue({
        id: "loan-1",
        emi_amount: 5000,
        outstanding_amount: 5000,
        installments_paid: 9,
        status: "active",
      });

      await service.recordPayment("loan-1");

      expect(mockDb.update).toHaveBeenCalledWith(
        "loans",
        "loan-1",
        expect.objectContaining({
          outstanding_amount: 0,
          installments_paid: 10,
          status: "completed",
          end_date: expect.any(String),
        }),
      );
    });

    it("should not allow outstanding to go negative", async () => {
      mockDb.findById.mockResolvedValue({
        id: "loan-1",
        emi_amount: 5000,
        outstanding_amount: 3000,
        installments_paid: 9,
        status: "active",
      });

      await service.recordPayment("loan-1");

      expect(mockDb.update).toHaveBeenCalledWith(
        "loans",
        "loan-1",
        expect.objectContaining({
          outstanding_amount: 0,
          status: "completed",
        }),
      );
    });

    it("should throw NotFoundError when loan does not exist", async () => {
      mockDb.findById.mockResolvedValue(null);

      await expect(service.recordPayment("nonexistent")).rejects.toThrow("not found");
    });

    it("should throw if loan is not active", async () => {
      mockDb.findById.mockResolvedValue({
        id: "loan-1",
        status: "completed",
      });

      await expect(service.recordPayment("loan-1")).rejects.toThrow("not active");
    });
  });

  // ── cancel ────────────────────────────────────────────────────────────

  describe("cancel", () => {
    it("should cancel an active loan", async () => {
      mockDb.findById.mockResolvedValue({ id: "loan-1", status: "active" });

      await service.cancel("loan-1");

      expect(mockDb.update).toHaveBeenCalledWith("loans", "loan-1", { status: "cancelled" });
    });

    it("should throw NotFoundError when loan does not exist", async () => {
      mockDb.findById.mockResolvedValue(null);

      await expect(service.cancel("nonexistent")).rejects.toThrow("not found");
    });
  });

  // ── getActiveEMIs ─────────────────────────────────────────────────────

  describe("getActiveEMIs", () => {
    it("should sum EMI amounts for active loans", async () => {
      mockDb.findMany.mockResolvedValue({
        data: [
          { id: "l1", emi_amount: 5000 },
          { id: "l2", emi_amount: 3000 },
        ],
        total: 2,
      });

      const result = await service.getActiveEMIs("emp-1");

      expect(result).toBe(8000);
    });

    it("should return 0 when no active loans", async () => {
      mockDb.findMany.mockResolvedValue({ data: [], total: 0 });

      const result = await service.getActiveEMIs("emp-1");

      expect(result).toBe(0);
    });
  });

  // ── list ──────────────────────────────────────────────────────────────

  describe("list", () => {
    it("should return loans with employee names", async () => {
      mockDb.findMany.mockResolvedValue({
        data: [{ id: "l1", employee_id: "emp-1", emi_amount: 5000 }],
        total: 1,
      });
      mockDb.findById.mockResolvedValue({
        first_name: "John",
        last_name: "Doe",
        employee_code: "E001",
      });

      const result = await service.list("org-1");

      expect(result.data).toHaveLength(1);
      expect(result.data[0].employee_name).toBe("John Doe");
      expect(result.data[0].employee_code).toBe("E001");
    });

    it("should apply status filter", async () => {
      mockDb.findMany.mockResolvedValue({ data: [], total: 0 });

      await service.list("org-1", { status: "active" });

      expect(mockDb.findMany).toHaveBeenCalledWith(
        "loans",
        expect.objectContaining({
          filters: expect.objectContaining({ status: "active" }),
        }),
      );
    });

    it("should apply employee filter", async () => {
      mockDb.findMany.mockResolvedValue({ data: [], total: 0 });

      await service.list("org-1", { employeeId: "emp-1" });

      expect(mockDb.findMany).toHaveBeenCalledWith(
        "loans",
        expect.objectContaining({
          filters: expect.objectContaining({ employee_id: "emp-1" }),
        }),
      );
    });
  });
});
