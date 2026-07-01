import {
  Bot,
  Check,
  Cloud,
  Command,
  Database,
  ExternalLink,
  Folder,
  GitBranch,
  Globe2,
  Languages,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Moon,
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
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { defaultBootstrap } from "./data/defaults";
import type { BootstrapData, Category, Locale, NavLink, SearchEngine, SiteSettings, ThemeMode } from "./types";
import { buildSearchUrl, collectTags, filterLinks, normalizeUrl } from "./utils/navigation";

const iconMap: Record<string, LucideIcon> = {
  Bot,
  Cloud,
  Database,
  Folder,
  Github: GitBranch,
  Globe2,
  LayoutDashboard,
  Rocket,
  Sparkles,
  TerminalSquare,
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

export default function App() {
  const isAdmin = window.location.pathname.startsWith("/admin");
  return isAdmin ? <AdminApp /> : <PublicApp />;
}

function PublicApp() {
  const [data, setData] = useState<BootstrapData>(defaultBootstrap);
  const [locale, setLocale] = useStoredState<Locale>("cyber-nav-locale", defaultBootstrap.settings.defaultLocale);
  const [theme, setTheme] = useStoredState<ThemeMode>("cyber-nav-theme", defaultBootstrap.settings.defaultTheme);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [favorites, setFavorites] = useStoredSet("cyber-nav-favorites");
  const [engineId, setEngineId] = useState("baidu");
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    applyTheme(theme);
  }, [theme]);

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
  const tags = useMemo(() => collectTags(data.links.filter((link) => link.isActive)), [data.links]);
  const visibleLinks = useMemo(
    () =>
      filterLinks(
        data.links,
        {
          categoryId,
          query,
          tags: selectedTags,
          favorites,
          favoriteOnly,
        },
        locale,
      ),
    [categoryId, data.links, favoriteOnly, favorites, locale, query, selectedTags],
  );
  const siteTitle = locale === "zh" ? data.settings.titleZh : data.settings.titleEn;
  const siteSubtitle = locale === "zh" ? data.settings.subtitleZh : data.settings.subtitleEn;

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

  function toggleTag(tag: string) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="app-shell">
      <div className="noise-layer" />
      <aside className={clsx("sidebar", sidebarOpen && "sidebar-open")}>
        <div className="brand-mark">
          <span className="brand-chip">NC</span>
          <div>
            <strong>{siteTitle}</strong>
            <span>{locale === "zh" ? "个人导航系统" : "Personal nav system"}</span>
          </div>
        </div>
        <nav className="category-list" aria-label={t.categories}>
          <button className={clsx("category-button", categoryId === "all" && "active")} onClick={() => setCategoryId("all")}>
            <LayoutDashboard size={18} />
            <span>{t.all}</span>
            <em>{data.links.filter((link) => link.isActive).length}</em>
          </button>
          {activeCategories.map((category) => {
            const Icon = iconMap[category.icon] ?? Folder;
            return (
              <button
                className={clsx("category-button", categoryId === category.id && "active")}
                key={category.id}
                onClick={() => {
                  setCategoryId(category.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={18} style={{ color: category.color }} />
                <span>{locale === "zh" ? category.nameZh : category.nameEn}</span>
                <em>{data.links.filter((link) => link.isActive && link.categoryId === category.id).length}</em>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <a href="/admin" className="ghost-link">
            <ShieldCheck size={16} />
            {t.admin}
          </a>
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
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch();
              }}
              placeholder={t.searchPlaceholder}
            />
            <select value={engineId} onChange={(event) => setEngineId(event.target.value)} aria-label="search engine">
              {activeEngines.map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {engine.name}
                </option>
              ))}
            </select>
          </div>
          <div className="top-actions">
            <button className="icon-button" onClick={() => setCommandOpen(true)} aria-label={t.command}>
              <Command size={18} />
            </button>
            <button className="icon-button" onClick={() => setLocale(locale === "zh" ? "en" : "zh")} aria-label="language">
              <Languages size={18} />
            </button>
            <ThemeButton theme={theme} setTheme={setTheme} />
          </div>
        </header>

        <section className="hero-band">
          <div>
            <span className="kicker">CYBER NAV // 2077</span>
            <h1>{siteTitle}</h1>
            <p>{siteSubtitle}</p>
          </div>
          <div className="system-metrics" aria-label="metrics">
            <span>{visibleLinks.length.toString().padStart(2, "0")}</span>
            <small>{t.links}</small>
          </div>
        </section>

        <section className="tool-row" aria-label="filters">
          <div className="inline-filter">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.filterPlaceholder} />
          </div>
          <button className={clsx("tool-button", favoriteOnly && "active")} onClick={() => setFavoriteOnly((value) => !value)}>
            <Star size={16} />
            {t.favoriteOnly}
          </button>
          <button className="tool-button" onClick={openRandom}>
            <Shuffle size={16} />
            {t.openRandom}
          </button>
        </section>

        <section className="tag-rail" aria-label={t.tags}>
          {tags.map((tag) => (
            <button className={clsx("tag", selectedTags.includes(tag) && "active")} key={tag} onClick={() => toggleTag(tag)}>
              {tag}
            </button>
          ))}
        </section>

        <section className="link-grid" aria-label={t.links}>
          {visibleLinks.map((link) => {
            const category = activeCategories.find((item) => item.id === link.categoryId);
            const Icon = iconMap[category?.icon ?? "Globe2"] ?? Globe2;
            const isFavorite = favorites.has(link.id) || link.isFavorite;
            return (
              <article className={clsx("link-card", link.isPinned && "pinned")} key={link.id}>
                <div className="link-card-top">
                  <span className="link-icon" style={{ color: category?.color ?? "#00f5ff" }}>
                    {link.iconUrl ? <img src={link.iconUrl} alt="" /> : <Icon size={22} />}
                  </span>
                  <button className={clsx("star-button", isFavorite && "active")} onClick={() => toggleFavorite(link.id)} aria-label="favorite">
                    <Star size={17} />
                  </button>
                </div>
                <h2>{link.title}</h2>
                <p>{locale === "zh" ? link.descriptionZh : link.descriptionEn || link.descriptionZh}</p>
                <div className="card-tags">
                  {link.isPinned && <span>{t.pinned}</span>}
                  {link.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <a href={link.url} target="_blank" rel="noreferrer" className="open-link">
                  <ExternalLink size={16} />
                  {new URL(link.url).hostname.replace(/^www\./, "")}
                </a>
              </article>
            );
          })}
          {visibleLinks.length === 0 && <div className="empty-state">{t.noResult}</div>}
        </section>
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

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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
          <span className="brand-chip">ADM</span>
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
            <ThemeButton theme={theme} setTheme={setTheme} />
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

function ThemeButton({ theme, setTheme }: { theme: ThemeMode; setTheme: (theme: ThemeMode) => void }) {
  const nextTheme = theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Settings;
  return (
    <button className="icon-button" onClick={() => setTheme(nextTheme)} aria-label="theme">
      <Icon size={18} />
    </button>
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

function applyTheme(theme: ThemeMode) {
  const resolved = theme === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : theme;
  document.documentElement.dataset.theme = resolved;
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
