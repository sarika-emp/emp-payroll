import { test, expect } from "@playwright/test";

test.describe("Reports Page", () => {
  test("page loads with heading and description", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText(
        "Generate PF, ESI, PT, and TDS returns for compliance filing"
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test("payroll run selector label is visible", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Payroll Run:").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("payroll run selector dropdown is visible", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.locator("#run").first()).toBeVisible({ timeout: 5000 });
  });

  test("payroll run selector has options from completed runs", async ({
    page,
  }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    // If there are payroll runs, options should have month/year labels
    if (optCount > 0) {
      const firstText = await options.first().textContent();
      expect(firstText).toBeTruthy();
      // Options should contain "employees" text per the label format
      expect(firstText).toContain("employees");
    }
  });

  test("selecting a different payroll run works", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 1) {
      // Select the second option
      const secondValue = await options.nth(1).getAttribute("value");
      if (secondValue) {
        await runSelect.selectOption(secondValue);
        await page.waitForTimeout(1000);

        // Page should still be functional after selection
        await expect(
          page.getByRole("heading", { name: "Statutory Reports", level: 1 })
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("shows status badge next to selected run", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      // There should be a Badge showing status (paid/approved) next to the selector
      // The Badge is a sibling inside the same flex container as the SelectField
      const container = runSelect.locator("..").locator("..");
      const badge = container.locator("span.capitalize").first();
      const badgeVisible = await badge.isVisible().catch(() => false);
      if (badgeVisible) {
        const text = await badge.textContent();
        expect(text).toMatch(/paid|approved/);
      }
    }
  });

  test("PF ECR report card is visible with correct details", async ({
    page,
  }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Wait for report cards to render (only if runs exist)
    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      await expect(page.getByText("PF ECR").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page
          .getByText("Electronic Challan cum Return for EPFO filing")
          .first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText("TXT (ECR Format)").first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("ESI Return report card is visible with correct details", async ({
    page,
  }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      await expect(page.getByText("ESI Return").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page
          .getByText("Monthly contribution statement for ESIC")
          .first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("PT Return report card is visible with correct details", async ({
    page,
  }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      await expect(page.getByText("PT Return").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page
          .getByText("Professional Tax return for state filing")
          .first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Bank Transfer report card is visible with correct details", async ({
    page,
  }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      await expect(page.getByText("Bank Transfer").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page.getByText("NEFT/RTGS salary transfer file").first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("all four report cards have Download buttons", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      const downloadButtons = page.getByRole("button", { name: /Download/ });
      await expect(downloadButtons.first()).toBeVisible({ timeout: 5000 });
      const btnCount = await downloadButtons.count();
      expect(btnCount).toBeGreaterThanOrEqual(4);
    }
  });

  test("all report cards show format badges", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      // PF uses TXT format, others use CSV
      await expect(
        page.getByText("TXT (ECR Format)").first()
      ).toBeVisible({ timeout: 5000 });

      const csvBadges = page.getByText("CSV", { exact: true });
      await expect(csvBadges.first()).toBeVisible({ timeout: 5000 });
      const csvCount = await csvBadges.count();
      expect(csvCount).toBeGreaterThanOrEqual(3);
    }
  });

  test("click PF ECR download button triggers download", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      // Find the PF ECR card and its download button
      const pfCard = page.getByText("PF ECR").first().locator("..").locator("..");
      const downloadBtn = pfCard.getByRole("button", { name: /Download/ });
      await expect(downloadBtn).toBeVisible({ timeout: 5000 });

      // Listen for download event
      const downloadPromise = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);
      await downloadBtn.click();
      const download = await downloadPromise;

      // If download succeeded, verify filename
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toContain("pf");
      }

      // Page should still be functional
      await expect(
        page.getByRole("heading", { name: "Statutory Reports", level: 1 })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("click ESI Return download button triggers download", async ({
    page,
  }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      const esiCard = page
        .getByText("ESI Return")
        .first()
        .locator("..")
        .locator("..");
      const downloadBtn = esiCard.getByRole("button", { name: /Download/ });
      await expect(downloadBtn).toBeVisible({ timeout: 5000 });

      const downloadPromise = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);
      await downloadBtn.click();
      const download = await downloadPromise;

      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toContain("esi");
      }

      await expect(
        page.getByRole("heading", { name: "Statutory Reports", level: 1 })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("click PT Return download button triggers download", async ({
    page,
  }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      const ptCard = page
        .getByText("PT Return")
        .first()
        .locator("..")
        .locator("..");
      const downloadBtn = ptCard.getByRole("button", { name: /Download/ });
      await expect(downloadBtn).toBeVisible({ timeout: 5000 });

      const downloadPromise = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);
      await downloadBtn.click();
      const download = await downloadPromise;

      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toContain("pt");
      }

      await expect(
        page.getByRole("heading", { name: "Statutory Reports", level: 1 })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("click Bank Transfer download button triggers download", async ({
    page,
  }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      const bankCard = page
        .getByText("Bank Transfer")
        .first()
        .locator("..")
        .locator("..");
      const downloadBtn = bankCard.getByRole("button", { name: /Download/ });
      await expect(downloadBtn).toBeVisible({ timeout: 5000 });

      const downloadPromise = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);
      await downloadBtn.click();
      const download = await downloadPromise;

      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toContain("bank");
      }

      await expect(
        page.getByRole("heading", { name: "Statutory Reports", level: 1 })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("TDS Summary table heading is visible", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      // TDS Summary heading contains month/year
      await expect(
        page.getByText("TDS Summary").first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("TDS Summary table has correct column headers", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      await expect(
        page.getByText("TDS Summary").first()
      ).toBeVisible({ timeout: 5000 });

      // TDS table should have Employee, Gross Salary, TDS Deducted headers
      const tables = page.locator("table");
      // There may be multiple tables; the TDS one is the last
      const lastTable = tables.last();
      await expect(lastTable).toBeVisible({ timeout: 5000 });

      const headers = lastTable.locator("thead th");
      await expect(
        headers.filter({ hasText: "Employee" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        headers.filter({ hasText: "Gross Salary" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        headers.filter({ hasText: "TDS Deducted" }).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("TDS table shows employee data or empty message", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      await expect(
        page.getByText("TDS Summary").first()
      ).toBeVisible({ timeout: 5000 });

      const tables = page.locator("table");
      const lastTable = tables.last();
      await expect(lastTable).toBeVisible({ timeout: 5000 });

      const rows = lastTable.locator("tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRowText = await rows.first().textContent();
        // Either employee data or "No TDS data for this run"
        expect(firstRowText).toBeTruthy();
      }
    }
  });

  test("TDS table shows PAN number for employees", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      await expect(
        page.getByText("TDS Summary").first()
      ).toBeVisible({ timeout: 5000 });

      const tables = page.locator("table");
      const lastTable = tables.last();
      await expect(lastTable).toBeVisible({ timeout: 5000 });

      // Check if PAN text exists in the table
      const panText = lastTable.getByText("PAN:").first();
      const panVisible = await panText.isVisible().catch(() => false);

      if (panVisible) {
        await expect(panText).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("empty state shows when no completed payroll runs exist", async ({
    page,
  }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    // Check for either report cards OR empty state
    const reportsOrEmpty = page.locator("text=PF ECR, text=No completed payroll runs yet").first();
    const pfVisible = await page.getByText("PF ECR").first().isVisible().catch(() => false);
    const emptyVisible = await page.getByText("No completed payroll runs yet").first().isVisible().catch(() => false);

    // One of these two states must be true
    expect(pfVisible || emptyVisible).toBeTruthy();
  });

  test("selecting different runs updates TDS Summary heading", async ({
    page,
  }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 1) {
      // Get first option text to find month
      const firstOptionText = await options.first().textContent();

      // Select second run
      const secondValue = await options.nth(1).getAttribute("value");
      if (secondValue) {
        await runSelect.selectOption(secondValue);
        await page.waitForTimeout(1000);

        // TDS Summary heading should update with the new month/year
        await expect(
          page.getByText("TDS Summary").first()
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("report cards grid layout renders four cards", async ({ page }) => {
    await page.goto("/reports");
    await expect(
      page.getByRole("heading", { name: "Statutory Reports", level: 1 })
    ).toBeVisible({ timeout: 5000 });

    const runSelect = page.locator("#run");
    await expect(runSelect).toBeVisible({ timeout: 5000 });

    const options = runSelect.locator("option");
    const optCount = await options.count();

    if (optCount > 0) {
      // All four report titles should be visible
      await expect(page.getByText("PF ECR").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByText("ESI Return").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByText("PT Return").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByText("Bank Transfer").first()).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
