import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "ananya@technova.in");
  await page.fill('input[type="password"]', "Welcome@123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|my)/, { timeout: 10000 });
}

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("shows dashboard with stat cards", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Payroll Dashboard" })).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Active Employees")).toBeVisible();
  });

  test("quick actions are visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Run Payroll/i }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: /Add Employee/i }).first()).toBeVisible();
  });

  test("navigate to employees page", async ({ page }) => {
    await page.getByRole("link", { name: "Employees" }).first().click();
    await page.waitForURL(/\/employees/);
    await expect(page.getByRole("heading", { name: /Employees/i })).toBeVisible();
  });

  test("navigate to payroll runs", async ({ page }) => {
    await page.getByRole("link", { name: "Payroll Runs" }).click();
    await page.waitForURL(/\/payroll\/runs/);
    await expect(page.getByRole("heading", { name: /Payroll Runs/i })).toBeVisible();
  });
});
