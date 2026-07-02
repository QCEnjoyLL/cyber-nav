import {
  Bell,
  Archive,
  BookOpen,
  Bot,
  Box,
  Bookmark,
  Briefcase,
  Check,
  ChevronDown,
  Cloud,
  Code2,
  Command,
  Compass,
  Cpu,
  Database,
  ExternalLink,
  Film,
  Folder,
  Gamepad2,
  GitBranch,
  Globe2,
  HardDrive,
  Home,
  Image,
  Languages,
  LayoutDashboard,
  Link2,
  Lock,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Music,
  Navigation,
  Network,
  Newspaper,
  Palette,
  Plus,
  Rocket,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Shuffle,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  TerminalSquare,
  Trash2,
  Users,
  Video,
  Wifi,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { defaultBootstrap } from "./data/defaults";
import { BACKGROUND_STYLES, DEFAULT_BACKGROUND_STYLE, getBackgroundDefinition } from "./theme/backgrounds";
import { DEFAULT_THEME_PALETTE, getPaletteDefinition, getThemeColors, isThemePalette, THEME_PALETTES, type ThemeColorSet } from "./theme/palettes";
import type { BackgroundStyle, BootstrapData, Category, Locale, NavLink, ResolvedThemeMode, SearchEngine, SiteSettings, ThemeMode, ThemePalette } from "./types";
import { buildSearchUrl, filterLinks, normalizeUrl } from "./utils/navigation";

const iconMap: Record<string, LucideIcon> = {
  Archive,
  Bell,
  BookOpen,
  Bot,
  Box,
  Bookmark,
  Briefcase,
  Cloud,
  Code2,
  Command,
  Compass,
  Cpu,
  Database,
  Film,
  Folder,
  Gamepad2,
  Github: GitBranch,
  Globe2,
  HardDrive,
  Home,
  Image,
  Link2,
  LayoutDashboard,
  Monitor,
  Music,
  Network,
  Newspaper,
  Palette,
  Rocket,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  TerminalSquare,
  Users,
  Video,
  Wifi,
  Wrench,
};

const categoryIconOptions = [
  "Folder",
  "Globe2",
  "Bot",
  "Film",
  "Cloud",
  "Database",
  "Network",
  "Rocket",
  "Sparkles",
  "TerminalSquare",
  "LayoutDashboard",
  "Github",
  "Users",
  "Home",
  "Bookmark",
  "BookOpen",
  "Newspaper",
  "Video",
  "Music",
  "Gamepad2",
  "Image",
  "Palette",
  "Code2",
  "Command",
  "Server",
  "Monitor",
  "HardDrive",
  "Wifi",
  "Cpu",
  "ShieldCheck",
  "Bell",
  "Archive",
  "Box",
  "Briefcase",
  "Compass",
  "Link2",
  "Wrench",
  "Star",
] as const;

const text = {
  zh: {
    all: "全部",
    admin: "管理",
    command: "命令",
    favoriteOnly: "收藏",
    filterPlaceholder: "搜索站点、标签或地址",
    links: "导航",
    noResult: "没有匹配的入口",
    openRandom: "随机",
    pinned: "置顶",
    searchPlaceholder: "搜索全网，也会同步筛选导航",
    tags: "标签",
    loginTitle: "进入管理",
    password: "管理密码",
    login: "登录",
    logout: "退出",
    dashboard: "控制台",
    categories: "分类",
    engines: "搜索引擎",
    settings: "站点设置",
    importExport: "导入导出",
    save: "保存",
    create: "新增",
    delete: "删除",
    export: "导出",
    import: "导入",
    title: "标题",
    url: "网址",
    category: "分类",
    description: "描述",
    sort: "排序",
    active: "启用",
    color: "颜色",
    shortcut: "短码",
    default: "默认",
    tagsHint: "用英文逗号分隔",
  },
  en: {
    all: "All",
    admin: "Admin",
    command: "Command",
    favoriteOnly: "Favorites",
    filterPlaceholder: "Search sites, tags, or URLs",
    links: "Links",
    noResult: "No matching entries",
    openRandom: "Random",
    pinned: "Pinned",
    searchPlaceholder: "Search the web and filter links",
    tags: "Tags",
    loginTitle: "Admin Access",
    password: "Password",
    login: "Sign in",
    logout: "Sign out",
    dashboard: "Dashboard",
    categories: "Categories",
    engines: "Search Engines",
    settings: "Settings",
    importExport: "Import / Export",
    save: "Save",
    create: "Create",
    delete: "Delete",
    export: "Export",
    import: "Import",
    title: "Title",
    url: "URL",
    category: "Category",
    description: "Description",
    sort: "Sort",
    active: "Active",
    color: "Color",
    shortcut: "Shortcut",
    default: "Default",
    tagsHint: "Comma separated",
  },
} satisfies Record<Locale, Record<string, string>>;

const BOOTSTRAP_CACHE_KEY = "cyber-nav-bootstrap";

const emptyCategory: Category = {
  id: "",
  nameZh: "",
  nameEn: "",
  icon: "Folder",
  color: "#00f5ff",
  sortOrder: 100,
  isActive: true,
};

const emptyLink: NavLink = {
  id: "",
  categoryId: "ai",
  title: "",
  descriptionZh: "",
  descriptionEn: "",
  url: "",
  iconUrl: "",
  tags: [],
  isPinned: false,
  isFavorite: false,
  isActive: true,
  sortOrder: 100,
};

const emptyEngine: SearchEngine = {
  id: "",
  name: "",
  urlTemplate: "https://www.bing.com/search?q={query}",
  shortcut: "",
  isDefault: false,
  isActive: true,
  sortOrder: 100,
};

type CategoryNode = {
  category: Category;
  links: NavLink[];
  subcategories: SubcategoryNode[];
};

type SubcategoryNode = {
  id: string;
  title: string;
  links: NavLink[];
};

type DirectorySectionData = {
  id: string;
  title: string;
  icon: React.ReactNode;
  links: NavLink[];
};

type NavSelection =
  | { type: "all" }
  | { type: "category"; categoryId: string }
  | { type: "subcategory"; categoryId: string; subcategory: string };

function categorySelectionKey(categoryId: string): string {
  return `category:${categoryId}`;
}

function subcategorySelectionPrefix(categoryId: string): string {
  return `subcategory:${categoryId}`;
}

function subcategorySelectionKey(categoryId: string, subcategory: string): string {
  return `${subcategorySelectionPrefix(categoryId)}:${encodeURIComponent(subcategory)}`;
}

function parseSelectionKey(key: string): NavSelection {
  if (key.startsWith("category:")) {
    return { type: "category", categoryId: key.slice("category:".length) };
  }
  if (key.startsWith("subcategory:")) {
    const [, categoryId = "", encodedSubcategory = ""] = key.split(":");
    return { type: "subcategory", categoryId, subcategory: decodeURIComponent(encodedSubcategory) };
  }
  return { type: "all" };
}

function getNextTheme(theme: ThemeMode): ThemeMode {
  return theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
}

function getLinkSubcategory(link: NavLink, category: Category): string | null {
  const [scope, subcategory] = link.tags;
  if (!subcategory) return null;
  if (scope === category.nameZh || scope === category.nameEn || scope === category.id) return subcategory;
  return null;
}

function buildCategoryNodes(categories: Category[], links: NavLink[]): CategoryNode[] {
  return categories.map((category) => {
    const categoryLinks = links.filter((link) => link.categoryId === category.id);
    const subcategoryMap = new Map<string, NavLink[]>();
    for (const link of categoryLinks) {
      const subcategory = getLinkSubcategory(link, category);
      if (!subcategory) continue;
      subcategoryMap.set(subcategory, [...(subcategoryMap.get(subcategory) ?? []), link]);
    }
    return {
      category,
      links: categoryLinks,
      subcategories: Array.from(subcategoryMap, ([title, subcategoryLinks]) => ({
        id: title,
        title,
        links: subcategoryLinks,
      })),
    };
  });
}

function buildDirectorySections(categories: Category[], links: NavLink[], selection: NavSelection, locale: Locale): DirectorySectionData[] {
  const nodes = buildCategoryNodes(categories, links);
  const sections: DirectorySectionData[] = [];
  for (const node of nodes) {
    if (selection.type === "category" && node.category.id !== selection.categoryId) continue;
    if (selection.type === "subcategory" && node.category.id !== selection.categoryId) continue;

    const Icon = iconMap[node.category.icon] ?? Folder;
    if (node.subcategories.length > 0) {
      for (const subcategory of node.subcategories) {
        if (selection.type === "subcategory" && subcategory.id !== selection.subcategory) continue;
        if (subcategory.links.length === 0) continue;
        sections.push({
          id: `${node.category.id}:${subcategory.id}`,
          title: subcategory.title,
          icon: <Icon size={24} style={{ color: node.category.color }} />,
          links: subcategory.links,
        });
      }
      continue;
    }

    if (node.links.length === 0) continue;
    sections.push({
      id: node.category.id,
      title: locale === "zh" ? node.category.nameZh : node.category.nameEn,
      icon: <Icon size={24} style={{ color: node.category.color }} />,
      links: node.links,
    });
  }
  return sections;
}

export default function App() {
  const isAdmin = window.location.pathname.startsWith("/admin");
  return isAdmin ? <AdminApp /> : <PublicApp />;
}

function BootstrapLoadingShell({
  locale,
  theme,
  setTheme,
  themePalette,
  setThemePalette,
}: {
  locale: Locale;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  themePalette: ThemePalette;
  setThemePalette: (palette: ThemePalette) => void;
}) {
  const title = locale === "zh" ? "橙子导航" : "Orange Nav";
  return (
    <div className="app-shell bootstrap-loading">
      <div className="noise-layer" />
      <aside className="sidebar">
        <div className="brand-mark">
          <span className="brand-chip">
            <img src="/logo-mark.svg" alt="" />
          </span>
          <div>
            <strong>{title}</strong>
            <span>{locale === "zh" ? "个人导航系统" : "Personal nav system"}</span>
          </div>
        </div>
        <div className="sidebar-label">{locale === "zh" ? "分类" : "Categories"}</div>
        <div className="loading-nav-stack" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div className="search-box loading-search" aria-hidden="true">
            <Search size={19} />
            <span />
            <em />
          </div>
          <div className="top-actions">
            <ThemeButton theme={theme} setTheme={setTheme} palette={themePalette} setPalette={setThemePalette} />
          </div>
        </header>
        <div className="directory-content">
          <div className="bootstrap-loading-panel" role="status">
            <span className="loading-pulse" />
            <strong>{locale === "zh" ? "正在加载导航数据" : "Loading navigation data"}</strong>
            <p>{locale === "zh" ? "稍等片刻，页面会在数据就绪后显示。" : "The page will appear when the data is ready."}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function PublicApp() {
  const [data, setData] = useState<BootstrapData | null>(() => readCachedBootstrap());
  const bootstrap = data ?? defaultBootstrap;
  const [locale, setLocale] = useStoredState<Locale>("cyber-nav-locale", bootstrap.settings.defaultLocale);
  const [theme, setTheme] = useStoredState<ThemeMode>("cyber-nav-theme", bootstrap.settings.defaultTheme);
  const [themePalette, setThemePalette] = useStoredThemePalette();
  const [query, setQuery] = useState("");
  const [selectionKey, setSelectionKey] = useState("all");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [favorites, setFavorites] = useStoredSet("cyber-nav-favorites");
  const [engineId, setEngineId] = useState("baidu");
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const directoryContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/public/bootstrap")
      .then((response) => {
        if (!response.ok) throw new Error("bootstrap failed");
        return response.json() as Promise<BootstrapData>;
      })
      .then((bootstrap) => {
        cacheBootstrap(bootstrap);
        setData(bootstrap);
        setEngineId(bootstrap.searchEngines.find((engine) => engine.isDefault)?.id ?? bootstrap.searchEngines[0]?.id ?? "baidu");
      })
      .catch(() => setData((current) => current ?? defaultBootstrap));
  }, []);

  useEffect(() => {
    applyTheme(theme, themePalette, bootstrap.settings.backgroundStyle);
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme(theme, themePalette, bootstrap.settings.backgroundStyle);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [bootstrap.settings.backgroundStyle, theme, themePalette]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const t = text[locale];
  const activeCategories = bootstrap.categories.filter((category) => category.isActive);
  const activeEngines = bootstrap.searchEngines.filter((engine) => engine.isActive);
  const selectedEngine = activeEngines.find((engine) => engine.id === engineId) ?? activeEngines[0] ?? defaultBootstrap.searchEngines[0];
  const queryMatchedLinks = useMemo(
    () =>
      filterLinks(
        bootstrap.links,
        {
          categoryId: "all",
          query,
          tags: [],
          favorites,
          favoriteOnly,
        },
        locale,
      ),
    [bootstrap.links, favoriteOnly, favorites, locale, query],
  );
  const sidebarNodes = useMemo(
    () => buildCategoryNodes(activeCategories, bootstrap.links.filter((link) => link.isActive)),
    [activeCategories, bootstrap.links],
  );
  const visibleLinks = queryMatchedLinks;
  const siteTitle = locale === "zh" ? bootstrap.settings.titleZh : bootstrap.settings.titleEn;
  useEffect(() => {
    if (data) document.title = siteTitle;
  }, [data, siteTitle]);

  const commonLinks = useMemo(
    () => visibleLinks.filter((link) => link.isPinned || link.isFavorite || favorites.has(link.id)),
    [favorites, visibleLinks],
  );
  const commonLinkIds = useMemo(() => new Set(commonLinks.map((link) => link.id)), [commonLinks]);
  const groupedSections = useMemo(() => {
    const sectionLinks = visibleLinks.filter((link) => !commonLinkIds.has(link.id));
    return buildDirectorySections(activeCategories, sectionLinks, { type: "all" }, locale);
  }, [activeCategories, commonLinkIds, locale, visibleLinks]);

  function runSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    window.open(buildSearchUrl(selectedEngine, trimmed), "_blank", "noopener,noreferrer");
  }

  function openRandom() {
    if (visibleLinks.length === 0) return;
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const link = visibleLinks[bytes[0] % visibleLinks.length];
    window.open(link.url, "_blank", "noopener,noreferrer");
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function scrollDirectoryTop() {
    directoryContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function focusSearch() {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }

  function scrollToSection(sectionId: string) {
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function getTargetSectionId(key: string): string | null {
    const selection = parseSelectionKey(key);
    if (selection.type === "all") return null;
    if (selection.type === "subcategory") return `${selection.categoryId}:${selection.subcategory}`;
    const node = sidebarNodes.find((item) => item.category.id === selection.categoryId);
    return node?.subcategories[0] ? `${selection.categoryId}:${node.subcategories[0].id}` : selection.categoryId;
  }

  function navigateToSection(key: string) {
    setSelectionKey(key);
    setSidebarOpen(false);
    const sectionId = getTargetSectionId(key);
    if (sectionId) scrollToSection(sectionId);
    else scrollDirectoryTop();
  }

  if (!data) {
    return <BootstrapLoadingShell locale={locale} theme={theme} setTheme={setTheme} themePalette={themePalette} setThemePalette={setThemePalette} />;
  }

  return (
    <div className="app-shell">
      <div className="noise-layer" />
      <aside className={clsx("sidebar", sidebarOpen && "sidebar-open")}>
        <div className="brand-mark">
          <span className="brand-chip">
            <img src="/logo-mark.svg" alt="" />
          </span>
          <div>
            <strong>{siteTitle}</strong>
            <span>{locale === "zh" ? "个人导航系统" : "Personal nav system"}</span>
          </div>
        </div>
        <div className="sidebar-label">{t.categories}</div>
        <nav className="category-list" aria-label={t.categories}>
          <button className={clsx("category-button", selectionKey === "all" && "active")} onClick={() => navigateToSection("all")}>
            <LayoutDashboard size={18} />
            <span>{t.all}</span>
            <em>{data.links.filter((link) => link.isActive).length}</em>
          </button>
          {sidebarNodes.map(({ category, links, subcategories }) => {
            const Icon = iconMap[category.icon] ?? Folder;
            const categoryKey = categorySelectionKey(category.id);
            const expanded = subcategories.length > 0 && (selectionKey === categoryKey || selectionKey.startsWith(`${subcategorySelectionPrefix(category.id)}:`) || selectionKey === "all");
            return (
              <div className={clsx("category-group", subcategories.length > 0 && "has-children")} key={category.id}>
                <button
                  className={clsx("category-button", selectionKey === categoryKey && "active")}
                  onClick={() => navigateToSection(categoryKey)}
                >
                  <Icon size={18} style={{ color: category.color }} />
                  <span>{locale === "zh" ? category.nameZh : category.nameEn}</span>
                  {subcategories.length > 0 ? <ChevronDown className="category-chevron" size={15} /> : <em>{links.length}</em>}
                </button>
                {expanded && (
                  <div className="subcategory-list">
                    {subcategories.map((subcategory) => {
                      const key = subcategorySelectionKey(category.id, subcategory.id);
                      return (
                        <button
                          className={clsx("subcategory-button", selectionKey === key && "active")}
                          key={key}
                          onClick={() => navigateToSection(key)}
                        >
                          <span>{subcategory.title}</span>
                          <em>{subcategory.links.length}</em>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <a href="/admin" className="ghost-link">
            <ShieldCheck size={16} />
            {t.admin}
          </a>
          <div className="sidebar-copyright">
            <span>© 2021 - 2026</span>
            <a href="https://www.nerocats.com/" target="_blank" rel="noreferrer">偏爱一丛花</a>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} aria-label="menu">
            <Menu size={20} />
          </button>
          <div className="search-box">
            <Search size={19} />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch();
              }}
              placeholder={t.searchPlaceholder}
            />
            <EngineSelect engines={activeEngines} selectedEngine={selectedEngine} onChange={setEngineId} />
          </div>
          <div className="top-actions">
            <button className={clsx("icon-button", favoriteOnly && "active")} onClick={() => setFavoriteOnly((value) => !value)} aria-label={t.favoriteOnly}>
              <Star size={18} />
            </button>
            <button className="icon-button" onClick={openRandom} aria-label={t.openRandom}>
              <Shuffle size={18} />
            </button>
            <button className="icon-button" onClick={() => setCommandOpen(true)} aria-label={t.command}>
              <Command size={18} />
            </button>
            <button className="icon-button" onClick={() => setLocale(locale === "zh" ? "en" : "zh")} aria-label="language">
              <Languages size={18} />
            </button>
            <ThemeButton theme={theme} setTheme={setTheme} palette={themePalette} setPalette={setThemePalette} />
          </div>
        </header>

        <div className="directory-content" ref={directoryContentRef}>
          <h1 className="sr-only">{siteTitle}</h1>
          {commonLinks.length > 0 && (
            <DirectorySection
              sectionId="section-favorites"
              title={locale === "zh" ? "我的常用" : "Favorites"}
              icon={<Sparkles size={24} />}
              links={commonLinks}
              categories={activeCategories}
              locale={locale}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          )}
          {groupedSections.map((section) => (
            <DirectorySection
              key={section.id}
              sectionId={section.id}
              title={section.title}
              icon={section.icon}
              links={section.links}
              categories={activeCategories}
              locale={locale}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          ))}
          {visibleLinks.length === 0 && <div className="empty-state">{t.noResult}</div>}
          <SiteFooter />
        </div>
        <div className="floating-actions" aria-label="quick actions">
          <button className="floating-action-button" onClick={scrollDirectoryTop} title="回到顶部" aria-label="回到顶部">
            <Navigation size={14} />
          </button>
          <button className="floating-action-button" onClick={focusSearch} title="搜索" aria-label="搜索">
            <Search size={14} />
          </button>
          <button className="floating-action-button" onClick={() => setCommandOpen(true)} title={t.command} aria-label={t.command}>
            <Bell size={14} />
          </button>
          <button className="floating-action-button" onClick={() => setTheme(getNextTheme(theme))} title="切换主题" aria-label="切换主题">
            <Moon size={14} />
          </button>
        </div>
      </main>

      {sidebarOpen && <button className="scrim" aria-label="close" onClick={() => setSidebarOpen(false)} />}
      {commandOpen && (
        <CommandPalette
          links={visibleLinks}
          locale={locale}
          onClose={() => setCommandOpen(false)}
          onSelect={(link) => {
            window.open(link.url, "_blank", "noopener,noreferrer");
            setCommandOpen(false);
          }}
        />
      )}
    </div>
  );
}

function DirectorySection({
  sectionId,
  title,
  icon,
  links,
  categories,
  locale,
  favorites,
  onToggleFavorite,
}: {
  sectionId: string;
  title: string;
  icon: React.ReactNode;
  links: NavLink[];
  categories: Category[];
  locale: Locale;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <section className="directory-section" id={sectionId}>
      <h2>
        {icon}
        <span>{title}</span>
      </h2>
      <div className="directory-grid">
        {links.map((link) => {
          const category = categories.find((item) => item.id === link.categoryId);
          const Icon = iconMap[category?.icon ?? "Globe2"] ?? Globe2;
          const description = locale === "zh" ? link.descriptionZh : link.descriptionEn || link.descriptionZh;
          const isFavorite = favorites.has(link.id) || link.isFavorite;
          return (
            <article className="directory-card" key={`${title}-${link.id}`}>
              <a href={link.url} target="_blank" rel="noreferrer" className="directory-card-main">
                <span className="directory-icon" style={{ color: category?.color ?? "#00f5ff" }}>
                  {link.iconUrl ? <img src={link.iconUrl} alt="" /> : <Icon size={24} />}
                </span>
                <span className="directory-copy">
                  <h3>{link.title}</h3>
                  <small>{description}</small>
                </span>
                <ExternalLink className="directory-open" size={15} />
              </a>
              <button className={clsx("star-button", isFavorite && "active")} onClick={() => onToggleFavorite(link.id)} aria-label="favorite">
                <Star size={15} />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>本站内容源自互联网，如有内容侵犯了你的权益，请联系删除相关内容，联系邮箱：klts1228@163.com</p>
      <p>
        © 2021 - 2026 By{" "}
        <a href="https://www.nerocats.com/" target="_blank" rel="noreferrer">
          偏爱一丛花
        </a>
      </p>
    </footer>
  );
}

function CommandPalette({
  links,
  locale,
  onClose,
  onSelect,
}: {
  links: NavLink[];
  locale: Locale;
  onClose: () => void;
  onSelect: (link: NavLink) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = filterLinks(
    links,
    {
      categoryId: "all",
      query,
      tags: [],
      favorites: new Set(),
      favoriteOnly: false,
    },
    locale,
  ).slice(0, 8);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="command-panel">
        <div className="command-search">
          <Command size={18} />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入入口名称" />
          <button className="icon-button" onClick={onClose} aria-label="close">
            <X size={17} />
          </button>
        </div>
        <div className="command-results">
          {filtered.map((link) => (
            <button key={link.id} onClick={() => onSelect(link)}>
              <span>{link.title}</span>
              <small>{new URL(link.url).hostname}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminApp() {
  const [locale, setLocale] = useStoredState<Locale>("cyber-nav-locale", "zh");
  const [theme, setTheme] = useStoredState<ThemeMode>("cyber-nav-theme", "dark");
  const [themePalette, setThemePalette] = useStoredThemePalette();
  const [session, setSession] = useState<"checking" | "anonymous" | "authenticated">("checking");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [data, setData] = useState<BootstrapData | null>(null);
  const [tab, setTab] = useState<"links" | "categories" | "engines" | "settings" | "import">("links");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [editingEngine, setEditingEngine] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<Category>(emptyCategory);
  const [linkForm, setLinkForm] = useState<NavLink>(emptyLink);
  const [engineForm, setEngineForm] = useState<SearchEngine>(emptyEngine);
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(defaultBootstrap.settings);
  const [jsonBuffer, setJsonBuffer] = useState("");
  const t = text[locale];
  const adminTitle = data ? (locale === "zh" ? data.settings.titleZh : data.settings.titleEn) : "橙子导航";

  useEffect(() => {
    applyTheme(theme, themePalette, data?.settings.backgroundStyle ?? defaultBootstrap.settings.backgroundStyle);
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme(theme, themePalette, data?.settings.backgroundStyle ?? defaultBootstrap.settings.backgroundStyle);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [data?.settings.backgroundStyle, theme, themePalette]);

  useEffect(() => {
    document.title = adminTitle;
  }, [adminTitle]);

  useEffect(() => {
    void apiGet("/api/admin/session")
      .then(async () => {
        await loadAdmin();
        setSession("authenticated");
      })
      .catch(() => setSession("anonymous"));
  }, []);

  async function loadAdmin() {
    const bootstrap = await apiGet<BootstrapData>("/api/admin/bootstrap");
    cacheBootstrap(bootstrap);
    setData(bootstrap);
    setSettingsForm(bootstrap.settings);
    setLinkForm({ ...emptyLink, categoryId: bootstrap.categories[0]?.id ?? null });
  }

  async function login() {
    setMessage("");
    await apiJson("/api/auth/login", "POST", { password });
    setPassword("");
    await loadAdmin();
    setSession("authenticated");
  }

  async function logout() {
    await apiJson("/api/auth/logout", "POST", {});
    setSession("anonymous");
  }

  async function saveCategory() {
    const saved = await apiJson<Category>(editingCategory ? `/api/admin/categories/${editingCategory}` : "/api/admin/categories", editingCategory ? "PUT" : "POST", categoryForm);
    setData((current) => (current ? { ...current, categories: upsertArray(current.categories, saved) } : current));
    setCategoryForm(emptyCategory);
    setEditingCategory(null);
  }

  async function saveLink() {
    const payload = { ...linkForm, url: normalizeUrl(linkForm.url) };
    const saved = await apiJson<NavLink>(editingLink ? `/api/admin/links/${editingLink}` : "/api/admin/links", editingLink ? "PUT" : "POST", payload);
    setData((current) => (current ? { ...current, links: upsertArray(current.links, saved) } : current));
    setLinkForm({ ...emptyLink, categoryId: data?.categories[0]?.id ?? null });
    setEditingLink(null);
  }

  async function saveEngine() {
    const saved = await apiJson<SearchEngine>(
      editingEngine ? `/api/admin/search-engines/${editingEngine}` : "/api/admin/search-engines",
      editingEngine ? "PUT" : "POST",
      engineForm,
    );
    setData((current) => (current ? { ...current, searchEngines: upsertArray(current.searchEngines, saved) } : current));
    setEngineForm(emptyEngine);
    setEditingEngine(null);
  }

  async function saveSettings() {
    const saved = await apiJson<SiteSettings>("/api/admin/settings", "PUT", settingsForm);
    setData((current) => (current ? { ...current, settings: saved } : current));
    setMessage("已保存");
  }

  async function remove(kind: "categories" | "links" | "search-engines", id: string) {
    await apiJson(`/api/admin/${kind}/${id}`, "DELETE", {});
    await loadAdmin();
  }

  if (session === "checking" || (session === "authenticated" && !data)) {
    return <div className="center-screen">Loading</div>;
  }

  if (session === "anonymous") {
    return (
      <div className="admin-login">
        <a className="home-icon-link" href="/" aria-label="返回首页" title="返回首页">
          <Home size={18} />
        </a>
        <div className="login-panel">
          <Lock size={32} />
          <h1>{t.loginTitle}</h1>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void login().catch((error: Error) => setMessage(error.message));
            }}
            placeholder={t.password}
          />
          <button className="primary-button" onClick={() => void login().catch((error: Error) => setMessage(error.message))}>
            {t.login}
          </button>
          {message && <p className="form-message">{message}</p>}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="center-screen">Loading</div>;
  }

  const adminData = data;

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="brand-mark">
          <span className="brand-chip">
            <img src="/logo-mark.svg" alt="" />
          </span>
          <div>
            <strong>{t.dashboard}</strong>
            <span>{adminData.settings.titleZh}</span>
          </div>
        </div>
        {[
          ["links", t.links, Globe2],
          ["categories", t.categories, Folder],
          ["engines", t.engines, Search],
          ["settings", t.settings, Settings],
          ["import", t.importExport, Database],
        ].map(([key, label, Icon]) => (
          <button key={String(key)} className={clsx("category-button", tab === key && "active")} onClick={() => setTab(key as typeof tab)}>
            <Icon size={18} />
            <span>{String(label)}</span>
          </button>
        ))}
        <button className="ghost-link" onClick={logout}>
          <LogOut size={16} />
          {t.logout}
        </button>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <a className="icon-button admin-home-button" href="/" aria-label="返回首页" title="返回首页">
            <Home size={18} />
          </a>
          <h1>{t.dashboard}</h1>
          <div className="top-actions">
            <button className="icon-button" onClick={() => setLocale(locale === "zh" ? "en" : "zh")} aria-label="language">
              <Languages size={18} />
            </button>
            <ThemeButton theme={theme} setTheme={setTheme} palette={themePalette} setPalette={setThemePalette} />
          </div>
        </header>

        <div className="admin-content">

        {tab === "links" && (
          <AdminSection title={t.links}>
            <LinkForm form={linkForm} setForm={setLinkForm} categories={adminData.categories} onSubmit={() => void saveLink()} t={t} />
            <AdminList
              items={adminData.links}
              title={(link) => link.title}
              detail={(link) => link.url}
              onEdit={(link) => {
                setEditingLink(link.id);
                setLinkForm(link);
              }}
              onDelete={(link) => void remove("links", link.id)}
            />
          </AdminSection>
        )}

        {tab === "categories" && (
          <AdminSection title={t.categories}>
            <CategoryForm form={categoryForm} setForm={setCategoryForm} onSubmit={() => void saveCategory()} t={t} />
            <AdminList
              items={adminData.categories}
              title={(category) => category.nameZh}
              detail={(category) => category.id}
              onEdit={(category) => {
                setEditingCategory(category.id);
                setCategoryForm(category);
              }}
              onDelete={(category) => void remove("categories", category.id)}
            />
          </AdminSection>
        )}

        {tab === "engines" && (
          <AdminSection title={t.engines}>
            <EngineForm form={engineForm} setForm={setEngineForm} onSubmit={() => void saveEngine()} t={t} />
            <AdminList
              items={adminData.searchEngines}
              title={(engine) => engine.name}
              detail={(engine) => engine.urlTemplate}
              onEdit={(engine) => {
                setEditingEngine(engine.id);
                setEngineForm(engine);
              }}
              onDelete={(engine) => void remove("search-engines", engine.id)}
            />
          </AdminSection>
        )}

        {tab === "settings" && (
          <AdminSection title={t.settings}>
            <SettingsForm form={settingsForm} setForm={setSettingsForm} onSubmit={() => void saveSettings()} t={t} />
          </AdminSection>
        )}

        {tab === "import" && (
          <AdminSection title={t.importExport}>
            <div className="admin-form">
              <AdminField label="JSON 内容" span="span-12" hint="可导出当前配置备份，也可以粘贴 JSON 后导入。">
                <textarea value={jsonBuffer} onChange={(event) => setJsonBuffer(event.target.value)} rows={18} />
              </AdminField>
              <div className="form-actions">
                <button className="tool-button" onClick={() => setJsonBuffer(JSON.stringify(adminData, null, 2))}>
                  {t.export}
                </button>
                <button
                  className="primary-button"
                  onClick={() =>
                    void apiJson<BootstrapData>("/api/admin/import", "POST", JSON.parse(jsonBuffer)).then((next) => {
                      setData(next);
                      setMessage("已导入");
                    })
                  }
                >
                  {t.import}
                </button>
              </div>
            </div>
          </AdminSection>
        )}
        {message && <p className="form-message">{message}</p>}
        </div>
      </main>
    </div>
  );
}

function ThemeButton({
  theme,
  setTheme,
  palette,
  setPalette,
}: {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  palette: ThemePalette;
  setPalette: (palette: ThemePalette) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedPalette = getPaletteDefinition(palette);
  const resolvedMode = getResolvedThemeMode(theme);
  const modeOptions: Array<{ key: ThemeMode; label: string; icon: React.ReactNode }> = [
    { key: "system", label: "跟随系统", icon: <Settings size={17} /> },
    { key: "light", label: "浅色", icon: <Sun size={17} /> },
    { key: "dark", label: "深色", icon: <Moon size={17} /> },
  ];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".appearance-control")) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div className="appearance-control">
      <button className="appearance-trigger" onClick={() => setOpen((value) => !value)} aria-label="theme" aria-haspopup="menu" aria-expanded={open}>
        <Settings size={18} />
        <span className="appearance-trigger-swatch" style={{ background: getThemeColors(resolvedMode, palette).accent }} />
        <span className="appearance-trigger-text">{selectedPalette.label}</span>
      </button>
      {open && (
        <div className="appearance-menu" role="menu">
          <div className="appearance-menu-group">
            <strong>模式</strong>
            {modeOptions.map((item) => (
              <button className="appearance-menu-item" key={item.key} onClick={() => setTheme(item.key)} role="menuitem">
                {item.icon}
                <span>{item.label}</span>
                {theme === item.key && <Check className="appearance-check" size={16} />}
              </button>
            ))}
          </div>
          <div className="appearance-menu-divider" />
          <div className="appearance-menu-group">
            <strong>配色</strong>
            <div className="appearance-palette-list">
              {THEME_PALETTES.map((item) => (
                <button className="appearance-menu-item" key={item.key} onClick={() => setPalette(item.key)} role="menuitem">
                  <span className="appearance-swatch" style={{ background: getThemeColors(resolvedMode, item.key).accent }} />
                  <span>{item.label}</span>
                  {palette === item.key && <Check className="appearance-check" size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="admin-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function AdminField({
  label,
  hint,
  span = "span-3",
  children,
}: {
  label: string;
  hint?: string;
  span?: "span-2" | "span-3" | "span-4" | "span-6" | "span-8" | "span-12";
  children: React.ReactNode;
}) {
  return (
    <label className={clsx("admin-field", span)}>
      <span className="admin-field-label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}



function CategoryForm({
  form,
  setForm,
  onSubmit,
  t,
}: {
  form: Category;
  setForm: (form: Category) => void;
  onSubmit: () => void;
  t: Record<string, string>;
}) {
  const SelectedIcon = iconMap[form.icon] ?? Folder;

  return (
    <div className="admin-form">
      <AdminField label="分类 ID" hint="留空会自动生成；建议使用英文、数字或短横线。">
        <input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="tools" />
      </AdminField>
      <AdminField label="中文名称">
        <input value={form.nameZh} onChange={(event) => setForm({ ...form, nameZh: event.target.value })} placeholder="AI 工具" />
      </AdminField>
      <AdminField label="英文名称">
        <input value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} placeholder="AI Tools" />
      </AdminField>
      <AdminField label="图标名称" hint="使用 lucide 图标名，例如 Folder、Bot。">
        <input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} placeholder="Folder" />
      </AdminField>
      <div className="icon-picker span-6">
        <span className="admin-field-label">图标预览</span>
        <div className="icon-picker-current">
          <SelectedIcon size={22} />
          <span>{form.icon || "Folder"}</span>
        </div>
        <div className="icon-picker-grid" aria-label="选择分类图标">
          {categoryIconOptions.map((iconName) => {
            const Icon = iconMap[iconName] ?? Folder;
            return (
              <button
                className={clsx("icon-picker-button", form.icon === iconName && "active")}
                key={iconName}
                type="button"
                onClick={() => setForm({ ...form, icon: iconName })}
                title={iconName}
                aria-label={iconName}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      </div>
      <AdminField label="强调色">
        <input value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} placeholder="#00f5ff" />
      </AdminField>
      <AdminField label="排序" span="span-2">
        <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} placeholder="10" />
      </AdminField>
      <div className="admin-toggle-group span-4">
        <span className="admin-field-label">状态</span>
        <label className="check-row">
          <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
          {t.active}
        </label>
      </div>
      <div className="form-actions">
        <button className="primary-button admin-save-button" onClick={onSubmit}>
          <Plus size={16} />
          {t.save}
        </button>
      </div>
    </div>
  );
}


function LinkForm({
  form,
  setForm,
  categories,
  onSubmit,
  t,
}: {
  form: NavLink;
  setForm: (form: NavLink) => void;
  categories: Category[];
  onSubmit: () => void;
  t: Record<string, string>;
}) {
  return (
    <div className="admin-form">
      <AdminField label="导航 ID" hint="留空会自动生成；导入旧数据时可保留原 ID。">
        <input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="nerocats-blog" />
      </AdminField>
      <AdminField label="站点名称">
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="偏爱一丛花" />
      </AdminField>
      <AdminField label="所属分类">
        <select value={form.categoryId ?? ""} onChange={(event) => setForm({ ...form, categoryId: event.target.value || null })}>
          <option value="">未分类</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nameZh}
            </option>
          ))}
        </select>
      </AdminField>
      <AdminField label="排序" span="span-2">
        <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} placeholder="100" />
      </AdminField>
      <AdminField label="站点网址" span="span-6">
        <input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://www.example.com" />
      </AdminField>
      <AdminField label="图标地址" span="span-6" hint="可填写 favicon、图片 URL；留空会使用默认图标。">
        <input value={form.iconUrl} onChange={(event) => setForm({ ...form, iconUrl: event.target.value })} placeholder="https://example.com/favicon.ico" />
      </AdminField>
      <AdminField label="中文描述" span="span-6">
        <input value={form.descriptionZh} onChange={(event) => setForm({ ...form, descriptionZh: event.target.value })} placeholder="我的网站、博客" />
      </AdminField>
      <AdminField label="英文描述" span="span-6">
        <input value={form.descriptionEn} onChange={(event) => setForm({ ...form, descriptionEn: event.target.value })} placeholder="My website and blog" />
      </AdminField>
      <AdminField label="标签" span="span-8" hint="多个标签用英文逗号分隔，例如：博客,工具,AI。">
        <input value={form.tags.join(",")} onChange={(event) => setForm({ ...form, tags: splitTags(event.target.value) })} placeholder="我的网站,博客" />
      </AdminField>
      <div className="admin-toggle-group span-4">
        <span className="admin-field-label">展示选项</span>
        <label className="check-row">
          <input type="checkbox" checked={form.isPinned} onChange={(event) => setForm({ ...form, isPinned: event.target.checked })} />
          {t.pinned}
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.isFavorite} onChange={(event) => setForm({ ...form, isFavorite: event.target.checked })} />
          {t.favoriteOnly}
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
          {t.active}
        </label>
      </div>
      <div className="form-actions">
        <button className="primary-button admin-save-button" onClick={onSubmit}>
          <Plus size={16} />
          {t.save}
        </button>
      </div>
    </div>
  );
}


function EngineForm({
  form,
  setForm,
  onSubmit,
  t,
}: {
  form: SearchEngine;
  setForm: (form: SearchEngine) => void;
  onSubmit: () => void;
  t: Record<string, string>;
}) {
  return (
    <div className="admin-form">
      <AdminField label="搜索引擎 ID">
        <input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="google" />
      </AdminField>
      <AdminField label="显示名称">
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Google" />
      </AdminField>
      <AdminField label="快捷码" span="span-2">
        <input value={form.shortcut} onChange={(event) => setForm({ ...form, shortcut: event.target.value })} placeholder="gg" />
      </AdminField>
      <AdminField label="排序" span="span-2">
        <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} placeholder="10" />
      </AdminField>
      <AdminField label="搜索地址模板" span="span-8" hint="必须包含 {query}，搜索时会替换为关键词。">
        <input value={form.urlTemplate} onChange={(event) => setForm({ ...form, urlTemplate: event.target.value })} placeholder="https://www.google.com/search?q={query}" />
      </AdminField>
      <div className="admin-toggle-group span-4">
        <span className="admin-field-label">状态</span>
        <label className="check-row">
          <input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} />
          {t.default}
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
          {t.active}
        </label>
      </div>
      <div className="form-actions">
        <button className="primary-button admin-save-button" onClick={onSubmit}>
          <Plus size={16} />
          {t.save}
        </button>
      </div>
    </div>
  );
}


function SettingsForm({
  form,
  setForm,
  onSubmit,
  t,
}: {
  form: SiteSettings;
  setForm: (form: SiteSettings) => void;
  onSubmit: () => void;
  t: Record<string, string>;
}) {
  return (
    <div className="admin-form">
      <AdminField label="中文站点名称">
        <input value={form.titleZh} onChange={(event) => setForm({ ...form, titleZh: event.target.value })} placeholder="橙子导航" />
      </AdminField>
      <AdminField label="英文站点名称">
        <input value={form.titleEn} onChange={(event) => setForm({ ...form, titleEn: event.target.value })} placeholder="Orange Nav" />
      </AdminField>
      <AdminField label="默认语言" span="span-2">
        <select value={form.defaultLocale} onChange={(event) => setForm({ ...form, defaultLocale: event.target.value as Locale })}>
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </AdminField>
      <AdminField label="默认主题" span="span-2">
        <select value={form.defaultTheme} onChange={(event) => setForm({ ...form, defaultTheme: event.target.value as ThemeMode })}>
          <option value="system">System</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </AdminField>
      <AdminField label="中文副标题" span="span-6">
        <input value={form.subtitleZh} onChange={(event) => setForm({ ...form, subtitleZh: event.target.value })} placeholder="个人导航系统" />
      </AdminField>
      <AdminField label="英文副标题" span="span-6">
        <input value={form.subtitleEn} onChange={(event) => setForm({ ...form, subtitleEn: event.target.value })} placeholder="Personal navigation system" />
      </AdminField>
      <AdminField label="背景风格" span="span-6">
        <select
          value={form.backgroundStyle}
          onChange={(event) => setForm({ ...form, backgroundStyle: event.target.value as BackgroundStyle })}
          aria-label="背景风格"
          title="背景风格"
        >
          {BACKGROUND_STYLES.map((style) => (
            <option key={style.id} value={style.id}>
              {style.nameZh} / {style.nameEn}
            </option>
          ))}
        </select>
      </AdminField>
      <div className="form-actions">
        <button className="primary-button admin-save-button" onClick={onSubmit}>
          <Check size={16} />
          {t.save}
        </button>
      </div>
    </div>
  );
}

function AdminList<T extends { id: string }>({
  items,
  title,
  detail,
  onEdit,
  onDelete,
}: {
  items: T[];
  title: (item: T) => string;
  detail: (item: T) => string;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}) {
  return (
    <div className="admin-list">
      {items.map((item) => (
        <div className="admin-list-row" key={item.id}>
          <button onClick={() => onEdit(item)}>
            <strong>{title(item)}</strong>
            <span>{detail(item)}</span>
          </button>
          <button className="danger-button" onClick={() => onDelete(item)} aria-label="delete">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function EngineSelect({
  engines,
  selectedEngine,
  onChange,
}: {
  engines: SearchEngine[];
  selectedEngine: SearchEngine;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const options = engines.length > 0 ? engines : [selectedEngine];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="engine-select" ref={wrapperRef}>
      <button className="engine-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-label="search engine" aria-haspopup="menu" aria-expanded={open}>
        <span>{selectedEngine.name}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="engine-menu" role="menu">
          {options.map((engine) => (
            <button
              className={clsx("engine-option", engine.id === selectedEngine.id && "active")}
              key={engine.id}
              type="button"
              role="menuitemradio"
              aria-checked={engine.id === selectedEngine.id}
              onClick={() => {
                onChange(engine.id);
                setOpen(false);
              }}
            >
              <span>{engine.name}</span>
              {engine.id === selectedEngine.id && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function useStoredState<T extends string>(key: string, fallback: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => (localStorage.getItem(key) as T | null) ?? fallback);
  return [
    value,
    (next) => {
      localStorage.setItem(key, next);
      setValue(next);
    },
  ];
}

function useStoredThemePalette(): [ThemePalette, (value: ThemePalette) => void] {
  const [value, setValue] = useState<ThemePalette>(() => {
    const stored = localStorage.getItem("cyber-nav-palette");
    return stored && isThemePalette(stored) ? stored : DEFAULT_THEME_PALETTE;
  });
  return [
    value,
    (next) => {
      localStorage.setItem("cyber-nav-palette", next);
      setValue(next);
    },
  ];
}

function useStoredSet(key: string): [Set<string>, (update: (current: Set<string>) => Set<string>) => void] {
  const [value, setValue] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem(key) || "[]") as string[]));
  return [
    value,
    (update) => {
      setValue((current) => {
        const next = update(current);
        localStorage.setItem(key, JSON.stringify(Array.from(next)));
        return next;
      });
    },
  ];
}

function getResolvedThemeMode(theme: ThemeMode): ResolvedThemeMode {
  return theme === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : theme;
}

function applyTheme(theme: ThemeMode, palette: ThemePalette, backgroundStyle: BackgroundStyle = DEFAULT_BACKGROUND_STYLE) {
  const resolved = getResolvedThemeMode(theme);
  const colors = getThemeColors(resolved, palette);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.palette = palette;
  document.documentElement.dataset.background = backgroundStyle;
  applyThemeVariables(colors, resolved);
  applyBackgroundVariables(backgroundStyle, resolved);
}

function applyThemeVariables(colors: ThemeColorSet, resolved: ResolvedThemeMode): void {
  const root = document.documentElement;
  const alphaPanel = resolved === "dark" ? "0.84" : "0.78";
  const alphaStrong = resolved === "dark" ? "0.94" : "0.94";
  const entries: Array<[string, string]> = [
    ["--bg", colors.pageBg],
    ["--bg-soft", colors.elevatedBg],
    ["--panel", hexToRgba(colors.panelBg, alphaPanel)],
    ["--panel-strong", hexToRgba(colors.sidebarBg, alphaStrong)],
    ["--text", colors.text],
    ["--muted", colors.muted],
    ["--line", hexToRgba(colors.border, resolved === "dark" ? "0.72" : "0.58")],
    ["--cyan", colors.accent],
    ["--yellow", colors.accentHover],
    ["--magenta", colors.accentHover],
    ["--green", colors.accentHover],
    ["--tile", hexToRgba(colors.panelBg, resolved === "dark" ? "0.72" : "0.68")],
    ["--tile-hover", hexToRgba(colors.elevatedBg, resolved === "dark" ? "0.94" : "0.96")],
    ["--field-bg", hexToRgba(colors.elevatedBg, resolved === "dark" ? "0.52" : "0.7")],
    ["--shadow", resolved === "dark" ? "0 24px 60px rgba(0, 0, 0, 0.36)" : "0 18px 44px rgba(31, 56, 64, 0.12)"],
  ];
  entries.forEach(([key, value]) => root.style.setProperty(key, value));
}

function applyBackgroundVariables(backgroundStyle: BackgroundStyle, resolved: ResolvedThemeMode): void {
  const root = document.documentElement;
  const background = getBackgroundDefinition(backgroundStyle);
  root.style.setProperty("--grid-bg", `url("${resolved === "dark" ? background.dark : background.light}")`);
}

function hexToRgba(value: string, alpha: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(value)) return value;
  const numeric = Number.parseInt(value.slice(1), 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function upsertArray<T extends { id: string }>(items: T[], item: T): T[] {
  const exists = items.some((current) => current.id === item.id);
  return exists ? items.map((current) => (current.id === item.id ? item : current)) : [...items, item];
}

function readCachedBootstrap(): BootstrapData | null {
  try {
    const raw = localStorage.getItem(BOOTSTRAP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isBootstrapData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function cacheBootstrap(data: BootstrapData): void {
  try {
    localStorage.setItem(BOOTSTRAP_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage can be unavailable in private browsing or strict browser settings.
  }
}

function isBootstrapData(value: unknown): value is BootstrapData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<BootstrapData>;
  return Boolean(data.settings) && Array.isArray(data.categories) && Array.isArray(data.links) && Array.isArray(data.searchEngines);
}

async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(await readApiError(response));
  return response.json() as Promise<T>;
}

async function apiJson<T>(url: string, method: "POST" | "PUT" | "DELETE", body: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return response.json() as Promise<T>;
}

async function readApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}
