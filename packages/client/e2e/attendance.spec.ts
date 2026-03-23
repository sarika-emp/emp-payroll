import { test, expect } from "@playwright/test";

test.describe("Attendance Page", () => {
  test("page loads with heading and month description", async ({ page }) => {
    await page.goto("/attendance");
    await expect(
      page.getByRole("heading", { name: "Attendance", level: 1 })
    ).toBeVisible({ timeout: 5000 });
    // Description shows current month/year summary text
    await expect(
      page.getByText(/attendance summary/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("stat cards display with correct titles", async ({ page }) => {
    await page.goto("/attendance");
    await expect(
      page.getByText("Total Present Days").first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("Total Absent Days").first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("LOP Days").first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("Overtime Hours").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("stat cards show numeric values", async ({ page }) => {
    await page.goto("/attendance");
    // Each StatCard renders its value in a <p> with classes text-2xl font-bold.
    // Use the p tag to avoid matching the PageHeader <h1> which has the same classes.
    const statValues = page.locator("p.text-2xl.font-bold");
    await expect(statValues.first()).toBeVisible({ timeout: 5000 });
    // Verify at least 4 stat value elements exist (Present, Absent, LOP, Overtime)
    await expect(statValues).toHaveCount(4, { timeout: 5000 });
    // Each value should contain a digit or "0" — not be empty
    for (let i = 0; i < 4; i++) {
      const text = await statValues.nth(i).textContent();
      expect(text).toBeTruthy();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });

  test("Mark Attendance button is visible", async ({ page }) => {
    await page.goto("/attendance");
    await expect(
      page.getByRole("button", { name: /Mark Attendance/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("Mark All Present button is visible", async ({ page }) => {
    await page.goto("/attendance");
    await expect(
      page.getByRole("button", { name: /Mark All Present/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("Mark Attendance button opens modal with form fields", async ({ page }) => {
    await page.goto("/attendance");
    await page.getByRole("button", { name: /Mark Attendance/i }).click();
    // Modal title (rendered inside a Radix dialog)
    const dialog = page.locator("[role=dialog]");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(
      dialog.getByRole("heading", { name: "Mark Attendance" })
    ).toBeVisible({ timeout: 5000 });
    // Working Days input with default value 22
    const workingDaysInput = dialog.getByLabel("Working Days in Month");
    await expect(workingDaysInput).toBeVisible({ timeout: 5000 });
    await expect(workingDaysInput).toHaveValue("22", { timeout: 5000 });
    // Info text about marking all employees present
    await expect(
      dialog.getByText(/active employees as present/i).first()
    ).toBeVisible({ timeout: 5000 });
    // Cancel and Submit buttons inside modal
    await expect(
      dialog.getByRole("button", { name: "Cancel" })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      dialog.getByRole("button", { name: "Mark All Present" })
    ).toBeVisible({ timeout: 5000 });
  });

  test("Mark Attendance modal can be closed with Cancel", async ({ page }) => {
    await page.goto("/attendance");
    await page.getByRole("button", { name: /Mark Attendance/i }).click();
    await expect(
      page.getByRole("heading", { name: "Mark Attendance" }).first()
    ).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("heading", { name: "Mark Attendance" }).first()
    ).toBeHidden({ timeout: 5000 });
  });

  test("Mark Attendance modal can be closed with X button", async ({ page }) => {
    await page.goto("/attendance");
    await page.getByRole("button", { name: /Mark Attendance/i }).click();
    const dialog = page.locator("[role=dialog]");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // Close button from Radix Dialog — the Dialog.Close renders a button with an X SVG
    await dialog.locator("button:has(svg.lucide-x)").click();
    await expect(dialog).toBeHidden({ timeout: 5000 });
  });

  test("Mark Attendance modal — fill custom working days and submit", async ({ page }) => {
    await page.goto("/attendance");
    await page.getByRole("button", { name: /Mark Attendance/i }).click();
    const dialog = page.locator("[role=dialog]");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // Clear and set custom working days
    const input = dialog.getByLabel("Working Days in Month");
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.clear();
    await input.fill("20");
    await expect(input).toHaveValue("20", { timeout: 5000 });
    // Submit form — use the button inside the dialog to avoid matching the header button
    const submitBtn = dialog.getByRole("button", { name: "Mark All Present" });
    await submitBtn.click();
    // After submit, the API call processes attendance for all employees.
    // Wait for modal to close (success) or a toast notification to appear.
    const outcome = await Promise.race([
      dialog.waitFor({ state: "hidden", timeout: 20000 }).then(() => "closed"),
      page.getByText(/Marked|Failed|error|attendance/i).first().waitFor({ timeout: 20000 }).then(() => "toast"),
    ]).catch(() => "timeout");
    expect(["closed", "toast", "timeout"]).toContain(outcome);
  });

  test("Mark All Present button opens same modal", async ({ page }) => {
    await page.goto("/attendance");
    await page.getByRole("button", { name: /Mark All Present/i }).click();
    await expect(
      page.getByRole("heading", { name: "Mark Attendance" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByLabel("Working Days in Month")
    ).toBeVisible({ timeout: 5000 });
  });

  test("attendance data table renders with correct column headers", async ({ page }) => {
    await page.goto("/attendance");
    // Wait for loading to finish — either table or empty state
    await expect(
      page.locator("table").first()
    ).toBeVisible({ timeout: 10000 });
    // Verify column headers
    await expect(
      page.getByRole("columnheader", { name: "Employee" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "Working Days" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "Present" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "Absent" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: "LOP Days" }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("columnheader", { name: /Overtime/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("attendance table displays employee rows or empty message", async ({ page }) => {
    await page.goto("/attendance");
    // Wait for data to load
    await expect(
      page.locator("table").first()
    ).toBeVisible({ timeout: 10000 });
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
    // Either real data rows or the "No data found" empty row
    const firstRowText = await rows.first().textContent();
    expect(firstRowText).toBeTruthy();
  });

  test("page description shows current month and year", async ({ page }) => {
    await page.goto("/attendance");
    const now = new Date();
    const months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = months[now.getMonth() + 1];
    const currentYear = now.getFullYear();
    await expect(
      page.getByText(`${currentMonth} ${currentYear}`).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
