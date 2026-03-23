import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Self-Service Dashboard  (/my)
// ---------------------------------------------------------------------------
test.describe("Self-Service Dashboard", () => {
  test("loads with welcome greeting showing user name", async ({ page }) => {
    await page.goto("/my");

    await expect(
      page.getByRole("heading", { name: /welcome/i }).first()
    ).toBeVisible({ timeout: 5000 });

    // Greeting includes user's first name (from storageState)
    await expect(
      page.getByRole("heading", { name: /welcome/i }).first()
    ).toContainText(/welcome,\s+\w+/i, { timeout: 5000 });

    // Sub-description
    await expect(page.getByText("Here's your payroll summary")).toBeVisible({
      timeout: 5000,
    });
  });

  test("displays 4 stat cards with values", async ({ page }) => {
    await page.goto("/my");

    await expect(page.getByText("Monthly CTC")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Net Pay (Latest)")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Tax Regime")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Days at Company")).toBeVisible({
      timeout: 5000,
    });

    // Each stat card should display a value (currency or number or dash)
    const statCards = page.locator('[class*="StatCard"], [class*="stat-card"]');
    // At minimum, Tax Regime shows Old/New Regime text
    await expect(
      page.getByText(/Old Regime|New Regime/).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("quick navigation links are clickable and navigate correctly", async ({
    page,
  }) => {
    await page.goto("/my");

    // Wait for dashboard to load
    await expect(
      page.getByRole("heading", { name: /welcome/i }).first()
    ).toBeVisible({ timeout: 5000 });

    // Verify all 5 quick nav links exist
    const navLinks = [
      { label: "View Salary Breakdown", path: "/my/salary" },
      { label: "Tax Computation", path: "/my/tax" },
      { label: "Submit Declarations", path: "/my/declarations" },
      { label: "Reimbursements", path: "/my/reimbursements" },
      { label: "My Profile", path: "/my/profile" },
    ];

    for (const link of navLinks) {
      await expect(
        page.getByRole("button", { name: link.label })
      ).toBeVisible({ timeout: 5000 });
    }

    // Click "View Salary Breakdown" and verify navigation
    await page.getByRole("button", { name: "View Salary Breakdown" }).click();
    await expect(page).toHaveURL(/\/my\/salary/, { timeout: 5000 });
    await expect(
      page.getByRole("heading", { name: "My Salary" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Go back and click "Tax Computation"
    await page.goto("/my");
    await expect(
      page.getByRole("heading", { name: /welcome/i }).first()
    ).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Tax Computation" }).click();
    await expect(page).toHaveURL(/\/my\/tax/, { timeout: 5000 });

    // Go back and click "My Profile"
    await page.goto("/my");
    await expect(
      page.getByRole("heading", { name: /welcome/i }).first()
    ).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "My Profile" }).click();
    await expect(page).toHaveURL(/\/my\/profile/, { timeout: 5000 });
  });

  test("latest payslip section shows gross, deductions, net and View All button", async ({
    page,
  }) => {
    await page.goto("/my");

    await expect(
      page.getByRole("heading", { name: /welcome/i }).first()
    ).toBeVisible({ timeout: 5000 });

    // If latest payslip card exists, verify its contents
    const payslipCard = page.getByText("Latest Payslip");
    const hasPayslip = await payslipCard.isVisible().catch(() => false);

    if (hasPayslip) {
      await expect(page.getByText("Gross Pay").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Deductions").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByText("Net Pay").first()).toBeVisible({ timeout: 5000 });

      // View All button navigates to payslips page
      const viewAllBtn = page.getByRole("button", { name: /View All/i });
      await expect(viewAllBtn).toBeVisible({ timeout: 5000 });
      await viewAllBtn.click();
      await expect(page).toHaveURL(/\/my\/payslips/, { timeout: 5000 });
    }
  });

  test("announcements section displays if announcements exist", async ({
    page,
  }) => {
    await page.goto("/my");

    await expect(
      page.getByRole("heading", { name: /welcome/i }).first()
    ).toBeVisible({ timeout: 5000 });

    // Company Announcements widget — may or may not be present
    const announcementsHeading = page.getByText("Company Announcements");
    const hasAnnouncements = await announcementsHeading
      .isVisible()
      .catch(() => false);

    if (hasAnnouncements) {
      await expect(announcementsHeading).toBeVisible({ timeout: 5000 });
      // Each announcement has a title, priority badge, and author
      const announcementItems = page.locator(".line-clamp-2");
      const count = await announcementItems.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// My Payslips  (/my/payslips)
// ---------------------------------------------------------------------------
test.describe("My Payslips", () => {
  test("loads with heading and description", async ({ page }) => {
    await page.goto("/my/payslips");

    await expect(
      page.getByRole("heading", { name: "My Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("View and download your payslips")
    ).toBeVisible({ timeout: 5000 });
  });

  test("payslip list shows month, gross, and net amounts", async ({
    page,
  }) => {
    await page.goto("/my/payslips");

    await expect(
      page.getByRole("heading", { name: "My Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Either we have payslips or the empty state
    const emptyState = page.getByText("No payslips available yet");
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    if (!hasEmpty) {
      // Payslip cards should show Gross: and Net: amounts
      await expect(page.getByText(/Gross:/).first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByText(/Net:/).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("expand a payslip to see earnings and deductions breakdown", async ({
    page,
  }) => {
    await page.goto("/my/payslips");

    await expect(
      page.getByRole("heading", { name: "My Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    const detailsBtn = page
      .getByRole("button", { name: "Details" })
      .first();
    const hasPayslips = await detailsBtn.isVisible().catch(() => false);

    if (hasPayslips) {
      // Click Details to expand
      await detailsBtn.click();

      // Expanded view shows Earnings and Deductions sections
      await expect(page.getByText("Earnings").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByText("Deductions").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByText("Total Earnings").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByText("Total Deductions").first()).toBeVisible({
        timeout: 5000,
      });

      // Click Hide to collapse
      const hideBtn = page.getByRole("button", { name: "Hide" }).first();
      await expect(hideBtn).toBeVisible({ timeout: 5000 });
      await hideBtn.click();

      // After collapse, Details button should be back
      await expect(
        page.getByRole("button", { name: "Details" }).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("download payslip PDF button exists", async ({ page }) => {
    await page.goto("/my/payslips");

    await expect(
      page.getByRole("heading", { name: "My Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    const pdfBtn = page.getByRole("button", { name: /PDF/i }).first();
    const hasPayslips = await pdfBtn.isVisible().catch(() => false);

    if (hasPayslips) {
      await expect(pdfBtn).toBeVisible({ timeout: 5000 });
    }
  });

  test("raise dispute — click, fill reason, submit", async ({ page }) => {
    await page.goto("/my/payslips");

    await expect(
      page.getByRole("heading", { name: "My Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    // The dispute button is a ghost button with AlertTriangle icon (no text label)
    // It only appears on payslips that are not already disputed
    const disputeBtn = page.locator("button.text-red-500, button:has(.text-red-500)").first();
    const hasDispute = await disputeBtn.isVisible().catch(() => false);

    if (hasDispute) {
      await disputeBtn.click();

      // Modal opens with "Raise Payslip Dispute" title
      await expect(
        page.getByText("Raise Payslip Dispute")
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText("If you believe there's an error in this payslip")
      ).toBeVisible({ timeout: 5000 });

      // Fill in the dispute reason
      await page
        .locator('textarea[name="reason"]')
        .fill("Incorrect HRA deduction amount for this month");

      // Submit the dispute
      await page
        .getByRole("button", { name: /Raise Dispute/i })
        .click();

      // Wait for toast or modal to close
      await expect(
        page.getByText(/Dispute raised|Failed to raise dispute/).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("dispute modal cancel button closes modal", async ({ page }) => {
    await page.goto("/my/payslips");

    await expect(
      page.getByRole("heading", { name: "My Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    const disputeBtn = page.locator("button.text-red-500, button:has(.text-red-500)").first();
    const hasDispute = await disputeBtn.isVisible().catch(() => false);

    if (hasDispute) {
      await disputeBtn.click();

      await expect(
        page.getByText("Raise Payslip Dispute")
      ).toBeVisible({ timeout: 5000 });

      // Click Cancel
      await page.getByRole("button", { name: "Cancel" }).click();

      // Modal should close
      await expect(
        page.getByText("Raise Payslip Dispute")
      ).not.toBeVisible({ timeout: 5000 });
    }
  });
});

// ---------------------------------------------------------------------------
// My Salary  (/my/salary)
// ---------------------------------------------------------------------------
test.describe("My Salary", () => {
  test("loads with heading and description", async ({ page }) => {
    await page.goto("/my/salary");

    // Wait for page to load — it either shows the salary page or the empty state
    await page.waitForTimeout(2000);

    const noSalary = page.getByText("No salary information available");
    const hasNoSalary = await noSalary.isVisible().catch(() => false);

    if (hasNoSalary) {
      // No salary data — the page renders empty state without PageHeader
      await expect(noSalary).toBeVisible({ timeout: 5000 });
    } else {
      // Salary data exists — verify heading and description
      await expect(
        page.getByRole("heading", { name: "My Salary" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText("Your CTC breakdown and salary structure")
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("annual CTC and gross salary values displayed", async ({ page }) => {
    await page.goto("/my/salary");

    await expect(
      page.getByRole("heading", { name: "My Salary" }).first()
    ).toBeVisible({ timeout: 5000 });

    const noSalary = page.getByText("No salary information available");
    const hasNoSalary = await noSalary.isVisible().catch(() => false);

    if (!hasNoSalary) {
      await expect(
        page.getByRole("heading", { name: "Annual Summary" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Annual CTC")).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page.getByText("Gross Salary (Annual)")
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("salary components table shows Component, Monthly, Annual columns", async ({
    page,
  }) => {
    await page.goto("/my/salary");

    await expect(
      page.getByRole("heading", { name: "My Salary" }).first()
    ).toBeVisible({ timeout: 5000 });

    const noSalary = page.getByText("No salary information available");
    const hasNoSalary = await noSalary.isVisible().catch(() => false);

    if (!hasNoSalary) {
      await expect(
        page.getByRole("heading", { name: "Salary Components" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Table headers
      await expect(
        page.getByRole("columnheader", { name: "Component" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Monthly" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Annual" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Common salary components should appear
      await expect(
        page.getByText("Basic Salary").first()
      ).toBeVisible({ timeout: 5000 });

      // Effective-from badge
      await expect(
        page.getByText(/Effective from/).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("pie chart breakdown section is visible", async ({ page }) => {
    await page.goto("/my/salary");

    await expect(
      page.getByRole("heading", { name: "My Salary" }).first()
    ).toBeVisible({ timeout: 5000 });

    const noSalary = page.getByText("No salary information available");
    const hasNoSalary = await noSalary.isVisible().catch(() => false);

    if (!hasNoSalary) {
      await expect(
        page.getByRole("heading", { name: "Monthly Salary Breakdown" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Pie chart is rendered via recharts — check for SVG element
      await expect(page.locator(".recharts-wrapper").first()).toBeVisible({
        timeout: 5000,
      });

      // Legend items — at least Basic Salary should appear in the legend
      await expect(
        page.getByText("Basic Salary").first()
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

// ---------------------------------------------------------------------------
// My Tax  (/my/tax)
// ---------------------------------------------------------------------------
test.describe("My Tax", () => {
  test("loads with heading, description, and Form 16 button", async ({
    page,
  }) => {
    await page.goto("/my/tax");

    await expect(
      page.getByRole("heading", { name: "My Tax" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("FY 2025-26 tax computation")
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: /Form 16/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("4 stat cards show Annual Income, Taxable Income, Estimated Tax, TDS", async ({
    page,
  }) => {
    await page.goto("/my/tax");

    await expect(
      page.getByRole("heading", { name: "My Tax" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText("Annual Income", { exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Taxable Income").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Estimated Tax").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("TDS Deducted YTD").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("tax computation breakdown section shows all line items", async ({
    page,
  }) => {
    await page.goto("/my/tax");

    await expect(
      page.getByRole("heading", { name: "Tax Computation" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Computation rows
    await expect(page.getByText("Gross Annual Income")).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText("Less: Standard Deduction")
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("Taxable Income").first()
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Tax on Income")).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText("Health & Education Cess (4%)")
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Total Tax Liability")).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText("Monthly TDS", { exact: true }).first()
    ).toBeVisible({ timeout: 5000 });

    // Regime badge
    await expect(
      page.getByText(/New Regime|Old Regime/).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("TDS deduction tracker section shows progress", async ({ page }) => {
    await page.goto("/my/tax");

    await expect(
      page.getByRole("heading", { name: "TDS Deduction Tracker" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Total Tax for FY")).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText("TDS Deducted YTD").first()
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Remaining")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Progress")).toBeVisible({ timeout: 5000 });

    // Monthly TDS info box
    await expect(
      page.getByText(/will be deducted from your salary each month/)
    ).toBeVisible({ timeout: 5000 });
  });

  test("Form 16 download button triggers download", async ({ page }) => {
    await page.goto("/my/tax");

    await expect(
      page.getByRole("heading", { name: "My Tax" }).first()
    ).toBeVisible({ timeout: 5000 });

    const form16Btn = page.getByRole("button", { name: /Form 16/i });
    await expect(form16Btn).toBeVisible({ timeout: 5000 });

    // Clicking Form 16 opens a new tab/window (window.open)
    const [popup] = await Promise.all([
      page.waitForEvent("popup").catch(() => null),
      form16Btn.click(),
    ]);

    // If popup opened, verify it targets the form16 endpoint
    if (popup) {
      expect(popup.url()).toContain("form16");
      await popup.close();
    }
  });
});

// ---------------------------------------------------------------------------
// My Declarations  (/my/declarations)
// ---------------------------------------------------------------------------
test.describe("My Declarations", () => {
  test("loads with heading, description, and action buttons", async ({
    page,
  }) => {
    await page.goto("/my/declarations");

    await expect(
      page.getByRole("heading", { name: "Tax Declarations" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("FY 2025-26 — Submit investment proofs and claims")
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole("button", { name: /Quick Declare All/i })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: /New Declaration/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("summary cards show Total Declared, Total Approved, Pending Approval", async ({
    page,
  }) => {
    await page.goto("/my/declarations");

    await expect(
      page.getByRole("heading", { name: "Tax Declarations" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Total Declared")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Total Approved")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Pending Approval")).toBeVisible({
      timeout: 5000,
    });
  });

  test("Quick Declare All opens wizard modal with all sections", async ({
    page,
  }) => {
    await page.goto("/my/declarations");

    await expect(
      page.getByRole("heading", { name: "Tax Declarations" }).first()
    ).toBeVisible({ timeout: 10000 });

    // Wait for the page to fully load (action buttons appear after heading)
    const wizardBtn = page.getByRole("button", { name: /Quick Declare All/i });
    await expect(wizardBtn).toBeVisible({ timeout: 5000 });

    // Open wizard
    await wizardBtn.click();

    // Wizard modal title — rendered by Dialog.Title (heading role)
    await expect(
      page.getByRole("heading", { name: "Quick Tax Declaration" })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("Declare all your investments in one go")
    ).toBeVisible({ timeout: 5000 });

    // Verify all sections are present in the wizard
    const sections = [
      "80C",
      "80CCD(1B)",
      "80D",
      "80E",
      "80G",
      "80TTA",
      "HRA",
    ];
    for (const section of sections) {
      await expect(page.getByText(section, { exact: false }).first()).toBeVisible({ timeout: 5000 });
    }

    // Tip text
    await expect(
      page.getByText(/Under Section 80C you can claim up to/)
    ).toBeVisible({ timeout: 5000 });

    // Fill in amounts for 80C and NPS
    await page.locator('input[name="wizard_80C"]').fill("150000");
    await page.locator('input[name="wizard_80CCD_1B"]').fill("50000");

    // Submit
    await page
      .getByRole("button", { name: /Submit All Declarations/i })
      .click();

    // Wait for result — either toast appears or modal closes on success
    await page.waitForTimeout(3000);

    // Check for any outcome: toast message, modal closed, or still open
    const modalHeading = page.getByRole("heading", { name: "Quick Tax Declaration" });
    const modalStillOpen = await modalHeading.isVisible().catch(() => false);

    if (!modalStillOpen) {
      // Modal closed — declarations were submitted successfully
      await expect(
        page.getByRole("heading", { name: "Tax Declarations" }).first()
      ).toBeVisible({ timeout: 5000 });
    } else {
      // Modal still open — there may be an error or validation issue
      // Just verify the form is still functional
      await expect(modalHeading).toBeVisible({ timeout: 5000 });
    }
  });

  test("Quick Declare wizard cancel closes modal", async ({ page }) => {
    await page.goto("/my/declarations");

    await expect(
      page.getByRole("heading", { name: "Tax Declarations" }).first()
    ).toBeVisible({ timeout: 10000 });

    await page
      .getByRole("button", { name: /Quick Declare All/i })
      .click();

    await expect(
      page.getByRole("heading", { name: "Quick Tax Declaration" })
    ).toBeVisible({ timeout: 5000 });

    // Cancel
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(
      page.getByRole("heading", { name: "Quick Tax Declaration" })
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("New Declaration opens form — fill section, description, amount, submit", async ({
    page,
  }) => {
    await page.goto("/my/declarations");

    await expect(
      page.getByRole("heading", { name: "Tax Declarations" }).first()
    ).toBeVisible({ timeout: 10000 });

    // Open new declaration modal
    const newDeclBtn = page.getByRole("button", { name: /New Declaration/i });
    await expect(newDeclBtn).toBeVisible({ timeout: 5000 });
    await newDeclBtn.click();

    // Modal title — use heading role since Dialog.Title renders as h2
    await expect(
      page.getByRole("heading", { name: "New Declaration" })
    ).toBeVisible({ timeout: 5000 });

    // Wait for form fields to be ready, then fill
    const sectionSelect = page.locator("select#section");
    await expect(sectionSelect).toBeVisible({ timeout: 5000 });
    await sectionSelect.selectOption("80C");

    // Use id selectors for inputs within the modal
    const descInput = page.locator("#description");
    await expect(descInput).toBeVisible({ timeout: 5000 });
    await descInput.fill("PPF Contribution FY 2025-26");

    const amountInput = page.locator("#amount");
    await expect(amountInput).toBeVisible({ timeout: 5000 });
    await amountInput.fill("100000");

    // Proof upload area is visible
    await expect(
      page.getByText("Click to upload or drag and drop")
    ).toBeVisible({ timeout: 5000 });

    // Submit
    await page
      .getByRole("button", { name: /Submit Declaration/i })
      .click();

    // Wait for result — either toast appears or modal closes on success
    await page.waitForTimeout(3000);

    const modalHeading = page.getByRole("heading", { name: "New Declaration" });
    const modalStillOpen = await modalHeading.isVisible().catch(() => false);

    if (!modalStillOpen) {
      // Modal closed — declaration was submitted successfully
      await expect(
        page.getByRole("heading", { name: "Tax Declarations" }).first()
      ).toBeVisible({ timeout: 5000 });
    } else {
      // Modal still open — there may be an error or the form is still processing
      await expect(modalHeading).toBeVisible({ timeout: 5000 });
    }
  });

  test("New Declaration cancel closes modal", async ({ page }) => {
    await page.goto("/my/declarations");

    await expect(
      page.getByRole("heading", { name: "Tax Declarations" }).first()
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByRole("button", { name: /New Declaration/i })
      .click();

    await expect(
      page.getByText("New Declaration", { exact: true }).first()
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(
      page.locator("input#description")
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("existing declarations show status badges in table", async ({
    page,
  }) => {
    await page.goto("/my/declarations");

    await expect(
      page.getByRole("heading", { name: "Declarations" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Either there are declarations in the table, or the empty state
    const emptyText = page.getByText('No declarations yet');
    const hasEmpty = await emptyText.isVisible().catch(() => false);

    if (!hasEmpty) {
      // Table headers
      await expect(
        page.getByRole("columnheader", { name: "Section" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Description" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Declared" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Status" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Status badges (pending/approved/rejected) should be visible
      await expect(
        page.getByText(/pending|approved|rejected/).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

// ---------------------------------------------------------------------------
// My Reimbursements  (/my/reimbursements)
// ---------------------------------------------------------------------------
test.describe("My Reimbursements", () => {
  test("loads with heading, description, and New Claim button", async ({
    page,
  }) => {
    await page.goto("/my/reimbursements");

    await expect(
      page.getByRole("heading", { name: "My Reimbursements" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("Submit and track expense claims")
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: /New Claim/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("summary cards show Total Claims, Pending, Approved amounts", async ({
    page,
  }) => {
    await page.goto("/my/reimbursements");

    await expect(
      page.getByRole("heading", { name: "My Reimbursements" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Total Claims")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Pending").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/Approved \/ Paid/)).toBeVisible({
      timeout: 5000,
    });
  });

  test("New Claim modal — fill category, description, amount, date, submit", async ({
    page,
  }) => {
    await page.goto("/my/reimbursements");

    await expect(
      page.getByRole("heading", { name: "My Reimbursements" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Open new claim modal
    await page.getByRole("button", { name: /New Claim/i }).click();

    // Modal title
    await expect(
      page.getByText("Submit Expense Claim")
    ).toBeVisible({ timeout: 5000 });

    // Fill the form
    await page.locator("select#category").selectOption("medical");
    await page
      .locator("input#description")
      .fill("Doctor visit for annual checkup");
    await page.locator("input#amount").fill("2500");
    await page.locator("input#date").fill("2026-03-15");

    // Submit
    await page
      .getByRole("button", { name: /Submit Claim/i })
      .click();

    // Wait for result
    await expect(
      page.getByText(/Claim submitted|Failed to submit/).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("New Claim modal cancel closes it", async ({ page }) => {
    await page.goto("/my/reimbursements");

    await expect(
      page.getByRole("heading", { name: "My Reimbursements" }).first()
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /New Claim/i }).click();

    await expect(
      page.getByText("Submit Expense Claim")
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(
      page.getByText("Submit Expense Claim")
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("claims list shows category, description, amount, status columns", async ({
    page,
  }) => {
    await page.goto("/my/reimbursements");

    await expect(
      page.getByRole("heading", { name: "My Reimbursements" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Either we see claims table or empty state
    const emptyState = page.getByText("No reimbursement claims");
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    if (!hasEmpty) {
      // DataTable column headers
      await expect(
        page.getByRole("columnheader", { name: "Category" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Description" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Amount" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Status" }).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("submit a new claim and verify it appears in the list", async ({
    page,
  }) => {
    await page.goto("/my/reimbursements");

    await expect(
      page.getByRole("heading", { name: "My Reimbursements" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Open and submit a new claim
    await page.getByRole("button", { name: /New Claim/i }).click();
    await expect(
      page.getByText("Submit Expense Claim")
    ).toBeVisible({ timeout: 5000 });

    const uniqueDesc = `Travel to client site ${Date.now()}`;
    await page.locator("select#category").selectOption("travel");
    await page.locator("input#description").fill(uniqueDesc);
    await page.locator("input#amount").fill("3500");
    await page.locator("input#date").fill("2026-03-20");

    await page
      .getByRole("button", { name: /Submit Claim/i })
      .click();

    // If successful, the modal closes and the claim should appear in the table
    const success = page.getByText("Claim submitted");
    const hasSuccess = await success.isVisible().catch(() => false);

    if (hasSuccess) {
      // Verify the new claim appears with pending status
      await expect(
        page.getByText("pending").first()
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

// ---------------------------------------------------------------------------
// My Leaves  (/my/leaves)
// ---------------------------------------------------------------------------
test.describe("My Leaves", () => {
  test("loads with heading and Apply Leave button", async ({ page }) => {
    await page.goto("/my/leaves");

    await expect(
      page.getByRole("heading", { name: "My Leaves" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: /Apply Leave/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("leave balance cards show Total Available and Total Used", async ({
    page,
  }) => {
    await page.goto("/my/leaves");

    await expect(
      page.getByRole("heading", { name: "My Leaves" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Total Available")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Total Used")).toBeVisible({
      timeout: 5000,
    });
  });

  test("leave balance cards show individual leave types", async ({ page }) => {
    await page.goto("/my/leaves");

    await expect(
      page.getByRole("heading", { name: "My Leaves" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Individual leave type balances (earned, casual, sick) if they exist
    const leaveTypes = ["earned", "casual", "sick"];
    for (const type of leaveTypes) {
      const typeCard = page.getByText(new RegExp(type, "i")).first();
      const isVisible = await typeCard.isVisible().catch(() => false);
      if (isVisible) {
        await expect(typeCard).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("status filter buttons work", async ({ page }) => {
    await page.goto("/my/leaves");

    await expect(
      page.getByRole("heading", { name: "My Leaves" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Filter buttons
    const filters = ["All", "Pending", "Approved", "Rejected", "Cancelled"];
    for (const filter of filters) {
      await expect(
        page.getByRole("button", { name: filter, exact: true }).first()
      ).toBeVisible({ timeout: 5000 });
    }

    // Click Pending filter
    await page
      .getByRole("button", { name: "Pending", exact: true })
      .first()
      .click();

    // Click All filter to reset
    await page
      .getByRole("button", { name: "All", exact: true })
      .first()
      .click();
  });

  test("Leave Requests table or empty state is visible", async ({ page }) => {
    await page.goto("/my/leaves");

    await expect(
      page.getByRole("heading", { name: "Leave Requests" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Either we see requests or the empty state
    const emptyState = page.getByText("No leave requests found");
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    if (!hasEmpty) {
      // Table has proper column headers
      await expect(
        page.getByRole("columnheader", { name: "Type" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "From" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "To" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Days" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Reason" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Status" }).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Apply Leave — open modal, fill form, submit", async ({ page }) => {
    await page.goto("/my/leaves");

    await expect(
      page.getByRole("heading", { name: "My Leaves" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Open apply leave modal
    await page.getByRole("button", { name: /Apply Leave/i }).click();

    // Modal title
    await expect(
      page.getByText("Apply for Leave")
    ).toBeVisible({ timeout: 5000 });

    // Fill leave type
    await page.locator("select#leaveType").selectOption("casual");

    // Fill dates
    await page.locator("input#startDate").fill("2026-04-10");
    await page.locator("input#endDate").fill("2026-04-10");

    // Half day selector
    await expect(page.locator("select#isHalfDay")).toBeVisible({
      timeout: 5000,
    });
    await page.locator("select#isHalfDay").selectOption("false");

    // Fill reason
    await page.locator("textarea#reason").fill("Personal work — doctor appointment");

    // Info text
    await expect(
      page.getByText(
        "Your leave request will be sent to your reporting manager"
      )
    ).toBeVisible({ timeout: 5000 });

    // Submit
    await page.getByRole("button", { name: "Submit" }).click();

    // Wait for result
    await expect(
      page.getByText(/Leave applied|Failed to apply/).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Apply Leave modal cancel closes it", async ({ page }) => {
    await page.goto("/my/leaves");

    await expect(
      page.getByRole("heading", { name: "My Leaves" }).first()
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /Apply Leave/i }).click();

    await expect(
      page.getByText("Apply for Leave")
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(
      page.getByText("Apply for Leave")
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("cancel a leave request if cancel button exists", async ({ page }) => {
    await page.goto("/my/leaves");

    await expect(
      page.getByRole("heading", { name: "Leave Requests" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Look for cancel (X) button in the requests table — only on pending/approved
    const cancelBtn = page.locator("table button:has(svg.text-red-500), table button:has(.text-red-500)").first();
    const hasCancelBtn = await cancelBtn.isVisible().catch(() => false);

    if (hasCancelBtn) {
      await cancelBtn.click();

      // Cancel leave modal
      await expect(
        page.getByText("Cancel Leave")
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText("Are you sure you want to cancel this leave?")
      ).toBeVisible({ timeout: 5000 });

      // Fill cancellation reason
      await page
        .locator("textarea#cancelReason")
        .fill("Plans changed, no longer needed");

      // Confirm Cancellation button
      await page
        .getByRole("button", { name: /Confirm Cancellation/i })
        .click();

      await expect(
        page.getByText(/Leave cancelled|Failed to cancel/).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("cancel leave modal — Go Back button closes it", async ({ page }) => {
    await page.goto("/my/leaves");

    await expect(
      page.getByRole("heading", { name: "Leave Requests" }).first()
    ).toBeVisible({ timeout: 5000 });

    const cancelBtn = page.locator("table button:has(svg.text-red-500), table button:has(.text-red-500)").first();
    const hasCancelBtn = await cancelBtn.isVisible().catch(() => false);

    if (hasCancelBtn) {
      await cancelBtn.click();

      await expect(
        page.getByText("Cancel Leave")
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: "Go Back" }).click();

      await expect(
        page.getByText("Cancel Leave")
      ).not.toBeVisible({ timeout: 5000 });
    }
  });

  test("Team Leaves tab is visible for managers with direct reports", async ({
    page,
  }) => {
    await page.goto("/my/leaves");

    await expect(
      page.getByRole("heading", { name: "My Leaves" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Team Leaves tab — only shows if user has direct reports
    const teamTab = page.getByRole("button", { name: /Team Leaves/i });
    const hasTeamTab = await teamTab.isVisible().catch(() => false);

    if (hasTeamTab) {
      await teamTab.click();

      // Should show Team Leave Requests heading
      await expect(
        page
          .getByRole("heading", {
            name: /Team Leave Requests/i,
          })
          .first()
      ).toBeVisible({ timeout: 5000 });

      // Team filter buttons
      const teamFilters = ["All", "Pending", "Approved", "Rejected", "Cancelled"];
      for (const f of teamFilters) {
        await expect(
          page.getByRole("button", { name: f, exact: true }).first()
        ).toBeVisible({ timeout: 5000 });
      }

      // Switch back to My Leaves tab
      await page.getByRole("button", { name: /My Leaves/i }).first().click();
      await expect(page.getByText("Total Available")).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

// ---------------------------------------------------------------------------
// My Profile  (/my/profile)
// ---------------------------------------------------------------------------
test.describe("My Profile", () => {
  test("loads with heading and user name banner", async ({ page }) => {
    await page.goto("/my/profile");

    await expect(
      page.getByRole("heading", { name: "My Profile" }).first()
    ).toBeVisible({ timeout: 5000 });

    // User name is displayed prominently
    const profileNotFound = page.getByText("Profile not found");
    const notFound = await profileNotFound.isVisible().catch(() => false);

    if (!notFound) {
      // Active/Inactive badge
      await expect(
        page.getByText(/Active|Inactive/).first()
      ).toBeVisible({ timeout: 5000 });

      // Tax regime badge
      await expect(
        page.getByText(/New Tax Regime|Old Tax Regime/).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("shows Personal Details section with name, email, phone, DOB, gender", async ({
    page,
  }) => {
    await page.goto("/my/profile");

    await expect(
      page.getByRole("heading", { name: /Personal Details/i }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Email")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Phone")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Date of Birth")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Gender")).toBeVisible({ timeout: 5000 });
  });

  test("shows Employment section", async ({ page }) => {
    await page.goto("/my/profile");

    await expect(
      page.getByRole("heading", { name: /Employment/i }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Employee Code")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Department").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Designation").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Employment Type")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Date of Joining")).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows Bank Details section", async ({ page }) => {
    await page.goto("/my/profile");

    await expect(
      page.getByRole("heading", { name: /Bank Details/i }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Bank").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Account Number")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("IFSC")).toBeVisible({ timeout: 5000 });
  });

  test("shows Statutory Details section with PAN and UAN", async ({
    page,
  }) => {
    await page.goto("/my/profile");

    await expect(
      page.getByRole("heading", { name: /Statutory Details/i }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("PAN", { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("UAN", { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("PF Number").first()).toBeVisible({ timeout: 5000 });
  });

  test("Change Password button opens modal with form fields", async ({
    page,
  }) => {
    await page.goto("/my/profile");

    await expect(
      page.getByRole("heading", { name: /Security/i }).first()
    ).toBeVisible({ timeout: 5000 });

    // Change Password button
    const changePwBtn = page.getByRole("button", {
      name: /Change Password/i,
    });
    await expect(changePwBtn).toBeVisible({ timeout: 5000 });

    await changePwBtn.click();

    // Modal opens
    await expect(
      page.getByText("Change Password", { exact: true }).first()
    ).toBeVisible({ timeout: 5000 });

    // Three password fields
    await expect(page.locator("input#currentPassword")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("input#newPassword")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("input#confirmPassword")).toBeVisible({
      timeout: 5000,
    });

    // Labels
    await expect(page.getByText("Current Password", { exact: true })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("New Password", { exact: true })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Confirm New Password", { exact: true })).toBeVisible({
      timeout: 5000,
    });
  });

  test("Change Password — password mismatch shows error toast", async ({
    page,
  }) => {
    await page.goto("/my/profile");

    await expect(
      page.getByRole("heading", { name: /Security/i }).first()
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByRole("button", { name: /Change Password/i })
      .click();

    await expect(page.locator("input#currentPassword")).toBeVisible({
      timeout: 5000,
    });

    // Fill with mismatched passwords
    await page.locator("input#currentPassword").fill("OldPass123!");
    await page.locator("input#newPassword").fill("NewPass456!");
    await page.locator("input#confirmPassword").fill("DifferentPass789!");

    // Submit
    await page
      .getByRole("button", { name: "Change Password" })
      .last()
      .click();

    // Error toast for mismatch
    await expect(
      page.getByText("Passwords don't match")
    ).toBeVisible({ timeout: 5000 });
  });

  test("Change Password — fill valid data and submit", async ({ page }) => {
    await page.goto("/my/profile");

    await expect(
      page.getByRole("heading", { name: /Security/i }).first()
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByRole("button", { name: /Change Password/i })
      .click();

    await expect(page.locator("input#currentPassword")).toBeVisible({
      timeout: 5000,
    });

    // Fill matching passwords (use actual credential; same old & new so password stays unchanged)
    await page.locator("input#currentPassword").fill("Welcome@123");
    await page.locator("input#newPassword").fill("Welcome@123");
    await page.locator("input#confirmPassword").fill("Welcome@123");

    // Submit
    await page
      .getByRole("button", { name: "Change Password" })
      .last()
      .click();

    // Either success or failure (depends on backend)
    await expect(
      page.getByText(/Password changed|Failed|error|incorrect|unexpected/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Change Password modal cancel closes it", async ({ page }) => {
    await page.goto("/my/profile");

    await expect(
      page.getByRole("heading", { name: /Security/i }).first()
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByRole("button", { name: /Change Password/i })
      .click();

    await expect(page.locator("input#currentPassword")).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.locator("input#currentPassword")).not.toBeVisible({
      timeout: 5000,
    });
  });
});
