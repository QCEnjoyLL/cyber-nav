export type Locale = "zh" | "en";
export type ThemeMode = "system" | "light" | "dark";

export interface Category {
  id: string;
  nameZh: string;
  nameEn: string;
  icon: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
}

export interface NavLink {
  id: string;
  categoryId: string | null;
  title: string;
  descriptionZh: string;
  descriptionEn: string;
  url: string;
  iconUrl: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface SearchEngine {
  id: string;
  name: string;
  urlTemplate: string;
  shortcut: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface SiteSettings {
  titleZh: string;
  titleEn: string;
  subtitleZh: string;
  subtitleEn: string;
  defaultLocale: Locale;
  defaultTheme: ThemeMode;
}

export interface BootstrapData {
  settings: SiteSettings;
  categories: Category[];
  links: NavLink[];
  searchEngines: SearchEngine[];
}

export interface LinkFilter {
  categoryId: string;
  query: string;
  tags: string[];
  favorites: Set<string>;
  favoriteOnly: boolean;
}
