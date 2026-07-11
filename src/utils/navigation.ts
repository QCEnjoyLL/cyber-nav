import type { Category, LinkFilter, Locale, NavLink, SearchEngine } from "../types";

export function getLinkDescription(link: NavLink, locale: Locale): string {
  return locale === "zh" ? link.descriptionZh : link.descriptionEn || link.descriptionZh;
}

export function collectTags(links: NavLink[]): string[] {
  const tags = new Set<string>();
  for (const link of links) {
    for (const tag of link.tags) {
      if (tag.trim()) tags.add(tag.trim());
    }
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

export function filterLinks(links: NavLink[], filter: LinkFilter, locale: Locale): NavLink[] {
  const normalizedQuery = filter.query.trim().toLowerCase();
  return links
    .filter((link) => link.isActive)
    .filter((link) => filter.categoryId === "all" || link.categoryId === filter.categoryId)
    .filter((link) => !filter.favoriteOnly || filter.favorites.has(link.id) || link.isFavorite)
    .filter((link) => filter.tags.every((tag) => link.tags.includes(tag)))
    .filter((link) => {
      if (!normalizedQuery) return true;
      const haystack = [
        link.title,
        link.url,
        getLinkDescription(link, locale),
        ...link.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export function buildSearchUrl(engine: SearchEngine, query: string): string {
  const encodedQuery = encodeURIComponent(query.trim());
  return engine.urlTemplate.replaceAll("{query}", encodedQuery);
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export function getLinkSubcategory(link: NavLink, category: Category): string | null {
  const [scope, subcategory] = link.tags;
  if (!subcategory) return null;
  if (scope === category.nameZh || scope === category.nameEn || scope === category.id) return subcategory;
  return null;
}

export function getLinkTagGroup(link: NavLink, category?: Category): string {
  if (category) {
    const subcategory = getLinkSubcategory(link, category);
    if (subcategory) return subcategory;
    const fallback = link.tags.find((tag) => tag && tag !== category.nameZh && tag !== category.nameEn && tag !== category.id);
    return fallback ?? "其他";
  }
  return link.tags[0] || "其他";
}

export function buildCategorySubcategories(
  category: Category,
  links: NavLink[],
): Array<{ id: string; title: string; links: NavLink[] }> {
  const categoryLinks = links.filter((link) => link.categoryId === category.id);
  const subcategoryMap = new Map<string, NavLink[]>();
  let hasScopedSubcategory = false;

  for (const link of categoryLinks) {
    const subcategory = getLinkSubcategory(link, category);
    if (!subcategory) continue;
    hasScopedSubcategory = true;
    subcategoryMap.set(subcategory, [...(subcategoryMap.get(subcategory) ?? []), link]);
  }

  // When a category already has scoped subtags, keep ungrouped links visible under a fallback group.
  if (hasScopedSubcategory) {
    for (const link of categoryLinks) {
      if (getLinkSubcategory(link, category)) continue;
      const fallbackGroup = getLinkTagGroup(link, category);
      subcategoryMap.set(fallbackGroup, [...(subcategoryMap.get(fallbackGroup) ?? []), link]);
    }
  }

  return Array.from(subcategoryMap, ([title, subcategoryLinks]) => ({
    id: title,
    title,
    links: subcategoryLinks,
  }));
}

