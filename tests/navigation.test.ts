import { describe, expect, it } from "vitest";
import { defaultBootstrap } from "../src/data/defaults";
import { buildCategorySubcategories, buildSearchUrl, filterLinks, getLinkSubcategory, normalizeUrl } from "../src/utils/navigation";

describe("navigation helpers", () => {
  it("filters links by category, query, tag, and favorites", () => {
    const results = filterLinks(
      defaultBootstrap.links,
      {
        categoryId: "ai",
        query: "open",
        tags: ["LLM"],
        favorites: new Set(["openai"]),
        favoriteOnly: true,
      },
      "zh",
    );

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("openai");
  });

  it("keeps pinned links before non-pinned links", () => {
    const results = filterLinks(
      defaultBootstrap.links,
      {
        categoryId: "all",
        query: "",
        tags: [],
        favorites: new Set(),
        favoriteOnly: false,
      },
      "en",
    );

    expect(results.slice(0, 3).every((link) => link.isPinned)).toBe(true);
  });

  it("builds search URLs by replacing the query token", () => {
    const url = buildSearchUrl(defaultBootstrap.searchEngines[0], "赛博朋克 nav");
    expect(url).toBe("https://www.baidu.com/s?wd=%E8%B5%9B%E5%8D%9A%E6%9C%8B%E5%85%8B%20nav");
  });

  it("keeps ungrouped links visible when category has subcategories", () => {
    const category = {
      id: "my-sites",
      nameZh: "我的网站",
      nameEn: "My Sites",
      icon: "Globe2",
      color: "#00f5ff",
      sortOrder: 10,
      isActive: true,
    };
    const links = [
      {
        id: "blog",
        categoryId: "my-sites",
        title: "Blog",
        descriptionZh: "",
        descriptionEn: "",
        url: "https://example.com/blog",
        iconUrl: "",
        tags: ["我的网站", "博客"],
        isPinned: false,
        isFavorite: false,
        isActive: true,
        sortOrder: 10,
      },
      {
        id: "misc",
        categoryId: "my-sites",
        title: "Misc",
        descriptionZh: "",
        descriptionEn: "",
        url: "https://example.com/misc",
        iconUrl: "",
        tags: ["其他"],
        isPinned: false,
        isFavorite: false,
        isActive: true,
        sortOrder: 20,
      },
    ];

    expect(getLinkSubcategory(links[0], category)).toBe("博客");
    expect(getLinkSubcategory(links[1], category)).toBeNull();

    const groups = buildCategorySubcategories(category, links);
    const titles = groups.map((group) => group.title).sort();
    expect(titles).toEqual(["其他", "博客"]);
    expect(groups.find((group) => group.title === "其他")?.links.map((link) => link.id)).toEqual(["misc"]);
  });
  it("normalizes urls and rejects dangerous schemes", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
    expect(normalizeUrl("javascript:alert(1)")).toBe("");
    expect(normalizeUrl("data:text/html,hi")).toBe("");
  });
});
