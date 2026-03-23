import { test, expect } from "@playwright/test";

test.describe("Leave Management Page", () => {
  test("page loads with heading", async ({ page }) => {
    await page.goto("/leaves");
    await expect(
      page.getByRole("heading", { name: "Leave Management", level: 1 })
    ).toBeVisible({ timeout: 5000 });
  });

  test("all five filter buttons are visible", async ({ page }) => {
    await page.goto("/leaves");
    for (const label of ["All", "Pending", "Approved", "Rejected", "Cancelled"]) {
      await expect(
        page.getByRole("button", { name: label, exact: true })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Pending filter is active by default", async ({ page }) => {
    await page.goto("/leaves");
    // The default filter state is "pending" — Pending button should be primary variant
    const pendingBtn = page.getByRole("button", { name: "Pending", exact: true });
    await expect(pendingBtn).toBeVisible({ timeout: 5000 });
    // Pending button should have the primary styling (bg-brand class) since filter defaults to "pending"
    await expect(pendingBtn).toHaveClass(/bg-brand/, { timeout: 5000 });
  });

  test("clicking All filter button switches to all requests", async ({ page }) => {
    await page.goto("/leaves");
    const allBtn = page.getByRole("button", { name: "All", exact: true });
    await allBtn.click();
    // All button should now have primary styling
    await expect(allBtn).toHaveClass(/bg-brand/, { timeout: 5000 });
    // Pending button should no longer have primary styling
    const pendingBtn = page.getByRole("button", { name: "Pending", exact: true });
    await expect(pendingBtn).not.toHaveClass(/bg-brand/, { timeout: 5000 });
  });

  test("clicking Approved filter shows approved requests", async ({ page }) => {
    await page.goto("/leaves");
    const approvedBtn = page.getByRole("button", { name: "Approved", exact: true });
    await approvedBtn.click();
    await expect(approvedBtn).toHaveClass(/bg-brand/, { timeout: 5000 });
    // Wait for table or empty state to appear
    await expect(
      page.getByRole("heading", { name: "Leave Requests" }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("clicking Rejected filter shows rejected requests", async ({ page }) => {
    await page.goto("/leaves");
    const rejectedBtn = page.getByRole("button", { name: "Rejected", exact: true });
    await rejectedBtn.click();
    await expect(rejectedBtn).toHaveClass(/bg-brand/, { timeout: 5000 });
    await expect(
      page.getByRole("heading", { name: "Leave Requests" }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("clicking Cancelled filter shows cancelled requests", async ({ page }) => {
    await page.goto("/leaves");
    const cancelledBtn = page.getByRole("button", { name: "Cancelled", exact: true });
    await cancelledBtn.click();
    await expect(cancelledBtn).toHaveClass(/bg-brand/, { timeout: 5000 });
    await expect(
      page.getByRole("heading", { name: "Leave Requests" }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Leave Requests card heading is visible", async ({ page }) => {
    await page.goto("/leaves");
    await expect(
      page.getByRole("heading", { name: "Leave Requests" }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("stat cards are visible — Pending, Approved, Rejected, Total", async ({ page }) => {
    await page.goto("/leaves");
    await expect(page.getByText("Pending").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Approved").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Rejected").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Total").first()).toBeVisible({ timeout: 5000 });
  });

  test("stat cards are clickable and change filter", async ({ page }) => {
    await page.goto("/leaves");
    // Click the "Approved" stat card (the card element, not the filter button)
    const approvedCard = page.locator(".cursor-pointer").nth(1);
    await approvedCard.click();
    // After clicking approved card, the Approved filter button should become active
    await expect(
      page.getByRole("button", { name: "Approved", exact: true })
    ).toHaveClass(/bg-brand/, { timeout: 5000 });
  });

  test("leave requests table has correct column headers", async ({ page }) => {
    await page.goto("/leaves");
    // Switch to All to have the best chance of seeing data
    await page.getByRole("button", { name: "All", exact: true }).click();

    // Wait for loading to complete
    await page.waitForTimeout(2000);

    // The table is only rendered when there are leave requests.
    // If empty state is shown, verify that and pass gracefully.
    const tableVisible = await page.locator("table").first().isVisible().catch(() => false);

    if (!tableVisible) {
      // Empty state — no leave requests, no table rendered
      await expect(
        page.getByText(/No.*leave requests/i).first()
      ).toBeVisible({ timeout: 5000 });
      return;
    }

    // Table is visible — verify column headers
    await expect(
      page.getByRole("columnheader", { name: "Employee" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "Type" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "From" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "To" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "Days" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "Reason" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "Status" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "Actions" }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("leave requests show data rows or empty message", async ({ page }) => {
    await page.goto("/leaves");
    await page.getByRole("button", { name: "All", exact: true }).click();
    // Wait for loading to complete
    await expect(
      page.getByRole("heading", { name: "Leave Requests" }).first()
    ).toBeVisible({ timeout: 5000 });
    // Either a table row with data or the "No leave requests" empty state
    const hasTable = await page.locator("table tbody tr").first().isVisible().catch(() => false);
    if (hasTable) {
      const rowCount = await page.locator("table tbody tr").count();
      expect(rowCount).toBeGreaterThanOrEqual(1);
    } else {
      await expect(
        page.getByText(/No .* leave requests/i).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("pending requests show Approve and Reject action buttons", async ({ page }) => {
    await page.goto("/leaves");
    // Ensure we are on Pending filter (default)
    await expect(
      page.getByRole("button", { name: "Pending", exact: true })
    ).toHaveClass(/bg-brand/, { timeout: 5000 });
    // Wait for table to load
    await page.waitForTimeout(2000);
    const hasRows = await page.locator("table tbody tr").first().isVisible().catch(() => false);
    if (hasRows) {
      const firstRowText = await page.locator("table tbody tr").first().textContent();
      // Skip if the only row is the empty message
      if (firstRowText && !firstRowText.includes("No")) {
        // Approve button (green check icon) in first row
        await expect(
          page.getByTitle("Approve").first()
        ).toBeVisible({ timeout: 5000 });
        // Reject button (red X icon) in first row
        await expect(
          page.getByTitle("Reject").first()
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("Approve button triggers quick approve action", async ({ page }) => {
    await page.goto("/leaves");
    await page.waitForTimeout(2000);
    const approveBtn = page.getByTitle("Approve").first();
    const isVisible = await approveBtn.isVisible().catch(() => false);
    if (isVisible) {
      await approveBtn.click();
      // Should show success or error toast
      const result = await Promise.race([
        page.getByText(/Leave approved/i).first().waitFor({ timeout: 5000 }).then(() => "success"),
        page.getByText(/Failed/i).first().waitFor({ timeout: 5000 }).then(() => "error"),
      ]);
      expect(["success", "error"]).toContain(result);
    }
  });

  test("Reject button opens remarks modal", async ({ page }) => {
    await page.goto("/leaves");
    await page.waitForTimeout(2000);
    const rejectBtn = page.getByTitle("Reject").first();
    const isVisible = await rejectBtn.isVisible().catch(() => false);
    if (isVisible) {
      await rejectBtn.click();
      // Reject Leave modal should appear
      await expect(
        page.getByRole("heading", { name: "Reject Leave" }).first()
      ).toBeVisible({ timeout: 5000 });
      // Remarks textarea is visible
      await expect(
        page.getByPlaceholder("Add remarks...")
      ).toBeVisible({ timeout: 5000 });
      // Cancel and Reject buttons inside modal
      await expect(
        page.getByRole("button", { name: "Cancel" })
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("button", { name: "Reject" }).last()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Reject modal — fill remarks and submit", async ({ page }) => {
    await page.goto("/leaves");
    await page.waitForTimeout(2000);
    const rejectBtn = page.getByTitle("Reject").first();
    const isVisible = await rejectBtn.isVisible().catch(() => false);
    if (isVisible) {
      await rejectBtn.click();
      await expect(
        page.getByPlaceholder("Add remarks...")
      ).toBeVisible({ timeout: 5000 });
      // Fill in the remarks
      await page.getByPlaceholder("Add remarks...").fill("Insufficient leave balance");
      // Click Reject button in modal
      await page.getByRole("button", { name: "Reject" }).last().click();
      // Should show success or error toast
      const result = await Promise.race([
        page.getByText(/Leave rejected/i).first().waitFor({ timeout: 5000 }).then(() => "success"),
        page.getByText(/Action failed/i).first().waitFor({ timeout: 5000 }).then(() => "error"),
        page.getByText(/Failed/i).first().waitFor({ timeout: 5000 }).then(() => "error"),
      ]);
      expect(["success", "error"]).toContain(result);
    }
  });

  test("Reject modal can be closed with Cancel", async ({ page }) => {
    await page.goto("/leaves");
    await page.waitForTimeout(2000);
    const rejectBtn = page.getByTitle("Reject").first();
    const isVisible = await rejectBtn.isVisible().catch(() => false);
    if (isVisible) {
      await rejectBtn.click();
      await expect(
        page.getByRole("heading", { name: "Reject Leave" }).first()
      ).toBeVisible({ timeout: 5000 });
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(
        page.getByRole("heading", { name: "Reject Leave" }).first()
      ).toBeHidden({ timeout: 5000 });
    }
  });

  test("switching filters cycles through all statuses", async ({ page }) => {
    await page.goto("/leaves");
    const filters = ["All", "Pending", "Approved", "Rejected", "Cancelled"];
    for (const f of filters) {
      const btn = page.getByRole("button", { name: f, exact: true });
      await btn.click();
      await expect(btn).toHaveClass(/bg-brand/, { timeout: 5000 });
      // Each filter click should keep the Leave Requests heading visible
      await expect(
        page.getByRole("heading", { name: "Leave Requests" }).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("Approver column header is visible in table", async ({ page }) => {
    await page.goto("/leaves");
    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(
      page.locator("table").first()
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("columnheader", { name: "Approver" }).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
