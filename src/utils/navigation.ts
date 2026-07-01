import type { LinkFilter, Locale, NavLink, SearchEngine } from "../types";

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
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
