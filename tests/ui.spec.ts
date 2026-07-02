import { expect, test } from "@playwright/test";

test("public navigation renders and theme toggle works", async ({ page }) => {
  await page.route("**/api/public/bootstrap", (route) => route.abort());
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "橙子导航" })).toBeVisible();
  await expect(page).toHaveTitle("橙子导航");
  await expect(page.getByRole("heading", { name: "OpenAI" })).toBeVisible();
  await page.getByLabel("theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", /light|dark/);
});

test("mobile drawer opens", async ({ page }) => {
  await page.route("**/api/public/bootstrap", (route) => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByLabel("menu").click();
  await expect(page.locator(".sidebar")).toHaveClass(/sidebar-open/);
});

test("admin login screen renders", async ({ page }) => {
  await page.route("**/api/admin/session", (route) => route.abort());
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "进入后台" })).toBeVisible();
  await expect(page.getByPlaceholder("管理密码")).toBeVisible();
  await expect(page).toHaveTitle("橙子导航");
});
