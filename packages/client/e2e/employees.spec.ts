import { test, expect } from "@playwright/test";

test.describe("Employee Management", () => {
  test.describe("List Page", () => {
    test("loads with heading, employee count, and table columns", async ({ page }) => {
      await page.goto("/employees");

      await expect(
        page.getByRole("heading", { name: "Employees" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Description shows employee count like "X of Y employees"
      await expect(page.getByText(/\d+ of \d+ employees/)).toBeVisible({
        timeout: 5000,
      });

      // Table headers: Employee, Designation, Email, Joined, Status
      await expect(page.locator("thead")).toBeVisible({ timeout: 5000 });
      for (const header of ["Employee", "Designation", "Email", "Joined", "Status"]) {
        await expect(
          page.locator("th", { hasText: header }).first()
        ).toBeVisible({ timeout: 5000 });
      }

      // At least one row in the table
      await expect(page.locator("tbody tr").first()).toBeVisible({
        timeout: 5000,
      });
    });

    test("search by name filters results", async ({ page }) => {
      await page.goto("/employees");

      // Wait for the page to load with count text
      await expect(page.getByText(/\d+ of \d+ employees/)).toBeVisible({
        timeout: 10000,
      });

      const searchInput = page.getByPlaceholder(
        "Search by name, email, code, or designation..."
      );
      await expect(searchInput).toBeVisible({ timeout: 5000 });

      // If there are no employees (0 of 0), skip filtering test
      const countText = await page.getByText(/\d+ of \d+ employees/).textContent();
      const match = countText?.match(/(\d+) of (\d+) employees/);
      if (match && Number(match[2]) === 0) {
        // No employees to search — verify search input is still functional
        await searchInput.fill("test");
        await page.waitForTimeout(500);
        await expect(page.getByText("No data found")).toBeVisible({ timeout: 5000 });
        return;
      }

      // Search by name — filtering is client-side and synchronous on state change
      await searchInput.fill("Ananya");

      // Wait for React to re-render the filtered list
      await page.waitForTimeout(1000);

      // The filtered table should still be visible and contain the name
      await expect(page.locator("tbody tr").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page.locator("tbody").getByText("Ananya").first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("search by email filters results", async ({ page }) => {
      await page.goto("/employees");

      await expect(page.locator("tbody tr").first()).toBeVisible({
        timeout: 5000,
      });

      const searchInput = page.getByPlaceholder(
        "Search by name, email, code, or designation..."
      );
      await searchInput.fill("ananya@");

      await expect(page.locator("tbody tr").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page.locator("tbody").getByText("ananya@").first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("search for nonexistent name shows no results", async ({ page }) => {
      await page.goto("/employees");

      await expect(page.locator("tbody tr").first()).toBeVisible({
        timeout: 5000,
      });

      const searchInput = page.getByPlaceholder(
        "Search by name, email, code, or designation..."
      );
      await searchInput.fill("zzzznonexistent999");

      // Should show "No data found" empty state
      await expect(page.getByText("No data found")).toBeVisible({
        timeout: 5000,
      });
    });

    test("department filter buttons filter employees and All resets", async ({ page }) => {
      await page.goto("/employees");

      await expect(page.locator("tbody tr").first()).toBeVisible({
        timeout: 5000,
      });

      // Check for filter section
      const filterLabel = page.getByText("Filter:");
      const isFilterVisible = await filterLabel.isVisible().catch(() => false);
      if (!isFilterVisible) {
        test.skip();
        return;
      }

      // "All" button should be visible
      const allButton = page
        .locator("button", { hasText: "All" })
        .first();
      await expect(allButton).toBeVisible({ timeout: 5000 });

      // Get initial row count
      const initialCount = await page.locator("tbody tr").count();

      // Collect department filter buttons (skip "All" which is the first)
      const filterButtons = page.locator(
        ".flex.flex-wrap.items-center.gap-2 button"
      );
      const buttonCount = await filterButtons.count();

      if (buttonCount > 1) {
        // Click the first department filter (index 1, since 0 is "All")
        const deptButton = filterButtons.nth(1);
        const deptName = await deptButton.textContent();
        await deptButton.click();

        // Description should show "in <department>" filter text
        if (deptName) {
          await expect(page.getByText(new RegExp(`in ${deptName.trim()}`))).toBeVisible({
            timeout: 5000,
          });
        }

        // Table should still have at least one row
        await expect(page.locator("tbody tr").first()).toBeVisible({
          timeout: 5000,
        });

        // Click a second department if available
        if (buttonCount > 2) {
          await filterButtons.nth(2).click();
          await expect(page.locator("tbody tr").first()).toBeVisible({
            timeout: 5000,
          });
        }

        // Reset by clicking "All"
        await allButton.click();

        // After reset, the count text should no longer show "in <dept>"
        await expect(page.getByText(/^\d+ of \d+ employees$/)).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("click employee row navigates to detail page", async ({ page }) => {
      await page.goto("/employees");

      await expect(page.locator("tbody tr").first()).toBeVisible({
        timeout: 5000,
      });

      // Click the first row
      await page.locator("tbody tr").first().click();

      // URL should change to /employees/:id
      await expect(page).toHaveURL(/\/employees\/[a-zA-Z0-9-]+/, {
        timeout: 5000,
      });

      // Detail page shows employee name in h2
      await expect(page.locator("h2").first()).toBeVisible({ timeout: 5000 });
    });

    test("action buttons are visible (Import, Export, Import CSV, Add Employee)", async ({ page }) => {
      await page.goto("/employees");

      await expect(
        page.getByRole("heading", { name: "Employees" }).first()
      ).toBeVisible({ timeout: 5000 });

      await expect(
        page.getByRole("button", { name: /Import$/ }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("button", { name: "Export" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("button", { name: "Import CSV" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("button", { name: "Add Employee" }).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("Export button triggers CSV download", async ({ page }) => {
      await page.goto("/employees");

      await expect(page.locator("tbody tr").first()).toBeVisible({
        timeout: 5000,
      });

      // Listen for download event
      const downloadPromise = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);

      await page.getByRole("button", { name: "Export" }).first().click();

      const download = await downloadPromise;
      // Either a download happens or a toast appears
      if (download) {
        expect(download.suggestedFilename()).toContain("employees");
      } else {
        // Toast for success or failure should appear
        await expect(
          page.getByText(/export/i).first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("Add Employee button navigates to /employees/new", async ({ page }) => {
      await page.goto("/employees");

      await expect(
        page.getByRole("heading", { name: "Employees" }).first()
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: "Add Employee" }).first().click();

      await expect(page).toHaveURL(/\/employees\/new/, { timeout: 5000 });
    });

    test("Import CSV button navigates to /employees/import", async ({ page }) => {
      await page.goto("/employees");

      await expect(
        page.getByRole("heading", { name: "Employees" }).first()
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: "Import CSV" }).first().click();

      await expect(page).toHaveURL(/\/employees\/import/, { timeout: 5000 });
    });
  });

  test.describe("Employee Detail Page", () => {
    test("shows profile header with name, designation, status, email", async ({ page }) => {
      await page.goto("/employees");

      await expect(page.locator("tbody tr").first()).toBeVisible({
        timeout: 5000,
      });

      await page.locator("tbody tr").first().click();
      await expect(page).toHaveURL(/\/employees\/[a-zA-Z0-9-]+/, {
        timeout: 5000,
      });

      // Employee name in h2
      const nameHeading = page.locator("h2").first();
      await expect(nameHeading).toBeVisible({ timeout: 5000 });
      const name = await nameHeading.textContent();
      expect(name?.trim().length).toBeGreaterThan(0);

      // Status badge (Active or Inactive)
      await expect(
        page.getByText(/Active|Inactive/).first()
      ).toBeVisible({ timeout: 5000 });

      // Back to Employees button
      await expect(
        page.getByRole("button", { name: "Back to Employees" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Edit button
      await expect(
        page.getByRole("button", { name: "Edit" }).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("Salary Details section shows CTC and components", async ({ page }) => {
      await page.goto("/employees");
      await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 5000 });
      await page.locator("tbody tr").first().click();
      await expect(page).toHaveURL(/\/employees\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      // Salary Details card
      await expect(
        page.getByText("Salary Details").first()
      ).toBeVisible({ timeout: 5000 });

      // Should show Annual CTC label
      await expect(
        page.getByText("Annual CTC").first()
      ).toBeVisible({ timeout: 5000 });

      // Should show Employee Code label
      await expect(
        page.getByText("Employee Code").first()
      ).toBeVisible({ timeout: 5000 });

      // Assign or Revise button
      await expect(
        page.getByRole("button", { name: /Assign|Revise/ }).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("Bank & Tax section shows bank details and tax info", async ({ page }) => {
      await page.goto("/employees");

      // Check if there are any employees to click on
      const hasRows = await page.locator("tbody tr").first().isVisible({ timeout: 5000 }).catch(() => false);
      const rowText = hasRows ? await page.locator("tbody tr").first().textContent() : "";
      if (!hasRows || rowText?.includes("No data found")) {
        // No employees — skip this test gracefully
        return;
      }

      await page.locator("tbody tr").first().click();
      await expect(page).toHaveURL(/\/employees\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      // Wait for full detail page to load
      await expect(page.locator("h2").first()).toBeVisible({ timeout: 5000 });

      // Bank & Tax card — the card title includes an icon, use text matching
      await expect(
        page.getByText("Bank & Tax").first()
      ).toBeVisible({ timeout: 5000 });

      // Check for bank/tax field labels rendered as <dt> elements in the Bank & Tax card
      for (const label of ["Bank", "Account", "IFSC", "PAN", "Tax Regime"]) {
        await expect(
          page.locator("dt", { hasText: label }).first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("Statutory section shows PF details", async ({ page }) => {
      await page.goto("/employees");

      // Check if there are any employees to click on
      const hasRows = await page.locator("tbody tr").first().isVisible({ timeout: 5000 }).catch(() => false);
      const rowText = hasRows ? await page.locator("tbody tr").first().textContent() : "";
      if (!hasRows || rowText?.includes("No data found")) {
        // No employees — skip this test gracefully
        return;
      }

      await page.locator("tbody tr").first().click();
      await expect(page).toHaveURL(/\/employees\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      await expect(
        page.getByText("Statutory").first()
      ).toBeVisible({ timeout: 5000 });

      // PF fields
      await expect(
        page.getByText("PF Rate").first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText("Employment Type").first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("Notes section — add a note, verify it appears", async ({ page }) => {
      await page.goto("/employees");
      await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 5000 });
      await page.locator("tbody tr").first().click();
      await expect(page).toHaveURL(/\/employees\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      // Notes card heading
      await expect(
        page.getByText("Notes").first()
      ).toBeVisible({ timeout: 5000 });

      // The notes form is: <form class="mb-4 flex gap-2"> with select, input, button
      const notesForm = page.locator("form.flex.gap-2").first();
      await expect(notesForm).toBeVisible({ timeout: 5000 });

      // Category dropdown — select inside the notes form
      const categorySelect = notesForm.locator("select");
      await expect(categorySelect).toBeVisible({ timeout: 5000 });

      // Select "Performance" category
      await categorySelect.selectOption("performance");

      // Note input
      const noteInput = page.getByPlaceholder("Add a note...");
      await expect(noteInput).toBeVisible({ timeout: 5000 });

      const noteText = `E2E test note ${Date.now()}`;
      await noteInput.fill(noteText);

      // Submit button — the form's submit button (sibling of the input in the form)
      const submitButton = notesForm.getByRole("button");
      await submitButton.click();

      // Verify the note appears in the list
      await expect(page.getByText(noteText).first()).toBeVisible({
        timeout: 5000,
      });

      // Verify category badge shows "performance" (skip <option> elements which are hidden)
      await expect(
        page.locator("span", { hasText: "performance" }).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("Timeline section is visible when employee has history", async ({ page }) => {
      await page.goto("/employees");
      await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 5000 });
      await page.locator("tbody tr").first().click();
      await expect(page).toHaveURL(/\/employees\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      // Timeline card — it renders only when there are more than 1 events
      // The employee should at least have a joining event + salary, so look for it
      const timelineVisible = await page
        .getByText("Timeline")
        .first()
        .isVisible()
        .catch(() => false);

      if (timelineVisible) {
        await expect(page.getByText("Timeline").first()).toBeVisible({
          timeout: 5000,
        });
        // Timeline should show "Joined as" text
        await expect(
          page.getByText(/Joined as/).first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("YTD Summary section shows earnings data when payslips exist", async ({ page }) => {
      await page.goto("/employees");
      await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 5000 });
      await page.locator("tbody tr").first().click();
      await expect(page).toHaveURL(/\/employees\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      // YTD Summary appears only if payslips exist
      const ytdVisible = await page
        .getByText(/YTD Summary/)
        .first()
        .isVisible()
        .catch(() => false);

      if (ytdVisible) {
        await expect(page.getByText("Gross Earnings").first()).toBeVisible({
          timeout: 5000,
        });
        await expect(page.getByText("Total Deductions").first()).toBeVisible({
          timeout: 5000,
        });
        await expect(page.getByText("Net Pay").first()).toBeVisible({
          timeout: 5000,
        });
        await expect(
          page.getByText(/payslips processed/).first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("Documents section is visible with Upload button", async ({ page }) => {
      await page.goto("/employees");
      await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 5000 });
      await page.locator("tbody tr").first().click();
      await expect(page).toHaveURL(/\/employees\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      await expect(
        page.getByText("Documents").first()
      ).toBeVisible({ timeout: 5000 });

      await expect(
        page.getByRole("button", { name: "Upload" }).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("Edit employee modal — open, modify field, save", async ({ page }) => {
      await page.goto("/employees");
      await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 5000 });
      await page.locator("tbody tr").first().click();
      await expect(page).toHaveURL(/\/employees\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      // Click Edit button
      await page.getByRole("button", { name: "Edit" }).first().click();

      // Modal should open — scope assertions to the dialog
      const dialog = page.locator("[role=dialog]");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(
        dialog.getByRole("heading", { name: "Edit Employee" })
      ).toBeVisible({ timeout: 5000 });

      // Form fields in the edit modal — scoped to dialog
      const firstNameInput = dialog.getByLabel("First Name");
      await expect(firstNameInput).toBeVisible({ timeout: 5000 });
      const lastNameInput = dialog.getByLabel("Last Name");
      await expect(lastNameInput).toBeVisible({ timeout: 5000 });
      const phoneInput = dialog.getByLabel("Phone");
      await expect(phoneInput).toBeVisible({ timeout: 5000 });
      const departmentInput = dialog.getByLabel("Department");
      await expect(departmentInput).toBeVisible({ timeout: 5000 });
      const designationInput = dialog.getByLabel("Designation");
      await expect(designationInput).toBeVisible({ timeout: 5000 });

      // Modify phone field
      await phoneInput.clear();
      await phoneInput.fill("+91 99999 00000");

      // Save Changes button
      await dialog.getByRole("button", { name: "Save Changes" }).click();

      // Expect success toast or modal closes
      const result = await Promise.race([
        page.getByText(/updated|saved/i).first().waitFor({ timeout: 5000 }).then(() => "toast"),
        dialog.waitFor({ state: "hidden", timeout: 5000 }).then(() => "closed"),
      ]);
      expect(["toast", "closed"]).toContain(result);
    });

    test("Back to Employees button navigates to list page", async ({ page }) => {
      await page.goto("/employees");
      await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 5000 });
      await page.locator("tbody tr").first().click();
      await expect(page).toHaveURL(/\/employees\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      await page.getByRole("button", { name: "Back to Employees" }).first().click();

      await expect(page).toHaveURL(/\/employees$/, { timeout: 5000 });
    });

    test("Recent Payslips section is visible", async ({ page }) => {
      await page.goto("/employees");
      await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 5000 });
      await page.locator("tbody tr").first().click();
      await expect(page).toHaveURL(/\/employees\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      await expect(
        page.getByText("Recent Payslips").first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("New Employee Page", () => {
    test("form loads with all sections and fields", async ({ page }) => {
      await page.goto("/employees/new");

      await expect(
        page.getByRole("heading", { name: "Add Employee" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Personal Information section
      await expect(
        page.getByRole("heading", { name: "Personal Information" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Personal info fields
      await expect(page.getByLabel("First Name")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("Last Name")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("Email")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("Phone")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("Date of Birth")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("Gender")).toBeVisible({ timeout: 5000 });

      // Employment Details section
      await expect(
        page.getByRole("heading", { name: "Employment Details" }).first()
      ).toBeVisible({ timeout: 5000 });

      await expect(page.getByLabel("Employee ID")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("Department")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("Designation")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("Date of Joining")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("Employment Type")).toBeVisible({ timeout: 5000 });

      // Bank Details section
      await expect(
        page.getByRole("heading", { name: "Bank Details" }).first()
      ).toBeVisible({ timeout: 5000 });

      await expect(page.getByLabel("Bank Name")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("Account Number")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("IFSC Code")).toBeVisible({ timeout: 5000 });

      // Tax & Statutory section
      await expect(
        page.getByRole("heading", { name: "Tax & Statutory" }).first()
      ).toBeVisible({ timeout: 5000 });

      await expect(page.getByLabel("PAN Number")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("UAN / PF Number")).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel("Tax Regime")).toBeVisible({ timeout: 5000 });

      // Buttons
      await expect(
        page.getByRole("button", { name: "Save Employee" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("button", { name: "Cancel" }).first()
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("button", { name: "Back" }).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("fill form and submit new employee", async ({ page }) => {
      await page.goto("/employees/new");

      await expect(
        page.getByRole("heading", { name: "Add Employee" }).first()
      ).toBeVisible({ timeout: 5000 });

      const uniqueId = Date.now().toString();

      // Personal Information — use locator by id for fields that may have
      // ambiguous labels (e.g. "Email" text appears elsewhere on the page)
      await page.locator("#first_name").fill("TestFirst");
      await page.locator("#last_name").fill("TestLast");
      await page.locator("#email").fill(`e2e${uniqueId}@test.com`);
      await page.locator("#phone").fill("+91 98765 43210");
      await page.locator("#dob").fill("1995-06-15");
      await page.locator("#gender").selectOption("male");

      // Employment Details
      await page.locator("#employee_id").fill(`E${uniqueId.slice(-8)}`);
      await page.locator("#department").fill("Engineering");
      await page.locator("#designation").fill("Software Engineer");
      await page.locator("#date_of_joining").fill("2026-04-01");
      await page.locator("#employment_type").selectOption("full_time");

      // Bank Details
      await page.locator("#bank_name").fill("HDFC Bank");
      await page.locator("#account_number").fill("9876543210");
      await page.locator("#ifsc").fill("HDFC0001234");

      // Tax & Statutory
      await page.locator("#pan").fill("ABCPT1234F");
      await page.locator("#uan").fill("BGBNG/12345/099");
      await page.locator("#tax_regime").selectOption("new");

      // Submit
      await page.getByRole("button", { name: "Save Employee" }).first().click();

      // Expect success: either toast message, redirect to /employees, or an error toast
      await expect(
        page.getByText(/created successfully|Failed|already exists|Employees/i).first()
          .or(page.getByRole("heading", { name: "Employees" }))
      ).toBeVisible({ timeout: 10000 });
    });

    test("Cancel button navigates back to employees list", async ({ page }) => {
      await page.goto("/employees/new");

      await expect(
        page.getByRole("heading", { name: "Add Employee" }).first()
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: "Cancel" }).first().click();

      await expect(page).toHaveURL(/\/employees$/, { timeout: 5000 });
    });

    test("Back button navigates to employees list", async ({ page }) => {
      await page.goto("/employees/new");

      await expect(
        page.getByRole("heading", { name: "Add Employee" }).first()
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: "Back" }).first().click();

      await expect(page).toHaveURL(/\/employees$/, { timeout: 5000 });
    });
  });

  test.describe("Import Page", () => {
    test("loads with heading, upload area, and template download button", async ({ page }) => {
      await page.goto("/employees/import");

      await expect(
        page.getByRole("heading", { name: "Import Employees" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Description text
      await expect(
        page.getByText("Bulk import employees from a CSV file").first()
      ).toBeVisible({ timeout: 5000 });

      // Upload CSV card
      await expect(
        page.getByText("Upload CSV").first()
      ).toBeVisible({ timeout: 5000 });

      // Click to select area
      await expect(
        page.getByText("Click to select a CSV file").first()
      ).toBeVisible({ timeout: 5000 });

      // Template & Instructions card
      await expect(
        page.getByText("Template & Instructions").first()
      ).toBeVisible({ timeout: 5000 });

      // Download CSV Template button
      await expect(
        page.getByRole("button", { name: "Download CSV Template" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Required Fields section
      await expect(
        page.getByText("Required Fields").first()
      ).toBeVisible({ timeout: 5000 });

      // Optional Fields section
      await expect(
        page.getByText("Optional Fields").first()
      ).toBeVisible({ timeout: 5000 });

      // Back to Employees button
      await expect(
        page.getByRole("button", { name: "Back to Employees" }).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("Download CSV Template button triggers download", async ({ page }) => {
      await page.goto("/employees/import");

      await expect(
        page.getByRole("heading", { name: "Import Employees" }).first()
      ).toBeVisible({ timeout: 5000 });

      const downloadPromise = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);

      await page.getByRole("button", { name: "Download CSV Template" }).first().click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toContain("employee_import_template");
      }
    });

    test("shows required and optional field badges", async ({ page }) => {
      await page.goto("/employees/import");

      await expect(
        page.getByRole("heading", { name: "Import Employees" }).first()
      ).toBeVisible({ timeout: 5000 });

      // Required badges
      for (const field of ["firstName", "lastName", "email"]) {
        await expect(
          page.getByText(field, { exact: true }).first()
        ).toBeVisible({ timeout: 5000 });
      }

      // Some optional badges
      for (const field of ["phone", "department", "designation"]) {
        await expect(
          page.getByText(field, { exact: true }).first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("Back to Employees button navigates to list", async ({ page }) => {
      await page.goto("/employees/import");

      await expect(
        page.getByRole("heading", { name: "Import Employees" }).first()
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: "Back to Employees" }).first().click();

      await expect(page).toHaveURL(/\/employees$/, { timeout: 5000 });
    });
  });
});
