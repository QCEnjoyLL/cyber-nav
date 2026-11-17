import type { ResolvedThemeMode, ThemePalette } from "../types";

export interface ThemeColorSet {
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentFg: string;
  pageBg: string;
  panelBg: string;
  elevatedBg: string;
  sidebarBg: string;
  pillBg: string;
  pillHover: string;
  segTrack: string;
  segThumb: string;
  text: string;
  textSecondary: string;
  ctlFg: string;
  muted: string;
  faint: string;
  border: string;
  borderSoft: string;
  sel: string;
  mark: string;
  markFill: string;
  popBg: string;
}

export interface ThemePaletteDefinition {
  key: ThemePalette;
  label: string;
  swatch: string;
  featured?: boolean;
  tagline?: string;
  preview?: [string, string, string];
  light: ThemeColorSet;
  dark: ThemeColorSet;
}

export interface MagpieAccentPreset {
  value: string;
  labelZh: string;
  labelEn: string;
  swatch: string;
}

export const MAGPIE_ACCENT_PRESETS: MagpieAccentPreset[] = [
  { value: "", labelZh: "默认靛蓝", labelEn: "Default", swatch: "#4f46e5" },
  { value: "#2563eb", labelZh: "海蓝", labelEn: "Blue", swatch: "#2563eb" },
  { value: "#0d9488", labelZh: "青碧", labelEn: "Teal", swatch: "#0d9488" },
  { value: "#16a34a", labelZh: "森绿", labelEn: "Green", swatch: "#16a34a" },
  { value: "#ea580c", labelZh: "暖橙", labelEn: "Orange", swatch: "#ea580c" },
  { value: "#db2777", labelZh: "玫粉", labelEn: "Pink", swatch: "#db2777" },
  { value: "#52525b", labelZh: "石墨", labelEn: "Graphite", swatch: "#52525b" },
];

type Rgb = [number, number, number];

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];
const DARK_INK: Rgb = [0x14, 0x14, 0x1a];
const LIGHT_BG: Rgb = [0xf4, 0xf4, 0xf6];
const DARK_BG: Rgb = [0x1a, 0x1a, 0x1e];
const DARK_CARD: Rgb = [0x23, 0x23, 0x27];
const LIGHT_PICK: Rgb = [0xe9, 0xe9, 0xee];
const DARK_PICK: Rgb = [0x4c, 0x4c, 0x52];
const DARK_FILL: Rgb = [0x3a, 0x3a, 0x3f];
const DARK_POP: Rgb = [38, 38, 43];
const ACCENT_INK_CONTRAST = 4.5;
const LIGHT_TINT = 0.05;
const DARK_TINT = 0.08;
const DARK_LIGHT_THRESHOLD = 0.4;

export function parseHexColor(value: string): Rgb | null {
  const normalized = value.trim();
  if (!/^#[0-9a-f]{6}$/i.test(normalized)) return null;
  const numeric = Number.parseInt(normalized.slice(1), 16);
  return [(numeric >> 16) & 255, (numeric >> 8) & 255, numeric & 255];
}

function rgbToHex(c: Rgb): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${clamp(c[0]).toString(16).padStart(2, "0")}${clamp(c[1]).toString(16).padStart(2, "0")}${clamp(c[2]).toString(16).padStart(2, "0")}`;
}

function mixRgb(a: Rgb, b: Rgb, p: number): Rgb {
  return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
}

function luminance(c: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

function oklabLightness(c: Rgb): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = lin(c[0]);
  const g = lin(c[1]);
  const b = lin(c[2]);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

function tintSurface(base: Rgb, accent: Rgb, k: number): Rgb {
  const g = (accent[0] + accent[1] + accent[2]) / 3;
  return [
    Math.min(255, Math.max(0, base[0] + (accent[0] - g) * k)),
    Math.min(255, Math.max(0, base[1] + (accent[1] - g) * k)),
    Math.min(255, Math.max(0, base[2] + (accent[2] - g) * k)),
  ];
}

function colorDepth(c: Rgb, dark: boolean): number {
  const g = (c[0] + c[1] + c[2]) / 3;
  if (dark) {
    const ref = (DARK_BG[0] + DARK_BG[1] + DARK_BG[2]) / 3;
    return Math.max(0, ref - g) / ref;
  }
  const ref = (LIGHT_BG[0] + LIGHT_BG[1] + LIGHT_BG[2]) / 3;
  return Math.max(0, g - ref) / (255 - ref);
}

function colorDarkness(c: Rgb): number {
  return Math.max(0, DARK_LIGHT_THRESHOLD - oklabLightness(c)) / DARK_LIGHT_THRESHOLD;
}

function computeGround(base: Rgb, c: Rgb, dark: boolean): Rgb {
  if (!dark) {
    return tintSurface(base, c, LIGHT_TINT);
  }
  const d = colorDarkness(c);
  const mean = (base[0] + base[1] + base[2]) / 3;
  const tinted = tintSurface(mixRgb(base, [mean, mean, mean], d), c, DARK_TINT + d * 0.25);
  const step = (d * (DARK_BG[0] + DARK_BG[1] + DARK_BG[2])) / 3;
  return [
    Math.max(0, tinted[0] - step),
    Math.max(0, tinted[1] - step),
    Math.max(0, tinted[2] - step),
  ];
}

function liftedInk(c: Rgb, dark: boolean): Rgb {
  return dark ? mixRgb(c, WHITE, 0.88 * colorDepth(c, true)) : mixRgb(c, BLACK, 0.88 * colorDepth(c, false));
}

function inkOn(c: Rgb, toward: Rgb, against: Rgb[]): Rgb {
  const reads = (candidate: Rgb) => against.every((bg) => contrastRatio(candidate, bg) >= ACCENT_INK_CONTRAST);
  let out = c;
  for (let p = 0; p <= 1 && !reads(out); p += 0.02) {
    out = mixRgb(c, toward, p);
  }
  return out;
}

const MAGPIE_LIGHT_DEFAULT: ThemeColorSet = {
  accent: "#4f46e5",
  accentHover: "#4338ca",
  accentSoft: "#eeedfd",
  accentFg: "#ffffff",
  pageBg: "#f4f4f6",
  panelBg: "#ffffff",
  elevatedBg: "#f9f9fb",
  sidebarBg: "#f4f4f6",
  pillBg: "#f1f1f4",
  pillHover: "#e9e9ee",
  segTrack: "#e6e6eb",
  segThumb: "#ffffff",
  text: "#1c1c21",
  textSecondary: "#4b4b53",
  ctlFg: "#63636b",
  muted: "#85858d",
  faint: "#b9b9c2",
  border: "#e3e3e8",
  borderSoft: "#ececf0",
  sel: "#ecebfb",
  mark: "#1c1c21",
  markFill: "#ffffff",
  popBg: "rgba(255, 255, 255, 0.94)",
};

const MAGPIE_DARK_DEFAULT: ThemeColorSet = {
  accent: "#a5b4fc",
  accentHover: "#c7d2fe",
  accentSoft: "#2b2c47",
  accentFg: "#14142a",
  pageBg: "#1a1a1e",
  panelBg: "#232327",
  elevatedBg: "#1f1f23",
  sidebarBg: "#1a1a1e",
  pillBg: "#2d2d33",
  pillHover: "#36363d",
  segTrack: "rgba(255, 255, 255, 0.04)",
  segThumb: "rgba(255, 255, 255, 0.15)",
  text: "#ededf1",
  textSecondary: "#b9b9c1",
  ctlFg: "#a1a1aa",
  muted: "#8b8b94",
  faint: "#56565f",
  border: "#333339",
  borderSoft: "#2c2c32",
  sel: "#33345a",
  mark: "#ededf1",
  markFill: "rgba(255, 255, 255, 0.14)",
  popBg: "rgba(38, 38, 43, 0.96)",
};

export function getMagpieColors(mode: ResolvedThemeMode, accentHex: string): ThemeColorSet {
  const c = parseHexColor(accentHex);
  const dark = mode === "dark";
  if (!c) {
    return dark ? MAGPIE_DARK_DEFAULT : MAGPIE_LIGHT_DEFAULT;
  }

  if (!dark) {
    const bg = computeGround(LIGHT_BG, c, false);
    const card2 = computeGround([0xf9, 0xf9, 0xfb], c, false);
    const pill = computeGround([0xf1, 0xf1, 0xf4], c, false);
    const pillHover = computeGround(LIGHT_PICK, c, false);
    const segTrack = computeGround([0xe6, 0xe6, 0xeb], c, false);
    const line = computeGround([0xe3, 0xe3, 0xe8], c, false);
    const line2 = computeGround([0xec, 0xec, 0xf0], c, false);
    const a = inkOn(liftedInk(c, false), BLACK, [LIGHT_BG, bg]);
    const fg = contrastRatio(a, DARK_INK) > contrastRatio(a, WHITE) ? DARK_INK : WHITE;
    const soft = mixRgb(WHITE, a, 0.09);
    const sel = mixRgb(WHITE, a, 0.11);
    const fill = mixRgb(WHITE, a, 0.12);
    const mark = inkOn(liftedInk(c, false), BLACK, [LIGHT_PICK, pillHover, fill]);
    return {
      ...MAGPIE_LIGHT_DEFAULT,
      accent: rgbToHex(a),
      accentHover: rgbToHex(mixRgb(a, BLACK, 0.14)),
      accentSoft: rgbToHex(soft),
      accentFg: rgbToHex(fg),
      pageBg: rgbToHex(bg),
      sidebarBg: rgbToHex(bg),
      elevatedBg: rgbToHex(card2),
      pillBg: rgbToHex(pill),
      pillHover: rgbToHex(pillHover),
      segTrack: rgbToHex(segTrack),
      border: rgbToHex(line),
      borderSoft: rgbToHex(line2),
      sel: rgbToHex(sel),
      mark: rgbToHex(mark),
      markFill: rgbToHex(fill),
    };
  }

  const bg = computeGround(DARK_BG, c, true);
  const card = computeGround(DARK_CARD, c, true);
  const card2 = computeGround([0x1f, 0x1f, 0x23], c, true);
  const pill = computeGround([0x2d, 0x2d, 0x33], c, true);
  const pillHover = computeGround([0x36, 0x36, 0x3d], c, true);
  const line = computeGround([0x33, 0x33, 0x39], c, true);
  const line2 = computeGround([0x2c, 0x2c, 0x32], c, true);
  const pop = computeGround(DARK_POP, c, true);
  const a = inkOn(liftedInk(c, true), WHITE, [DARK_CARD, card, bg]);
  const fg = contrastRatio(a, DARK_INK) > contrastRatio(a, WHITE) ? DARK_INK : WHITE;
  const soft = mixRgb(bg, a, 0.14);
  const sel = mixRgb(bg, a, 0.2);
  const fill = mixRgb(computeGround(DARK_FILL, c, true), a, 0.26);
  const mark = inkOn(liftedInk(c, true), WHITE, [DARK_PICK, computeGround(DARK_PICK, c, true), fill]);
  return {
    ...MAGPIE_DARK_DEFAULT,
    accent: rgbToHex(a),
    accentHover: rgbToHex(mixRgb(a, WHITE, 0.18)),
    accentSoft: rgbToHex(soft),
    accentFg: rgbToHex(fg),
    pageBg: rgbToHex(bg),
    panelBg: rgbToHex(card),
    elevatedBg: rgbToHex(card2),
    sidebarBg: rgbToHex(bg),
    pillBg: rgbToHex(pill),
    pillHover: rgbToHex(pillHover),
    border: rgbToHex(line),
    borderSoft: rgbToHex(line2),
    sel: rgbToHex(sel),
    mark: rgbToHex(mark),
    markFill: rgbToHex(fill),
    popBg: `rgba(${Math.round(pop[0])}, ${Math.round(pop[1])}, ${Math.round(pop[2])}, 0.96)`,
  };
}

const makeLight = (accent: string, accentHover: string, accentSoft: string, overrides: Partial<ThemeColorSet> = {}): ThemeColorSet => {
  const pageBg = overrides.pageBg ?? "#f4f4f6";
  const panelBg = overrides.panelBg ?? "#ffffff";
  const elevatedBg = overrides.elevatedBg ?? "#f8f9fb";
  const sidebarBg = overrides.sidebarBg ?? pageBg;
  const text = overrides.text ?? "#1c1c21";
  const muted = overrides.muted ?? "#6c707d";
  const border = overrides.border ?? "#e1e3e8";
  const rgb = parseHexColor(accent);
  const accentFg = rgb && contrastRatio(rgb, DARK_INK) > contrastRatio(rgb, WHITE) ? "#14141a" : "#ffffff";
  return {
    accent,
    accentHover,
    accentSoft,
    accentFg,
    pageBg,
    panelBg,
    elevatedBg,
    sidebarBg,
    pillBg: overrides.pillBg ?? "rgba(28, 28, 33, 0.05)",
    pillHover: overrides.pillHover ?? "rgba(28, 28, 33, 0.09)",
    segTrack: overrides.segTrack ?? "rgba(28, 28, 33, 0.07)",
    segThumb: overrides.segThumb ?? panelBg,
    text,
    textSecondary: overrides.textSecondary ?? "#454852",
    ctlFg: overrides.ctlFg ?? "#585b66",
    muted,
    faint: overrides.faint ?? "#a1a5b2",
    border,
    borderSoft: overrides.borderSoft ?? border,
    sel: overrides.sel ?? accentSoft,
    mark: overrides.mark ?? text,
    markFill: overrides.markFill ?? panelBg,
    popBg: overrides.popBg ?? "rgba(255, 255, 255, 0.95)",
    ...overrides,
  };
};

const makeDark = (accent: string, accentHover: string, accentSoft: string, overrides: Partial<ThemeColorSet> = {}): ThemeColorSet => {
  const pageBg = overrides.pageBg ?? "#1a1a1e";
  const panelBg = overrides.panelBg ?? "#232327";
  const elevatedBg = overrides.elevatedBg ?? "#1f1f23";
  const sidebarBg = overrides.sidebarBg ?? pageBg;
  const text = overrides.text ?? "#ededf1";
  const muted = overrides.muted ?? "#9396a1";
  const border = overrides.border ?? "#333339";
  const rgb = parseHexColor(accent);
  const accentFg = rgb && contrastRatio(rgb, DARK_INK) > contrastRatio(rgb, WHITE) ? "#14141a" : "#ffffff";
  return {
    accent,
    accentHover,
    accentSoft,
    accentFg,
    pageBg,
    panelBg,
    elevatedBg,
    sidebarBg,
    pillBg: overrides.pillBg ?? "rgba(255, 255, 255, 0.07)",
    pillHover: overrides.pillHover ?? "rgba(255, 255, 255, 0.12)",
    segTrack: overrides.segTrack ?? "rgba(255, 255, 255, 0.04)",
    segThumb: overrides.segThumb ?? "rgba(255, 255, 255, 0.15)",
    text,
    textSecondary: overrides.textSecondary ?? "#c1c3cc",
    ctlFg: overrides.ctlFg ?? "#a6a8b2",
    muted,
    faint: overrides.faint ?? "#626570",
    border,
    borderSoft: overrides.borderSoft ?? border,
    sel: overrides.sel ?? accentSoft,
    mark: overrides.mark ?? text,
    markFill: overrides.markFill ?? "rgba(255, 255, 255, 0.14)",
    popBg: overrides.popBg ?? "rgba(34, 34, 40, 0.96)",
    ...overrides,
  };
};

const makePalette = (
  key: ThemePalette,
  label: string,
  swatch: string,
  lightAccent: string,
  lightHover: string,
  lightSoft: string,
  darkAccent: string,
  darkHover: string,
  darkSoft: string,
  lightOverrides: Partial<ThemeColorSet> = {},
  darkOverrides: Partial<ThemeColorSet> = {},
): ThemePaletteDefinition => ({
  key,
  label,
  swatch,
  light: makeLight(lightAccent, lightHover, lightSoft, lightOverrides),
  dark: makeDark(darkAccent, darkHover, darkSoft, darkOverrides),
});

const definitions: ThemePaletteDefinition[] = [
  {
    key: "magpie",
    label: "Magpie",
    swatch: "#4f46e5",
    featured: true,
    tagline: "素净平面、克制高对比、桌面级质感",
    preview: ["#e9ecf5", "#ffffff", "#4f46e5"],
    light: MAGPIE_LIGHT_DEFAULT,
    dark: MAGPIE_DARK_DEFAULT,
  },
  {
    ...makePalette("aurora", "极光玻璃", "#0f9f8d", "#0f9f8d", "#08776a", "rgba(15,159,141,.14)", "#78f7d4", "#a7fae2", "rgba(120,247,212,.18)", { pageBg: "#eff6f5", panelBg: "#ffffff", elevatedBg: "#e6f1ef", sidebarBg: "#eff6f5", text: "#102b2b", muted: "#567171", border: "#d2e3e0" }, { pageBg: "#0d1715", panelBg: "#13221e", elevatedBg: "#182c26", sidebarBg: "#0d1715", text: "#e9fff9", muted: "#91b9ae", border: "#26443d" }),
    featured: true,
    tagline: "清透薄荷青，柔和且清晰",
    preview: ["#0d1715", "#182c26", "#78f7d4"],
  },
  {
    ...makePalette("porcelain", "暖纸编辑", "#d9653b", "#b84a25", "#96391b", "rgba(184,74,37,.14)", "#ff9b73", "#ffc1a8", "rgba(255,155,115,.2)", { pageBg: "#f3eee5", panelBg: "#fffaf1", elevatedBg: "#ece4d8", sidebarBg: "#f3eee5", text: "#2e2924", muted: "#74695f", border: "#ded3c6" }, { pageBg: "#211d1a", panelBg: "#2a2420", elevatedBg: "#332c27", sidebarBg: "#211d1a", text: "#fff8ed", muted: "#c4b5a6", border: "#483e36" }),
    featured: true,
    tagline: "温暖纸感、克制、适合阅读",
    preview: ["#f3eee5", "#fffaf1", "#d9653b"],
  },
  {
    ...makePalette("cobalt", "深海工作台", "#4d7cff", "#315ee8", "#2447b8", "rgba(49,94,232,.14)", "#7fa0ff", "#a5bdff", "rgba(127,160,255,.2)", { pageBg: "#eef2fb", panelBg: "#ffffff", elevatedBg: "#e4eaf8", sidebarBg: "#eef2fb", text: "#111c3a", muted: "#596784", border: "#d3dcf0" }, { pageBg: "#111623", panelBg: "#182032", elevatedBg: "#1e283d", sidebarBg: "#111623", text: "#edf3ff", muted: "#8fa1c4", border: "#2b3957" }),
    featured: true,
    tagline: "高对比、模块化、冷色蓝调",
    preview: ["#111623", "#1e283d", "#7fa0ff"],
  },
  {
    ...makePalette("moss", "苔原自然", "#4f7b58", "#386242", "#2b4f34", "rgba(56,98,66,.14)", "#9bcf91", "#b7dea8", "rgba(155,207,145,.2)", { pageBg: "#f1f3eb", panelBg: "#fbfcef", elevatedBg: "#e8ecde", sidebarBg: "#f1f3eb", text: "#263329", muted: "#657064", border: "#d6dccb" }, { pageBg: "#151a16", panelBg: "#1d251e", elevatedBg: "#242e25", sidebarBg: "#151a16", text: "#f0f6e8", muted: "#a6b49f", border: "#354336" }),
    featured: true,
    tagline: "柔和自然、安静耐看",
    preview: ["#f1f3eb", "#fbfcef", "#4f7b58"],
  },
  {
    ...makePalette("ember", "暮火微光", "#d94848", "#c23b3b", "#9e2e2e", "rgba(217,72,72,.14)", "#ff8787", "#ffb087", "rgba(255,135,135,.2)", { pageBg: "#faf2ef", panelBg: "#fffaf8", elevatedBg: "#f4e6e1", sidebarBg: "#faf2ef", text: "#352020", muted: "#825d59", border: "#ead4ce" }, { pageBg: "#1c1417", panelBg: "#261c20", elevatedBg: "#2e2227", sidebarBg: "#1c1417", text: "#ffeae7", muted: "#c8a39f", border: "#443038" }),
    featured: true,
    tagline: "暖调微光、沉稳有氛围",
    preview: ["#1c1417", "#2e2227", "#ff8787"],
  },
  {
    ...makePalette("glacier", "冰原终端", "#1493c9", "#1493c9", "#0d6f9b", "rgba(20,147,201,.14)", "#63d8ff", "#9ce6ff", "rgba(99,216,255,.2)", { pageBg: "#eff6fb", panelBg: "#ffffff", elevatedBg: "#e3eff7", sidebarBg: "#eff6fb", text: "#123247", muted: "#567891", border: "#cde0ee" }, { pageBg: "#101820", panelBg: "#16212c", elevatedBg: "#1c2936", sidebarBg: "#101820", text: "#e8f7ff", muted: "#8eb3c9", border: "#283c4e" }),
    featured: true,
    tagline: "冷静清晰、高精度仪表盘感",
    preview: ["#101820", "#1c2936", "#63d8ff"],
  },
  {
    ...makePalette("noir", "紫夜影院", "#7d45d6", "#7d45d6", "#5f30ad", "rgba(125,69,214,.14)", "#c9a0ff", "#e0c5ff", "rgba(201,160,255,.2)", { pageBg: "#f4f1fa", panelBg: "#ffffff", elevatedBg: "#ebe5f6", sidebarBg: "#f4f1fa", text: "#2a2140", muted: "#6f6488", border: "#dcd3ec" }, { pageBg: "#17141f", panelBg: "#201b2b", elevatedBg: "#282136", sidebarBg: "#17141f", text: "#f3eaff", muted: "#b5a4d2", border: "#39304d" }),
    featured: true,
    tagline: "柔和暮紫、适合夜间沉浸使用",
    preview: ["#17141f", "#282136", "#c9a0ff"],
  },
  {
    ...makePalette("candy", "樱花糖霜", "#db2777", "#db2777", "#be185d", "rgba(219,39,119,.13)", "#f472b6", "#f9a8d4", "rgba(244,114,182,.2)", { pageBg: "#faf2f6", panelBg: "#ffffff", elevatedBg: "#f5e8ef", sidebarBg: "#faf2f6", text: "#3d2233", muted: "#8a6278", border: "#ecd4e1" }, { pageBg: "#1e161b", panelBg: "#281e24", elevatedBg: "#31242c", sidebarBg: "#1e161b", text: "#ffeef6", muted: "#cba3b8", border: "#473440" }),
    featured: true,
    tagline: "轻柔粉彩、洁净耐看",
    preview: ["#faf2f6", "#ffffff", "#db2777"],
  },
  makePalette("one", "One", "#61afef", "#4078f2", "#2864d8", "rgba(64,120,242,.13)", "#61afef", "#7ec7ff", "rgba(97,175,239,.2)", { pageBg: "#f5f6f8", sidebarBg: "#f5f6f8", text: "#24292f" }, { pageBg: "#22262e", panelBg: "#282c34", elevatedBg: "#2f343e", sidebarBg: "#22262e", text: "#d7dae0", muted: "#abb2bf", border: "#393f4b" }),
  makePalette("absolutely", "Absolutely", "#cc7d5e", "#b85f43", "#9c4c34", "rgba(184,95,67,.14)", "#d98d6e", "#e5a68c", "rgba(217,141,110,.22)", { pageBg: "#f5f1ec", sidebarBg: "#f5f1ec", panelBg: "#fffaf5", elevatedBg: "#f2eae1", border: "#dfd3c9", text: "#2d2926" }, { pageBg: "#262523", panelBg: "#2f2e2b", elevatedBg: "#373632", sidebarBg: "#262523", text: "#f9f9f7", border: "#46443f" }),
  makePalette("ayu", "Ayu", "#ffb454", "#c46f00", "#9f5a00", "rgba(196,111,0,.14)", "#ffb454", "#ffd580", "rgba(255,180,84,.18)", { pageBg: "#f8f5ee", sidebarBg: "#f8f5ee", panelBg: "#fffdf9", text: "#1f2933" }, { pageBg: "#141821", panelBg: "#1b202b", elevatedBg: "#222836", sidebarBg: "#141821", text: "#e6e1cf", muted: "#9da8b8", border: "#2c3443" }),
  makePalette("catppuccin", "Catppuccin", "#cba6f7", "#8839ef", "#6c2bd9", "rgba(136,57,239,.13)", "#cba6f7", "#ddb6ff", "rgba(203,166,247,.18)", { pageBg: "#eff1f5", sidebarBg: "#eff1f5", text: "#4c4f69", muted: "#6c6f85" }, { pageBg: "#1e1e2e", panelBg: "#262638", elevatedBg: "#2d2d42", sidebarBg: "#1e1e2e", text: "#cdd6f4", muted: "#a6adc8", border: "#393a50" }),
  makePalette("codex", "Codex", "#0169cc", "#0b6bcb", "#0759ad", "rgba(11,107,203,.12)", "#4da3ff", "#7abaff", "rgba(77,163,255,.2)", { pageBg: "#f6f7f9", sidebarBg: "#f6f7f9", text: "#17202a" }, { pageBg: "#141920", panelBg: "#1b212a", elevatedBg: "#222934", sidebarBg: "#141920" }),
  makePalette("dracula", "Dracula", "#bd93f9", "#7c3aed", "#6d28d9", "rgba(124,58,237,.13)", "#bd93f9", "#d6acff", "rgba(189,147,249,.2)", { pageBg: "#f6f5fc", sidebarBg: "#f6f5fc", text: "#282a36" }, { pageBg: "#232530", panelBg: "#2a2c3a", elevatedBg: "#323546", sidebarBg: "#232530", text: "#f8f8f2", muted: "#c7c4d8", border: "#404356" }),
  makePalette("everforest", "Everforest", "#a7c080", "#6c8f43", "#557136", "rgba(108,143,67,.14)", "#a7c080", "#b9d18f", "rgba(167,192,128,.18)", { pageBg: "#f4f0d9", sidebarBg: "#f4f0d9", panelBg: "#fffdf0", text: "#3c4841", border: "#ded6b8" }, { pageBg: "#293136", panelBg: "#313a40", elevatedBg: "#39434a", sidebarBg: "#293136", text: "#d3c6aa", muted: "#a7ad9a", border: "#495359" }),
  makePalette("github", "GitHub", "#1f6feb", "#0969da", "#0756b6", "rgba(9,105,218,.12)", "#58a6ff", "#79b8ff", "rgba(88,166,255,.2)", { pageBg: "#f6f8fa", sidebarBg: "#f6f8fa", border: "#d0d7de" }, { pageBg: "#0d1117", panelBg: "#161b22", elevatedBg: "#1f242c", sidebarBg: "#0d1117", border: "#30363d" }),
  makePalette("gruvbox", "Gruvbox", "#fabd2f", "#af6f00", "#8f5900", "rgba(175,111,0,.15)", "#fabd2f", "#ffd75f", "rgba(250,189,47,.18)", { pageBg: "#fbf1c7", sidebarBg: "#fbf1c7", panelBg: "#fff8db", text: "#3c3836", border: "#dfd0ad" }, { pageBg: "#252525", panelBg: "#2f2e2c", elevatedBg: "#383633", sidebarBg: "#252525", text: "#ebdbb2", muted: "#bdae93", border: "#494440" }),
  makePalette("linear", "Linear", "#5e6ad2", "#5e6ad2", "#4f5bbc", "rgba(94,106,210,.13)", "#828df8", "#a2abfb", "rgba(130,141,248,.2)", { pageBg: "#f7f7f8", sidebarBg: "#f7f7f8", text: "#1f2023" }, { pageBg: "#141518", panelBg: "#1c1d22", elevatedBg: "#23252b", sidebarBg: "#141518", text: "#f7f8f8", muted: "#a6a8ad", border: "#2c2e36" }),
  makePalette("lobster", "Lobster", "#e5534b", "#c23a2f", "#9f2f27", "rgba(194,58,47,.14)", "#ff7a70", "#ff9a92", "rgba(255,122,112,.2)", { pageBg: "#faf3f1", sidebarBg: "#faf3f1", panelBg: "#fffbfa", text: "#35211f", border: "#ead4cf" }, { pageBg: "#251c1f", panelBg: "#2e2226", elevatedBg: "#37282d", sidebarBg: "#251c1f", text: "#ffece7", muted: "#d8b7b0", border: "#4f383f" }),
  makePalette("material", "Material", "#80cbc4", "#1976d2", "#115293", "rgba(25,118,210,.13)", "#80cbc4", "#a7ffeb", "rgba(128,203,196,.2)", { pageBg: "#f5f7fa", sidebarBg: "#f5f7fa", text: "#263238" }, { pageBg: "#212b30", panelBg: "#29353c", elevatedBg: "#313f47", sidebarBg: "#212b30", text: "#eeffff", muted: "#b0bec5", border: "#3f4f58" }),
  makePalette("matrix", "Matrix", "#00d26a", "#0f8f4a", "#0b6f39", "rgba(15,143,74,.14)", "#4ade80", "#86efac", "rgba(74,222,128,.18)", { pageBg: "#f2faf5", sidebarBg: "#f2faf5", text: "#14351f", border: "#cde6d6" }, { pageBg: "#121d16", panelBg: "#18261d", elevatedBg: "#1e3024", sidebarBg: "#121d16", text: "#d7ffe4", muted: "#8fbc9a", border: "#2b4433" }),
  makePalette("monokai", "Monokai", "#a6e22e", "#6f8f00", "#536d00", "rgba(111,143,0,.16)", "#b5e853", "#ccff75", "rgba(181,232,83,.18)", { pageBg: "#f7f4ea", sidebarBg: "#f7f4ea", panelBg: "#fffdf5", text: "#272822", border: "#e2dac7" }, { pageBg: "#23241f", panelBg: "#2c2d26", elevatedBg: "#34362d", sidebarBg: "#23241f", text: "#f8f8f2", muted: "#cfcfc2", border: "#45463c" }),
  makePalette("night-owl", "Night Owl", "#82aaff", "#3268d8", "#2450ad", "rgba(50,104,216,.14)", "#82aaff", "#b4ccff", "rgba(130,170,255,.2)", { pageBg: "#eff5fc", sidebarBg: "#eff5fc", text: "#16243d", border: "#d1def0" }, { pageBg: "#101827", panelBg: "#162135", elevatedBg: "#1b2840", sidebarBg: "#101827", text: "#d6deeb", muted: "#8fa6c9", border: "#283956" }),
  makePalette("nord", "Nord", "#88c0d0", "#4c7a92", "#3b6479", "rgba(76,122,146,.14)", "#88c0d0", "#a3d7e6", "rgba(136,192,208,.2)", { pageBg: "#eceff4", sidebarBg: "#eceff4", text: "#2e3440", border: "#d8dee9" }, { pageBg: "#282e39", panelBg: "#303744", elevatedBg: "#38404f", sidebarBg: "#282e39", text: "#eceff4", muted: "#b7c0d0", border: "#465063" }),
  makePalette("notion", "Notion", "#2f3437", "#2f3437", "#1f2326", "rgba(47,52,55,.12)", "#e9e5dc", "#ffffff", "rgba(233,229,220,.16)", { pageBg: "#f7f6f3", sidebarBg: "#f7f6f3", panelBg: "#ffffff", elevatedBg: "#f2f0eb", text: "#2f3437", border: "#e3dfd8" }, { pageBg: "#191919", panelBg: "#222222", elevatedBg: "#2a2a2a", sidebarBg: "#191919", text: "#f1f1ef", muted: "#aaa7a2", border: "#353535" }),
  makePalette("oscurance", "Oscurance", "#9f8cff", "#7357d8", "#5b43b0", "rgba(115,87,216,.14)", "#b4a7ff", "#d2caff", "rgba(180,167,255,.2)", { pageBg: "#f5f3fc", sidebarBg: "#f5f3fc", text: "#27213f", border: "#ddd6f4" }, { pageBg: "#1a1929", panelBg: "#222136", elevatedBg: "#2a2842", sidebarBg: "#1a1929", text: "#efeaff", muted: "#b9b0d7", border: "#393657" }),
  makePalette("raycast", "Raycast", "#ff6363", "#e5484d", "#c7353b", "rgba(229,72,77,.14)", "#ff7878", "#ff9b9b", "rgba(255,120,120,.2)", { pageBg: "#faf3f3", sidebarBg: "#faf3f3", text: "#311c1f", border: "#eed2d2" }, { pageBg: "#1e1718", panelBg: "#281e1f", elevatedBg: "#312426", sidebarBg: "#1e1718", text: "#fff1f1", muted: "#d7adad", border: "#4a3335" }),
  makePalette("rose-pine", "Rose Pine", "#eb6f92", "#d7827e", "#b4637a", "rgba(215,130,126,.15)", "#eb6f92", "#f6a1b6", "rgba(235,111,146,.2)", { pageBg: "#faf4ed", sidebarBg: "#faf4ed", panelBg: "#fffaf6", text: "#575279", border: "#e6dfd9" }, { pageBg: "#191724", panelBg: "#211e30", elevatedBg: "#28243a", sidebarBg: "#191724", text: "#e0def4", muted: "#908caa", border: "#3d3a50" }),
  makePalette("sentry", "Sentry", "#6c5fc7", "#5f4bb6", "#4c3b91", "rgba(95,75,182,.14)", "#c59cff", "#d8baff", "rgba(197,156,255,.2)", { pageBg: "#f7f4fc", sidebarBg: "#f7f4fc", text: "#30263f", border: "#e0d6ef" }, { pageBg: "#201929", panelBg: "#282034", elevatedBg: "#312740", sidebarBg: "#201929", text: "#f5edff", muted: "#c1acd7", border: "#453759" }),
  makePalette("solarized", "Solarized", "#268bd2", "#268bd2", "#1f6f9f", "rgba(38,139,210,.14)", "#4ec5bc", "#79dcd4", "rgba(78,197,188,.2)", { pageBg: "#fdf6e3", sidebarBg: "#fdf6e3", panelBg: "#fffbf0", text: "#586e75", border: "#e4dcc0" }, { pageBg: "#07303a", panelBg: "#0d3b47", elevatedBg: "#144754", sidebarBg: "#07303a", text: "#eee8d5", muted: "#93a1a1", border: "#2a5762" }),
  makePalette("temple", "Temple", "#d49b34", "#a66c1f", "#805218", "rgba(166,108,31,.15)", "#f6c177", "#ffd59a", "rgba(246,193,119,.2)", { pageBg: "#f7f1df", sidebarBg: "#f7f1df", panelBg: "#fffaf0", text: "#342d21", border: "#e1d3b4" }, { pageBg: "#221e19", panelBg: "#2b261e", elevatedBg: "#342e24", sidebarBg: "#221e19", text: "#f6ead0", muted: "#c7b48e", border: "#4c412e" }),
  makePalette("tokyo-night", "Tokyo Night", "#7aa2f7", "#3d68d8", "#2d50aa", "rgba(61,104,216,.14)", "#7aa2f7", "#9ab8ff", "rgba(122,162,247,.2)", { pageBg: "#f1f5fc", sidebarBg: "#f1f5fc", text: "#1f2335", border: "#d3dcf0" }, { pageBg: "#1a1b26", panelBg: "#222433", elevatedBg: "#292c3e", sidebarBg: "#1a1b26", text: "#c0caf5", muted: "#9aa5ce", border: "#373d58" }),
  makePalette("vercel", "Vercel", "#111827", "#111827", "#0f172a", "rgba(17,24,39,.12)", "#f5f5f5", "#ffffff", "rgba(245,245,245,.14)", { pageBg: "#fafafa", sidebarBg: "#fafafa", text: "#111827", border: "#e3e3e3" }, { pageBg: "#161616", panelBg: "#1f1f1f", elevatedBg: "#272727", sidebarBg: "#161616", text: "#f5f5f5", muted: "#a3a3a3", border: "#373737" }),
  makePalette("vs-code-plus", "VS Code Plus", "#007acc", "#007acc", "#0067ad", "rgba(0,122,204,.13)", "#4db2ff", "#7ac6ff", "rgba(77,178,255,.22)", { pageBg: "#f3f3f3", sidebarBg: "#f3f3f3", text: "#1f1f1f", border: "#dcdcdc" }, { pageBg: "#1e1e1e", panelBg: "#252526", elevatedBg: "#2d2d30", sidebarBg: "#1e1e1e", text: "#d4d4d4", muted: "#a7a7a7", border: "#3c3c3c" }),
  makePalette("xcode", "Xcode", "#007aff", "#007aff", "#005ecb", "rgba(0,122,255,.13)", "#4da3ff", "#7ebdff", "rgba(77,163,255,.22)", { pageBg: "#f5f7fa", sidebarBg: "#f5f7fa", text: "#1d1d1f", border: "#dce2ea" }, { pageBg: "#21242d", panelBg: "#292d38", elevatedBg: "#313644", sidebarBg: "#21242d", text: "#f2f2f7", muted: "#b9c2d0", border: "#41485b" }),
];

export const DEFAULT_THEME_PALETTE: ThemePalette = "magpie";
export const THEME_PALETTES: ThemePaletteDefinition[] = [
  ...definitions.filter((item) => item.featured),
  ...definitions.filter((item) => !item.featured).sort((a, b) => a.key.localeCompare(b.key)),
];

export function getPaletteDefinition(palette: ThemePalette): ThemePaletteDefinition {
  return THEME_PALETTES.find((item) => item.key === palette) ?? THEME_PALETTES.find((item) => item.key === DEFAULT_THEME_PALETTE) ?? THEME_PALETTES[0];
}

export function getThemeColors(mode: ResolvedThemeMode, palette: ThemePalette, magpieAccent = ""): ThemeColorSet {
  if (palette === "magpie") {
    return getMagpieColors(mode, magpieAccent);
  }
  return getPaletteDefinition(palette)[mode];
}

export function isThemePalette(value: string): value is ThemePalette {
  return THEME_PALETTES.some((item) => item.key === value);
}
