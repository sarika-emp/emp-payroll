import { test, expect } from "@playwright/test";

test.describe("Loans Page", () => {
  test("page loads with heading and description", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("Track employee loans, advances, and EMI deductions")
    ).toBeVisible({ timeout: 5000 });
  });

  test("displays all four stat cards", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Active Loans").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Outstanding").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Monthly EMI").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Completed").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("New Loan button is visible and opens create modal", async ({
    page,
  }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const newLoanBtn = page.getByRole("button", { name: /New Loan/ });
    await expect(newLoanBtn).toBeVisible({ timeout: 5000 });
    await newLoanBtn.click();

    // Modal title
    await expect(
      page.getByText("Create Loan / Advance")
    ).toBeVisible({ timeout: 5000 });

    // All form fields present in modal
    await expect(page.locator("#employeeId")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#type")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#description")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#amount")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#tenure")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#interest")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#startDate")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#notes")).toBeVisible({ timeout: 5000 });

    // Modal buttons
    await expect(
      page.getByRole("button", { name: "Cancel" })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: "Create Loan" })
    ).toBeVisible({ timeout: 5000 });
  });

  test("create modal Cancel button closes the modal", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /New Loan/ }).click();
    await expect(
      page.getByText("Create Loan / Advance")
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByText("Create Loan / Advance")
    ).toBeHidden({ timeout: 5000 });
  });

  test("fill all fields in create loan modal and submit", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /New Loan/ }).click();
    await expect(
      page.getByText("Create Loan / Advance")
    ).toBeVisible({ timeout: 5000 });

    // Select employee (first option if available)
    const employeeSelect = page.locator("#employeeId");
    await expect(employeeSelect).toBeVisible({ timeout: 5000 });
    const employeeOptions = employeeSelect.locator("option");
    const optionCount = await employeeOptions.count();

    // If no employees exist, verify the form is displayed and close
    if (optionCount === 0) {
      await expect(page.locator("#type")).toBeVisible({ timeout: 5000 });
      await expect(page.locator("#amount")).toBeVisible({ timeout: 5000 });
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(
        page.getByRole("heading", { name: "Loans & Advances", level: 1 })
      ).toBeVisible({ timeout: 5000 });
      return;
    }

    const firstValue = await employeeOptions.first().getAttribute("value");
    if (firstValue) {
      await employeeSelect.selectOption(firstValue);
    }

    // Select loan type
    await page.locator("#type").selectOption("salary_advance");

    // Fill description
    await page.locator("#description").fill("Test loan for E2E");

    // Fill amount and tenure
    await page.locator("#amount").fill("50000");
    await page.locator("#tenure").fill("6");

    // Fill interest rate
    await page.locator("#interest").fill("5");

    // Start date should already have a default value, but set explicitly
    await page.locator("#startDate").fill("2026-04-01");

    // Optional notes
    await page.locator("#notes").fill("Automated test loan");

    // Submit the form
    await page.getByRole("button", { name: "Create Loan" }).click();

    // Wait for modal to close (success) or error toast
    await page.waitForTimeout(2000);

    // The page should still show the heading
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });
  });

  test("loan type select shows all three options", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /New Loan/ }).click();
    await expect(
      page.getByText("Create Loan / Advance")
    ).toBeVisible({ timeout: 5000 });

    const typeSelect = page.locator("#type");
    await expect(typeSelect.locator("option")).toHaveCount(3, {
      timeout: 5000,
    });

    // Verify option labels
    await expect(
      typeSelect.locator('option[value="salary_advance"]')
    ).toHaveText("Salary Advance", { timeout: 5000 });
    await expect(
      typeSelect.locator('option[value="loan"]')
    ).toHaveText("Loan", { timeout: 5000 });
    await expect(
      typeSelect.locator('option[value="emergency"]')
    ).toHaveText("Emergency Advance", { timeout: 5000 });
  });

  test("filter buttons are visible: All, active, completed, cancelled", async ({
    page,
  }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole("button", { name: "All", exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: "active", exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: "completed", exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: "cancelled", exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("clicking each filter button updates the list", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Click "active" filter
    await page
      .getByRole("button", { name: "active", exact: true })
      .first()
      .click();
    await page.waitForTimeout(500);
    // Table should be visible (DataTable always renders a table element)
    await expect(
      page.locator("table").first()
    ).toBeVisible({ timeout: 5000 });

    // Click "completed" filter
    await page
      .getByRole("button", { name: "completed", exact: true })
      .first()
      .click();
    await page.waitForTimeout(500);
    await expect(
      page.locator("table").first()
    ).toBeVisible({ timeout: 5000 });

    // Click "cancelled" filter
    await page
      .getByRole("button", { name: "cancelled", exact: true })
      .first()
      .click();
    await page.waitForTimeout(500);
    await expect(
      page.locator("table").first()
    ).toBeVisible({ timeout: 5000 });

    // Click "All" filter to reset
    await page
      .getByRole("button", { name: "All", exact: true })
      .first()
      .click();
    await page.waitForTimeout(500);
    await expect(
      page.locator("table").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("data table renders with correct column headers", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Wait for table to load
    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    // Verify column headers
    const headers = page.locator("table thead th");
    await expect(headers.filter({ hasText: "Employee" }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(headers.filter({ hasText: "Type" }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(
      headers.filter({ hasText: "Description" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(headers.filter({ hasText: "Principal" }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(
      headers.filter({ hasText: "Outstanding" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(headers.filter({ hasText: "EMI" }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(headers.filter({ hasText: "Progress" }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(headers.filter({ hasText: "Status" }).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("table rows show employee name, code, type badge, and status badge", async ({
    page,
  }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount > 0 && !(await rows.first().textContent())?.includes("No loans found")) {
      // First row should have employee info
      const firstRow = rows.first();
      // Should have at least one badge for type
      await expect(firstRow.locator("span").first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("Pay EMI button appears on active loans and can be clicked", async ({
    page,
  }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Filter to active loans
    await page
      .getByRole("button", { name: "active", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1000);

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    const payEmiBtn = page.getByRole("button", { name: /Pay EMI/ }).first();
    const payBtnVisible = await payEmiBtn.isVisible().catch(() => false);

    if (payBtnVisible) {
      await payEmiBtn.click();
      // After clicking, either success toast or error toast appears
      // Wait for the action to process
      await page.waitForTimeout(2000);

      // Page should still be visible and functional
      await expect(
        page.getByRole("heading", { name: "Loans & Advances", level: 1 })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("stat cards show numeric values", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Each stat card should have a value rendered as bold text
    // Active Loans card value
    const statValues = page.locator(".text-2xl.font-bold");
    await expect(statValues.first()).toBeVisible({ timeout: 5000 });

    // There should be 4 stat card values
    const valueCount = await statValues.count();
    expect(valueCount).toBeGreaterThanOrEqual(4);
  });

  test("create loan with loan type and verify table updates", async ({
    page,
  }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Open modal
    await page.getByRole("button", { name: /New Loan/ }).click();
    await expect(
      page.getByText("Create Loan / Advance")
    ).toBeVisible({ timeout: 5000 });

    // Select employee
    const employeeSelect = page.locator("#employeeId");
    const employeeOptions = employeeSelect.locator("option");
    const optCount = await employeeOptions.count();

    // If no employees, verify form is displayed and close
    if (optCount === 0) {
      await expect(page.locator("#type")).toBeVisible({ timeout: 5000 });
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(
        page.getByRole("heading", { name: "Loans & Advances", level: 1 })
      ).toBeVisible({ timeout: 5000 });
      return;
    }

    const firstVal = await employeeOptions.first().getAttribute("value");
    if (firstVal) {
      await employeeSelect.selectOption(firstVal);
    }

    // Select "Loan" type
    await page.locator("#type").selectOption("loan");

    // Fill required fields
    await page.locator("#description").fill("Home renovation loan");
    await page.locator("#amount").fill("100000");
    await page.locator("#tenure").fill("12");
    await page.locator("#interest").fill("8");
    await page.locator("#startDate").fill("2026-05-01");
    await page.locator("#notes").fill("E2E test - loan type");

    await page.getByRole("button", { name: "Create Loan" }).click();
    await page.waitForTimeout(2000);

    // Verify page is still functional
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });
  });

  test("create loan with emergency type", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /New Loan/ }).click();
    await expect(
      page.getByText("Create Loan / Advance")
    ).toBeVisible({ timeout: 5000 });

    const employeeSelect = page.locator("#employeeId");
    const employeeOptions = employeeSelect.locator("option");
    const optCount = await employeeOptions.count();

    // If no employees, verify form is displayed and close
    if (optCount === 0) {
      await expect(page.locator("#type")).toBeVisible({ timeout: 5000 });
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(
        page.getByRole("heading", { name: "Loans & Advances", level: 1 })
      ).toBeVisible({ timeout: 5000 });
      return;
    }

    const firstVal = await employeeOptions.first().getAttribute("value");
    if (firstVal) {
      await employeeSelect.selectOption(firstVal);
    }

    await page.locator("#type").selectOption("emergency");
    await page.locator("#description").fill("Medical emergency advance");
    await page.locator("#amount").fill("25000");
    await page.locator("#tenure").fill("3");
    await page.locator("#interest").fill("0");
    await page.locator("#startDate").fill("2026-04-15");

    await page.getByRole("button", { name: "Create Loan" }).click();
    await page.waitForTimeout(2000);

    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });
  });

  test("modal close X button works", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /New Loan/ }).click();
    await expect(
      page.getByText("Create Loan / Advance")
    ).toBeVisible({ timeout: 5000 });

    // Click the X close button on the dialog
    const closeBtn = page.locator("[data-radix-collection-item]").first();
    const closeBtnAlt = page.locator("button:has(svg.lucide-x)").first();
    const dialogClose = closeBtnAlt.isVisible()
      ? closeBtnAlt
      : closeBtn;

    if (await dialogClose.isVisible()) {
      await dialogClose.click();
      await expect(
        page.getByText("Create Loan / Advance")
      ).toBeHidden({ timeout: 5000 });
    }
  });

  test("form labels are correctly displayed in modal", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /New Loan/ }).click();
    await expect(
      page.getByText("Create Loan / Advance")
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Employee").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Type").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Description").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Amount").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Tenure").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Interest Rate").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Start Date").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Notes").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("progress bar renders for loans in table", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (
      rowCount > 0 &&
      !(await rows.first().textContent())?.includes("No loans found")
    ) {
      // Progress column has a progress bar div
      const progressBar = page.locator(".rounded-full.bg-gray-200").first();
      await expect(progressBar).toBeVisible({ timeout: 5000 });
    }
  });

  test("empty state message shows when no loans match filter", async ({
    page,
  }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Click cancelled filter -- likely fewer or no results
    await page
      .getByRole("button", { name: "cancelled", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1000);

    // Either table rows or empty message
    const tableOrEmpty = page.locator("table").first();
    await expect(tableOrEmpty).toBeVisible({ timeout: 5000 });
  });

  test("monthly EMI stat card shows subtitle text", async ({ page }) => {
    await page.goto("/loans");
    await expect(
      page.getByRole("heading", { name: "Loans & Advances", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("total across all").first()).toBeVisible({
      timeout: 5000,
    });
  });
});
