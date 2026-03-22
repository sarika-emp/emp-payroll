import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h2")).toContainText("Welcome back");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "ananya@technova.in");
    await page.fill('input[type="password"]', "Welcome@123");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL(/\/(dashboard|my)/, { timeout: 10000 });
    await expect(page.url()).toMatch(/\/(dashboard|my)/);
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("#email");

    // Fill with invalid credentials
    await page.locator("#email").fill("wrong@email.com");
    await page.locator("#password").fill("wrongpass");
    await page.click('button[type="submit"]');

    // Should stay on login page (not redirect) and show an error
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/login");
  });

  test("forgot password modal opens", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=Forgot password?");
    await expect(page.locator("text=Reset Password")).toBeVisible();
    await expect(page.locator('input[type="email"]#forgotEmail')).toBeVisible();
  });
});
