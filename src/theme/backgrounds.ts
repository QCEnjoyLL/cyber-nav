import type { BackgroundStyle } from "../types";

export const BACKGROUND_STYLE_IDS = [
  "classic-grid",
  "night-lanes",
  "circuit-terrace",
  "holo-map",
  "data-rain",
  "orange-core",
] as const;

export type BackgroundStyleId = (typeof BACKGROUND_STYLE_IDS)[number];

export type BackgroundDefinition = {
  id: BackgroundStyleId;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  descriptionEn: string;
  dark: string;
  light: string;
};

export const DEFAULT_BACKGROUND_STYLE: BackgroundStyleId = "classic-grid";

export const BACKGROUND_STYLES: BackgroundDefinition[] = [
  {
    id: "classic-grid",
    nameZh: "极光云幕",
    nameEn: "Aurora Veil",
    descriptionZh: "大面积流体极光与柔焦光晕，几乎没有线路元素。",
    descriptionEn: "Fluid aurora ribbons and soft-focus bloom with almost no circuit lines.",
    dark: "/background-options/00-soft-field-dark.svg",
    light: "/background-options/00-soft-field-light.svg",
  },
  {
    id: "night-lanes",
    nameZh: "星港地平线",
    nameEn: "Starport Horizon",
    descriptionZh: "深空星点、远方地平线与透视跑道，空间纵深更强。",
    descriptionEn: "A deep starfield, distant horizon and perspective runway with strong depth.",
    dark: "/background-options/01-night-lanes-dark.svg",
    light: "/background-options/01-night-lanes-light.svg",
  },
  {
    id: "circuit-terrace",
    nameZh: "立体方舱",
    nameEn: "Isometric Vault",
    descriptionZh: "低多边形方舱和等距立方体，呈现模块化建筑空间。",
    descriptionEn: "Low-poly chambers and isometric cubes forming a modular architectural field.",
    dark: "/background-options/02-circuit-terrace-dark.svg",
    light: "/background-options/02-circuit-terrace-light.svg",
  },
  {
    id: "holo-map",
    nameZh: "轨道星仪",
    nameEn: "Orbital Atlas",
    descriptionZh: "行星、轨道与星图标记组成的天文仪器界面。",
    descriptionEn: "Planets, orbital rings and celestial markings arranged like an astronomy instrument.",
    dark: "/background-options/03-holo-map-dark.svg",
    light: "/background-options/03-holo-map-light.svg",
  },
  {
    id: "data-rain",
    nameZh: "数字深林",
    nameEn: "Digital Grove",
    descriptionZh: "数据字符像树林和雨幕一样从远处浮现，氛围更沉浸。",
    descriptionEn: "Columns of data emerge like a forest in rain for a more immersive atmosphere.",
    dark: "/background-options/04-data-rain-dark.svg",
    light: "/background-options/04-data-rain-light.svg",
  },
  {
    id: "orange-core",
    nameZh: "落日唱片",
    nameEn: "Sunset Vinyl",
    descriptionZh: "复古落日、唱片圆环与粗颗粒色块，完全跳出赛博线路构图。",
    descriptionEn: "A retro sunset, vinyl rings and grainy color blocks that leave circuit imagery behind.",
    dark: "/background-options/05-orange-core-dark.svg",
    light: "/background-options/05-orange-core-light.svg",
  },
];

export function isBackgroundStyle(value: string): value is BackgroundStyleId {
  return BACKGROUND_STYLE_IDS.includes(value as BackgroundStyleId);
}

export function normalizeBackgroundStyle(value: BackgroundStyle | string | undefined): BackgroundStyleId {
  return value && isBackgroundStyle(value) ? value : DEFAULT_BACKGROUND_STYLE;
}

export function getBackgroundDefinition(value: BackgroundStyle | string | undefined): BackgroundDefinition {
  const id = normalizeBackgroundStyle(value);
  return BACKGROUND_STYLES.find((style) => style.id === id) ?? BACKGROUND_STYLES[0];
}
