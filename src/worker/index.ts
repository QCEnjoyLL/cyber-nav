import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { ZodError, type ZodSchema } from "zod";
import {
  countRecentFailedLogins,
  deleteCategory,
  deleteLink,
  deleteSearchEngine,
  getBootstrap,
  getSettings,
  importData,
  listCategories,
  listLinks,
  listSearchEngines,
  recordLoginAttempt,
  reorderLinksByGroups,
  updateSettings,
  upsertCategory,
  upsertLink,
  upsertSearchEngine,
} from "./db";
import {
  createSessionToken,
  getSecret,
  hashClientId,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
  verifySessionToken,
} from "./auth";
import {
  categorySchema,
  importSchema,
  linkSchema,
  loginSchema,
  searchEngineSchema,
  settingsSchema,
} from "./validation";

type RuntimeEnv = Env & {
  ADMIN_PASSWORD_HASH?: string;
  SESSION_SECRET?: string;
};

type AppEnv = {
  Bindings: RuntimeEnv;
};

const app = new Hono<AppEnv>();
const admin = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
});

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    service: "cyber-nav",
    time: new Date().toISOString(),
  }),
);

app.get("/api/public/bootstrap", async (c) => {
  return c.json(await getBootstrap(c.env.DB, false));
});

app.post("/api/auth/login", async (c) => {
  const body = await parseJson(c.req.raw, loginSchema);
  const sessionSecret = getSecret(c.env, "SESSION_SECRET");
  const passwordHash = getSecret(c.env, "ADMIN_PASSWORD_HASH");
  const ipHash = await hashClientId(getClientId(c.req.raw), sessionSecret);
  const failedAttempts = await countRecentFailedLogins(c.env.DB, ipHash);

  if (failedAttempts >= 8) {
    throw new HTTPException(429, { message: "登录失败次数过多，请 15 分钟后再试。" });
  }

  const passwordValid = await verifyPassword(body.password, passwordHash);
  await recordLoginAttempt(c.env.DB, ipHash, passwordValid);
  if (!passwordValid) {
    throw new HTTPException(401, { message: "密码不正确。" });
  }

  const token = await createSessionToken(sessionSecret);
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isHttps(c.req.raw),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return c.json({ ok: true });
});

app.post("/api/auth/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, {
    path: "/",
    secure: isHttps(c.req.raw),
    sameSite: "Lax",
  });
  return c.json({ ok: true });
});

admin.use("*", async (c, next) => {
  const sessionSecret = getSecret(c.env, "SESSION_SECRET");
  const token = getCookie(c, SESSION_COOKIE);
  const valid = await verifySessionToken(token, sessionSecret);
  if (!valid) {
    throw new HTTPException(401, { message: "需要登录后台。" });
  }
  await next();
});

admin.get("/session", (c) => c.json({ ok: true }));
admin.get("/bootstrap", async (c) => c.json(await getBootstrap(c.env.DB, true)));
admin.get("/export", async (c) => c.json(await getBootstrap(c.env.DB, true)));

admin.post("/import", async (c) => {
  const body = await parseJson(c.req.raw, importSchema);
  return c.json(await importData(c.env.DB, body));
});

admin.get("/settings", async (c) => c.json(await getSettings(c.env.DB)));
admin.put("/settings", async (c) => {
  const body = await parseJson(c.req.raw, settingsSchema);
  return c.json(await updateSettings(c.env.DB, body));
});

admin.get("/categories", async (c) => c.json(await listCategories(c.env.DB, true)));
admin.post("/categories", async (c) => c.json(await upsertCategory(c.env.DB, await parseJson(c.req.raw, categorySchema)), 201));
admin.put("/categories/:id", async (c) => {
  const body = await parseJson(c.req.raw, categorySchema);
  return c.json(await upsertCategory(c.env.DB, { ...body, id: c.req.param("id") }));
});
admin.delete("/categories/:id", async (c) => {
  await deleteCategory(c.env.DB, c.req.param("id"));
  return c.json({ ok: true });
});

admin.get("/links", async (c) => c.json(await listLinks(c.env.DB, true)));
admin.post("/links/reorder", async (c) => c.json(await reorderLinksByGroups(c.env.DB)));
admin.post("/links", async (c) => c.json(await upsertLink(c.env.DB, await parseJson(c.req.raw, linkSchema)), 201));
admin.put("/links/:id", async (c) => {
  const body = await parseJson(c.req.raw, linkSchema);
  return c.json(await upsertLink(c.env.DB, { ...body, id: c.req.param("id") }));
});
admin.delete("/links/:id", async (c) => {
  await deleteLink(c.env.DB, c.req.param("id"));
  return c.json({ ok: true });
});

admin.get("/search-engines", async (c) => c.json(await listSearchEngines(c.env.DB, true)));
admin.post("/search-engines", async (c) =>
  c.json(await upsertSearchEngine(c.env.DB, await parseJson(c.req.raw, searchEngineSchema)), 201),
);
admin.put("/search-engines/:id", async (c) => {
  const body = await parseJson(c.req.raw, searchEngineSchema);
  return c.json(await upsertSearchEngine(c.env.DB, { ...body, id: c.req.param("id") }));
});
admin.delete("/search-engines/:id", async (c) => {
  await deleteSearchEngine(c.env.DB, c.req.param("id"));
  return c.json({ ok: true });
});

app.route("/api/admin", admin);

app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError((error, c) => {
  const status = error instanceof HTTPException ? error.status : 500;
  const message = error instanceof HTTPException ? error.message : "Internal server error";
  console.error(
    JSON.stringify({
      message: "request failed",
      error: error instanceof Error ? error.message : String(error),
      path: new URL(c.req.url).pathname,
      status,
    }),
  );
  return c.json({ error: message }, status);
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return await app.fetch(request, env as RuntimeEnv, ctx);
  },
} satisfies ExportedHandler<Env>;

async function parseJson<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HTTPException(400, { message: error.issues.map((issue) => issue.message).join("; ") });
    }
    throw new HTTPException(400, { message: "请求体不是有效 JSON。" });
  }
}

function getClientId(request: Request): string {
  const cfIp = request.headers.get("CF-Connecting-IP");
  const forwarded = request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim();
  return cfIp || forwarded || "local-dev";
}

function isHttps(request: Request): boolean {
  const proto = request.headers.get("X-Forwarded-Proto");
  return new URL(request.url).protocol === "https:" || proto === "https";
}
