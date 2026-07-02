import {
  Bell,
  Bot,
  Check,
  ChevronDown,
  Cloud,
  Command,
  Database,
  ExternalLink,
  Film,
  Folder,
  GitBranch,
  Globe2,
  Languages,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Moon,
  Navigation,
  Network,
  Plus,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Star,
  Sun,
  TerminalSquare,
  Trash2,
  Users,
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
  Bot,
  Cloud,
  Database,
  Film,
  Folder,
  Github: GitBranch,
  Globe2,
  LayoutDashboard,
  Network,
  Rocket,
  Sparkles,
  TerminalSquare,
  Users,
};

const text = {
  zh: {
    all: "全部",
    admin: "后台",
    command: "命令",
    favoriteOnly: "收藏",
    filterPlaceholder: "搜索站点、标签或地址",
    links: "导航",
    noResult: "没有匹配的入口",
    openRandom: "随机",
    pinned: "置顶",
    searchPlaceholder: "搜索全网，也会同步筛选导航",
    tags: "标签",
    loginTitle: "进入后台",
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

function PublicApp() {
  const [data, setData] = useState<BootstrapData>(defaultBootstrap);
  const [locale, setLocale] = useStoredState<Locale>("cyber-nav-locale", defaultBootstrap.settings.defaultLocale);
  const [theme, setTheme] = useStoredState<ThemeMode>("cyber-nav-theme", defaultBootstrap.settings.defaultTheme);
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
        setData(bootstrap);
        setEngineId(bootstrap.searchEngines.find((engine) => engine.isDefault)?.id ?? bootstrap.searchEngines[0]?.id ?? "baidu");
      })
      .catch(() => setData(defaultBootstrap));
  }, []);

  useEffect(() => {
    applyTheme(theme, themePalette, data.settings.backgroundStyle);
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme(theme, themePalette, data.settings.backgroundStyle);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [data.settings.backgroundStyle, theme, themePalette]);

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
  const activeCategories = data.categories.filter((category) => category.isActive);
  const activeEngines = data.searchEngines.filter((engine) => engine.isActive);
  const selectedEngine = activeEngines.find((engine) => engine.id === engineId) ?? activeEngines[0] ?? defaultBootstrap.searchEngines[0];
  const queryMatchedLinks = useMemo(
    () =>
      filterLinks(
        data.links,
        {
          categoryId: "all",
          query,
          tags: [],
          favorites,
          favoriteOnly,
        },
        locale,
      ),
    [data.links, favoriteOnly, favorites, locale, query],
  );
  const sidebarNodes = useMemo(
    () => buildCategoryNodes(activeCategories, data.links.filter((link) => link.isActive)),
    [activeCategories, data.links],
  );
  const visibleLinks = queryMatchedLinks;
  const siteTitle = locale === "zh" ? data.settings.titleZh : data.settings.titleEn;
  useEffect(() => {
    document.title = siteTitle;
  }, [siteTitle]);

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
            <a href="https://www.nerocats.com/" target="_blank" rel="noreferrer">Nerocats</a>
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
          Nerocats
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
  const [data, setData] = useState<BootstrapData>(defaultBootstrap);
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
  const adminTitle = locale === "zh" ? data.settings.titleZh : data.settings.titleEn;

  useEffect(() => {
    applyTheme(theme, themePalette, data.settings.backgroundStyle);
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme(theme, themePalette, data.settings.backgroundStyle);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [data.settings.backgroundStyle, theme, themePalette]);

  useEffect(() => {
    document.title = adminTitle;
  }, [adminTitle]);

  useEffect(() => {
    void apiGet("/api/admin/session")
      .then(() => {
        setSession("authenticated");
        return loadAdmin();
      })
      .catch(() => setSession("anonymous"));
  }, []);

  async function loadAdmin() {
    const bootstrap = await apiGet<BootstrapData>("/api/admin/bootstrap");
    setData(bootstrap);
    setSettingsForm(bootstrap.settings);
    setLinkForm({ ...emptyLink, categoryId: bootstrap.categories[0]?.id ?? null });
  }

  async function login() {
    setMessage("");
    await apiJson("/api/auth/login", "POST", { password });
    setSession("authenticated");
    setPassword("");
    await loadAdmin();
  }

  async function logout() {
    await apiJson("/api/auth/logout", "POST", {});
    setSession("anonymous");
  }

  async function saveCategory() {
    const saved = await apiJson<Category>(editingCategory ? `/api/admin/categories/${editingCategory}` : "/api/admin/categories", editingCategory ? "PUT" : "POST", categoryForm);
    setData((current) => ({ ...current, categories: upsertArray(current.categories, saved) }));
    setCategoryForm(emptyCategory);
    setEditingCategory(null);
  }

  async function saveLink() {
    const payload = { ...linkForm, url: normalizeUrl(linkForm.url) };
    const saved = await apiJson<NavLink>(editingLink ? `/api/admin/links/${editingLink}` : "/api/admin/links", editingLink ? "PUT" : "POST", payload);
    setData((current) => ({ ...current, links: upsertArray(current.links, saved) }));
    setLinkForm({ ...emptyLink, categoryId: data.categories[0]?.id ?? null });
    setEditingLink(null);
  }

  async function saveEngine() {
    const saved = await apiJson<SearchEngine>(
      editingEngine ? `/api/admin/search-engines/${editingEngine}` : "/api/admin/search-engines",
      editingEngine ? "PUT" : "POST",
      engineForm,
    );
    setData((current) => ({ ...current, searchEngines: upsertArray(current.searchEngines, saved) }));
    setEngineForm(emptyEngine);
    setEditingEngine(null);
  }

  async function saveSettings() {
    const saved = await apiJson<SiteSettings>("/api/admin/settings", "PUT", settingsForm);
    setData((current) => ({ ...current, settings: saved }));
    setMessage("已保存");
  }

  async function remove(kind: "categories" | "links" | "search-engines", id: string) {
    await apiJson(`/api/admin/${kind}/${id}`, "DELETE", {});
    await loadAdmin();
  }

  if (session === "checking") {
    return <div className="center-screen">Loading</div>;
  }

  if (session === "anonymous") {
    return (
      <div className="admin-login">
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

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="brand-mark">
          <span className="brand-chip">
            <img src="/logo-mark.svg" alt="" />
          </span>
          <div>
            <strong>{t.dashboard}</strong>
            <span>{data.settings.titleZh}</span>
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
          <h1>{t.dashboard}</h1>
          <div className="top-actions">
            <button className="icon-button" onClick={() => setLocale(locale === "zh" ? "en" : "zh")} aria-label="language">
              <Languages size={18} />
            </button>
            <ThemeButton theme={theme} setTheme={setTheme} palette={themePalette} setPalette={setThemePalette} />
          </div>
        </header>

        {tab === "links" && (
          <AdminSection title={t.links}>
            <LinkForm form={linkForm} setForm={setLinkForm} categories={data.categories} onSubmit={() => void saveLink()} t={t} />
            <AdminList
              items={data.links}
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
              items={data.categories}
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
              items={data.searchEngines}
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
              <textarea value={jsonBuffer} onChange={(event) => setJsonBuffer(event.target.value)} rows={18} />
              <div className="form-actions">
                <button className="tool-button" onClick={() => setJsonBuffer(JSON.stringify(data, null, 2))}>
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
  return (
    <div className="admin-form">
      <input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="id" />
      <input value={form.nameZh} onChange={(event) => setForm({ ...form, nameZh: event.target.value })} placeholder="中文名称" />
      <input value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} placeholder="English name" />
      <input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} placeholder="Icon" />
      <input value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} placeholder={t.color} />
      <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} placeholder={t.sort} />
      <label className="check-row">
        <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
        {t.active}
      </label>
      <button className="primary-button" onClick={onSubmit}>
        <Plus size={16} />
        {t.save}
      </button>
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
      <input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="id" />
      <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t.title} />
      <input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder={t.url} />
      <select value={form.categoryId ?? ""} onChange={(event) => setForm({ ...form, categoryId: event.target.value || null })}>
        <option value="">未分类</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.nameZh}
          </option>
        ))}
      </select>
      <input value={form.descriptionZh} onChange={(event) => setForm({ ...form, descriptionZh: event.target.value })} placeholder="中文描述" />
      <input value={form.descriptionEn} onChange={(event) => setForm({ ...form, descriptionEn: event.target.value })} placeholder="English description" />
      <input value={form.iconUrl} onChange={(event) => setForm({ ...form, iconUrl: event.target.value })} placeholder="Icon URL" />
      <input value={form.tags.join(",")} onChange={(event) => setForm({ ...form, tags: splitTags(event.target.value) })} placeholder={t.tagsHint} />
      <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} placeholder={t.sort} />
      <div className="checkbox-grid">
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
      <button className="primary-button" onClick={onSubmit}>
        <Plus size={16} />
        {t.save}
      </button>
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
      <input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="id" />
      <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={t.title} />
      <input value={form.urlTemplate} onChange={(event) => setForm({ ...form, urlTemplate: event.target.value })} placeholder="https://...{query}" />
      <input value={form.shortcut} onChange={(event) => setForm({ ...form, shortcut: event.target.value })} placeholder={t.shortcut} />
      <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} placeholder={t.sort} />
      <label className="check-row">
        <input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} />
        {t.default}
      </label>
      <label className="check-row">
        <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
        {t.active}
      </label>
      <button className="primary-button" onClick={onSubmit}>
        <Plus size={16} />
        {t.save}
      </button>
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
      <input value={form.titleZh} onChange={(event) => setForm({ ...form, titleZh: event.target.value })} placeholder="中文标题" />
      <input value={form.titleEn} onChange={(event) => setForm({ ...form, titleEn: event.target.value })} placeholder="English title" />
      <input value={form.subtitleZh} onChange={(event) => setForm({ ...form, subtitleZh: event.target.value })} placeholder="中文副标题" />
      <input value={form.subtitleEn} onChange={(event) => setForm({ ...form, subtitleEn: event.target.value })} placeholder="English subtitle" />
      <select value={form.defaultLocale} onChange={(event) => setForm({ ...form, defaultLocale: event.target.value as Locale })}>
        <option value="zh">中文</option>
        <option value="en">English</option>
      </select>
      <select value={form.defaultTheme} onChange={(event) => setForm({ ...form, defaultTheme: event.target.value as ThemeMode })}>
        <option value="system">System</option>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
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
      <button className="primary-button" onClick={onSubmit}>
        <Check size={16} />
        {t.save}
      </button>
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
