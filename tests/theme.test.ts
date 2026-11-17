import { describe, expect, it } from "vitest";
import { DEFAULT_BACKGROUND_STYLE, normalizeBackgroundStyle } from "../src/theme/backgrounds";
import { DEFAULT_THEME_PALETTE, getThemeColors, MAGPIE_ACCENT_PRESETS } from "../src/theme/palettes";

describe("magpie theme system", () => {
  it("uses magpie quiet surface defaults", () => {
    expect(DEFAULT_THEME_PALETTE).toBe("magpie");
    expect(DEFAULT_BACKGROUND_STYLE).toBe("clean-surface");
    expect(normalizeBackgroundStyle(undefined)).toBe("clean-surface");
    expect(normalizeBackgroundStyle("classic-grid")).toBe("classic-grid");
  });

  it("returns crisp magpie light and dark tokens", () => {
    const light = getThemeColors("light", "magpie");
    const dark = getThemeColors("dark", "magpie");

    expect(light.pageBg).toBe("#f4f4f6");
    expect(light.panelBg).toBe("#ffffff");
    expect(light.accent).toBe("#4f46e5");

    expect(dark.pageBg).toBe("#1a1a1e");
    expect(dark.panelBg).toBe("#232327");
    expect(dark.accent).toBe("#a5b4fc");
  });

  it("tints surfaces cleanly for magpie accent presets", () => {
    const tealPreset = MAGPIE_ACCENT_PRESETS.find((item) => item.value === "#0d9488");
    expect(tealPreset).toBeDefined();

    const lightTeal = getThemeColors("light", "magpie", "#0d9488");
    const darkTeal = getThemeColors("dark", "magpie", "#0d9488");

    expect(lightTeal.pageBg).not.toBe("#f4f4f6");
    expect(lightTeal.panelBg).toBe("#ffffff");
    expect(darkTeal.pageBg).not.toBe("#1a1a1e");
    expect(darkTeal.panelBg).not.toBe("#232327");
  });
});
