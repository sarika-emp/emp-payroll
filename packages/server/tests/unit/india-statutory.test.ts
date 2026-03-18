import { describe, it, expect } from "vitest";
import { computePF, computeESI, computeProfessionalTax } from "../../src/services/compliance/india-statutory.service";

describe("PF Computation", () => {
  it("computes EPF correctly for basic ≤ 15000", () => {
    const result = computePF({
      employeeId: "emp-1",
      month: 3,
      year: 2026,
      basicSalary: 15000,
    });
    expect(result.employeeEPF).toBe(1800); // 12% of 15000
    expect(result.pfWages).toBe(15000);
    expect(result.totalEmployee).toBe(1800);
    expect(result.totalEmployer).toBeGreaterThan(0);
  });

  it("caps PF wages at ceiling", () => {
    const result = computePF({
      employeeId: "emp-1",
      month: 3,
      year: 2026,
      basicSalary: 50000,
    });
    // PF wages capped at PF_WAGE_CEILING (15000)
    expect(result.pfWages).toBe(15000);
    expect(result.employeeEPF).toBe(1800);
  });

  it("includes VPF when opted in", () => {
    const result = computePF({
      employeeId: "emp-1",
      month: 3,
      year: 2026,
      basicSalary: 30000,
      isVoluntaryPF: true,
      vpfRate: 5,
    });
    expect(result.employeeVPF).toBe(1500); // 5% of 30000
    expect(result.totalEmployee).toBe(result.employeeEPF + result.employeeVPF);
  });

  it("includes DA in PF wages", () => {
    const result = computePF({
      employeeId: "emp-1",
      month: 3,
      year: 2026,
      basicSalary: 10000,
      daAmount: 3000,
    });
    expect(result.pfWages).toBe(13000); // 10000 + 3000
    expect(result.employeeEPF).toBe(1560); // 12% of 13000
  });
});

describe("ESI Computation", () => {
  it("returns null when salary exceeds ceiling", () => {
    const result = computeESI({
      employeeId: "emp-1",
      month: 3,
      year: 2026,
      grossSalary: 25000, // Above 21000 ceiling
    });
    expect(result).toBeNull();
  });

  it("computes ESI for eligible salary", () => {
    const result = computeESI({
      employeeId: "emp-1",
      month: 3,
      year: 2026,
      grossSalary: 18000,
    });
    expect(result).not.toBeNull();
    expect(result!.employeeContribution).toBeGreaterThan(0);
    expect(result!.employerContribution).toBeGreaterThan(0);
    expect(result!.total).toBe(result!.employeeContribution + result!.employerContribution);
  });
});

describe("Professional Tax", () => {
  it("computes PT for Karnataka", () => {
    const result = computeProfessionalTax({
      employeeId: "emp-1",
      month: 3,
      year: 2026,
      state: "KA",
      grossSalary: 50000,
    });
    expect(result.taxAmount).toBe(200);
  });

  it("returns 0 for unknown state", () => {
    const result = computeProfessionalTax({
      employeeId: "emp-1",
      month: 3,
      year: 2026,
      state: "XX",
      grossSalary: 50000,
    });
    expect(result.taxAmount).toBe(0);
  });

  it("handles Maharashtra Feb special rate", () => {
    const result = computeProfessionalTax({
      employeeId: "emp-1",
      month: 2,
      year: 2026,
      state: "MH",
      grossSalary: 50000,
    });
    expect(result.taxAmount).toBe(300);
  });
});
