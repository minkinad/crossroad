import type {
  ArticleInput,
  ArticleView,
  CommentView,
  LoginInput,
  Page,
  RegisterInput,
} from "@crossroad/contracts";
import type { BookmarkView, Repository, Session } from "./repository";
import { RepositoryError } from "./repository";

const origin = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
let accessToken = "";
let currentSession: Session | null = null;
let refreshInFlight: Promise<Session | null> | null = null;
async function request<T>(
  path: string,
  method = "GET",
  data?: unknown,
  authorized = false,
  retry = true,
): Promise<T> {
  const response = await fetch(`${origin}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(authorized ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (response.status === 401 && authorized && retry) {
    const renewed = await refreshSession();
    if (renewed) return request<T>(path, method, data, authorized, false);
  }
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new RepositoryError(
      error?.message ?? `Ошибка запроса (${response.status})`,
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
async function auth(
  path: string,
  data?: LoginInput | RegisterInput,
): Promise<Session> {
  const result = await request<{ user: Session["user"]; accessToken: string }>(
    `/auth/${path}`,
    "POST",
    data,
  );
  accessToken = result.accessToken;
  currentSession = { ...result, demo: false };
  return currentSession;
}
function refreshSession(): Promise<Session | null> {
  if (!refreshInFlight) {
    refreshInFlight = auth("refresh")
      .catch(async (error: unknown) => {
        if (error instanceof RepositoryError && error.status === 409) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          try {
            return await auth("refresh");
          } catch {
            /* fall through to signed-out state */
          }
        }
        accessToken = "";
        currentSession = null;
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}
export const apiRepository: Repository = {
  mode: "api",
  session() {
    if (currentSession && accessToken) return Promise.resolve(currentSession);
    return refreshSession();
  },
  login(data) {
    return auth("login", data);
  },
  register(data) {
    return auth("register", data);
  },
  async logout() {
    try {
      await request("/auth/logout", "POST");
    } finally {
      accessToken = "";
      currentSession = null;
    }
  },
  articles(page, query) {
    return request<Page<ArticleView>>(
      `/articles?page=${page}${query ? `&q=${encodeURIComponent(query)}` : ""}`,
    );
  },
  article(slug) {
    return request<ArticleView>(`/articles/${encodeURIComponent(slug)}`);
  },
  mine() {
    return request<ArticleView[]>("/articles/mine", "GET", undefined, true);
  },
  create(data: ArticleInput) {
    return request<ArticleView>("/articles", "POST", data, true);
  },
  update(id, data, version) {
    return request<ArticleView>(
      `/articles/${id}`,
      "PATCH",
      { ...data, version },
      true,
    );
  },
  publish(id) {
    return request<ArticleView>(
      `/articles/${id}/publish`,
      "POST",
      undefined,
      true,
    );
  },
  comments(slug) {
    return request<CommentView[]>(
      `/articles/${encodeURIComponent(slug)}/comments`,
    );
  },
  comment(slug, body) {
    return request<CommentView>(
      `/articles/${encodeURIComponent(slug)}/comments`,
      "POST",
      { body },
      true,
    );
  },
  bookmarks() {
    return request<BookmarkView[]>("/bookmarks", "GET", undefined, true);
  },
  bookmark(slug, add) {
    return request<void>(
      `/articles/${encodeURIComponent(slug)}/bookmark`,
      add ? "POST" : "DELETE",
      undefined,
      true,
    );
  },
};
