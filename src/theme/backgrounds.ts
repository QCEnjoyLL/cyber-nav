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
    nameZh: "柔光线路",
    nameEn: "Soft Lines",
    descriptionZh: "低密度默认背景，保留霓虹线路和节点，不再使用密集小网格。",
    descriptionEn: "A low-density default backdrop with neon rails and nodes, without dense micro grids.",
    dark: "/background-options/00-soft-field-dark.svg",
    light: "/background-options/00-soft-field-light.svg",
  },
  {
    id: "night-lanes",
    nameZh: "夜城斜轨",
    nameEn: "Night Lanes",
    descriptionZh: "接近当前赛博气质，但层次和导轨更丰富。",
    descriptionEn: "Close to the current cyber mood, with richer rails and depth.",
    dark: "/background-options/01-night-lanes-dark.svg",
    light: "/background-options/01-night-lanes-light.svg",
  },
  {
    id: "circuit-terrace",
    nameZh: "高架电路",
    nameEn: "Circuit Terrace",
    descriptionZh: "中控线路感更强，秩序感高，适合密集导航。",
    descriptionEn: "A more structured control-panel circuit layout for dense navigation.",
    dark: "/background-options/02-circuit-terrace-dark.svg",
    light: "/background-options/02-circuit-terrace-light.svg",
  },
  {
    id: "holo-map",
    nameZh: "全息航图",
    nameEn: "Holo Map",
    descriptionZh: "地图和航线感更柔和，弱化网格的突兀感。",
    descriptionEn: "A softer holographic route-map feel with quieter grid contrast.",
    dark: "/background-options/03-holo-map-dark.svg",
    light: "/background-options/03-holo-map-light.svg",
  },
  {
    id: "data-rain",
    nameZh: "霓虹雨幕",
    nameEn: "Data Rain",
    descriptionZh: "纵向数据流配合横向导轨，科技感更明显。",
    descriptionEn: "Vertical data streams with horizontal rails for a stronger tech mood.",
    dark: "/background-options/04-data-rain-dark.svg",
    light: "/background-options/04-data-rain-light.svg",
  },
  {
    id: "orange-core",
    nameZh: "橙核矩阵",
    nameEn: "Orange Core",
    descriptionZh: "带有橙色品牌识别的清爽线路背景。",
    descriptionEn: "A cleaner circuit backdrop with orange brand accents.",
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
