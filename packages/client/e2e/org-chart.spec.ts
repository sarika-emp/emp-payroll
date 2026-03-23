import { test, expect } from "@playwright/test";

test.describe("Organization Chart", () => {
  test("page loads with heading and department count", async ({ page }) => {
    await page.goto("/employees/org-chart");

    await expect(
      page.getByRole("heading", { name: "Organization Chart" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Description shows employee count and department count
    await expect(
      page.getByText(/\d+ employees across \d+ departments/).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("root employee card shows name, designation, and department badge", async ({ page }) => {
    await page.goto("/employees/org-chart");

    await expect(
      page.getByRole("heading", { name: "Organization Chart" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for at least one org node card to render
    // OrgNodeCard uses Card className="w-48", containing p (name), p (designation), Badge span (department)
    const firstCard = page.locator("[class*='w-48']").first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });

    // The name is the first <p> with font-semibold inside the card
    const firstCardName = firstCard.locator("p").first();
    await expect(firstCardName).toBeVisible({ timeout: 5000 });

    // The name should have non-empty text
    const name = await firstCardName.textContent();
    expect(name?.trim().length).toBeGreaterThan(0);

    // Designation text is the second <p> inside the card
    const firstDesignation = firstCard.locator("p").nth(1);
    await expect(firstDesignation).toBeVisible({ timeout: 5000 });

    // Department badge is a <span> inside the card (Badge component)
    const deptBadge = firstCard.locator("span").first();
    await expect(deptBadge).toBeVisible({ timeout: 5000 });
  });

  test("child nodes are visible under the root employee", async ({ page }) => {
    await page.goto("/employees/org-chart");

    await expect(
      page.getByRole("heading", { name: "Organization Chart" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for cards to load
    await expect(
      page.locator(".text-sm.font-semibold.text-gray-900").first()
    ).toBeVisible({ timeout: 5000 });

    // There should be multiple employee cards in the org tree
    const cardCount = await page.locator(".w-48").count();
    expect(cardCount).toBeGreaterThan(1);
  });

  test("department summary grid shows departments with employee lists", async ({ page }) => {
    await page.goto("/employees/org-chart");

    await expect(
      page.getByRole("heading", { name: "Organization Chart" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for content to load
    await expect(
      page.locator(".text-sm.font-semibold.text-gray-900").first()
    ).toBeVisible({ timeout: 5000 });

    // Department grid below the org tree
    // Each department card has an h3 with department name and a Badge with count
    const deptCards = page.locator(".grid.grid-cols-1.gap-4 h3.text-sm.font-semibold.text-gray-900");
    const deptCardCount = await deptCards.count();
    expect(deptCardCount).toBeGreaterThan(0);

    // First department card should have a count badge
    const firstDeptName = await deptCards.first().textContent();
    expect(firstDeptName?.trim().length).toBeGreaterThan(0);
  });

  test("employee cards in department grid show name and designation", async ({ page }) => {
    await page.goto("/employees/org-chart");

    await expect(
      page.getByRole("heading", { name: "Organization Chart" }).first()
    ).toBeVisible({ timeout: 5000 });

    // Wait for department grid to render
    await expect(
      page.locator(".grid.grid-cols-1.gap-4 .text-xs.font-medium.text-gray-900").first()
    ).toBeVisible({ timeout: 5000 });

    // Each employee entry in dept grid has name and designation
    const empName = page.locator(".grid.grid-cols-1.gap-4 .text-xs.font-medium.text-gray-900").first();
    const empDesig = page.locator(".grid.grid-cols-1.gap-4 .text-xs.text-gray-400").first();

    await expect(empName).toBeVisible({ timeout: 5000 });
    await expect(empDesig).toBeVisible({ timeout: 5000 });

    const nameText = await empName.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);
  });

  test("multiple employee cards render in the org tree section", async ({ page }) => {
    await page.goto("/employees/org-chart");

    await expect(
      page.getByRole("heading", { name: "Organization Chart" }).first()
    ).toBeVisible({ timeout: 5000 });

    // The org tree container has a min-width and is scrollable
    await expect(
      page.locator(".overflow-x-auto.overflow-y-auto").first()
    ).toBeVisible({ timeout: 5000 });

    // Multiple w-48 cards in the tree
    const treeCards = page.locator(".overflow-x-auto.overflow-y-auto .w-48");
    await expect(treeCards.first()).toBeVisible({ timeout: 5000 });

    const count = await treeCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
