import { describe, expect, it } from "vitest";
import { linkSchema } from "../src/worker/validation";

describe("link validation", () => {
  const base = {
    title: "Example",
    url: "https://example.com",
  };

  it("accepts empty, http(s), absolute path, and data image icon urls", () => {
    expect(linkSchema.parse({ ...base, iconUrl: "" }).iconUrl).toBe("");
    expect(linkSchema.parse({ ...base, iconUrl: "https://cdn.example.com/a.png" }).iconUrl).toBe("https://cdn.example.com/a.png");
    expect(linkSchema.parse({ ...base, iconUrl: "/icons/logo.svg" }).iconUrl).toBe("/icons/logo.svg");
    expect(linkSchema.parse({ ...base, iconUrl: "data:image/png;base64,abc" }).iconUrl).toBe("data:image/png;base64,abc");
  });

  it("rejects unsafe icon urls", () => {
    expect(() => linkSchema.parse({ ...base, iconUrl: "javascript:alert(1)" })).toThrow();
    expect(() => linkSchema.parse({ ...base, iconUrl: "ftp://example.com/a.png" })).toThrow();
  });
});
