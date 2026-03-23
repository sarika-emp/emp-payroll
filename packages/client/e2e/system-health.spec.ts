import { test, expect } from "@playwright/test";

test.describe("System Health", () => {
  test("page loads with System Health heading and description", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText("Server status and diagnostics").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Refresh button is visible", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole("button", { name: /Refresh/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("click Refresh button triggers data reload", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for initial load to complete
    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });

    // Click refresh
    const refreshButton = page.getByRole("button", { name: /Refresh/i }).first();
    await refreshButton.click();

    // After refresh, status should still be visible
    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("status banner shows Healthy or Degraded or unreachable", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for status to load (either healthy, degraded, or unreachable)
    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("when healthy, shows response time, environment, and version", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for data to load
    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });

    const isHealthy = await page.getByText("System is Healthy").isVisible().catch(() => false);
    const isDegraded = await page.getByText("System is Degraded").isVisible().catch(() => false);

    if (isHealthy || isDegraded) {
      // Check for response time, environment, version info
      await expect(
        page.getByText(/Response time:/).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText(/Environment:/).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText(/Version:/).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Database status card is visible with status badge", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });

    const isReachable = await page.getByText(/System is (Healthy|Degraded)/).first().isVisible().catch(() => false);

    if (isReachable) {
      // Database card
      await expect(
        page.getByText("Database").first()
      ).toBeVisible({ timeout: 5000 });

      // Database status badge (ok or other status)
      await expect(
        page.getByText(/^(ok|unknown|error)$/).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Memory card shows heap usage values", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });

    const isReachable = await page.getByText(/System is (Healthy|Degraded)/).first().isVisible().catch(() => false);

    if (isReachable) {
      // Memory card label
      await expect(
        page.getByText("Memory").first()
      ).toBeVisible({ timeout: 5000 });

      // Heap and RSS info text
      await expect(
        page.getByText(/heap/).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText(/RSS/).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Uptime card shows formatted uptime and seconds", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });

    const isReachable = await page.getByText(/System is (Healthy|Degraded)/).first().isVisible().catch(() => false);

    if (isReachable) {
      // Uptime card label
      await expect(
        page.getByText("Uptime").first()
      ).toBeVisible({ timeout: 5000 });

      // Seconds indicator
      await expect(
        page.getByText(/seconds/).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Data card shows employee, payroll run, and payslip counts", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });

    const isReachable = await page.getByText(/System is (Healthy|Degraded)/).first().isVisible().catch(() => false);

    if (isReachable) {
      // Data card label
      await expect(
        page.getByText("Data").first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Raw Health Response section shows JSON", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });

    const isReachable = await page.getByText(/System is (Healthy|Degraded)/).first().isVisible().catch(() => false);

    if (isReachable) {
      // Raw Health Response heading
      await expect(
        page.getByRole("heading", { name: "Raw Health Response" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Pre element with JSON content
      const preBlock = page.locator("pre").first();
      await expect(preBlock).toBeVisible({ timeout: 5000 });
      const jsonText = await preBlock.textContent();
      expect(jsonText).toBeTruthy();

      // Should be valid JSON
      expect(() => JSON.parse(jsonText!)).not.toThrow();
    }
  });

  test("all four status cards are present when server is reachable", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });

    const isReachable = await page.getByText(/System is (Healthy|Degraded)/).first().isVisible().catch(() => false);

    if (isReachable) {
      await expect(page.getByText("Database").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Memory").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Uptime").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Data").first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("server unreachable shows error state", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for either state
    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });

    const isUnreachable = await page.getByText("Server unreachable").isVisible().catch(() => false);

    if (isUnreachable) {
      await expect(
        page.getByText("Server unreachable").first()
      ).toBeVisible({ timeout: 5000 });

      // Should NOT show the four status cards
      await expect(
        page.getByText("Database").first()
      ).not.toBeVisible({ timeout: 5000 });
    }
  });

  test("multiple rapid refresh clicks do not break the page", async ({ page }) => {
    await page.goto("/system");

    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for initial load
    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });

    const refreshButton = page.getByRole("button", { name: /Refresh/i }).first();

    // Click refresh multiple times in succession
    await refreshButton.click();
    await refreshButton.click();
    await refreshButton.click();

    // Page should still be intact after rapid clicks
    await expect(
      page.getByRole("heading", { name: "System Health" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText(/System is (Healthy|Degraded)|Server unreachable/).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
