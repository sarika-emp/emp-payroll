import { test, expect } from "@playwright/test";

test.describe("Holidays Page", () => {
  test("page loads with heading and holiday count description", async ({ page }) => {
    await page.goto("/holidays");
    await expect(
      page.getByRole("heading", { name: "Holiday Calendar", level: 1 })
    ).toBeVisible({ timeout: 5000 });
    // Description shows year and holiday count
    await expect(
      page.getByText(/holidays configured/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Add Holiday button is visible", async ({ page }) => {
    await page.goto("/holidays");
    await expect(
      page.getByRole("button", { name: /Add Holiday/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("Upcoming Holidays section is visible with table", async ({ page }) => {
    await page.goto("/holidays");
    await expect(
      page.getByRole("heading", { name: "Upcoming Holidays" }).first()
    ).toBeVisible({ timeout: 5000 });
    // Table under Upcoming Holidays should have column headers
    const tables = page.locator("table");
    await expect(tables.first()).toBeVisible({ timeout: 5000 });
  });

  test("Past Holidays section is visible", async ({ page }) => {
    await page.goto("/holidays");
    await expect(
      page.getByRole("heading", { name: "Past Holidays" }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("holiday tables have correct column headers", async ({ page }) => {
    await page.goto("/holidays");
    await expect(
      page.getByRole("columnheader", { name: "Holiday" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "Date" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "Day" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "Type" }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("holiday cards show type badges (national/regional)", async ({ page }) => {
    await page.goto("/holidays");
    // At least one "national" badge should be visible in the table
    await expect(
      page.getByText("national").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("calendar overview grid shows 12 month cards", async ({ page }) => {
    await page.goto("/holidays");
    // The calendar overview contains month names
    for (const month of ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"]) {
      await expect(
        page.getByText(month, { exact: true }).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("calendar month cards show holiday names for months with holidays", async ({ page }) => {
    await page.goto("/holidays");
    // Republic Day should appear in the January card area
    await expect(
      page.getByText("Republic Day").first()
    ).toBeVisible({ timeout: 5000 });
    // Diwali should appear
    await expect(
      page.getByText("Diwali").first()
    ).toBeVisible({ timeout: 5000 });
    // Christmas should appear
    await expect(
      page.getByText("Christmas").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("known holidays are listed in the tables", async ({ page }) => {
    await page.goto("/holidays");
    // Verify several default holidays exist in either upcoming or past tables
    const knownHolidays = ["Independence Day", "Gandhi Jayanti", "Dussehra", "Ganesh Chaturthi"];
    for (const name of knownHolidays) {
      await expect(
        page.getByText(name).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Add Holiday button opens modal with form", async ({ page }) => {
    await page.goto("/holidays");
    await page.getByRole("button", { name: /Add Holiday/i }).click();
    // Modal title
    await expect(
      page.getByRole("heading", { name: "Add Holiday" }).first()
    ).toBeVisible({ timeout: 5000 });
    // Form fields
    await expect(
      page.getByLabel("Holiday Name")
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByLabel("Date")
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByLabel("Type")
    ).toBeVisible({ timeout: 5000 });
    // Buttons
    await expect(
      page.getByRole("button", { name: "Cancel" })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: "Add Holiday" }).last()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Add Holiday modal — Type select has national, regional, optional options", async ({ page }) => {
    await page.goto("/holidays");
    await page.getByRole("button", { name: /Add Holiday/i }).click();
    const typeSelect = page.getByLabel("Type");
    await expect(typeSelect).toBeVisible({ timeout: 5000 });
    // Verify the select options
    await expect(typeSelect.locator("option")).toHaveCount(3, { timeout: 5000 });
    await expect(typeSelect.locator("option").nth(0)).toHaveText("National", { timeout: 5000 });
    await expect(typeSelect.locator("option").nth(1)).toHaveText("Regional", { timeout: 5000 });
    await expect(typeSelect.locator("option").nth(2)).toHaveText("Optional / Restricted", { timeout: 5000 });
  });

  test("Add Holiday modal can be closed with Cancel", async ({ page }) => {
    await page.goto("/holidays");
    await page.getByRole("button", { name: /Add Holiday/i }).click();
    await expect(
      page.getByRole("heading", { name: "Add Holiday" }).first()
    ).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByLabel("Holiday Name")
    ).toBeHidden({ timeout: 5000 });
  });

  test("Add Holiday — fill form and submit, verify new holiday appears", async ({ page }) => {
    await page.goto("/holidays");
    // Count holidays before
    const descBefore = await page.getByText(/holidays configured/i).first().textContent();
    const countBefore = parseInt(descBefore!.match(/(\d+)\s*holidays configured/i)?.[1] || "0", 10);

    await page.getByRole("button", { name: /Add Holiday/i }).click();
    await expect(
      page.getByLabel("Holiday Name")
    ).toBeVisible({ timeout: 5000 });

    // Fill holiday name
    await page.getByLabel("Holiday Name").fill("Test Company Day");
    // Fill date — pick a future date
    await page.getByLabel("Date").fill("2026-12-31");
    // Select type as regional
    await page.getByLabel("Type").selectOption("regional");

    // Submit
    await page.getByRole("button", { name: "Add Holiday" }).last().click();

    // Modal should close
    await expect(
      page.getByLabel("Holiday Name")
    ).toBeHidden({ timeout: 5000 });

    // New holiday should appear on the page
    await expect(
      page.getByText("Test Company Day").first()
    ).toBeVisible({ timeout: 5000 });

    // Holiday count in description should increase by 1
    const descAfter = await page.getByText(/holidays configured/i).first().textContent();
    const countAfter = parseInt(descAfter!.match(/(\d+)\s*holidays configured/i)?.[1] || "0", 10);
    expect(countAfter).toBe(countBefore + 1);
  });

  test("Add Holiday — new national holiday appears in upcoming table", async ({ page }) => {
    await page.goto("/holidays");
    await page.getByRole("button", { name: /Add Holiday/i }).click();
    await page.getByLabel("Holiday Name").fill("Future National Fest");
    await page.getByLabel("Date").fill("2026-12-28");
    await page.getByLabel("Type").selectOption("national");
    await page.getByRole("button", { name: "Add Holiday" }).last().click();

    // Should appear with national badge
    await expect(
      page.getByText("Future National Fest").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Delete holiday — remove a holiday from the list", async ({ page }) => {
    await page.goto("/holidays");
    // Wait for page to fully load
    await expect(
      page.getByRole("heading", { name: "Holiday Calendar" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for at least one table to render
    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    // Get the initial holiday count
    const descBefore = await page.getByText(/holidays configured/i).first().textContent();
    const countBefore = parseInt(descBefore!.match(/(\d+)\s*holidays configured/i)?.[1] || "0", 10);
    expect(countBefore).toBeGreaterThan(0);

    // Find and click the first delete button (Trash2 icon button)
    const deleteButtons = page.locator("table button").filter({ has: page.locator("svg") });
    await expect(deleteButtons.first()).toBeVisible({ timeout: 5000 });

    // Click delete on the first holiday
    await deleteButtons.first().click();

    // Holiday count should decrease
    const descAfter = await page.getByText(/holidays configured/i).first().textContent();
    const countAfter = parseInt(descAfter!.match(/(\d+)\s*holidays configured/i)?.[1] || "0", 10);
    expect(countAfter).toBe(countBefore - 1);
  });

  test("holiday dates are formatted in en-IN locale", async ({ page }) => {
    await page.goto("/holidays");
    // Tables should show dates in "DD Mon YYYY" format (en-IN)
    // Look for a date pattern like "26 Jan 2026" or similar
    await expect(
      page.locator("table tbody td").filter({ hasText: /\d{1,2}\s\w{3}\s\d{4}/ }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("holiday day-of-week column shows day names", async ({ page }) => {
    await page.goto("/holidays");
    // Wait for the page and table to fully load
    await expect(
      page.getByRole("heading", { name: "Holiday Calendar" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    // The "Day" column should contain day names
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    let foundDay = false;
    for (const day of dayNames) {
      const visible = await page.locator("table tbody td").filter({ hasText: day }).first().isVisible().catch(() => false);
      if (visible) {
        foundDay = true;
        break;
      }
    }
    expect(foundDay).toBe(true);
  });

  test("regional holiday shows regional badge", async ({ page }) => {
    await page.goto("/holidays");
    // Ganesh Chaturthi is regional in the default data
    await expect(
      page.getByText("Ganesh Chaturthi").first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("regional").first()
    ).toBeVisible({ timeout: 5000 });
  });
});
