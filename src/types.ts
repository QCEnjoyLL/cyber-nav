export type Locale = "zh" | "en";
export type ThemeMode = "system" | "light" | "dark";
export type ResolvedThemeMode = "light" | "dark";
export type BackgroundStyle =
  | "classic-grid"
  | "night-lanes"
  | "circuit-terrace"
  | "holo-map"
  | "data-rain"
  | "orange-core";
export type ThemePalette =
  | "absolutely"
  | "ayu"
  | "catppuccin"
  | "codex"
  | "dracula"
  | "everforest"
  | "github"
  | "gruvbox"
  | "linear"
  | "lobster"
  | "material"
  | "matrix"
  | "monokai"
  | "night-owl"
  | "nord"
  | "notion"
  | "one"
  | "oscurance"
  | "raycast"
  | "rose-pine"
  | "sentry"
  | "solarized"
  | "temple"
  | "tokyo-night"
  | "vercel"
  | "vs-code-plus"
  | "xcode";

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
  backgroundStyle: BackgroundStyle;
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
