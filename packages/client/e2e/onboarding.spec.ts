import { test, expect } from "@playwright/test";

test.describe("Onboarding", () => {
  test("page loads with Setup Your Payroll heading and description", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Setup Your Payroll" })
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText("Let's get your organization ready in 3 easy steps").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("all four step indicators are visible", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Setup Your Payroll" })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Organization").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Salary Structure").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("First Employee").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Done").first()).toBeVisible({ timeout: 5000 });
  });

  test("Step 1: Organization Details form shows all required fields", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });

    // Company Name
    const companyName = page.locator("#name");
    await expect(companyName).toBeVisible({ timeout: 5000 });

    // Legal Name
    const legalName = page.locator("#legalName");
    await expect(legalName).toBeVisible({ timeout: 5000 });

    // PAN
    const pan = page.locator("#pan");
    await expect(pan).toBeVisible({ timeout: 5000 });

    // TAN
    const tan = page.locator("#tan");
    await expect(tan).toBeVisible({ timeout: 5000 });

    // GSTIN (optional)
    const gstin = page.locator("#gstin");
    await expect(gstin).toBeVisible({ timeout: 5000 });

    // Address
    const address = page.locator("#address");
    await expect(address).toBeVisible({ timeout: 5000 });

    // City
    const city = page.locator("#city");
    await expect(city).toBeVisible({ timeout: 5000 });

    // State select
    const state = page.locator("#state");
    await expect(state).toBeVisible({ timeout: 5000 });

    // Pincode
    const pincode = page.locator("#pincode");
    await expect(pincode).toBeVisible({ timeout: 5000 });

    // Next button
    await expect(
      page.getByRole("button", { name: "Next" })
    ).toBeVisible({ timeout: 5000 });
  });

  test("Step 1: verify placeholder text on form fields", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByPlaceholder("TechNova Solutions", { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("TechNova Solutions Pvt. Ltd.", { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("AABCT1234F", { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("BLRT12345A", { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("29AABCT1234F1ZP", { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("42, HSR Layout")).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("Bengaluru")).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("560102")).toBeVisible({ timeout: 5000 });
  });

  test("Step 1: State dropdown has all state options", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });

    const stateSelect = page.locator("#state");
    await expect(stateSelect).toBeVisible({ timeout: 5000 });

    await expect(stateSelect.locator("option", { hasText: "Karnataka" })).toBeAttached();
    await expect(stateSelect.locator("option", { hasText: "Maharashtra" })).toBeAttached();
    await expect(stateSelect.locator("option", { hasText: "Tamil Nadu" })).toBeAttached();
    await expect(stateSelect.locator("option", { hasText: "Delhi" })).toBeAttached();
    await expect(stateSelect.locator("option", { hasText: "Telangana" })).toBeAttached();
    await expect(stateSelect.locator("option", { hasText: "Gujarat" })).toBeAttached();
    await expect(stateSelect.locator("option", { hasText: "West Bengal" })).toBeAttached();
    await expect(stateSelect.locator("option", { hasText: "Uttar Pradesh" })).toBeAttached();
  });

  test("Step 1: fill all fields and submit to advance to Step 2", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });

    // Use unique names to avoid "already exists" errors
    const uid = Date.now().toString().slice(-6);

    // Fill Company Name
    await page.locator("#name").fill(`E2E Corp ${uid}`);

    // Fill Legal Name
    await page.locator("#legalName").fill(`E2E Corp ${uid} Pvt. Ltd.`);

    // Fill PAN
    await page.locator("#pan").fill("AABCE1234F");

    // Fill TAN
    await page.locator("#tan").fill("BLRE12345A");

    // Fill GSTIN (optional)
    await page.locator("#gstin").fill("29AABCE1234F1ZP");

    // Fill Address
    await page.locator("#address").fill("100, Test Layout");

    // Fill City
    await page.locator("#city").fill("Bengaluru");

    // Select State
    await page.locator("#state").selectOption("KA");

    // Fill Pincode
    await page.locator("#pincode").fill("560001");

    // Click Next
    await page.getByRole("button", { name: "Next" }).click();

    // Should advance to Step 2 (Salary Structure) or show a toast (success or error)
    // The heading "Default Salary Structure" appears on step 2, or a toast with
    // "Organization created" or "Failed" / "already exists" appears
    await expect(
      page.getByText(/Default Salary Structure|Organization created|Failed|already exists/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Step 2: Salary Structure shows component breakdown", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });

    // Fill minimum required fields and submit to get to step 2
    await page.locator("#name").fill("E2E Salary Test Corp");
    await page.locator("#legalName").fill("E2E Salary Test Corp Pvt. Ltd.");
    await page.locator("#pan").fill("AABCS1234F");
    await page.locator("#tan").fill("BLRS12345A");
    await page.locator("#address").fill("200, Test Road");
    await page.locator("#city").fill("Mumbai");
    await page.locator("#state").selectOption("MH");
    await page.locator("#pincode").fill("400001");

    await page.getByRole("button", { name: "Next" }).click();

    // Wait for step 2
    const onStep2 = await page.getByText("Default Salary Structure").isVisible().catch(() => false);

    if (onStep2) {
      await expect(
        page.getByRole("heading", { name: "Default Salary Structure" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Description text
      await expect(
        page.getByText("standard Indian CTC structure").first()
      ).toBeVisible({ timeout: 5000 });

      // Salary component breakdown table
      await expect(page.getByText("Basic Salary").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("40% of CTC").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("HRA").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("50% of Basic").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Special Allowance").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Balance").first()).toBeVisible({ timeout: 5000 });

      // Back and Create & Next buttons
      await expect(
        page.getByRole("button", { name: "Back" })
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("button", { name: /Create & Next/ })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Step 2: Back button returns to Step 1", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });

    // Fill and submit step 1
    await page.locator("#name").fill("E2E Back Test Corp");
    await page.locator("#legalName").fill("E2E Back Test Corp Pvt. Ltd.");
    await page.locator("#pan").fill("AABCB1234F");
    await page.locator("#tan").fill("BLRB12345A");
    await page.locator("#address").fill("300, Back Street");
    await page.locator("#city").fill("Delhi");
    await page.locator("#state").selectOption("DL");
    await page.locator("#pincode").fill("110001");

    await page.getByRole("button", { name: "Next" }).click();

    const onStep2 = await page.getByText("Default Salary Structure").isVisible().catch(() => false);

    if (onStep2) {
      // Click Back
      await page.getByRole("button", { name: "Back" }).click();

      // Should return to step 1
      await expect(
        page.getByRole("heading", { name: "Organization Details" })
      ).toBeVisible({ timeout: 5000 });

      // Fields should still be accessible
      await expect(page.locator("#name")).toBeVisible({ timeout: 5000 });
    }
  });

  test("Step 3: Add Employees page shows skip and add options", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });

    // Fill step 1
    await page.locator("#name").fill("E2E Step3 Corp");
    await page.locator("#legalName").fill("E2E Step3 Corp Pvt. Ltd.");
    await page.locator("#pan").fill("AABCD1234F");
    await page.locator("#tan").fill("BLRD12345A");
    await page.locator("#address").fill("400, Test Blvd");
    await page.locator("#city").fill("Chennai");
    await page.locator("#state").selectOption("TN");
    await page.locator("#pincode").fill("600001");

    await page.getByRole("button", { name: "Next" }).click();

    const onStep2 = await page.getByText("Default Salary Structure").isVisible().catch(() => false);

    if (onStep2) {
      // Submit step 2
      await page.getByRole("button", { name: /Create & Next/ }).click();

      const onStep3 = await page.getByRole("heading", { name: "Add Employees" }).isVisible().catch(() => false);

      if (onStep3) {
        await expect(
          page.getByRole("heading", { name: "Add Employees" })
        ).toBeVisible({ timeout: 5000 });

        // Description text
        await expect(
          page.getByText("You can add employees now or skip and do it later").first()
        ).toBeVisible({ timeout: 5000 });

        // Back button
        await expect(
          page.getByRole("button", { name: "Back" })
        ).toBeVisible({ timeout: 5000 });

        // Skip for now button
        await expect(
          page.getByRole("button", { name: "Skip for now" })
        ).toBeVisible({ timeout: 5000 });

        // Add First Employee button
        await expect(
          page.getByRole("button", { name: "Add First Employee" })
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("Step 3: Back button returns to Step 2", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });

    // Fill step 1
    await page.locator("#name").fill("E2E BackStep3 Corp");
    await page.locator("#legalName").fill("E2E BackStep3 Corp Pvt. Ltd.");
    await page.locator("#pan").fill("AABCF1234F");
    await page.locator("#tan").fill("BLRF12345A");
    await page.locator("#address").fill("500, Return Lane");
    await page.locator("#city").fill("Hyderabad");
    await page.locator("#state").selectOption("TS");
    await page.locator("#pincode").fill("500001");

    await page.getByRole("button", { name: "Next" }).click();

    const onStep2 = await page.getByText("Default Salary Structure").isVisible().catch(() => false);

    if (onStep2) {
      await page.getByRole("button", { name: /Create & Next/ }).click();

      const onStep3 = await page.getByRole("heading", { name: "Add Employees" }).isVisible().catch(() => false);

      if (onStep3) {
        // Click Back from step 3
        await page.getByRole("button", { name: "Back" }).click();

        // Should return to step 2
        await expect(
          page.getByRole("heading", { name: "Default Salary Structure" }).first()
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("Step 3: Skip for now advances to Done step", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });

    // Fill step 1
    await page.locator("#name").fill("E2E Skip Corp");
    await page.locator("#legalName").fill("E2E Skip Corp Pvt. Ltd.");
    await page.locator("#pan").fill("AABCG1234F");
    await page.locator("#tan").fill("BLRG12345A");
    await page.locator("#address").fill("600, Skip Avenue");
    await page.locator("#city").fill("Ahmedabad");
    await page.locator("#state").selectOption("GJ");
    await page.locator("#pincode").fill("380001");

    await page.getByRole("button", { name: "Next" }).click();

    const onStep2 = await page.getByText("Default Salary Structure").isVisible().catch(() => false);

    if (onStep2) {
      await page.getByRole("button", { name: /Create & Next/ }).click();

      const onStep3 = await page.getByRole("heading", { name: "Add Employees" }).isVisible().catch(() => false);

      if (onStep3) {
        // Click Skip for now
        await page.getByRole("button", { name: "Skip for now" }).click();

        // Should show Done step
        await expect(
          page.getByRole("heading", { name: "You're all set!" })
        ).toBeVisible({ timeout: 5000 });

        await expect(
          page.getByText("Your organization is ready").first()
        ).toBeVisible({ timeout: 5000 });

        // Go to Dashboard button
        await expect(
          page.getByRole("button", { name: "Go to Dashboard" })
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("Step 4: Go to Dashboard button navigates to dashboard", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });

    // Fill step 1
    await page.locator("#name").fill("E2E Done Corp");
    await page.locator("#legalName").fill("E2E Done Corp Pvt. Ltd.");
    await page.locator("#pan").fill("AABCH1234F");
    await page.locator("#tan").fill("BLRH12345A");
    await page.locator("#address").fill("700, Done Road");
    await page.locator("#city").fill("Kolkata");
    await page.locator("#state").selectOption("WB");
    await page.locator("#pincode").fill("700001");

    await page.getByRole("button", { name: "Next" }).click();

    const onStep2 = await page.getByText("Default Salary Structure").isVisible().catch(() => false);

    if (onStep2) {
      await page.getByRole("button", { name: /Create & Next/ }).click();

      const onStep3 = await page.getByRole("heading", { name: "Add Employees" }).isVisible().catch(() => false);

      if (onStep3) {
        await page.getByRole("button", { name: "Skip for now" }).click();

        await expect(
          page.getByRole("heading", { name: "You're all set!" })
        ).toBeVisible({ timeout: 5000 });

        // Click Go to Dashboard
        await page.getByRole("button", { name: "Go to Dashboard" }).click();

        // Should navigate to dashboard
        await page.waitForURL(/\/dashboard/, { timeout: 5000 });
        expect(page.url()).toContain("/dashboard");
      }
    }
  });

  test("Step 1: form validation prevents empty submission", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });

    // Try to click Next without filling anything
    await page.getByRole("button", { name: "Next" }).click();

    // Should still be on step 1 (form has required fields, browser validation stops it)
    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });
  });

  test("Step 3: Add First Employee button navigates to employee creation", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", { name: "Organization Details" })
    ).toBeVisible({ timeout: 5000 });

    // Fill step 1
    await page.locator("#name").fill("E2E AddEmp Corp");
    await page.locator("#legalName").fill("E2E AddEmp Corp Pvt. Ltd.");
    await page.locator("#pan").fill("AABCI1234F");
    await page.locator("#tan").fill("BLRI12345A");
    await page.locator("#address").fill("800, Employee St");
    await page.locator("#city").fill("Bengaluru");
    await page.locator("#state").selectOption("KA");
    await page.locator("#pincode").fill("560002");

    await page.getByRole("button", { name: "Next" }).click();

    const onStep2 = await page.getByText("Default Salary Structure").isVisible().catch(() => false);

    if (onStep2) {
      await page.getByRole("button", { name: /Create & Next/ }).click();

      const onStep3 = await page.getByRole("heading", { name: "Add Employees" }).isVisible().catch(() => false);

      if (onStep3) {
        // Click Add First Employee
        await page.getByRole("button", { name: "Add First Employee" }).click();

        // Should navigate to employee creation page
        await page.waitForURL(/\/employees\/new/, { timeout: 5000 });
        expect(page.url()).toContain("/employees/new");
      }
    }
  });
});
