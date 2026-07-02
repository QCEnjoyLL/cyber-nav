import { expect, test } from "@playwright/test";

test("public navigation renders and theme toggle works", async ({ page }) => {
  await page.route("**/api/public/bootstrap", (route) => route.abort());
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "橙子导航" })).toBeVisible();
  await expect(page).toHaveTitle("橙子导航");
  await expect(page.getByRole("heading", { name: "OpenAI" })).toBeVisible();
  const searchInput = page.getByPlaceholder("搜索全网，也会同步筛选导航");
  await searchInput.fill("open");
  await expect(page.getByLabel("清空搜索")).toBeVisible();
  await page.getByLabel("清空搜索").click();
  await expect(searchInput).toHaveValue("");
  await page.getByLabel("theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", /light|dark/);
});

test("mobile drawer opens", async ({ page }) => {
  await page.route("**/api/public/bootstrap", (route) => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByLabel("menu").click();
  await expect(page.locator(".sidebar")).toHaveClass(/sidebar-open/);
  await page.locator(".sidebar .category-button").filter({ hasText: "开发" }).click();
  await expect(page.locator(".sidebar")).not.toHaveClass(/sidebar-open/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByLabel("收藏")).toBeVisible();
});

test("admin login screen renders", async ({ page }) => {
  await page.route("**/api/admin/session", (route) => route.abort());
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "进入管理" })).toBeVisible();
  await expect(page.getByPlaceholder("管理密码")).toBeVisible();
  await expect(page).toHaveTitle("橙子导航");
});
