import { describe, expect, it } from "vitest";
import { defaultBootstrap } from "../src/data/defaults";
import { buildSearchUrl, filterLinks } from "../src/utils/navigation";

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
});
