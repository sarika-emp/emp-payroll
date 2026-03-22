import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "ananya@technova.in");
  await page.fill('input[type="password"]', "Welcome@123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|my)/, { timeout: 10000 });
}

test.describe("Self-Service Portal", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("self-service dashboard loads", async ({ page }) => {
    await page.goto("/my");
    await expect(page.locator("text=Welcome").first()).toBeVisible({ timeout: 5000 });
  });

  test("my payslips page loads", async ({ page }) => {
    await page.goto("/my/payslips");
    await expect(page.getByRole("heading", { name: "My Payslips" })).toBeVisible({ timeout: 5000 });
  });

  test("my salary page loads", async ({ page }) => {
    await page.goto("/my/salary");
    await expect(page.getByRole("heading", { name: "My Salary" })).toBeVisible({ timeout: 5000 });
  });

  test("my profile page loads with change password", async ({ page }) => {
    await page.goto("/my/profile");
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Change Password")).toBeVisible();
  });

  test("declarations page has quick declare button", async ({ page }) => {
    await page.goto("/my/declarations");
    await expect(page.getByRole("heading", { name: "Tax Declarations" })).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Quick Declare All")).toBeVisible();
  });
});
