import { chromium } from "@playwright/test";

export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: "http://localhost:5173" });

  await page.goto("/login");
  await page.fill('input[type="email"]', "ananya@technova.in");
  await page.fill('input[type="password"]', "Welcome@123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|my)/, { timeout: 15000 });

  await page.context().storageState({ path: "./e2e/.auth/user.json" });
  await browser.close();
}
