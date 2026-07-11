import { defaultSettings } from "../data/defaults";
import { normalizeBackgroundStyle } from "../theme/backgrounds";
import type { BootstrapData, Category, NavLink, SearchEngine, SiteSettings } from "../types";
import type { CategoryInput, ImportInput, LinkInput, ReorderLinksInput, SearchEngineInput, SettingsInput } from "./validation";

type CategoryRow = {
  id: string;
  name_zh: string;
  name_en: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: number;
};

type LinkRow = {
  id: string;
  category_id: string | null;
  title: string;
  description_zh: string;
  description_en: string;
  url: string;
  icon_url: string;
  tags: string;
  is_pinned: number;
  is_favorite: number;
  is_active: number;
  sort_order: number;
};

type SearchEngineRow = {
  id: string;
  name: string;
  url_template: string;
  shortcut: string;
  is_default: number;
  is_active: number;
  sort_order: number;
};

type SettingRow = {
  key: keyof SiteSettings;
  value: string;
};

export async function getBootstrap(db: D1Database, includeInactive = false): Promise<BootstrapData> {
  const [settings, categories, links, searchEngines] = await Promise.all([
    getSettings(db),
    listCategories(db, includeInactive),
    listLinks(db, includeInactive),
    listSearchEngines(db, includeInactive),
  ]);

  return { settings, categories, links, searchEngines };
}

export async function getSettings(db: D1Database): Promise<SiteSettings> {
  const { results } = await db.prepare("SELECT key, value FROM settings").all<SettingRow>();
  const settings = { ...defaultSettings };
  for (const row of results) {
    if (row.key in settings) {
      settings[row.key] = row.value as never;
    }
  }
  return {
    ...settings,
    defaultLocale: settings.defaultLocale === "en" ? "en" : "zh",
    defaultTheme: settings.defaultTheme === "light" || settings.defaultTheme === "dark" ? settings.defaultTheme : "system",
    backgroundStyle: normalizeBackgroundStyle(settings.backgroundStyle),
    customBackgroundImage: settings.customBackgroundImage?.trim() ?? "",
  };
}

export async function updateSettings(db: D1Database, settings: SettingsInput): Promise<SiteSettings> {
  await db.batch(
    Object.entries(settings).map(([key, value]) =>
      db
        .prepare(
          "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
        )
        .bind(key, String(value)),
    ),
  );
  return getSettings(db);
}

export async function listCategories(db: D1Database, includeInactive = false): Promise<Category[]> {
  const where = includeInactive ? "" : "WHERE is_active = 1";
  const { results } = await db
    .prepare(`SELECT id, name_zh, name_en, icon, color, sort_order, is_active FROM categories ${where} ORDER BY sort_order ASC, name_zh ASC`)
    .all<CategoryRow>();
  return results.map(mapCategory);
}

export async function upsertCategory(db: D1Database, input: CategoryInput): Promise<Category> {
  const id = input.id ?? crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO categories (id, name_zh, name_en, icon, color, sort_order, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         name_zh = excluded.name_zh,
         name_en = excluded.name_en,
         icon = excluded.icon,
         color = excluded.color,
         sort_order = excluded.sort_order,
         is_active = excluded.is_active,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(id, input.nameZh, input.nameEn, input.icon, input.color, input.sortOrder, Number(input.isActive))
    .run();
  const category = await db
    .prepare("SELECT id, name_zh, name_en, icon, color, sort_order, is_active FROM categories WHERE id = ?")
    .bind(id)
    .first<CategoryRow>();
  if (!category) throw new Error("Category write failed");
  return mapCategory(category);
}

export async function deleteCategory(db: D1Database, id: string): Promise<void> {
  await db.batch([
    db.prepare("UPDATE links SET category_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE category_id = ?").bind(id),
    db.prepare("DELETE FROM categories WHERE id = ?").bind(id),
  ]);
}

export async function listLinks(db: D1Database, includeInactive = false): Promise<NavLink[]> {
  const where = includeInactive ? "" : "WHERE is_active = 1";
  const { results } = await db
    .prepare(
      `SELECT id, category_id, title, description_zh, description_en, url, icon_url, tags, is_pinned, is_favorite, is_active, sort_order
       FROM links ${where}
       ORDER BY is_pinned DESC, sort_order ASC, title ASC`,
    )
    .all<LinkRow>();
  return results.map(mapLink);
}

export async function upsertLink(db: D1Database, input: LinkInput): Promise<NavLink> {
  const id = input.id ?? crypto.randomUUID();
  const categoryId = input.categoryId || null;
  await db
    .prepare(
      `INSERT INTO links (id, category_id, title, description_zh, description_en, url, icon_url, tags, is_pinned, is_favorite, is_active, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         category_id = excluded.category_id,
         title = excluded.title,
         description_zh = excluded.description_zh,
         description_en = excluded.description_en,
         url = excluded.url,
         icon_url = excluded.icon_url,
         tags = excluded.tags,
         is_pinned = excluded.is_pinned,
         is_favorite = excluded.is_favorite,
         is_active = excluded.is_active,
         sort_order = excluded.sort_order,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      id,
      categoryId,
      input.title,
      input.descriptionZh,
      input.descriptionEn,
      input.url,
      input.iconUrl,
      JSON.stringify(input.tags),
      Number(input.isPinned),
      Number(input.isFavorite),
      Number(input.isActive),
      input.sortOrder,
    )
    .run();
  const link = await db
    .prepare(
      "SELECT id, category_id, title, description_zh, description_en, url, icon_url, tags, is_pinned, is_favorite, is_active, sort_order FROM links WHERE id = ?",
    )
    .bind(id)
    .first<LinkRow>();
  if (!link) throw new Error("Link write failed");
  return mapLink(link);
}

export async function deleteLink(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM links WHERE id = ?").bind(id).run();
}

export async function reorderLinksByGroups(db: D1Database, input: ReorderLinksInput = {}): Promise<BootstrapData> {
  const [categories, links] = await Promise.all([listCategories(db, true), listLinks(db, true)]);
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const sortedLinks = [...links].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  const targetCategoryId = Object.prototype.hasOwnProperty.call(input, "categoryId") ? (input.categoryId ?? null) : undefined;
  const categoryGroups = [
    {
      categoryId: null,
      category: undefined,
      links: sortedLinks.filter((link) => !link.categoryId || !categoryMap.has(link.categoryId)),
    },
    ...[...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.nameZh.localeCompare(b.nameZh)).map((category) => ({
      categoryId: category.id,
      category,
      links: sortedLinks.filter((link) => link.categoryId === category.id),
    })),
  ].filter((group) => group.links.length > 0 && (targetCategoryId === undefined || group.categoryId === targetCategoryId));
  const updates: D1PreparedStatement[] = [];

  for (const group of categoryGroups) {
    const tagGroups = buildLinkTagGroups(group.links, group.category, input.tags);
    tagGroups.forEach((tagGroup, groupIndex) => {
      tagGroup.links.forEach((link, linkIndex) => {
        const nextSortOrder = (groupIndex + 1) * 1000 + linkIndex + 1;
        if (link.sortOrder !== nextSortOrder) {
          updates.push(db.prepare("UPDATE links SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(nextSortOrder, link.id));
        }
      });
    });
  }

  if (updates.length > 0) {
    await db.batch(updates);
  }
  return getBootstrap(db, true);
}

export async function listSearchEngines(db: D1Database, includeInactive = false): Promise<SearchEngine[]> {
  const where = includeInactive ? "" : "WHERE is_active = 1";
  const { results } = await db
    .prepare(
      `SELECT id, name, url_template, shortcut, is_default, is_active, sort_order
       FROM search_engines ${where}
       ORDER BY sort_order ASC, name ASC`,
    )
    .all<SearchEngineRow>();
  return results.map(mapSearchEngine);
}

export async function upsertSearchEngine(db: D1Database, input: SearchEngineInput): Promise<SearchEngine> {
  const id = input.id ?? crypto.randomUUID();
  if (input.isDefault) {
    await db.prepare("UPDATE search_engines SET is_default = 0, updated_at = CURRENT_TIMESTAMP").run();
  }

  await db
    .prepare(
      `INSERT INTO search_engines (id, name, url_template, shortcut, is_default, is_active, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         url_template = excluded.url_template,
         shortcut = excluded.shortcut,
         is_default = excluded.is_default,
         is_active = excluded.is_active,
         sort_order = excluded.sort_order,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(id, input.name, input.urlTemplate, input.shortcut, Number(input.isDefault), Number(input.isActive), input.sortOrder)
    .run();

  const engine = await db
    .prepare("SELECT id, name, url_template, shortcut, is_default, is_active, sort_order FROM search_engines WHERE id = ?")
    .bind(id)
    .first<SearchEngineRow>();
  if (!engine) throw new Error("Search engine write failed");
  return mapSearchEngine(engine);
}

export async function deleteSearchEngine(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM search_engines WHERE id = ?").bind(id).run();
}

export async function importData(db: D1Database, data: ImportInput): Promise<BootstrapData> {
  if (data.settings) {
    await updateSettings(db, data.settings);
  }
  for (const category of data.categories ?? []) {
    await upsertCategory(db, category);
  }
  for (const link of data.links ?? []) {
    await upsertLink(db, link);
  }
  for (const engine of data.searchEngines ?? []) {
    await upsertSearchEngine(db, engine);
  }
  return getBootstrap(db, true);
}

export async function recordLoginAttempt(db: D1Database, ipHash: string, success: boolean): Promise<void> {
  await db
    .prepare("INSERT INTO login_attempts (ip_hash, success, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)")
    .bind(ipHash, Number(success))
    .run();
}

export async function countRecentFailedLogins(db: D1Database, ipHash: string): Promise<number> {
  await db.prepare("DELETE FROM login_attempts WHERE created_at < datetime('now', '-1 day')").run();
  const row = await db
    .prepare(
      "SELECT COUNT(*) AS count FROM login_attempts WHERE ip_hash = ? AND success = 0 AND created_at >= datetime('now', '-15 minutes')",
    )
    .bind(ipHash)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    nameZh: row.name_zh,
    nameEn: row.name_en,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    isActive: Boolean(row.is_active),
  };
}

function mapLink(row: LinkRow): NavLink {
  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    descriptionZh: row.description_zh,
    descriptionEn: row.description_en,
    url: row.url,
    iconUrl: row.icon_url,
    tags: parseTags(row.tags),
    isPinned: Boolean(row.is_pinned),
    isFavorite: Boolean(row.is_favorite),
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order,
  };
}

function mapSearchEngine(row: SearchEngineRow): SearchEngine {
  return {
    id: row.id,
    name: row.name,
    urlTemplate: row.url_template,
    shortcut: row.shortcut,
    isDefault: Boolean(row.is_default),
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order,
  };
}

function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0);
  } catch {
    return [];
  }
}

function buildLinkTagGroups(links: NavLink[], category?: Category, tagOrder: string[] = []): Array<{ tag: string; links: NavLink[] }> {
  const tagMap = new Map<string, NavLink[]>();
  for (const link of links) {
    const tag = getLinkTagGroup(link, category);
    tagMap.set(tag, [...(tagMap.get(tag) ?? []), link]);
  }
  const orderedTags = new Map(tagOrder.map((tag, index) => [tag, index]));
  return Array.from(tagMap, ([tag, tagLinks]) => ({ tag, links: tagLinks })).sort((a, b) => {
    const aOrder = orderedTags.get(a.tag);
    const bOrder = orderedTags.get(b.tag);
    if (aOrder !== undefined || bOrder !== undefined) {
      return (aOrder ?? Number.MAX_SAFE_INTEGER) - (bOrder ?? Number.MAX_SAFE_INTEGER);
    }
    if (a.tag === "其他") return 1;
    if (b.tag === "其他") return -1;
    const sortDelta = Math.min(...a.links.map((link) => link.sortOrder)) - Math.min(...b.links.map((link) => link.sortOrder));
    return sortDelta || a.tag.localeCompare(b.tag, "zh-Hans-CN");
  });
}

function getLinkTagGroup(link: NavLink, category?: Category): string {
  if (category) {
    const [scope, subcategory] = link.tags;
    if (subcategory && (scope === category.id || scope === category.nameZh || scope === category.nameEn)) return subcategory;
    const fallback = link.tags.find((tag) => tag && tag !== category.id && tag !== category.nameZh && tag !== category.nameEn);
    return fallback ?? "其他";
  }
  return link.tags[0] || "其他";
}
