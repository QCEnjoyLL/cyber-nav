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
    tags: [index % 4 < 2 ? "test" : "notes"],
    isPinned: false,
    isFavorite: false,
    isActive: true,
    sortOrder: index + 1,
  }));
  const adminPayload = {
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
  };
  let tagReorderBody: { categoryId: string | null; tags: string[] } | null = null;

  await page.setViewportSize({ width: 1440, height: 920 });
  await page.route("**/api/admin/session", (route) => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/admin/bootstrap", (route) => route.fulfill({ json: adminPayload }));
  await page.route("**/api/admin/links/reorder", async (route) => {
    tagReorderBody = await route.request().postDataJSON();
    await route.fulfill({
      json: {
        ...adminPayload,
        links: links.map((link) => {
          if (link.categoryId !== tagReorderBody?.categoryId) return link;
          const tagIndex = tagReorderBody.tags.indexOf(link.tags[0]);
          return { ...link, sortOrder: (tagIndex + 1) * 1000 + link.sortOrder };
        }),
      },
    });
  });

  await page.goto("/admin");
  await page.waitForSelector(".admin-list-row");
  await expect(page.locator(".admin-sort-badge").first()).toHaveText("1#");
  await expect
    .poll(() =>
      page.locator(".admin-link-grid").first().evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length),
    )
    .toBe(6);
  await expect(page.locator(".admin-link-group-header").filter({ hasText: "Media" })).toBeVisible();
  await expect(page.locator(".admin-link-group-header").filter({ hasText: "Tools" })).toBeVisible();
  await expect(page.locator(".admin-tag-group-header").filter({ hasText: "test" }).first()).toBeVisible();
  await page.getByLabel("notes 上移").first().click();
  await expect(page.locator(".form-message")).toContainText("标签顺序已保存");
  expect(tagReorderBody).toEqual({ categoryId: "media", tags: ["notes", "test"] });
  const categorySelect = page.locator(".admin-field").filter({ hasText: "所属分类" }).locator(".admin-select-trigger");
  await categorySelect.click();
  await expect(page.locator(".admin-select-menu")).toBeVisible();
  await page.locator(".admin-select-option").filter({ hasText: "Tools" }).click();
  await expect(categorySelect).toContainText("Tools");
  await page.locator(".admin-tag-select .admin-select-trigger").click();
  await expect(page.locator(".admin-tag-menu")).toBeVisible();
  await page.locator(".admin-tag-menu .admin-select-option").filter({ hasText: "test" }).click();
  await expect(page.locator(".admin-tag-select .admin-select-trigger")).toContainText("test");

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

  await page.getByRole("button", { name: "站点设置" }).click();
  const localeSelect = page.getByLabel("默认语言");
  await localeSelect.click();
  await page.getByRole("option", { name: "English" }).click();
  await expect(localeSelect).toContainText("English");
  const themeSelect = page.getByLabel("默认主题");
  await themeSelect.click();
  await page.getByRole("option", { name: "Dark" }).click();
  await expect(themeSelect).toContainText("Dark");
});

test("admin create update and delete show explicit feedback", async ({ page }) => {
  const baseData = {
    settings: {
      titleZh: "Orange Nav",
      titleEn: "Orange Nav",
      subtitleZh: "Navigation",
      subtitleEn: "Navigation",
      defaultLocale: "zh",
      defaultTheme: "system",
      backgroundStyle: "soft-circuit",
    },
    categories: [{ id: "tools", nameZh: "Tools", nameEn: "Tools", icon: "Wrench", color: "#00f5ff", sortOrder: 20, isActive: true }],
    links: [
      {
        id: "link-1",
        categoryId: "tools",
        title: "Site 1",
        descriptionZh: "",
        descriptionEn: "",
        url: "https://example.com/1",
        iconUrl: "",
        tags: [],
        isPinned: false,
        isFavorite: false,
        isActive: true,
        sortOrder: 1,
      },
      {
        id: "link-2",
        categoryId: "tools",
        title: "Site 2",
        descriptionZh: "",
        descriptionEn: "",
        url: "https://example.com/2",
        iconUrl: "",
        tags: [],
        isPinned: false,
        isFavorite: false,
        isActive: true,
        sortOrder: 2,
      },
    ],
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
  };

  let created = false;
  let updated = false;
  let deleted = false;
  let confirmed = false;
  let reordered = false;

  await page.setViewportSize({ width: 1440, height: 920 });
  await page.route("**/api/admin/session", (route) => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/admin/bootstrap", (route) => route.fulfill({ json: baseData }));
  await page.route("**/api/admin/links/reorder", (route) => {
    reordered = route.request().method() === "POST";
    return route.fulfill({ json: baseData });
  });
  await page.route("**/api/admin/links", async (route) => {
    const body = await route.request().postDataJSON();
    created = route.request().method() === "POST" && body.title === "Created Site";
    await route.fulfill({ json: { ...body, id: body.id || "created-site", url: body.url } });
  });
  await page.route("**/api/admin/links/*", async (route) => {
    const method = route.request().method();
    if (method === "PUT") {
      const body = await route.request().postDataJSON();
      updated = body.title === "Updated Site";
      await route.fulfill({ json: { ...body, id: "link-1" } });
      return;
    }
    if (method === "DELETE") {
      deleted = true;
      await route.fulfill({ json: { ok: true } });
      return;
    }
    await route.fallback();
  });
  page.on("dialog", async (dialog) => {
    confirmed = dialog.message().includes("确认删除");
    await dialog.accept();
  });

  await page.goto("/admin");
  await page.waitForSelector(".admin-list-row");
  await expect(page.getByRole("button", { name: "保存修改" })).toBeDisabled();
  await page.getByRole("button", { name: "重排序号" }).click();
  await expect(page.locator(".form-message")).toContainText("重排成功");
  expect(reordered).toBe(true);

  await page.locator('input[placeholder="偏爱一丛花"]').fill("Created Site");
  await page.locator('input[placeholder="https://www.example.com"]').fill("https://created.example.com");
  await page.getByRole("button", { name: "新增" }).click();
  await expect(page.locator(".form-message")).toContainText("保存成功");
  expect(created).toBe(true);

  await page.locator(".admin-list-row").filter({ hasText: "Site 1" }).locator("button").first().click();
  await expect(page.locator(".admin-edit-state")).toContainText("正在编辑");
  await expect(page.getByRole("button", { name: "保存修改" })).toBeEnabled();
  await page.locator('input[placeholder="偏爱一丛花"]').fill("Updated Site");
  await page.getByRole("button", { name: "保存修改" }).click();
  await expect(page.locator(".form-message")).toContainText("保存成功");
  expect(updated).toBe(true);

  await page.locator(".admin-list-row").filter({ hasText: "Site 2" }).locator(".danger-button").click();
  await expect(page.locator(".form-message")).toContainText("删除成功");
  expect(confirmed).toBe(true);
  expect(deleted).toBe(true);
});

test("admin mobile layout scrolls and keeps the form usable", async ({ page }) => {
  const links = Array.from({ length: 12 }, (_, index) => ({
    id: `mobile-link-${index + 1}`,
    categoryId: "tools",
    title: `Mobile Site ${index + 1}`,
    descriptionZh: "",
    descriptionEn: "",
    url: `https://example.com/mobile-${index + 1}`,
    iconUrl: "",
    tags: ["mobile"],
    isPinned: false,
    isFavorite: false,
    isActive: true,
    sortOrder: index + 1,
  }));

  await page.setViewportSize({ width: 390, height: 844 });
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
        categories: [{ id: "tools", nameZh: "Tools", nameEn: "Tools", icon: "Wrench", color: "#00f5ff", sortOrder: 20, isActive: true }],
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
  await expect.poll(() => page.locator(".admin-shell").evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await page.locator(".admin-shell").evaluate((element) => {
    element.scrollTop = 520;
  });
  await expect.poll(() => page.locator(".admin-shell").evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.locator('input[placeholder="偏爱一丛花"]').fill("Mobile Editable Site");
  await expect(page.locator('input[placeholder="偏爱一丛花"]')).toHaveValue("Mobile Editable Site");
});
