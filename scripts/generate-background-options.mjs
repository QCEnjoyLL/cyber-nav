import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "public", "background-options");
mkdirSync(outDir, { recursive: true });

const size = { width: 1600, height: 1000 };

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const line = (points, color, width = 2, opacity = 1, extra = "") =>
  `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="square" stroke-linejoin="miter" opacity="${opacity}" ${extra}/>`;

const path = (d, color, width = 2, opacity = 1, extra = "") =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="square" stroke-linejoin="miter" opacity="${opacity}" ${extra}/>`;

const dot = (cx, cy, r, fill, opacity = 1) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;

const node = (x, y, fill, stroke, opacity = 1) => `
  <rect x="${x - 9}" y="${y - 9}" width="18" height="18" rx="3" fill="${fill}" opacity="${opacity * 0.42}"/>
  <rect x="${x - 4}" y="${y - 4}" width="8" height="8" rx="1" fill="${stroke}" opacity="${opacity}"/>
`;

const baseDefs = ({ id, major, minor, glow, scan, texture }) => `
  <defs>
    <pattern id="${id}-field" width="320" height="240" patternUnits="userSpaceOnUse">
      <path d="M 320 0 L 0 0 0 240" fill="none" stroke="${major}" stroke-width="1.2" opacity="0.18"/>
      <path d="M 160 0 V240 M 0 120 H320" fill="none" stroke="${minor}" stroke-width="0.8" opacity="0.08"/>
    </pattern>
    <pattern id="${id}-scan" width="1" height="42" patternUnits="userSpaceOnUse">
      <rect y="0" width="1" height="1" fill="${scan}" opacity="0.08"/>
    </pattern>
    <filter id="${id}-glow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="3.2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="${id}-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .55 0" result="soft"/>
      <feMerge>
        <feMergeNode in="soft"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="${id}-edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${glow[0]}" stop-opacity="0.34"/>
      <stop offset="0.52" stop-color="${glow[1]}" stop-opacity="0"/>
      <stop offset="1" stop-color="${glow[2]}" stop-opacity="0.28"/>
    </linearGradient>
    <filter id="${id}-grain">
      <feTurbulence type="fractalNoise" baseFrequency="${texture}" numOctaves="2" seed="7"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.08"/>
      </feComponentTransfer>
    </filter>
  </defs>
`;

const option0 = (mode) => {
  const p = palette[mode];
  const id = `soft-field-${mode}`;
  return wrap({
    id,
    title: "00 柔光线路",
    mode,
    bg: mode === "dark" ? "#080b12" : "#f1f8f7",
    defs: baseDefs({ id, ...p }),
    body: `
      <rect width="1600" height="1000" fill="url(#${id}-edge)" opacity="${mode === "dark" ? 0.72 : 0.56}"/>
      <rect width="1600" height="1000" fill="url(#${id}-field)" opacity="${mode === "dark" ? 0.36 : 0.28}"/>
      <g filter="url(#${id}-soft-glow)" opacity="${mode === "dark" ? 0.82 : 0.58}">
        ${path("M92 238 H384 L438 292 H646 L708 354 H1030 L1092 416 H1478", p.cyan, 2.2, 0.58)}
        ${path("M146 806 H426 L492 744 H682 L742 682 H1034 L1112 606 H1450", p.yellow, 2.4, 0.62)}
        ${path("M956 126 V278 L1018 340 V532 L1082 594 V842", p.magenta, 2, 0.5)}
      </g>
      <g opacity="${mode === "dark" ? 0.55 : 0.38}">
        ${node(438, 292, p.panel, p.cyan)}
        ${node(742, 682, p.panel, p.yellow)}
        ${node(1018, 340, p.panel, p.magenta)}
        ${dot(1092, 416, 4, p.cyan, 0.76)}
        ${dot(1112, 606, 4, p.yellow, 0.72)}
      </g>
      <rect width="1600" height="1000" filter="url(#${id}-grain)" opacity="0.58"/>
    `,
  });
};

const wrap = ({ title, mode, bg, defs, body }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" role="img" aria-label="${esc(title)} ${mode} background">
  ${defs}
  <rect width="1600" height="1000" fill="${bg}"/>
  ${body}
</svg>
`;

const palette = {
  dark: {
    bg: "#070a12",
    panel: "rgba(5, 10, 18, .68)",
    major: "#00e7ff",
    minor: "#0c5164",
    cyan: "#00f5ff",
    yellow: "#fcee0a",
    magenta: "#ff3b8d",
    orange: "#ff9f1c",
    red: "#ff3456",
    blue: "#4256ff",
    scan: "#ffffff",
    glow: ["#00f5ff", "#111827", "#ff3b8d"],
    texture: "0.86",
  },
  light: {
    bg: "#eef7f8",
    panel: "rgba(255, 255, 255, .56)",
    major: "#69aab8",
    minor: "#d1e4e8",
    cyan: "#00a6c8",
    yellow: "#dfb900",
    magenta: "#d73b78",
    orange: "#f97316",
    red: "#d72f4f",
    blue: "#4763d5",
    scan: "#315766",
    glow: ["#00a6c8", "#f8fafc", "#d73b78"],
    texture: "0.9",
  },
};

const option1 = (mode) => {
  const p = palette[mode];
  const id = `night-lanes-${mode}`;
  return wrap({
    id,
    title: "01 夜城斜轨",
    mode,
    bg: p.bg,
    defs: baseDefs({ id, ...p }),
    body: `
      <rect width="1600" height="1000" fill="url(#${id}-edge)"/>
      <rect width="1600" height="1000" fill="url(#${id}-field)" opacity="${mode === "dark" ? 0.42 : 0.32}"/>
      <rect width="1600" height="1000" fill="url(#${id}-scan)" opacity="${mode === "dark" ? 0.12 : 0.08}"/>
      <g filter="url(#${id}-soft-glow)" opacity="${mode === "dark" ? 0.96 : 0.7}">
        ${line("-140,832 612,704 746,716 1190,608 1760,492", p.yellow, 3.8, 0.72)}
        ${line("1088,904 1608,632 1750,602", p.magenta, 3, 0.66)}
        ${line("-72,360 270,252 728,112", p.cyan, 2.6, 0.58)}
      </g>
      <g opacity="${mode === "dark" ? 0.75 : 0.55}">
        <path d="M112 860 h290 l38 -28 h236" fill="none" stroke="${p.cyan}" stroke-width="1.6" stroke-dasharray="18 12"/>
        <path d="M962 170 h210 l52 48 h276" fill="none" stroke="${p.magenta}" stroke-width="1.5" stroke-dasharray="16 12"/>
        ${node(1120, 560, p.panel, p.cyan, 0.95)}
        ${dot(1038, 634, 4, p.yellow, 0.8)}
        ${dot(1264, 226, 5, p.magenta, 0.72)}
      </g>
      <rect width="1600" height="1000" filter="url(#${id}-grain)" opacity="0.85"/>
    `,
  });
};

const option2 = (mode) => {
  const p = palette[mode];
  const id = `circuit-terrace-${mode}`;
  return wrap({
    id,
    title: "02 高架电路",
    mode,
    bg: p.bg,
    defs: baseDefs({ id, ...p }),
    body: `
      <rect width="1600" height="1000" fill="url(#${id}-field)" opacity="${mode === "dark" ? 0.28 : 0.22}"/>
      <rect x="78" y="74" width="1444" height="852" fill="none" stroke="${p.major}" stroke-width="1.2" opacity="${mode === "dark" ? 0.32 : 0.2}"/>
      <g filter="url(#${id}-glow)">
        ${path("M88 286 H314 V196 H536 V150 H844 V216 H1032 V154 H1472", p.cyan, 2.4, 0.62)}
        ${path("M118 742 H346 V650 H590 V708 H836 V604 H1090 V662 H1488", p.yellow, 2.8, 0.68)}
        ${path("M1034 910 V790 H1170 V524 H1328 V326 H1490", p.magenta, 2.2, 0.66)}
        ${path("M170 908 V814 H246 V516 H420 V396 H702 V304", p.blue, 1.8, 0.58)}
      </g>
      <g opacity="${mode === "dark" ? 0.82 : 0.62}">
        ${node(314, 286, p.panel, p.cyan)}
        ${node(590, 708, p.panel, p.yellow)}
        ${node(1032, 216, p.panel, p.magenta)}
        ${node(1170, 790, p.panel, p.cyan)}
        ${node(420, 396, p.panel, p.blue)}
        ${dot(844, 150, 5, p.yellow, 0.78)}
        ${dot(1328, 326, 5, p.magenta, 0.74)}
      </g>
      <g opacity="${mode === "dark" ? 0.28 : 0.16}">
        <rect x="660" y="404" width="276" height="126" fill="none" stroke="${p.cyan}" stroke-width="1"/>
        <rect x="702" y="446" width="192" height="42" fill="none" stroke="${p.yellow}" stroke-width="1"/>
        <path d="M660 530 l-70 72 M936 404 l94 -78 M936 530 l126 88" stroke="${p.magenta}" stroke-width="1" fill="none"/>
      </g>
      <rect width="1600" height="1000" fill="url(#${id}-scan)" opacity="${mode === "dark" ? 0.08 : 0.05}"/>
      <rect width="1600" height="1000" filter="url(#${id}-grain)" opacity="0.72"/>
    `,
  });
};

const option3 = (mode) => {
  const p = palette[mode];
  const id = `holo-map-${mode}`;
  return wrap({
    id,
    title: "03 全息航图",
    mode,
    bg: p.bg,
    defs: baseDefs({ id, ...p }),
    body: `
      <rect width="1600" height="1000" fill="url(#${id}-edge)"/>
      <rect width="1600" height="1000" fill="url(#${id}-field)" opacity="${mode === "dark" ? 0.24 : 0.18}"/>
      <g filter="url(#${id}-glow)" opacity="${mode === "dark" ? 0.82 : 0.62}">
        ${path("M-40 604 C130 540 226 652 378 580 S690 470 832 538 1124 678 1314 540 1580 468 1680 534", p.cyan, 2.1, 0.56)}
        ${path("M-20 674 C142 620 246 720 396 646 S714 548 868 620 1120 760 1328 614 1588 550 1690 620", p.cyan, 1.3, 0.38)}
        ${path("M72 314 C252 222 398 330 572 256 S922 160 1120 252 1378 360 1540 282", p.yellow, 1.9, 0.56)}
        ${path("M120 392 C302 318 450 420 620 338 S950 258 1138 332 1378 438 1510 364", p.magenta, 1.55, 0.46)}
      </g>
      <g opacity="${mode === "dark" ? 0.7 : 0.5}">
        <path d="M238 720 l146 -94 224 60 184 -118 232 68 224 -138 208 42" fill="none" stroke="${p.yellow}" stroke-width="1.4" stroke-dasharray="8 16"/>
        <path d="M280 220 l180 116 202 -64 238 128 262 -156 228 96" fill="none" stroke="${p.cyan}" stroke-width="1.2" stroke-dasharray="10 12"/>
        ${node(608, 686, p.panel, p.yellow)}
        ${node(1024, 636, p.panel, p.magenta)}
        ${node(1162, 244, p.panel, p.cyan)}
        ${dot(792, 568, 4, p.cyan, 0.88)}
      </g>
      <g opacity="${mode === "dark" ? 0.25 : 0.16}">
        <rect x="96" y="96" width="392" height="202" fill="none" stroke="${p.cyan}" stroke-width="1"/>
        <rect x="1112" y="704" width="352" height="174" fill="none" stroke="${p.yellow}" stroke-width="1"/>
        <path d="M96 298 l-34 34 M488 96 l34 -34 M1112 704 l-42 -42 M1464 878 l44 44" stroke="${p.magenta}" fill="none"/>
      </g>
      <rect width="1600" height="1000" fill="url(#${id}-scan)" opacity="${mode === "dark" ? 0.08 : 0.05}"/>
      <rect width="1600" height="1000" filter="url(#${id}-grain)" opacity="0.64"/>
    `,
  });
};

const option4 = (mode) => {
  const p = palette[mode];
  const id = `data-rain-${mode}`;
  const rain = Array.from({ length: 44 }, (_, index) => {
    const x = 42 + index * 37;
    const y = 28 + ((index * 73) % 760);
    const h = 96 + ((index * 31) % 220);
    const color = index % 5 === 0 ? p.yellow : index % 4 === 0 ? p.magenta : p.cyan;
    const opacity = mode === "dark" ? 0.15 + (index % 6) * 0.035 : 0.08 + (index % 6) * 0.022;
    return `<path d="M${x} ${y} v${h}" stroke="${color}" stroke-width="${index % 7 === 0 ? 2 : 1}" opacity="${opacity}" stroke-dasharray="${8 + (index % 5) * 4} ${14 + (index % 4) * 8}"/>`;
  }).join("\n");

  return wrap({
    id,
    title: "04 霓虹雨幕",
    mode,
    bg: p.bg,
    defs: baseDefs({ id, ...p }),
    body: `
      <rect width="1600" height="1000" fill="url(#${id}-field)" opacity="${mode === "dark" ? 0.16 : 0.12}"/>
      <g filter="url(#${id}-soft-glow)">
        ${rain}
      </g>
      <g filter="url(#${id}-glow)" opacity="${mode === "dark" ? 0.8 : 0.58}">
        ${line("0,176 360,176 404,222 746,222 798,176 1600,176", p.cyan, 2.1, 0.62)}
        ${line("0,822 268,822 328,758 610,758 686,822 1600,822", p.yellow, 2.5, 0.58)}
        ${line("1004,0 1004,286 1068,348 1068,706 1138,780 1138,1000", p.magenta, 2.2, 0.56)}
      </g>
      <g opacity="${mode === "dark" ? 0.62 : 0.44}">
        ${node(404, 222, p.panel, p.cyan)}
        ${node(686, 822, p.panel, p.yellow)}
        ${node(1068, 348, p.panel, p.magenta)}
        ${dot(1252, 176, 4, p.cyan, 0.85)}
        ${dot(1408, 822, 4, p.yellow, 0.75)}
      </g>
      <rect width="1600" height="1000" fill="url(#${id}-scan)" opacity="${mode === "dark" ? 0.1 : 0.06}"/>
      <rect width="1600" height="1000" filter="url(#${id}-grain)" opacity="0.8"/>
    `,
  });
};

const option5 = (mode) => {
  const p = palette[mode];
  const id = `orange-core-${mode}`;
  return wrap({
    id,
    title: "05 橙核矩阵",
    mode,
    bg: mode === "dark" ? "#080b10" : "#f2f7f5",
    defs: baseDefs({ id, ...p, glow: [p.orange, p.cyan, p.magenta] }),
    body: `
      <rect width="1600" height="1000" fill="url(#${id}-field)" opacity="${mode === "dark" ? 0.24 : 0.16}"/>
      <g opacity="${mode === "dark" ? 0.34 : 0.2}">
        <path d="M0 0 H1600 V1000 H0 Z M128 126 H1472 V874 H128 Z" fill="${p.orange}" fill-rule="evenodd" opacity="${mode === "dark" ? 0.08 : 0.12}"/>
        <path d="M128 126 H1472 V874 H128 Z" fill="${mode === "dark" ? "#06111a" : "#f8fcfb"}" opacity="${mode === "dark" ? 0.34 : 0.38}"/>
        <path d="M128 126 H1472 V874 H128 Z" fill="none" stroke="${p.cyan}" stroke-width="1.1"/>
        <path d="M128 126 H1472 V874 H128 Z" fill="none" stroke="${p.orange}" stroke-width="10" stroke-dasharray="260 120 44 180" opacity="${mode === "dark" ? 0.32 : 0.24}"/>
      </g>
      <g filter="url(#${id}-soft-glow)">
        ${path("M190 794 H470 L536 732 H730 L798 664 H1010 L1082 594 H1416", p.orange, 3.1, 0.72)}
        ${path("M162 240 H470 L540 306 H766 L832 370 H1058 L1124 436 H1438", p.cyan, 2.3, 0.62)}
        ${path("M806 150 V312 L742 374 V554 L674 624 V852", p.magenta, 2.4, 0.58)}
      </g>
      <g opacity="${mode === "dark" ? 0.76 : 0.56}">
        ${node(536, 732, p.panel, p.orange)}
        ${node(832, 370, p.panel, p.cyan)}
        ${node(1082, 594, p.panel, p.magenta)}
        ${node(742, 374, p.panel, p.yellow)}
        ${dot(1010, 664, 5, p.orange, 0.9)}
        ${dot(470, 240, 4, p.cyan, 0.84)}
      </g>
      <g opacity="${mode === "dark" ? 0.22 : 0.15}">
        <path d="M128 126 l66 66 M1472 126 l-66 66 M128 874 l66 -66 M1472 874 l-66 -66" stroke="${p.yellow}" stroke-width="2" fill="none"/>
        <rect x="620" y="462" width="360" height="92" fill="none" stroke="${p.orange}" stroke-width="1"/>
        <path d="M620 508 H980 M800 462 V554" stroke="${p.cyan}" stroke-width="1"/>
      </g>
      <rect width="1600" height="1000" fill="url(#${id}-scan)" opacity="${mode === "dark" ? 0.08 : 0.05}"/>
      <rect width="1600" height="1000" filter="url(#${id}-grain)" opacity="0.7"/>
    `,
  });
};

const options = [
  { name: "00-soft-field", title: "00 柔光线路", desc: "替代经典网格的低密度默认背景，保留线路和节点，不再使用密集小格子。" },
  { name: "01-night-lanes", title: "01 夜城斜轨", desc: "最接近当前赛博导航气质，但层次更多，适合作为默认深色背景。" },
  { name: "02-circuit-terrace", title: "02 高架电路", desc: "更像后台中控和硬件线路，秩序感强，适合卡片很多的导航页面。" },
  { name: "03-holo-map", title: "03 全息航图", desc: "地图/航线感更强，背景线条更柔，适合想弱化网格突兀感。" },
  { name: "04-data-rain", title: "04 霓虹雨幕", desc: "纵向数据流和横向导轨，有动态科技感，但不会遮挡内容。" },
  { name: "05-orange-core", title: "05 橙核矩阵", desc: "更贴合橙子导航和 Nerocats 的橙色识别，浅色模式也更温和。" },
];

const generators = [option0, option1, option2, option3, option4, option5];

generators.forEach((generator, index) => {
  const option = options[index];
  writeFileSync(join(outDir, `${option.name}-dark.svg`), generator("dark"));
  writeFileSync(join(outDir, `${option.name}-light.svg`), generator("light"));
});

const preview = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>橙子导航背景候选</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: Inter, "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
        background: #080a11;
        color: #f6f7fb;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          linear-gradient(135deg, rgba(0, 245, 255, .08), transparent 34%),
          linear-gradient(315deg, rgba(252, 238, 10, .08), transparent 38%),
          #080a11;
      }
      main {
        width: min(1440px, calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0 40px;
      }
      header {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 20px;
      }
      h1 {
        margin: 0;
        font-size: clamp(26px, 3vw, 42px);
        letter-spacing: 0;
      }
      p {
        margin: 8px 0 0;
        color: #a9b4c7;
        line-height: 1.7;
      }
      .hint {
        max-width: 680px;
      }
      .option {
        padding: 16px 0 26px;
        border-top: 1px solid rgba(148, 163, 184, .22);
      }
      .option h2 {
        margin: 0 0 6px;
        font-size: 20px;
        letter-spacing: 0;
      }
      .pair {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 14px;
      }
      figure {
        margin: 0;
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, .28);
        background: rgba(255, 255, 255, .06);
        box-shadow: 0 20px 48px rgba(0, 0, 0, .26);
      }
      img {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
      }
      figcaption {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        color: #d8e0ea;
        font-size: 13px;
      }
      a {
        color: #00f5ff;
        text-decoration: none;
      }
      a:hover { text-decoration: underline; }
      @media (max-width: 800px) {
        header { display: block; }
        .pair { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <h1>橙子导航背景候选</h1>
          <p class="hint">每套都包含深色和浅色版本。你选中后，我再把对应方案接入主题变量，并按实际页面卡片可读性微调亮度。</p>
        </div>
      </header>
      ${options
        .map(
          (option) => `
          <section class="option">
            <h2>${option.title}</h2>
            <p>${option.desc}</p>
            <div class="pair">
              <figure>
                <img src="./${option.name}-dark.svg" alt="${option.title} 深色背景" />
                <figcaption><span>深色模式</span><a href="./${option.name}-dark.svg" target="_blank">打开原图</a></figcaption>
              </figure>
              <figure>
                <img src="./${option.name}-light.svg" alt="${option.title} 浅色背景" />
                <figcaption><span>浅色模式</span><a href="./${option.name}-light.svg" target="_blank">打开原图</a></figcaption>
              </figure>
            </div>
          </section>`,
        )
        .join("")}
    </main>
  </body>
</html>
`;

writeFileSync(join(outDir, "index.html"), preview);

console.log(`Generated ${generators.length * 2} SVG backgrounds and preview page in ${outDir}`);
