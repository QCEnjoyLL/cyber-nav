# Cyber Nav

个人赛博朋克导航站。前端使用 React + Vite + TypeScript，后端使用 Cloudflare Worker + Hono，数据存储在 Cloudflare D1，静态资源由 Worker Assets 托管。

## 功能

- 默认中文界面，支持中英文切换。
- 支持浅色、深色、系统主题。
- 左侧分类、标签筛选、收藏、本地命令面板和随机打开站点。
- 顶部搜索栏，内置百度、Bing、Google、GitHub、Perplexity。
- `/admin` 后台管理，支持分类、链接、搜索引擎、站点设置、JSON 导入导出。
- GitHub Actions 自动部署到 Cloudflare Workers。

## 本地开发

```powershell
npm install
npm run cf:types
npm run db:migrate:local
npm run dev
```

前端开发服务器默认是 `http://127.0.0.1:5173`。如果需要本地联调 Worker API，另开一个终端：

```powershell
npm run dev:worker
```

## Cloudflare 配置

当前 D1 数据库配置在 `wrangler.jsonc`：

- 数据库名：`cyber-nav-db`
- 绑定名：`DB`
- 数据库 ID：已写入 `wrangler.jsonc`

首次部署前确认远程 D1 已执行迁移：

```powershell
npm run db:migrate:remote
```

## 后台密码和 Worker Secrets

后台登录时输入的是你选择的明文密码。Cloudflare 里不要保存明文密码，只保存它生成出来的 hash。

生成 hash 和会话密钥：

```powershell
npm run secret:hash -- "你的后台管理密码"
```

脚本会输出：

```text
ADMIN_PASSWORD_HASH=pbkdf2_sha256$100000$...
SESSION_SECRET=...
```

设置远程 Worker Secrets：

```powershell
npx wrangler secret put ADMIN_PASSWORD_HASH
npx wrangler secret put SESSION_SECRET
npx wrangler deploy
```

Wrangler 提示 `Enter a secret value` 时：

- `ADMIN_PASSWORD_HASH`：只粘贴 `ADMIN_PASSWORD_HASH=` 后面的 `pbkdf2_sha256$100000$...`。
- `SESSION_SECRET`：只粘贴 `SESSION_SECRET=` 后面的随机值。

注意事项：

- 登录 `/admin` 时输入明文密码，不要输入 hash 或 `SESSION_SECRET`。
- 不要把 `ADMIN_PASSWORD_HASH=` 这个键名一起粘进 `secret put` 的输入框。
- 不要用 `.dev.vars` 直接执行 `wrangler secret bulk .dev.vars` 上传远程 secret；PBKDF2 hash 里有 `$`，`.env` 格式容易被解析出错。远程推荐使用 `wrangler secret put`。
- 修改远程 secret 后执行一次 `npx wrangler deploy`，确保当前 Worker 版本使用新 secret。

本地 Worker 调试时，可以复制 `.dev.vars.example` 为 `.dev.vars`，填入同样两项。`.dev.vars` 已被 `.gitignore` 忽略。

## GitHub Actions

仓库 Settings > Secrets and variables > Actions 里需要配置：

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

API Token 至少需要账号级权限：

- `Workers Scripts: Edit`
- `D1: Edit`

push 到 `main` 后，workflow 会执行类型检查、测试、构建、D1 远程迁移和 Worker 部署。

## 常用命令

```powershell
npm run typecheck
npm test
npm run build
npm run test:ui
npm run deploy:dry-run
```
