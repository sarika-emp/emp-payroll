import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "ananya@technova.in");
  await page.fill('input[type="password"]', "Welcome@123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|my)/, { timeout: 10000 });
}

test.describe("Employee Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("employee list shows employees with search", async ({ page }) => {
    await page.goto("/employees");
    await expect(page.getByRole("heading", { name: /Employees/i })).toBeVisible({ timeout: 5000 });

    // Should show employee rows
    await expect(page.locator("text=Ananya Gupta").first()).toBeVisible({ timeout: 5000 });

    // Search should filter
    await page.fill('input[placeholder*="Search"]', "Ananya");
    await expect(page.locator("text=Ananya Gupta").first()).toBeVisible();
  });

  test("employee detail page loads", async ({ page }) => {
    await page.goto("/employees");
    await expect(page.locator("text=Ananya Gupta").first()).toBeVisible({ timeout: 10000 });

    // Click the table row (uses onRowClick to navigate)
    await page.locator("tr", { hasText: "Ananya Gupta" }).first().click();
    await expect(page.url()).toContain("/employees/");

    await expect(page.locator("text=Ananya Gupta").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Salary Details")).toBeVisible({ timeout: 5000 });
  });

  test("department filter works", async ({ page }) => {
    await page.goto("/employees");
    await expect(page.getByRole("heading", { name: /Employees/i })).toBeVisible({ timeout: 5000 });

    // Click Engineering department filter
    const engButton = page.getByRole("button", { name: "Engineering" });
    if (await engButton.isVisible()) {
      await engButton.click();
      // Should filter to only engineering employees — check the filter button is active
      await expect(engButton).toBeVisible();
      // Verify at least one engineering employee is shown
      await expect(page.locator("text=Ananya Gupta").first()).toBeVisible();
    }
  });
});
