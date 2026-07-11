# 🍊 橙子导航 Cyber Nav

> 一个带点霓虹、带点赛博、又足够实用的个人导航站。  
> 前台负责快速抵达，后台负责随时整理，Cloudflare 负责安静运行。

![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=111)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript&logoColor=fff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=fff)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?style=flat-square&logo=cloudflare&logoColor=fff)
![D1](https://img.shields.io/badge/Database-D1-f6c915?style=flat-square)

## ✨ 项目亮点

- 🎛️ **首页即导航工作台**：打开就是实际可用的导航界面，不做花架子落地页。
- 🌗 **浅色 / 深色 / 跟随系统**：文字对比度经过多轮调整，日夜都能看清。
- 🎨 **多套配色和背景**：内置十套深浅色背景，并支持填写图片 URL 使用自定义背景。
- 🧭 **分类 + 标签分组**：左侧分类用于定位，中间按分类和标签分块展示。
- 🏷️ **标签顺序管理**：后台可直接调整某个分类下的标签先后顺序。
- 🔎 **聚合搜索栏**：预置百度、Bing、Google、GitHub、Perplexity 等搜索引擎。
- ⭐ **收藏、置顶、随机打开**：常用站点更快触达，也保留一点随机探索感。
- ⌘ **命令面板**：本地快速检索导航入口。
- 📱 **移动端适配**：前台和后台都支持手机端使用，后台手机端可自然滚动和回到顶部。
- 🔐 **单密码后台管理**：密码哈希存入 Cloudflare Worker Secret，不提交明文密码。
- ☁️ **无服务器部署**：Cloudflare Workers + D1 + Worker Assets，一套搞定前后端。
- 🚀 **GitHub Actions 自动部署**：push 到 `main` 后自动检查、构建、迁移并部署。

## 🧱 技术栈

| 模块 | 技术 |
| --- | --- |
| 前端 | React + TypeScript + Vite |
| 图标 | lucide-react |
| 后端 | Cloudflare Worker + Hono |
| 数据库 | Cloudflare D1 |
| 样式 | 原生 CSS，赛博朋克视觉体系 |
| 测试 | Vitest + Playwright |
| 部署 | Wrangler + GitHub Actions |

## 🖼️ 功能概览

### 🏠 前台导航

- 左侧分类栏：点击后定位到对应内容，不做筛选隐藏。
- 中间卡片区：只滚动内容区，顶部搜索和操作按钮保持可用。
- 标签分组：同一分类下可按 `博客 / 图床 / 网盘 / 笔记 / 其他` 这类标签分块。
- 搜索栏：输入内容可同步筛选导航，也可用当前搜索引擎跳转搜索。
- 右下角工具按钮：回到顶部、聚焦搜索、打开命令面板、切换主题。

### 🛠️ 后台管理

访问路径：

```text
/admin
```

后台支持：

- 🗂️ 分类管理：名称、图标、颜色、排序、启用状态。
- 🔗 导航管理：标题、URL、描述、图标地址、分类、标签、排序、置顶、收藏、启用。
- 🏷️ 标签顺序：按分类调整标签分组顺序。
- 🔍 搜索引擎：名称、快捷码、搜索 URL 模板、默认项、启用状态。
- ⚙️ 站点设置：站点名称、副标题、默认语言、默认主题、背景风格。
- 📦 JSON 导入导出：备份和迁移配置。
- 📱 手机端后台：单列布局、自然滚动、右下角回到顶部按钮。

## 🚀 快速开始

### 1. 安装依赖

```powershell
npm install
```

### 2. 生成 Cloudflare 类型

```powershell
npm run cf:types
```

### 3. 本地执行 D1 迁移

```powershell
npm run db:migrate:local
```

### 4. 启动前端开发服务

```powershell
npm run dev
```

默认地址：

```text
http://127.0.0.1:5173
```

如需本地联调 Worker API，另开一个终端：

```powershell
npm run dev:worker
```

Worker 本地地址通常是：

```text
http://127.0.0.1:8787
```

## 🔐 后台密码与 Worker Secrets

后台登录时输入的是你设置的**明文管理密码**。  
Cloudflare Worker 里保存的不是明文密码，而是这个密码生成出来的哈希。

### 1. 生成密码哈希和会话密钥

```powershell
npm run secret:hash -- "你的后台管理密码"
```

输出类似：

```text
ADMIN_PASSWORD_HASH=pbkdf2_sha256$100000$...
SESSION_SECRET=...
```

### 2. 写入 Cloudflare Worker Secrets

```powershell
npx wrangler secret put ADMIN_PASSWORD_HASH
npx wrangler secret put SESSION_SECRET
```

Wrangler 提示 `Enter a secret value` 时：

- `ADMIN_PASSWORD_HASH`：只粘贴 `ADMIN_PASSWORD_HASH=` 后面的值。
- `SESSION_SECRET`：只粘贴 `SESSION_SECRET=` 后面的值。

### 3. 本地开发用 `.dev.vars`

本地 Worker 调试时，可以复制：

```powershell
Copy-Item .dev.vars.example .dev.vars
```

然后填入：

```text
ADMIN_PASSWORD_HASH=pbkdf2_sha256$100000$...
SESSION_SECRET=...
```

注意：

- ✅ 登录 `/admin` 时输入明文管理密码。
- ❌ 不要把明文密码提交到 Git。
- ❌ 不要把 `.dev.vars` 提交到 Git。
- ❌ 不要把 `ADMIN_PASSWORD_HASH=` 这个键名一起粘进 `wrangler secret put` 的输入框。
- ⚠️ 不建议用 `wrangler secret bulk .dev.vars` 上传这两个值，PBKDF2 哈希里的 `$` 容易被环境变量格式误解析。

## ☁️ Cloudflare 部署

当前项目使用：

- Worker 名称：`cyber-nav`
- D1 数据库：`cyber-nav-db`
- D1 绑定名：`DB`
- 前端静态资源：Worker Assets

`wrangler.jsonc` 中已经配置：

```jsonc
{
  "name": "cyber-nav",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "cyber-nav-db"
    }
  ]
}
```

首次部署前，确认远程 D1 已执行迁移：

```powershell
npm run db:migrate:remote
```

手动部署：

```powershell
npm run build
npx wrangler deploy
```

部署前干跑检查：

```powershell
npm run deploy:dry-run
```

## 🤖 GitHub Actions 自动部署

仓库需要配置两个 GitHub Actions Secrets：

| Secret | 用途 |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号 ID |
| `CLOUDFLARE_API_TOKEN` | Wrangler 部署和 D1 迁移 |

Cloudflare API Token 推荐权限：

- `Workers Scripts: Edit`
- `D1: Edit`

push 到 `main` 后，workflow 会自动执行：

1. 📦 `npm ci`
2. 🧪 类型检查和测试
3. 🏗️ 构建前端资源
4. 🗃️ 远程 D1 迁移
5. 🚀 部署 Cloudflare Worker

## 🧪 常用命令

```powershell
# 类型检查
npm run typecheck

# 单元测试
npm test

# 构建
npm run build

# 代码检查
npm run lint

# Playwright UI 测试
npm run test:ui

# 本地 D1 迁移
npm run db:migrate:local

# 远程 D1 迁移
npm run db:migrate:remote

# Wrangler 干跑部署
npm run deploy:dry-run
```

## 🧭 使用小技巧

- 🏷️ **想调整标签顺序**：进入后台「导航」，在某个分类下的「标签顺序」区域点上移/下移。
- 🔢 **想整理卡片序号**：后台「导航」里点「重排序号」。
- 🎨 **想换背景**：后台「站点设置」里选择内置背景，或选择「自定义图片」后填写 HTTPS 图片地址或站内绝对路径。
- 🌗 **想换主题**：右上角主题按钮可切换浅色、深色和跟随系统。
- 📱 **手机端后台太长**：右下角有回到顶部按钮。
- 📦 **迁移数据**：用后台「导入导出」复制 JSON 备份。

## 📁 项目结构

```text
cyber-nav/
├─ .github/workflows/      # GitHub Actions 自动部署
├─ migrations/             # D1 数据库迁移
├─ public/                 # Logo、背景图等静态资源
├─ scripts/                # 密码哈希等工具脚本
├─ src/
│  ├─ worker/              # Cloudflare Worker API
│  ├─ theme/               # 背景和配色定义
│  ├─ utils/               # 导航搜索等工具函数
│  ├─ App.tsx              # 前台 + 后台主界面
│  └─ index.css            # 视觉和响应式样式
├─ tests/                  # Vitest / Playwright 测试
├─ wrangler.jsonc          # Cloudflare Worker 配置
└─ package.json
```

## 🧩 数据与安全说明

- 所有导航数据存储在 Cloudflare D1。
- 后台只支持单管理员密码，不做多用户和 OAuth。
- 登录会话使用 `HttpOnly + Secure + SameSite=Lax` Cookie。
- 会话签名使用 `SESSION_SECRET`。
- 登录失败会记录到 D1，用于基础限流。
- `database_id` 不是密码，可以提交。
- `.dev.vars`、Cloudflare Token、GitHub Secrets 不应提交。

## 🧡 关于

这个项目更偏个人工作台，而不是通用门户模板。  
目标是：打开快、管理顺、视觉有记忆点，部署后基本不用操心服务器。

> © 2021 - 2026 偏爱一丛花
