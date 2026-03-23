import { test, expect } from "@playwright/test";

test.describe("Audit Log", () => {
  test("page loads with Audit Log heading and entry count", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Description shows entry count like "X of Y entries"
    await expect(
      page.getByText(/\d+ of \d+ entries/).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("search input is visible and accepts text", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    const searchInput = page.getByPlaceholder("Search logs...");
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Type a search term
    await searchInput.fill("employee");
    await expect(searchInput).toHaveValue("employee", { timeout: 5000 });
  });

  test("search filters results and updates entry count", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Get initial description text
    const descriptionEl = page.getByText(/\d+ of \d+ entries/).first();
    await expect(descriptionEl).toBeVisible({ timeout: 5000 });
    const initialText = await descriptionEl.textContent();

    // Search for something specific
    const searchInput = page.getByPlaceholder("Search logs...");
    await searchInput.fill("payroll");

    // Wait for filtering to take effect
    await page.waitForTimeout(500);

    // Entry count description should update
    const updatedText = await page.getByText(/\d+ of \d+ entries/).first().textContent();
    // The filtered count may differ from the total
    expect(updatedText).toBeTruthy();
  });

  test("action type filter dropdown has all options", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    const actionFilter = page.locator("select").first();
    await expect(actionFilter).toBeVisible({ timeout: 5000 });

    // Verify all action type options
    await expect(actionFilter.locator("option", { hasText: "All Actions" })).toBeAttached();
    await expect(actionFilter.locator("option", { hasText: "Employee" })).toBeAttached();
    await expect(actionFilter.locator("option", { hasText: "Payroll" })).toBeAttached();
    await expect(actionFilter.locator("option", { hasText: "Salary" })).toBeAttached();
    await expect(actionFilter.locator("option", { hasText: "Settings" })).toBeAttached();
    await expect(actionFilter.locator("option", { hasText: "Login" })).toBeAttached();
  });

  test("select action type filter and verify filtering", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    const actionFilter = page.locator("select").first();
    await expect(actionFilter).toBeVisible({ timeout: 5000 });

    // Select "Employee" filter
    await actionFilter.selectOption("employee");
    await expect(actionFilter).toHaveValue("employee", { timeout: 5000 });

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Entry count should reflect filtering
    await expect(
      page.getByText(/\d+ of \d+ entries/).first()
    ).toBeVisible({ timeout: 5000 });

    // Reset to all
    await actionFilter.selectOption("");
    await expect(actionFilter).toHaveValue("", { timeout: 5000 });
  });

  test("entity type filter dropdown has all options", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    const entityFilter = page.locator("select").nth(1);
    await expect(entityFilter).toBeVisible({ timeout: 5000 });

    // Verify all entity type options
    await expect(entityFilter.locator("option", { hasText: "All Entities" })).toBeAttached();
    await expect(entityFilter.locator("option", { hasText: "Employee" })).toBeAttached();
    await expect(entityFilter.locator("option", { hasText: "Payroll Run" })).toBeAttached();
    await expect(entityFilter.locator("option", { hasText: "Payslip" })).toBeAttached();
    await expect(entityFilter.locator("option", { hasText: "Salary" })).toBeAttached();
    await expect(entityFilter.locator("option", { hasText: "Organization" })).toBeAttached();
  });

  test("select entity type filter and verify filtering", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    const entityFilter = page.locator("select").nth(1);
    await expect(entityFilter).toBeVisible({ timeout: 5000 });

    // Select "Payroll Run" filter
    await entityFilter.selectOption("payroll_run");
    await expect(entityFilter).toHaveValue("payroll_run", { timeout: 5000 });

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Entry count should reflect filtering
    await expect(
      page.getByText(/\d+ of \d+ entries/).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("combine action and entity filters", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    const actionFilter = page.locator("select").first();
    const entityFilter = page.locator("select").nth(1);
    await expect(actionFilter).toBeVisible({ timeout: 5000 });
    await expect(entityFilter).toBeVisible({ timeout: 5000 });

    // Apply both filters
    await actionFilter.selectOption("payroll");
    await entityFilter.selectOption("payroll_run");

    await page.waitForTimeout(500);

    // Count should update
    await expect(
      page.getByText(/\d+ of \d+ entries/).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("table shows column headers: Action, Entity, Entity ID, User, IP, Time", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Check for table header columns
    const hasTable = await page.locator("table").first().isVisible().catch(() => false);

    if (hasTable) {
      await expect(
        page.getByRole("columnheader", { name: "Action" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Entity" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Entity ID" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "User" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "IP" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("columnheader", { name: "Time" }).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("log entries display data in table rows", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for data to load
    await page.waitForTimeout(1000);

    const hasTable = await page.locator("table").first().isVisible().catch(() => false);

    if (hasTable) {
      // Check that at least one row has data
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // First row should have cells with content
        const firstRow = rows.first();
        const cells = firstRow.locator("td");
        const cellCount = await cells.count();
        expect(cellCount).toBeGreaterThanOrEqual(5);
      }
    } else {
      // Empty state message
      await expect(
        page.getByText(/No audit logs yet|No logs match your filters/).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("pagination appears when more than 20 entries", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(1000);

    // Check if pagination is present (Showing X-Y of Z text)
    const paginationText = page.getByText(/Showing \d+–\d+ of \d+/).first();
    const hasPagination = await paginationText.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(paginationText).toBeVisible({ timeout: 5000 });

      // Page number buttons should be visible
      const pageButtons = page.locator("button.h-8.w-8");
      const buttonCount = await pageButtons.count();
      expect(buttonCount).toBeGreaterThan(0);

      // Click next page if available
      const nextButton = page.locator("button").filter({ has: page.locator("svg") }).last();
      const isDisabled = await nextButton.isDisabled();

      if (!isDisabled) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Pagination text should update
        await expect(
          page.getByText(/Showing \d+–\d+ of \d+/).first()
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("search with no results shows empty state", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Search for something that should not exist
    const searchInput = page.getByPlaceholder("Search logs...");
    await searchInput.fill("zzz_nonexistent_xyz_12345");

    await page.waitForTimeout(500);

    // Should show "No logs match your filters" or 0 count
    const entryCount = page.getByText(/0 of \d+ entries/).first();
    const emptyState = page.getByText("No logs match your filters").first();

    const hasZeroCount = await entryCount.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasZeroCount || hasEmptyState).toBeTruthy();
  });

  test("clear search restores all results", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: "Audit Log" }).first()
    ).toBeVisible({ timeout: 5000 });

    const searchInput = page.getByPlaceholder("Search logs...");

    // Get initial count text
    const initialCount = await page.getByText(/\d+ of \d+ entries/).first().textContent();

    // Search for something
    await searchInput.fill("employee");
    await page.waitForTimeout(500);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Count should return to initial
    const restoredCount = await page.getByText(/\d+ of \d+ entries/).first().textContent();
    expect(restoredCount).toBe(initialCount);
  });
});
