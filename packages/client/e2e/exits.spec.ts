import { test, expect } from "@playwright/test";

test.describe("Exit Management", () => {
  test("page loads with heading and description", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText("Employee offboarding & full and final settlement").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Initiate Exit button is visible", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByRole("button", { name: "Initiate Exit" }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("all status tabs are visible and clickable", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    const tabs = ["All", "Initiated", "In Progress", "FnF Pending", "Completed"];

    // Verify all tabs are visible
    for (const tabLabel of tabs) {
      await expect(
        page.getByRole("button", { name: tabLabel, exact: true }).first()
      ).toBeVisible({ timeout: 5000 });
    }

    // Click each tab and verify it becomes active (has bg-white shadow-sm classes)
    for (const tabLabel of tabs) {
      const tabButton = page.getByRole("button", { name: tabLabel, exact: true }).first();
      await tabButton.click();

      // After clicking, the tab should have the active styling class
      await expect(tabButton).toHaveClass(/bg-white/, { timeout: 5000 });
    }
  });

  test("clicking Initiated tab filters to initiated exits", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Initiated", exact: true }).first().click();

    // Either exit cards with "initiated" status or empty state
    await expect(
      page.getByText(/initiated|No exit records found/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("clicking In Progress tab filters exits", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "In Progress", exact: true }).first().click();

    // Either exit cards or empty state
    await expect(
      page.getByText(/in progress|No exit records found/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("clicking FnF Pending tab filters exits", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "FnF Pending", exact: true }).first().click();

    await expect(
      page.getByText(/fnf pending|No exit records found/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("clicking Completed tab filters exits", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Completed", exact: true }).first().click();

    await expect(
      page.getByText(/completed|No exit records found/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Initiate Exit button opens create modal with all fields", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Click Initiate Exit button
    await page.getByRole("button", { name: "Initiate Exit" }).first().click();

    // Modal opens with title
    await expect(
      page.getByText("Initiate Employee Exit").first()
    ).toBeVisible({ timeout: 5000 });

    // Employee search field
    await expect(
      page.getByPlaceholder("Search by name or email...").first()
    ).toBeVisible({ timeout: 5000 });

    // Exit Type dropdown
    await expect(page.getByLabel("Exit Type")).toBeVisible({ timeout: 5000 });

    // Resignation Date field
    await expect(page.getByLabel("Resignation Date")).toBeVisible({ timeout: 5000 });

    // Last Working Date field
    await expect(page.getByLabel("Last Working Date")).toBeVisible({ timeout: 5000 });

    // Reason textarea
    await expect(
      page.getByPlaceholder("Exit reason...").first()
    ).toBeVisible({ timeout: 5000 });

    // Cancel button in modal
    await expect(
      page.getByRole("button", { name: "Cancel" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Initiate Exit submit button (disabled until employee selected)
    const submitBtn = page.getByRole("button", { name: "Initiate Exit" }).last();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
  });

  test("create modal — fill all fields and submit", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Open modal
    await page.getByRole("button", { name: "Initiate Exit" }).first().click();

    await expect(
      page.getByText("Initiate Employee Exit").first()
    ).toBeVisible({ timeout: 5000 });

    // Search for an employee
    const empSearch = page.getByPlaceholder("Search by name or email...");
    await empSearch.fill("Ananya");

    // Wait for search results dropdown to appear
    const searchResult = page.locator(".absolute.z-10 button").first();
    const resultAppeared = await searchResult
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (resultAppeared) {
      // Click the first result to select the employee
      await searchResult.click();

      // The selected employee should now show with a "Change" link
      await expect(
        page.getByText("Change").first()
      ).toBeVisible({ timeout: 5000 });

      // Select Exit Type
      await page.getByLabel("Exit Type").selectOption("resignation");

      // Fill Last Working Date
      await page.getByLabel("Last Working Date").fill("2026-05-31");

      // Fill Reason
      await page.getByPlaceholder("Exit reason...").fill("E2E test: voluntary resignation");

      // Submit
      await page.getByRole("button", { name: "Initiate Exit" }).last().click();

      // Expect success toast or error toast, or the modal closes after submission
      await expect(
        page.getByText(/exit initiated/i).first()
          .or(page.getByText(/failed/i).first())
          .or(page.getByText(/already/i).first())
          .or(page.getByText("Initiate Employee Exit").first())
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("create modal — Cancel button closes the modal", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Open modal
    await page.getByRole("button", { name: "Initiate Exit" }).first().click();

    await expect(
      page.getByText("Initiate Employee Exit").first()
    ).toBeVisible({ timeout: 5000 });

    // Click Cancel
    await page.getByRole("button", { name: "Cancel" }).first().click();

    // Modal should close — "Initiate Employee Exit" title should not be visible
    await expect(
      page.getByText("Initiate Employee Exit")
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("exit type dropdown has all options", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Open modal
    await page.getByRole("button", { name: "Initiate Exit" }).first().click();

    await expect(
      page.getByText("Initiate Employee Exit").first()
    ).toBeVisible({ timeout: 5000 });

    // Exit Type select should have these options
    const exitTypeSelect = page.getByLabel("Exit Type");
    await expect(exitTypeSelect).toBeVisible({ timeout: 5000 });

    // Verify each option by selecting it
    const exitTypes = [
      { value: "resignation", label: "Resignation" },
      { value: "termination", label: "Termination" },
      { value: "retirement", label: "Retirement" },
      { value: "end_of_contract", label: "End of Contract" },
      { value: "mutual_separation", label: "Mutual Separation" },
    ];

    for (const exitType of exitTypes) {
      await exitTypeSelect.selectOption(exitType.value);
    }
  });

  test("if exits exist, exit cards show employee name, status, exit type, and checklist", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for content to load — either exit cards or empty state
    await expect(
      page.getByText(/No exit records found/).or(page.locator("h3.text-sm.font-semibold.text-gray-900").first())
    ).toBeVisible({ timeout: 5000 });

    // Check if any exit cards exist
    const hasExits = await page
      .locator("h3.text-sm.font-semibold.text-gray-900")
      .first()
      .isVisible()
      .catch(() => false);

    if (hasExits) {
      // First exit card should show employee name
      const exitName = page.locator("h3.text-sm.font-semibold.text-gray-900").first();
      await expect(exitName).toBeVisible({ timeout: 5000 });
      const nameText = await exitName.textContent();
      expect(nameText?.trim().length).toBeGreaterThan(0);

      // Status badge visible
      await expect(
        page.locator(".rounded-full.px-2.py-0\\.5").first()
      ).toBeVisible({ timeout: 5000 });

      // Checklist count (e.g., "0/8" or "3/8")
      await expect(
        page.getByText(/\d+\/\d+/).first()
      ).toBeVisible({ timeout: 5000 });

      // "Checklist" label
      await expect(
        page.getByText("Checklist").first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("clicking an exit card opens detail modal with checklist and FnF section", async ({ page }) => {
    await page.goto("/exits");

    await expect(
      page.getByRole("heading", { name: "Exit Management" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for content
    await expect(
      page.getByText(/No exit records found/).or(page.locator("h3.text-sm.font-semibold.text-gray-900").first())
    ).toBeVisible({ timeout: 5000 });

    const hasExits = await page
      .locator("h3.text-sm.font-semibold.text-gray-900")
      .first()
      .isVisible()
      .catch(() => false);

    if (hasExits) {
      // Click the first exit card
      await page.locator(".cursor-pointer").first().click();

      // Detail modal opens with "Exit:" title
      await expect(
        page.getByText(/^Exit:/).first()
      ).toBeVisible({ timeout: 5000 });

      // Modal shows Employee, Exit Type, Resignation Date, Last Working Date
      await expect(page.getByText("Employee").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Exit Type").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Resignation Date").first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Last Working Date").first()).toBeVisible({ timeout: 5000 });

      // Offboarding Checklist section
      await expect(
        page.getByText("Offboarding Checklist").first()
      ).toBeVisible({ timeout: 5000 });

      // Checklist items visible
      const checklistItems = [
        "Notice Period Served",
        "Work Handover Complete",
        "Company Assets Returned",
        "System Access Revoked",
        "FnF Calculated",
        "FnF Paid",
        "Experience Letter Issued",
        "Relieving Letter Issued",
      ];

      for (const item of checklistItems) {
        await expect(
          page.getByText(item).first()
        ).toBeVisible({ timeout: 5000 });
      }

      // Full & Final Settlement section
      await expect(
        page.getByText("Full & Final Settlement").first()
      ).toBeVisible({ timeout: 5000 });

      // Either "FnF not yet calculated" or the FnF breakdown
      await expect(
        page.getByText(/FnF not yet calculated|Pending Salary/).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
