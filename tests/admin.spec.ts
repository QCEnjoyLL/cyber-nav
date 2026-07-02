import { expect, test } from "@playwright/test";

test("admin list scrolls independently and category icon can be picked", async ({ page }) => {
  const links = Array.from({ length: 36 }, (_, index) => ({
    id: `link-${index + 1}`,
    categoryId: index % 2 === 0 ? "media" : "tools",
    title: `Site ${index + 1}`,
    descriptionZh: "Scroll check",
    descriptionEn: "Scroll check",
    url: `https://example.com/${index + 1}`,
    iconUrl: "",
    tags: ["test"],
    isPinned: false,
    isFavorite: false,
    isActive: true,
    sortOrder: index + 1,
  }));

  await page.setViewportSize({ width: 1440, height: 920 });
  await page.route("**/api/admin/session", (route) => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/admin/bootstrap", (route) =>
    route.fulfill({
      json: {
        settings: {
          titleZh: "Orange Nav",
          titleEn: "Orange Nav",
          subtitleZh: "Navigation",
          subtitleEn: "Navigation",
          defaultLocale: "zh",
          defaultTheme: "system",
          backgroundStyle: "soft-circuit",
        },
        categories: [
          { id: "media", nameZh: "Media", nameEn: "Media", icon: "Film", color: "#fcee0a", sortOrder: 10, isActive: true },
          { id: "tools", nameZh: "Tools", nameEn: "Tools", icon: "Wrench", color: "#00f5ff", sortOrder: 20, isActive: true },
        ],
        links,
        searchEngines: [
          {
            id: "bing",
            name: "Bing",
            shortcut: "b",
            urlTemplate: "https://www.bing.com/search?q={query}",
            isDefault: true,
            isActive: true,
            sortOrder: 10,
          },
        ],
      },
    }),
  );

  await page.goto("/admin");
  await page.waitForSelector(".admin-list-row");
  const before = await page.locator(".admin-form").boundingBox();
  await page.locator(".admin-list").evaluate((element) => {
    element.scrollTop = 600;
  });
  await expect.poll(() => page.locator(".admin-list").evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  const after = await page.locator(".admin-form").boundingBox();

  expect(after?.y).toBe(before?.y);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.locator(".admin-nav .category-button").nth(1).click();
  await page.locator('.icon-picker-button[aria-label="Server"]').click();
  await expect(page.locator('input[placeholder="Folder"]')).toHaveValue("Server");
});
