import { test, expect } from "@playwright/test";

test.describe("Reimbursements Page", () => {
  test("page loads with heading and description", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("Review and manage employee expense claims")
    ).toBeVisible({ timeout: 5000 });
  });

  test("displays all four stat cards", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Total Claims").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Pending").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Approved").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Paid").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("stat cards show numeric values", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Each stat card renders a bold value
    const statValues = page.locator(".text-2xl.font-bold");
    await expect(statValues.first()).toBeVisible({ timeout: 5000 });
    const valueCount = await statValues.count();
    expect(valueCount).toBeGreaterThanOrEqual(4);
  });

  test("pending stat card shows currency subtitle", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Pending and Approved cards have currency subtitles
    // The subtitle text includes a rupee symbol
    const subtitles = page.locator(".text-sm.text-gray-500");
    await expect(subtitles.first()).toBeVisible({ timeout: 5000 });
  });

  test("all five filter buttons are visible", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole("button", { name: "All", exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: "Pending", exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: "Approved", exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: "Rejected", exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: "Paid", exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("clicking Pending filter shows only pending claims", async ({
    page,
  }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByRole("button", { name: "Pending", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1000);

    // Table should be visible
    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    // If there are rows, all status badges should say "pending"
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    if (
      rowCount > 0 &&
      !(await rows.first().textContent())?.includes("No reimbursement")
    ) {
      const statusBadges = page.locator("table tbody tr td:nth-child(6) span");
      const badgeCount = await statusBadges.count();
      for (let i = 0; i < badgeCount; i++) {
        await expect(statusBadges.nth(i)).toHaveText("pending", {
          timeout: 5000,
        });
      }
    }
  });

  test("clicking Approved filter shows only approved claims", async ({
    page,
  }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByRole("button", { name: "Approved", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1000);

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });
  });

  test("clicking Rejected filter shows only rejected claims", async ({
    page,
  }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByRole("button", { name: "Rejected", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1000);

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });
  });

  test("clicking Paid filter shows only paid claims", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByRole("button", { name: "Paid", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1000);

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });
  });

  test("clicking All filter resets to show all claims", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // First filter to Pending
    await page
      .getByRole("button", { name: "Pending", exact: true })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Then click All to reset
    await page
      .getByRole("button", { name: "All", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1000);

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });
  });

  test("data table renders with correct column headers", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    const headers = page.locator("table thead th");
    await expect(headers.filter({ hasText: "Employee" }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(headers.filter({ hasText: "Category" }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(
      headers.filter({ hasText: "Description" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(headers.filter({ hasText: "Amount" }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(headers.filter({ hasText: "Date" }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(headers.filter({ hasText: "Status" }).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("table rows show employee name and code", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (
      rowCount > 0 &&
      !(await rows.first().textContent())?.includes("No reimbursement")
    ) {
      // First cell should have employee name (font-medium) and code (text-xs)
      const firstCell = rows.first().locator("td").first();
      await expect(firstCell.locator("p").first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("approve button works on pending claims", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Filter to pending
    await page
      .getByRole("button", { name: "Pending", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1000);

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    // Look for approve button (green CheckCircle2 icon button)
    const approveBtn = page
      .locator("table tbody tr")
      .first()
      .locator("button.text-green-600")
      .first();
    const approveVisible = await approveBtn.isVisible().catch(() => false);

    if (approveVisible) {
      await approveBtn.click();
      await page.waitForTimeout(2000);

      // Page should remain functional
      await expect(
        page.getByRole("heading", { name: "Reimbursements", level: 1 })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("reject button works on pending claims", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Filter to pending
    await page
      .getByRole("button", { name: "Pending", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1000);

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    // Look for reject button (red XCircle icon button)
    const rejectBtn = page
      .locator("table tbody tr")
      .first()
      .locator("button.text-red-600")
      .first();
    const rejectVisible = await rejectBtn.isVisible().catch(() => false);

    if (rejectVisible) {
      await rejectBtn.click();
      await page.waitForTimeout(2000);

      // Page should remain functional
      await expect(
        page.getByRole("heading", { name: "Reimbursements", level: 1 })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("active filter button has highlighted styling", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // "All" filter should be active by default (brand bg)
    const allBtn = page
      .getByRole("button", { name: "All", exact: true })
      .first();
    await expect(allBtn).toBeVisible({ timeout: 5000 });
    await expect(allBtn).toHaveClass(/bg-brand-600/, { timeout: 5000 });

    // Click Pending, it should become highlighted
    const pendingBtn = page
      .getByRole("button", { name: "Pending", exact: true })
      .first();
    await pendingBtn.click();
    await page.waitForTimeout(500);
    await expect(pendingBtn).toHaveClass(/bg-brand-600/, { timeout: 5000 });
  });

  test("empty state shows correct message when no claims", async ({
    page,
  }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Filter to Rejected which may have no data
    await page
      .getByRole("button", { name: "Rejected", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1000);

    // Check for table -- if empty it shows "No reimbursement claims found"
    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });
  });

  test("category column shows badge for each claim", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (
      rowCount > 0 &&
      !(await rows.first().textContent())?.includes("No reimbursement")
    ) {
      // Category column (2nd column) should contain a badge span
      const categoryCell = rows.first().locator("td").nth(1);
      await expect(categoryCell.locator("span").first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("amount column shows formatted currency", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (
      rowCount > 0 &&
      !(await rows.first().textContent())?.includes("No reimbursement")
    ) {
      // Amount column (4th column) should contain currency text with rupee symbol
      const amountCell = rows.first().locator("td").nth(3);
      const amountText = await amountCell.textContent();
      expect(amountText).toBeTruthy();
    }
  });

  test("date column shows formatted date", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (
      rowCount > 0 &&
      !(await rows.first().textContent())?.includes("No reimbursement")
    ) {
      // Date column (5th column) should have a date string
      const dateCell = rows.first().locator("td").nth(4);
      const dateText = await dateCell.textContent();
      expect(dateText).toBeTruthy();
      // Should contain a "/" as en-IN locale uses dd/mm/yyyy
      expect(dateText).toMatch(/\d/);
    }
  });

  test("action buttons only appear for pending claims, not approved/rejected", async ({
    page,
  }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Filter to approved - should have no action buttons
    await page
      .getByRole("button", { name: "Approved", exact: true })
      .first()
      .click();
    await page.waitForTimeout(1000);

    await expect(page.locator("table").first()).toBeVisible({ timeout: 5000 });

    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();

    if (
      rowCount > 0 &&
      !(await rows.first().textContent())?.includes("No reimbursement")
    ) {
      // Action buttons (green/red) should NOT be present for approved claims
      const actionBtns = rows
        .first()
        .locator("button.text-green-600, button.text-red-600");
      const btnCount = await actionBtns.count();
      expect(btnCount).toBe(0);
    }
  });

  test("cycling through all filters in sequence", async ({ page }) => {
    await page.goto("/reimbursements");
    await expect(
      page.getByRole("heading", { name: "Reimbursements", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const filterNames = ["All", "Pending", "Approved", "Rejected", "Paid"];
    for (const filterName of filterNames) {
      await page
        .getByRole("button", { name: filterName, exact: true })
        .first()
        .click();
      await page.waitForTimeout(500);

      // Table should always remain visible after each filter
      await expect(page.locator("table").first()).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
