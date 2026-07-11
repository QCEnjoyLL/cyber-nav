import type { BackgroundStyle } from "../types";

export const BACKGROUND_STYLE_IDS = [
  "classic-grid",
  "night-lanes",
  "circuit-terrace",
  "holo-map",
  "data-rain",
  "orange-core",
  "prism-shards",
  "lunar-dunes",
  "ink-current",
  "pixel-parade",
  "neon-alley",
  "paper-fold",
  "tidal-glass",
  "manga-stickers",
  "gummy-planet",
  "cat-cloud",
  "soda-pop",
  "star-doodle",
  "custom-image",
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
  {
    id: "prism-shards",
    nameZh: "棱镜碎片",
    nameEn: "Prism Shards",
    descriptionZh: "半透明多边形与折射光束组成的抽象晶体空间。",
    descriptionEn: "An abstract crystal field of translucent polygons and refracted light.",
    dark: "/background-options/06-prism-shards-dark.svg",
    light: "/background-options/06-prism-shards-light.svg",
  },
  {
    id: "lunar-dunes",
    nameZh: "月下沙丘",
    nameEn: "Lunar Dunes",
    descriptionZh: "安静的月色、层叠沙丘与细腻星空，适合低干扰阅读。",
    descriptionEn: "Quiet moonlight, layered dunes and a delicate sky for distraction-free reading.",
    dark: "/background-options/07-lunar-dunes-dark.svg",
    light: "/background-options/07-lunar-dunes-light.svg",
  },
  {
    id: "ink-current",
    nameZh: "墨色潮汐",
    nameEn: "Ink Current",
    descriptionZh: "东方水墨与流动波纹结合，形成留白充足的纸面氛围。",
    descriptionEn: "East Asian ink wash and flowing ripples with generous negative space.",
    dark: "/background-options/08-ink-current-dark.svg",
    light: "/background-options/08-ink-current-light.svg",
  },
  {
    id: "pixel-parade",
    nameZh: "像素派对",
    nameEn: "Pixel Parade",
    descriptionZh: "明快像素块、棋盘图形和游戏机色彩，活泼但不刺眼。",
    descriptionEn: "Playful pixel blocks, checker forms and arcade colors without harsh contrast.",
    dark: "/background-options/09-pixel-parade-dark.svg",
    light: "/background-options/09-pixel-parade-light.svg",
  },
  {
    id: "neon-alley",
    nameZh: "霓虹雨巷",
    nameEn: "Neon Alley",
    descriptionZh: "湿润街面倒影与竖向霓虹，像一条夜间小巷。",
    descriptionEn: "Wet-street reflections and vertical neon signs like a midnight alley.",
    dark: "/background-options/10-neon-alley-dark.svg",
    light: "/background-options/10-neon-alley-light.svg",
  },
  {
    id: "paper-fold",
    nameZh: "折纸台面",
    nameEn: "Paper Fold",
    descriptionZh: "柔和折纸几何与纹理纹，清爽但不单调。",
    descriptionEn: "Soft folded-paper geometry and grain for a clean, crafted desk look.",
    dark: "/background-options/11-paper-fold-dark.svg",
    light: "/background-options/11-paper-fold-light.svg",
  },
  {
    id: "tidal-glass",
    nameZh: "潮汐玻璃",
    nameEn: "Tidal Glass",
    descriptionZh: "半透明浪纹与冰渊色块，像潮汐裤过玻璃。",
    descriptionEn: "Translucent wave bands and abyss glass for a calm coastal feel.",
    dark: "/background-options/12-tidal-glass-dark.svg",
    light: "/background-options/12-tidal-glass-light.svg",
  },
  {
    id: "manga-stickers",
    nameZh: "贴纸手账",
    nameEn: "Manga Stickers",
    descriptionZh: "星星、心形和气泡贴纸，像一页漫画手账。",
    descriptionEn: "Stars, hearts and speech-bubble stickers like a manga scrapbook page.",
    dark: "/background-options/13-manga-stickers-dark.svg",
    light: "/background-options/13-manga-stickers-light.svg",
  },
  {
    id: "gummy-planet",
    nameZh: "软糖星球",
    nameEn: "Gummy Planet",
    descriptionZh: "圆润软糖星球与糖纹环，温馨又有点好玩。",
    descriptionEn: "Round gummy planets and candy rings for a cozy playful space.",
    dark: "/background-options/14-gummy-planet-dark.svg",
    light: "/background-options/14-gummy-planet-light.svg",
  },
  {
    id: "cat-cloud",
    nameZh: "猫咪云朵",
    nameEn: "Cat Cloud",
    descriptionZh: "软云、小耳朵和爬爬脚印，像漫画里的懒猫天空。",
    descriptionEn: "Soft clouds, tiny ears and paw prints like a lazy manga sky.",
    dark: "/background-options/15-cat-cloud-dark.svg",
    light: "/background-options/15-cat-cloud-light.svg",
  },
  {
    id: "soda-pop",
    nameZh: "汽水泡泡",
    nameEn: "Soda Pop",
    descriptionZh: "汽水泡泡、折线与小杯贴纸，清爽又活泼。",
    descriptionEn: "Fizzy bubbles, sparkles and cup stickers for a bright pop feel.",
    dark: "/background-options/16-soda-pop-dark.svg",
    light: "/background-options/16-soda-pop-light.svg",
  },
  {
    id: "star-doodle",
    nameZh: "星星涂鸦",
    nameEn: "Star Doodle",
    descriptionZh: "手绘星星、旋转糖果与虚线，像笔记本里的随手涂鸦。",
    descriptionEn: "Hand-drawn stars, swirls and dashed trails like notebook doodles.",
    dark: "/background-options/17-star-doodle-dark.svg",
    light: "/background-options/17-star-doodle-light.svg",
  },
  {
    id: "custom-image",
    nameZh: "自定义图片",
    nameEn: "Custom Image",
    descriptionZh: "使用后台填写的图片地址作为导航背景。",
    descriptionEn: "Use an image URL configured in the admin panel as the navigation background.",
    dark: "",
    light: "",
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
