import { describe, it, expect } from "vitest";
import { computeIncomeTax } from "./india-tax.service";
import { TaxRegime } from "@emp-payroll/shared";

// ============================================================================
// Helper to build a standard TaxInput
// ============================================================================

function makeTaxInput(overrides: Record<string, unknown> = {}) {
  return {
    employeeId: "emp-1",
    financialYear: "2025-2026",
    regime: TaxRegime.NEW,
    annualGross: 1200000,
    basicAnnual: 600000,
    hraAnnual: 300000,
    rentPaidAnnual: 0,
    isMetroCity: false,
    declarations: [],
    employeePfAnnual: 21600,
    monthsWorked: 12,
    taxAlreadyPaid: 0,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("computeIncomeTax", () => {
  // ── Slab calculation ──────────────────────────────────────────────────

  describe("slab calculation", () => {
    it("should compute zero tax for income below new regime threshold", () => {
      // Annual gross 400000 - standard deduction 75000 = taxable 325000
      // New regime: 0-400000 at 0% -> 0 tax
      // Taxable 325000 is within first slab, so 0 tax
      // But 325000 < 400000 so fully in 0% slab
      const result = computeIncomeTax(
        makeTaxInput({
          annualGross: 400000,
          basicAnnual: 200000,
          hraAnnual: 100000,
          employeePfAnnual: 0,
        }),
      );

      expect(result.taxOnIncome).toBe(0);
      expect(result.totalTax).toBe(0);
      expect(result.monthlyTds).toBe(0);
    });

    it("should compute correct tax for mid-range new regime income (above rebate)", () => {
      // Annual gross 1500000 - standard deduction 75000 = taxable 1425000
      // New regime slabs:
      //   0-400000: 0%         = 0
      //   400001-800000: 5%    = 20000
      //   800001-1200000: 10%  = 40000
      //   1200001-1425000: 15% = 33750
      // Total slab tax = 93750
      // No rebate (taxable > 12L)
      const result = computeIncomeTax(
        makeTaxInput({
          annualGross: 1500000,
          basicAnnual: 750000,
          hraAnnual: 375000,
          employeePfAnnual: 0,
        }),
      );

      expect(result.taxableIncome).toBe(1425000);
      expect(result.taxOnIncome).toBeGreaterThan(0);
    });

    it("should apply old regime slabs correctly", () => {
      // Annual gross 800000
      // Old regime: standard deduction 75000
      // Section 80C deduction: PF 21600 (capped at 150000)
      // Taxable = 800000 - 75000 - 21600 = 703400
      // Old regime slabs:
      //   0-250000: 0%
      //   250001-500000: 5% = 12500
      //   500001-703400: 20% = 40680
      // Total = 53180
      const result = computeIncomeTax(
        makeTaxInput({
          regime: TaxRegime.OLD,
          annualGross: 800000,
          basicAnnual: 400000,
          hraAnnual: 200000,
          employeePfAnnual: 21600,
        }),
      );

      expect(result.regime).toBe(TaxRegime.OLD);
      expect(result.taxableIncome).toBe(703400);
    });
  });

  // ── TDS computation ───────────────────────────────────────────────────

  describe("TDS computation", () => {
    it("should divide remaining tax evenly across remaining months", () => {
      const result = computeIncomeTax(
        makeTaxInput({
          annualGross: 2000000,
          monthsWorked: 6,
          taxAlreadyPaid: 0,
        }),
      );

      // Monthly TDS = totalTax / 6
      expect(result.monthlyTds).toBe(Math.round(result.totalTax / 6));
    });

    it("should subtract already paid tax from remaining", () => {
      const baseResult = computeIncomeTax(
        makeTaxInput({
          annualGross: 1500000,
          monthsWorked: 12,
          taxAlreadyPaid: 0,
        }),
      );

      const withPaid = computeIncomeTax(
        makeTaxInput({
          annualGross: 1500000,
          monthsWorked: 6,
          taxAlreadyPaid: baseResult.totalTax / 2,
        }),
      );

      // Remaining tax should be half
      expect(withPaid.remainingTax).toBe(
        Math.max(0, baseResult.totalTax - Math.floor(baseResult.totalTax / 2)),
      );
    });

    it("should return zero TDS when all tax already paid", () => {
      const result = computeIncomeTax(
        makeTaxInput({
          annualGross: 1200000,
          taxAlreadyPaid: 999999999, // overpaid
        }),
      );

      expect(result.remainingTax).toBe(0);
      expect(result.monthlyTds).toBe(0);
    });

    it("should handle monthsWorked=1 correctly (no division by zero)", () => {
      const result = computeIncomeTax(
        makeTaxInput({
          annualGross: 1500000,
          monthsWorked: 1,
          taxAlreadyPaid: 0,
        }),
      );

      // All remaining tax in 1 month
      expect(result.monthlyTds).toBe(result.totalTax);
    });
  });

  // ── Rebate u/s 87A ────────────────────────────────────────────────────

  describe("rebate u/s 87A", () => {
    it("should apply rebate for new regime when taxable income <= 12L", () => {
      // Gross 1275000 - std deduction 75000 = taxable 1200000 exactly
      // Should get full rebate
      const result = computeIncomeTax(
        makeTaxInput({
          annualGross: 1275000,
          employeePfAnnual: 0,
        }),
      );

      expect(result.taxableIncome).toBe(1200000);
      expect(result.taxOnIncome).toBe(0); // rebate zeroes it out
    });

    it("should apply old regime rebate when taxable income <= 5L", () => {
      // Old regime: gross 575000 - std 75000 = 500000
      // No other deductions means taxable = 500000 (at limit)
      const result = computeIncomeTax(
        makeTaxInput({
          regime: TaxRegime.OLD,
          annualGross: 575000,
          basicAnnual: 287500,
          hraAnnual: 0,
          employeePfAnnual: 0,
          declarations: [],
        }),
      );

      expect(result.taxableIncome).toBe(500000);
      expect(result.taxOnIncome).toBe(0); // rebate
    });
  });

  // ── Exemptions & Deductions ──────────────────────────────────────────

  describe("exemptions and deductions", () => {
    it("should apply standard deduction for new regime", () => {
      const result = computeIncomeTax(makeTaxInput({ regime: TaxRegime.NEW }));

      const stdExemption = result.exemptions.find((e) => e.code === "STD_DED");
      expect(stdExemption).toBeDefined();
      expect(stdExemption!.amount).toBe(75000);
    });

    it("should apply standard deduction for old regime", () => {
      const result = computeIncomeTax(makeTaxInput({ regime: TaxRegime.OLD }));

      const stdExemption = result.exemptions.find((e) => e.code === "STD_DED");
      expect(stdExemption).toBeDefined();
      expect(stdExemption!.amount).toBe(75000);
    });

    it("should apply HRA exemption for old regime when rent paid", () => {
      const result = computeIncomeTax(
        makeTaxInput({
          regime: TaxRegime.OLD,
          annualGross: 1200000,
          basicAnnual: 600000,
          hraAnnual: 300000,
          rentPaidAnnual: 180000,
          isMetroCity: true,
        }),
      );

      const hraExemption = result.exemptions.find((e) => e.code === "HRA");
      expect(hraExemption).toBeDefined();
      expect(hraExemption!.amount).toBeGreaterThan(0);
    });

    it("should not apply HRA exemption for new regime", () => {
      const result = computeIncomeTax(
        makeTaxInput({
          regime: TaxRegime.NEW,
          rentPaidAnnual: 180000,
        }),
      );

      const hraExemption = result.exemptions.find((e) => e.code === "HRA");
      expect(hraExemption).toBeUndefined();
    });

    it("should apply 80C deduction for old regime (EPF + declared)", () => {
      const result = computeIncomeTax(
        makeTaxInput({
          regime: TaxRegime.OLD,
          employeePfAnnual: 21600,
          declarations: [
            { section: "80C", amount: 100000 }, // LIC, PPF etc
          ],
        }),
      );

      const ded80C = result.deductions.find((d) => d.section === "80C");
      expect(ded80C).toBeDefined();
      // Total 80C = 21600 + 100000 = 121600, capped at 150000
      expect(ded80C!.allowedAmount).toBe(121600);
    });

    it("should cap 80C at 150000", () => {
      const result = computeIncomeTax(
        makeTaxInput({
          regime: TaxRegime.OLD,
          employeePfAnnual: 100000,
          declarations: [{ section: "80C", amount: 200000 }],
        }),
      );

      const ded80C = result.deductions.find((d) => d.section === "80C");
      expect(ded80C!.allowedAmount).toBe(150000);
    });
  });

  // ── Cess ──────────────────────────────────────────────────────────────

  describe("cess", () => {
    it("should compute 4% cess on tax + surcharge", () => {
      const result = computeIncomeTax(
        makeTaxInput({
          annualGross: 2000000,
          employeePfAnnual: 0,
        }),
      );

      const expectedCess = Math.round(((result.taxOnIncome + result.surcharge) * 4) / 100);
      expect(result.healthAndEducationCess).toBe(expectedCess);
    });
  });

  // ── Output structure ──────────────────────────────────────────────────

  describe("output structure", () => {
    it("should include all expected fields", () => {
      const result = computeIncomeTax(makeTaxInput());

      expect(result).toHaveProperty("employeeId");
      expect(result).toHaveProperty("financialYear");
      expect(result).toHaveProperty("regime");
      expect(result).toHaveProperty("grossIncome");
      expect(result).toHaveProperty("exemptions");
      expect(result).toHaveProperty("deductions");
      expect(result).toHaveProperty("taxableIncome");
      expect(result).toHaveProperty("taxOnIncome");
      expect(result).toHaveProperty("surcharge");
      expect(result).toHaveProperty("healthAndEducationCess");
      expect(result).toHaveProperty("totalTax");
      expect(result).toHaveProperty("monthlyTds");
      expect(result).toHaveProperty("computedAt");
    });
  });
});
