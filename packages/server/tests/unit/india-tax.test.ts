import { describe, it, expect } from "vitest";
import { computeIncomeTax } from "../../src/services/tax/india-tax.service";
import { TaxRegime } from "@emp-payroll/shared";

describe("India Income Tax Engine", () => {
  const baseInput = {
    employeeId: "emp-1",
    financialYear: "2025-2026",
    annualGross: 1200000,
    basicAnnual: 480000,
    hraAnnual: 240000,
    rentPaidAnnual: 0,
    isMetroCity: false,
    declarations: [] as { section: string; amount: number }[],
    employeePfAnnual: 57600,
    monthsWorked: 12,
    taxAlreadyPaid: 0,
  };

  it("computes tax under new regime (12L gets rebate, 0 tax)", () => {
    const result = computeIncomeTax({ ...baseInput, regime: TaxRegime.NEW });
    expect(result.regime).toBe(TaxRegime.NEW);
    expect(result.grossIncome).toBe(1200000);
    expect(result.taxableIncome).toBeLessThan(result.grossIncome);
    // 12L CTC → ~11.25L taxable after standard deduction → rebate u/s 87A applies
    expect(result.totalTax).toBe(0);
    expect(result.monthlyTds).toBe(0);
  });

  it("computes positive tax for higher income (new regime)", () => {
    const result = computeIncomeTax({
      ...baseInput,
      regime: TaxRegime.NEW,
      annualGross: 1800000,
      basicAnnual: 720000,
      hraAnnual: 360000,
      employeePfAnnual: 86400,
    });
    expect(result.totalTax).toBeGreaterThan(0);
    expect(result.monthlyTds).toBeGreaterThan(0);
  });

  it("computes tax under old regime", () => {
    const result = computeIncomeTax({ ...baseInput, regime: TaxRegime.OLD });
    expect(result.regime).toBe(TaxRegime.OLD);
    expect(result.deductions.length).toBeGreaterThan(0);
    // Old regime should have 80C deduction (PF)
    const sec80c = result.deductions.find((d) => d.section === "80C");
    expect(sec80c).toBeDefined();
    expect(sec80c!.allowedAmount).toBeGreaterThan(0);
  });

  it("applies 80C deductions in old regime", () => {
    const result = computeIncomeTax({
      ...baseInput,
      regime: TaxRegime.OLD,
      declarations: [{ section: "80C", amount: 100000 }],
    });
    const sec80c = result.deductions.find((d) => d.section === "80C");
    // Total 80C = EPF (57600) + declared (100000) = 157600, capped at 150000
    expect(sec80c!.allowedAmount).toBe(150000);
  });

  it("applies HRA exemption in old regime", () => {
    const result = computeIncomeTax({
      ...baseInput,
      regime: TaxRegime.OLD,
      rentPaidAnnual: 200000,
    });
    const hra = result.exemptions.find((e) => e.code === "HRA");
    expect(hra).toBeDefined();
    expect(hra!.amount).toBeGreaterThan(0);
  });

  it("gives rebate under 87A for low income (new regime)", () => {
    const result = computeIncomeTax({
      ...baseInput,
      regime: TaxRegime.NEW,
      annualGross: 700000,
      basicAnnual: 280000,
      hraAnnual: 140000,
      employeePfAnnual: 33600,
    });
    // Below 12L taxable → should get rebate, tax ≈ 0
    expect(result.totalTax).toBe(0);
  });

  it("accounts for tax already paid", () => {
    const result = computeIncomeTax({
      ...baseInput,
      regime: TaxRegime.NEW,
      annualGross: 1800000,
      basicAnnual: 720000,
      hraAnnual: 360000,
      employeePfAnnual: 86400,
      taxAlreadyPaid: 50000,
      monthsWorked: 6,
    });
    expect(result.taxAlreadyPaid).toBe(50000);
    expect(result.remainingTax).toBe(Math.max(0, result.totalTax - 50000));
    expect(result.monthlyTds).toBe(Math.round(result.remainingTax / 6));
  });

  it("computes cess at 4%", () => {
    const result = computeIncomeTax({
      ...baseInput,
      regime: TaxRegime.NEW,
      annualGross: 2000000,
      basicAnnual: 800000,
      hraAnnual: 400000,
      employeePfAnnual: 96000,
    });
    expect(result.healthAndEducationCess).toBe(
      Math.round((result.taxOnIncome + result.surcharge) * 0.04)
    );
  });

  it("returns zero tax for income below threshold", () => {
    const result = computeIncomeTax({
      ...baseInput,
      regime: TaxRegime.NEW,
      annualGross: 300000,
      basicAnnual: 120000,
      hraAnnual: 60000,
      employeePfAnnual: 14400,
    });
    expect(result.totalTax).toBe(0);
    expect(result.monthlyTds).toBe(0);
  });
});
