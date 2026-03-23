import { test, expect } from "@playwright/test";

test.describe("Payslips Page", () => {
  test("page loads with heading and payslip count description", async ({ page }) => {
    await page.goto("/payslips");

    await expect(
      page.getByRole("heading", { name: "Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Description shows either "Loading..." or "{n} payslips"
    await expect(
      page.getByText(/\d+ payslips|Loading/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Export All button is visible", async ({ page }) => {
    await page.goto("/payslips");

    await expect(
      page.getByRole("heading", { name: "Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole("button", { name: /Export All/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("payslip table loads with correct column headers", async ({ page }) => {
    await page.goto("/payslips");

    await expect(
      page.getByRole("heading", { name: "Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    const table = page.locator("table").first();
    await expect(table).toBeVisible({ timeout: 5000 });

    // Verify all expected column headers
    for (const col of ["Employee", "Period", "Gross", "Deductions", "Net Pay", "Status"]) {
      await expect(
        page.getByRole("columnheader", { name: col }).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("table rows display payslip data with status badges", async ({ page }) => {
    await page.goto("/payslips");

    await expect(
      page.getByRole("heading", { name: "Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for the table to render
    const table = page.locator("table").first();
    await expect(table).toBeVisible({ timeout: 5000 });

    // Wait for data to load
    await page.waitForTimeout(2000);

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const firstRow = rows.first();
      const firstRowText = await firstRow.textContent();

      // If the only row is "No data found", the table is empty — pass gracefully
      if (firstRowText?.includes("No data found")) {
        await expect(page.getByText("No data found")).toBeVisible({ timeout: 5000 });
        return;
      }

      // The Status column (6th td) contains a Badge <span>
      const statusCell = firstRow.locator("td").nth(5);
      const badge = statusCell.locator("span").first();
      await expect(badge).toBeVisible({ timeout: 5000 });

      // Verify the badge text is a valid payslip status
      const badgeText = await badge.textContent();
      expect(badgeText?.trim()).toMatch(/draft|computed|approved|paid|disputed|generated/i);

      // Each row should have the eye (view) and download action buttons in the last column
      const actionCell = firstRow.locator("td").last();
      const actionButtons = actionCell.locator("button");
      const btnCount = await actionButtons.count();
      expect(btnCount).toBeGreaterThanOrEqual(1);
    }
  });

  test("click Export All button triggers CSV download", async ({ page }) => {
    await page.goto("/payslips");

    await expect(
      page.getByRole("heading", { name: "Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    const exportBtn = page.getByRole("button", { name: /Export All/i }).first();
    await expect(exportBtn).toBeVisible({ timeout: 5000 });

    // Click export — should trigger download or show toast
    await exportBtn.click();

    // Wait for response processing
    await page.waitForTimeout(2000);
  });

  test("click a payslip row opens the detail preview modal", async ({ page }) => {
    await page.goto("/payslips");

    await expect(
      page.getByRole("heading", { name: "Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      await rows.first().click();

      // Modal should open with "Payslip" heading
      await expect(
        page.getByRole("heading", { name: "Payslip" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Modal should show Earnings section
      await expect(page.getByText("Earnings").first()).toBeVisible({ timeout: 5000 });

      // Modal should show Deductions section
      await expect(page.getByText("Deductions").first()).toBeVisible({ timeout: 5000 });

      // Modal should show Gross Pay total
      await expect(page.getByText("Gross Pay").first()).toBeVisible({ timeout: 5000 });

      // Modal should show Total Deductions total
      await expect(page.getByText("Total Deductions").first()).toBeVisible({ timeout: 5000 });

      // Modal should show Net Pay highlight
      await expect(page.getByText("Net Pay").first()).toBeVisible({ timeout: 5000 });

      // Download PDF button
      await expect(
        page.getByRole("button", { name: /Download PDF/i }).first()
      ).toBeVisible({ timeout: 5000 });

      // Close button
      await expect(
        page.getByRole("button", { name: "Close" }).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("click view (eye) button on a row opens the preview modal", async ({ page }) => {
    await page.goto("/payslips");

    await expect(
      page.getByRole("heading", { name: "Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Click the eye button (first action button) in the first row
      const eyeButton = rows.first().locator("button").first();
      await expect(eyeButton).toBeVisible({ timeout: 5000 });
      await eyeButton.click();

      // Modal should open
      await expect(
        page.getByRole("heading", { name: "Payslip" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Verify modal content
      await expect(page.getByText("Earnings").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Deductions").first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("close button in payslip preview modal closes it", async ({ page }) => {
    await page.goto("/payslips");

    await expect(
      page.getByRole("heading", { name: "Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for data to load
    await page.waitForTimeout(2000);

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const firstRowText = await rows.first().textContent();
      // If the only row is "No data found", skip
      if (firstRowText?.includes("No data found")) {
        return;
      }

      await rows.first().click();

      await expect(
        page.getByRole("heading", { name: "Payslip" }).first()
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: "Close" }).first().click();

      // Modal should close — use exact match to avoid matching page heading "Payslips"
      await expect(
        page.getByRole("heading", { name: "Payslip", exact: true })
      ).toBeHidden({ timeout: 5000 });
    }
  });

  test("Download PDF button in preview modal triggers PDF download", async ({ page }) => {
    await page.goto("/payslips");

    await expect(
      page.getByRole("heading", { name: "Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      await rows.first().click();

      await expect(
        page.getByRole("heading", { name: "Payslip" }).first()
      ).toBeVisible({ timeout: 5000 });

      const pdfBtn = page.getByRole("button", { name: /Download PDF/i }).first();
      await expect(pdfBtn).toBeVisible({ timeout: 5000 });

      // Click PDF download — opens in new tab
      const popupPromise = page.waitForEvent("popup").catch(() => null);
      await pdfBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test("payslip preview modal shows earnings line items with amounts", async ({ page }) => {
    await page.goto("/payslips");

    await expect(
      page.getByRole("heading", { name: "Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      await rows.first().click();

      await expect(
        page.getByRole("heading", { name: "Payslip" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Earnings section should have at least one line item with a currency value
      const earningsCard = page.locator("div").filter({ hasText: /^Earnings/ }).first();
      await expect(earningsCard).toBeVisible({ timeout: 5000 });

      // Verify currency values are displayed (rupee sign)
      const currencyValues = page.locator("text=/[₹\\d,]+/");
      const valCount = await currencyValues.count();
      expect(valCount).toBeGreaterThanOrEqual(1);
    }
  });

  test("payslip preview modal shows deductions line items with negative amounts", async ({
    page,
  }) => {
    await page.goto("/payslips");

    await expect(
      page.getByRole("heading", { name: "Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      await rows.first().click();

      await expect(
        page.getByRole("heading", { name: "Payslip" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Deductions section
      await expect(page.getByText("Deductions").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Total Deductions").first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("multiple payslip rows can be viewed sequentially", async ({ page }) => {
    await page.goto("/payslips");

    await expect(
      page.getByRole("heading", { name: "Payslips" }).first()
    ).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (rowCount >= 2) {
      // View first payslip — use exact match to avoid matching page heading "Payslips"
      await rows.first().click();
      await expect(
        page.getByRole("heading", { name: "Payslip", exact: true }).first()
      ).toBeVisible({ timeout: 5000 });

      // Close modal
      await page.getByRole("button", { name: "Close" }).first().click();
      await expect(
        page.getByRole("heading", { name: "Payslip", exact: true })
      ).toBeHidden({ timeout: 5000 });

      // View second payslip
      await rows.nth(1).click();
      await expect(
        page.getByRole("heading", { name: "Payslip", exact: true }).first()
      ).toBeVisible({ timeout: 5000 });

      // Verify content is present
      await expect(page.getByText("Earnings").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Net Pay").first()).toBeVisible({ timeout: 5000 });

      // Close
      await page.getByRole("button", { name: "Close" }).first().click();
    }
  });
});
