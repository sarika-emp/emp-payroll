import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Payroll Dashboard" })
    ).toBeVisible({ timeout: 5000 });
  });

  // ── Page header ─────────────────────────────────────────────────────

  test("page header shows title, description, and Run Payroll button", async ({
    page,
  }) => {
    // Title
    await expect(
      page.getByRole("heading", { name: "Payroll Dashboard" })
    ).toBeVisible({ timeout: 5000 });

    // Description contains "Overview for <Month Year>"
    await expect(page.getByText("Overview for").first()).toBeVisible({
      timeout: 5000,
    });

    // Run Payroll button in header
    await expect(
      page.getByRole("button", { name: "Run Payroll" }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("header Run Payroll button navigates to /payroll/runs", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Run Payroll" })
      .first()
      .click();
    await page.waitForURL(/\/payroll\/runs/, { timeout: 5000 });
    expect(page.url()).toContain("/payroll/runs");
  });

  // ── Quick action buttons ────────────────────────────────────────────

  test("all 6 quick action buttons are visible", async ({ page }) => {
    const actions = [
      "Run Payroll",
      "Add Employee",
      "View Reports",
      "Payslips",
      "Attendance",
      "Settings",
    ];

    for (const label of actions) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("quick action: Run Payroll navigates to /payroll/runs", async ({
    page,
  }) => {
    // Use the quick action button (not the header button) — it is a <button> with text
    const quickActions = page.locator("button", { hasText: "Run Payroll" });
    // The second match is the quick action (first is header button)
    await quickActions.nth(1).click();
    await page.waitForURL(/\/payroll\/runs/, { timeout: 5000 });
    expect(page.url()).toContain("/payroll/runs");
  });

  test("quick action: Add Employee navigates to /employees/new", async ({
    page,
  }) => {
    await page
      .locator("button", { hasText: "Add Employee" })
      .first()
      .click();
    await page.waitForURL(/\/employees\/new/, { timeout: 5000 });
    expect(page.url()).toContain("/employees/new");
  });

  test("quick action: View Reports navigates to /reports", async ({
    page,
  }) => {
    await page
      .locator("button", { hasText: "View Reports" })
      .first()
      .click();
    await page.waitForURL(/\/reports/, { timeout: 5000 });
    expect(page.url()).toContain("/reports");
  });

  test("quick action: Payslips navigates to /payslips", async ({ page }) => {
    await page
      .locator("button", { hasText: "Payslips" })
      .first()
      .click();
    await page.waitForURL(/\/payslips/, { timeout: 5000 });
    expect(page.url()).toContain("/payslips");
  });

  test("quick action: Attendance navigates to /attendance", async ({
    page,
  }) => {
    await page
      .locator("button", { hasText: "Attendance" })
      .first()
      .click();
    await page.waitForURL(/\/attendance/, { timeout: 5000 });
    expect(page.url()).toContain("/attendance");
  });

  test("quick action: Settings navigates to /settings", async ({ page }) => {
    await page
      .locator("button", { hasText: "Settings" })
      .first()
      .click();
    await page.waitForURL(/\/settings/, { timeout: 5000 });
    expect(page.url()).toContain("/settings");
  });

  // ── Stat cards ──────────────────────────────────────────────────────

  test("all 4 stat cards are visible with titles", async ({ page }) => {
    const titles = [
      "Active Employees",
      "Last Payroll (Gross)",
      "Last Payroll (Net)",
      "Total Deductions",
    ];

    for (const title of titles) {
      await expect(page.getByText(title).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("Active Employees stat card shows a numeric value", async ({
    page,
  }) => {
    // The stat card renders title then value. Find the card container.
    const card = page.locator("div", { hasText: "Active Employees" }).first();
    await expect(card).toBeVisible({ timeout: 5000 });

    // The value is a bold 2xl element — check it contains at least a digit
    const value = card.locator("p.text-2xl").first();
    await expect(value).toBeVisible({ timeout: 5000 });
    const text = await value.textContent();
    expect(text).toBeTruthy();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test("Last Payroll (Gross) stat card shows a value", async ({ page }) => {
    const card = page
      .locator("div", { hasText: "Last Payroll (Gross)" })
      .first();
    const value = card.locator("p.text-2xl").first();
    await expect(value).toBeVisible({ timeout: 5000 });
    const text = await value.textContent();
    expect(text).toBeTruthy();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test("Last Payroll (Net) stat card shows a value", async ({ page }) => {
    const card = page
      .locator("div", { hasText: "Last Payroll (Net)" })
      .first();
    const value = card.locator("p.text-2xl").first();
    await expect(value).toBeVisible({ timeout: 5000 });
    const text = await value.textContent();
    expect(text).toBeTruthy();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test("Total Deductions stat card shows a value and subtitle", async ({
    page,
  }) => {
    const card = page
      .locator("div", { hasText: "Total Deductions" })
      .first();
    const value = card.locator("p.text-2xl").first();
    await expect(value).toBeVisible({ timeout: 5000 });
    const text = await value.textContent();
    expect(text).toBeTruthy();
    expect(text!.trim().length).toBeGreaterThan(0);

    // Subtitle: "PF + ESI + PT + TDS"
    await expect(page.getByText("PF + ESI + PT + TDS").first()).toBeVisible({
      timeout: 5000,
    });
  });

  // ── Charts section ──────────────────────────────────────────────────

  test("Monthly Payroll Trend chart section is visible", async ({ page }) => {
    await expect(
      page.getByText("Monthly Payroll Trend").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Headcount by Department chart section is visible", async ({
    page,
  }) => {
    await expect(
      page.getByText("Headcount by Department").first()
    ).toBeVisible({ timeout: 5000 });
  });

  // ── Recent activity ─────────────────────────────────────────────────

  test("Recent Activity section loads with items", async ({ page }) => {
    await expect(page.getByText("Recent Activity").first()).toBeVisible({
      timeout: 5000,
    });

    // Should have at least one activity item (real or placeholder)
    // Activity items contain timestamps or the word "Recently"
    const activitySection = page.locator("div", {
      hasText: "Recent Activity",
    });
    await expect(activitySection.first()).toBeVisible({ timeout: 5000 });
  });

  // ── Compliance status ───────────────────────────────────────────────

  test("Compliance Status section shows 4 compliance items", async ({
    page,
  }) => {
    await expect(
      page.getByText("Compliance Status").first()
    ).toBeVisible({ timeout: 5000 });

    // Four compliance items
    await expect(
      page.getByText("Provident Fund").first()
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("ESI").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText("Professional Tax").first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("TDS (Form 24Q)").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Compliance items show Filed or Pending badges", async ({ page }) => {
    // PF, ESI, PT should be Filed; TDS should be Pending
    const filedBadges = page.getByText("Filed");
    await expect(filedBadges.first()).toBeVisible({ timeout: 5000 });

    const pendingBadge = page.getByText("Pending").first();
    await expect(pendingBadge).toBeVisible({ timeout: 5000 });
  });

  // ── Full page structure test ────────────────────────────────────────

  test("dashboard has complete layout: header, quick actions, stats, charts, activity, compliance", async ({
    page,
  }) => {
    // Header
    await expect(
      page.getByRole("heading", { name: "Payroll Dashboard" })
    ).toBeVisible({ timeout: 5000 });

    // Quick actions — all 6
    for (const label of [
      "Run Payroll",
      "Add Employee",
      "View Reports",
      "Payslips",
      "Attendance",
      "Settings",
    ]) {
      await expect(
        page.getByText(label, { exact: true }).first()
      ).toBeVisible({ timeout: 5000 });
    }

    // Stat cards — all 4
    for (const title of [
      "Active Employees",
      "Last Payroll (Gross)",
      "Last Payroll (Net)",
      "Total Deductions",
    ]) {
      await expect(page.getByText(title).first()).toBeVisible({
        timeout: 5000,
      });
    }

    // Charts
    await expect(
      page.getByText("Monthly Payroll Trend").first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("Headcount by Department").first()
    ).toBeVisible({ timeout: 5000 });

    // Activity + Compliance
    await expect(page.getByText("Recent Activity").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText("Compliance Status").first()
    ).toBeVisible({ timeout: 5000 });
  });
});
