PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Folder',
  color TEXT NOT NULL DEFAULT '#00f5ff',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  category_id TEXT,
  title TEXT NOT NULL,
  description_zh TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  icon_url TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS search_engines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url_template TEXT NOT NULL,
  shortcut TEXT NOT NULL DEFAULT '',
  is_default INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_links_active_category_sort ON links(is_active, category_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_links_pinned_sort ON links(is_pinned, sort_order);
CREATE INDEX IF NOT EXISTS idx_search_engines_active_sort ON search_engines(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip_hash, created_at);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('titleZh', '夜城导航'),
  ('titleEn', 'Night City Nav'),
  ('subtitleZh', '个人工作流、AI 工具和灵感站点的赛博入口'),
  ('subtitleEn', 'A cyberpunk hub for workflows, AI tools, and inspiration'),
  ('defaultLocale', 'zh'),
  ('defaultTheme', 'system');

INSERT OR IGNORE INTO categories (id, name_zh, name_en, icon, color, sort_order, is_active) VALUES
  ('ai', 'AI 工具', 'AI Tools', 'Bot', '#00f5ff', 10, 1),
  ('dev', '开发', 'Development', 'TerminalSquare', '#fcee0a', 20, 1),
  ('cloud', '云服务', 'Cloud', 'Cloud', '#ff3b8d', 30, 1),
  ('design', '设计灵感', 'Design', 'Sparkles', '#9dff00', 40, 1);

INSERT OR IGNORE INTO links (id, category_id, title, description_zh, description_en, url, icon_url, tags, is_pinned, is_favorite, is_active, sort_order) VALUES
  ('openai', 'ai', 'OpenAI', '模型、API、文档和平台控制台', 'Models, APIs, docs, and platform console', 'https://platform.openai.com/', '', '["AI","API","LLM"]', 1, 0, 1, 10),
  ('cloudflare', 'cloud', 'Cloudflare', 'Workers、D1、Pages 和域名管理', 'Workers, D1, Pages, and domain management', 'https://dash.cloudflare.com/', '', '["Cloud","Workers","D1"]', 1, 0, 1, 20),
  ('github', 'dev', 'GitHub', '代码仓库、Actions 和项目协作', 'Repositories, Actions, and collaboration', 'https://github.com/', '', '["Code","CI"]', 1, 0, 1, 30),
  ('figma', 'design', 'Figma', '界面设计、原型和设计系统', 'UI design, prototypes, and design systems', 'https://www.figma.com/', '', '["Design","UI"]', 0, 0, 1, 40);

INSERT OR IGNORE INTO search_engines (id, name, url_template, shortcut, is_default, is_active, sort_order) VALUES
  ('baidu', '百度', 'https://www.baidu.com/s?wd={query}', 'bd', 1, 1, 10),
  ('bing', 'Bing', 'https://www.bing.com/search?q={query}', 'bi', 0, 1, 20),
  ('google', 'Google', 'https://www.google.com/search?q={query}', 'gg', 0, 1, 30),
  ('github', 'GitHub', 'https://github.com/search?q={query}', 'gh', 0, 1, 40),
  ('perplexity', 'Perplexity', 'https://www.perplexity.ai/search?q={query}', 'pp', 0, 1, 50);
