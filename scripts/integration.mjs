import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import EmbeddedPostgres from "embedded-postgres";
import { chromium } from "@playwright/test";

const run = promisify(execFile);
const freePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
const temp = await mkdtemp(join(tmpdir(), "crossroad-integration-"));
const dbPort = await freePort();
const apiPort = await freePort();
const webPort = await freePort();
const webOrigin = `http://127.0.0.1:${webPort}`;
const databaseUrl = `postgresql://crossroad:crossroad_test@127.0.0.1:${dbPort}/crossroad?schema=public`;
const secret = "integration-test-secret-32-bytes-long";
const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  SESSION_SECRET: secret,
  WEB_ORIGIN: webOrigin,
  PORT: String(apiPort),
  NODE_ENV: "test",
};
const pg = new EmbeddedPostgres({
  databaseDir: join(temp, "db"),
  user: "crossroad",
  password: "crossroad_test",
  port: dbPort,
  persistent: false,
  onLog: () => {},
});
let api;
let web;
let browser;
let started = false;
const origin = `http://127.0.0.1:${apiPort}`;
async function request(path, method = "GET", data, token, cookie) {
  const response = await fetch(`${origin}${path}`, {
    method,
    headers: {
      Origin: webOrigin,
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return {
    status: response.status,
    data: response.status === 204 ? null : await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}
try {
  await pg.initialise();
  await pg.start();
  started = true;
  await pg.createDatabase("crossroad");
  await run("pnpm", ["--filter", "@crossroad/api", "db:deploy"], {
    env,
    timeout: 90_000,
  });
  api = spawn(process.execPath, ["apps/api/dist/main.js"], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  api.stdout.on("data", (chunk) => (output += chunk));
  api.stderr.on("data", (chunk) => (output += chunk));
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      const response = await request("/health/ready");
      if (response.status === 200) {
        ready = true;
        break;
      }
    } catch {
      // The server may not be listening during the first readiness polls.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, `API did not become ready: ${output}`);
  assert.equal(
    (
      await fetch(`${origin}/auth/refresh`, {
        method: "POST",
        headers: { Origin: "http://untrusted.example" },
      })
    ).status,
    403,
  );
  const email = "test@example.com";
  const password = "correct horse battery staple";
  const registered = await request("/auth/register", "POST", {
    handle: "test_author",
    email,
    password,
  });
  assert.equal(registered.status, 201);
  assert.ok(registered.cookie);
  const token = registered.data.accessToken;
  assert.equal(
    (
      await request("/auth/register", "POST", {
        handle: "test_author",
        email,
        password,
      })
    ).status,
    409,
  );
  assert.equal(
    (await request("/articles", "POST", { title: "x" }, token)).status,
    400,
  );
  assert.equal(
    (
      await request("/articles", "POST", {
        title: "A valid title",
        summary: "Long enough summary",
        body: "A body long enough to satisfy the schema.",
      })
    ).status,
    401,
  );
  const input = {
    title: "A useful article",
    summary: "A concise but useful summary",
    body: "This is a useful article about architecture and testing.",
    tags: ["architecture"],
  };
  const created = await request("/articles", "POST", input, token);
  assert.equal(created.status, 201);
  assert.equal(created.data.status, "DRAFT");
  const id = created.data.id;
  const slug = created.data.slug;
  assert.equal(
    (await request(`/articles/${id}`, "PATCH", { ...input, version: 5 }, token))
      .status,
    409,
  );
  const updated = await request(
    `/articles/${id}`,
    "PATCH",
    { ...input, version: 1 },
    token,
  );
  assert.equal(updated.status, 200);
  assert.equal(updated.data.version, 2);
  const published = await request(
    `/articles/${id}/publish`,
    "POST",
    undefined,
    token,
  );
  assert.equal(published.status, 201);
  assert.equal(published.data.status, "PUBLISHED");
  assert.equal(
    (await request(`/articles/${id}/publish`, "POST", undefined, token)).status,
    409,
  );
  const found = await request("/articles?q=architecture");
  assert.equal(found.status, 200);
  assert.equal(found.data.total, 1);
  assert.equal(found.data.items[0].slug, slug);
  const laterPage = await request("/articles?page=2&q=architecture");
  assert.equal(laterPage.data.total, 1);
  assert.equal(laterPage.data.items.length, 0);
  assert.equal((await request("/articles/missing-slug")).status, 404);
  const discussion = await request(
    `/articles/${slug}/comments`,
    "POST",
    { body: "Thanks for sharing this." },
    token,
  );
  assert.equal(discussion.status, 201);
  assert.equal((await request(`/articles/${slug}/comments`)).data.length, 1);
  const second = await request("/auth/register", "POST", {
    handle: "second_author",
    email: "second@example.com",
    password,
  });
  assert.equal(second.status, 201);
  assert.equal(
    (
      await request(
        `/articles/${id}`,
        "PATCH",
        { ...input, version: 3 },
        second.data.accessToken,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        `/articles/${id}/publish`,
        "POST",
        undefined,
        second.data.accessToken,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        `/comments/${discussion.data.id}`,
        "DELETE",
        undefined,
        second.data.accessToken,
      )
    ).status,
    403,
  );
  const sessions = await request(
    "/auth/sessions",
    "GET",
    undefined,
    second.data.accessToken,
  );
  assert.equal(sessions.status, 200);
  assert.equal(sessions.data.length, 1);
  assert.equal(
    (
      await request(
        `/auth/sessions/${sessions.data[0].id}`,
        "DELETE",
        undefined,
        second.data.accessToken,
      )
    ).status,
    204,
  );
  assert.equal(
    (await request("/auth/me", "GET", undefined, second.data.accessToken))
      .status,
    401,
  );
  assert.equal(
    (await request(`/articles/${slug}/bookmark`, "POST", undefined, token))
      .status,
    204,
  );
  assert.equal(
    (await request(`/articles/${slug}/bookmark`, "POST", undefined, token))
      .status,
    409,
  );
  assert.equal(
    (await request("/bookmarks", "GET", undefined, token)).data.length,
    1,
  );
  const refreshed = await request(
    "/auth/refresh",
    "POST",
    undefined,
    undefined,
    registered.cookie,
  );
  assert.equal(refreshed.status, 200);
  assert.notEqual(refreshed.cookie, registered.cookie);
  assert.equal(
    (
      await request(
        "/auth/refresh",
        "POST",
        undefined,
        undefined,
        registered.cookie,
      )
    ).status,
    409,
  );
  assert.equal(
    (await request("/auth/me", "GET", undefined, refreshed.data.accessToken))
      .status,
    200,
  ); // A near-simultaneous refresh must not log out another tab.
  await new Promise((resolve) => setTimeout(resolve, 5_100));
  assert.equal(
    (
      await request(
        "/auth/refresh",
        "POST",
        undefined,
        undefined,
        registered.cookie,
      )
    ).status,
    401,
  );
  assert.equal(
    (await request("/auth/me", "GET", undefined, refreshed.data.accessToken))
      .status,
    401,
  );
  const loggedIn = await request("/auth/login", "POST", { email, password });
  assert.equal(loggedIn.status, 200);
  assert.equal(
    (
      await request(
        "/auth/logout",
        "POST",
        undefined,
        undefined,
        loggedIn.cookie,
      )
    ).status,
    204,
  );
  assert.equal(
    (await request("/auth/me", "GET", undefined, loggedIn.data.accessToken))
      .status,
    401,
  );
  const metrics = await request("/health/metrics");
  assert.ok(metrics.data.requests > 0 && metrics.data.errors > 0);
  console.log(
    "Integration flow passed: migration, auth, permissions, versioning, publication, FTS, comments, bookmarks, session revocation and refresh replay.",
  );
  if (process.env.RUN_BROWSER === "1") {
    await run("pnpm", ["--filter", "@crossroad/web", "build"], {
      env: {
        ...env,
        NODE_ENV: "production",
        VITE_DATA_MODE: "api",
        VITE_API_URL: origin,
      },
      timeout: 90_000,
    });
    web = spawn(
      "pnpm",
      [
        "--filter",
        "@crossroad/web",
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        String(webPort),
      ],
      { env, stdio: "ignore" },
    );
    let webReady = false;
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(webOrigin)).ok) {
          webReady = true;
          break;
        }
      } catch {
        /* wait for Vite */
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(webReady, "Fullstack web preview did not start");
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(`${webOrigin}/signup`);
    await page.getByLabel("Имя пользователя").fill("browser_writer");
    await page.getByLabel("Email").fill("browser@example.com");
    await page.getByLabel("Пароль").fill("long password for browser test");
    await page.getByRole("button", { name: "Создать аккаунт" }).click();
    await page.getByRole("link", { name: "Новая история ↗" }).click();
    await page.getByLabel("Заголовок").fill("A browser backed story");
    await page
      .getByLabel("Краткое описание")
      .fill("An API-backed story from the browser test");
    await page
      .getByLabel("Текст")
      .fill(
        "This story is stored in PostgreSQL after a real browser journey through the application.",
      );
    await page.getByLabel("Теги через запятую").fill("testing");
    await page.getByRole("button", { name: "Опубликовать ↗" }).click();
    await page
      .getByRole("heading", { name: "A browser backed story" })
      .waitFor();
    await page.getByLabel("Ваш комментарий").fill("A browser backed comment");
    await page.getByRole("button", { name: "Отправить комментарий" }).click();
    await page.getByText("A browser backed comment").waitFor();
    await page.getByRole("button", { name: /Сохранить/ }).click();
    await page.getByRole("button", { name: /В закладках/ }).waitFor();
    await page
      .getByRole("navigation", { name: "Главное меню" })
      .getByRole("link", { name: "Закладки" })
      .click();
    await page.getByRole("link", { name: "A browser backed story" }).waitFor();
    await page.reload();
    await page.getByRole("link", { name: "A browser backed story" }).waitFor();
    await page.getByRole("button", { name: "Выйти" }).click();
    await page.getByRole("link", { name: "Войти" }).waitFor();
    await page.reload();
    await page.getByRole("link", { name: "Войти" }).waitFor();
    console.log(
      "Fullstack browser flow passed: register, publish, comment, bookmark, reload, logout.",
    );
  }
} finally {
  if (browser) await browser.close();
  if (web) web.kill("SIGTERM");
  if (api) {
    api.kill("SIGTERM");
    await new Promise((resolve) => {
      if (api.exitCode !== null) resolve();
      else {
        api.once("exit", resolve);
        setTimeout(resolve, 3000);
      }
    });
  }
  if (started) await pg.stop();
  await rm(temp, { recursive: true, force: true });
}
