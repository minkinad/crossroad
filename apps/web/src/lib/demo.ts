import type {
  ArticleInput,
  ArticleView,
  CommentView,
  Page,
  UserView,
} from "@crossroad/contracts";
import { seedPosts } from "../data/seed";
import { z } from "zod";
import type { BookmarkView, Repository, Session } from "./repository";
import { RepositoryError } from "./repository";

const key = "crossroad.demo.v3";
const legacyPost = z.object({
  id: z.string().min(1),
  type: z.enum(["article", "discussion"]),
  title: z.string().min(1),
  summary: z.string(),
  body: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
  createdAt: z.iso.datetime(),
  likes: z.number().int().nonnegative(),
  comments: z.array(
    z.object({
      id: z.string(),
      author: z.string(),
      text: z.string(),
      createdAt: z.iso.datetime(),
    }),
  ),
});
const userView = z.object({
  id: z.string(),
  handle: z.string(),
  role: z.enum(["USER", "MODERATOR", "ADMIN"]),
});
const articleView = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  version: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  publishedAt: z.iso.datetime().nullable(),
  author: userView,
  commentCount: z.number().int().nonnegative(),
  bookmarkCount: z.number().int().nonnegative(),
});
const commentView = z.object({
  id: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime(),
  author: userView,
});
const demoState = z.object({
  articles: z.array(articleView),
  comments: z.record(z.string(), z.array(commentView)),
  bookmarks: z.array(z.string()),
});
const demoUser: UserView = {
  id: "local-browser",
  handle: "Вы · локально",
  role: "USER",
};
interface State {
  articles: ArticleView[];
  comments: Record<string, CommentView[]>;
  bookmarks: string[];
}
function seed(): State {
  return {
    articles: seedPosts.map((post) => ({
      id: post.id,
      slug: post.id,
      title: post.title,
      summary: post.summary,
      body: post.body,
      tags: post.tags,
      status: "PUBLISHED",
      version: 1,
      createdAt: post.createdAt,
      publishedAt: post.createdAt,
      author: { id: `seed-${post.author}`, handle: post.author, role: "USER" },
      commentCount: post.comments.length,
      bookmarkCount: 0,
    })),
    comments: Object.fromEntries(
      seedPosts.map((post) => [
        post.id,
        post.comments.map((comment) => ({
          id: comment.id,
          body: comment.text,
          createdAt: comment.createdAt,
          author: {
            id: `seed-${comment.author}`,
            handle: comment.author,
            role: "USER",
          },
        })),
      ]),
    ),
    bookmarks: [],
  };
}
function load(): State {
  const raw = localStorage.getItem(key);
  if (!raw) return seed();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new RepositoryError(
      "Демо-данные повреждены. Скачайте их на странице «Мои локальные данные».",
      422,
    );
  }
  const result = demoState.safeParse(parsed);
  if (!result.success)
    throw new RepositoryError(
      "Демо-данные несовместимы. Скачайте их на странице «Мои локальные данные».",
      422,
    );
  return result.data;
}
function save(state: State) {
  localStorage.setItem(key, JSON.stringify(state));
}
function requireArticle(state: State, slug: string) {
  const article = state.articles.find((a) => a.slug === slug);
  if (!article) throw new RepositoryError("Материал не найден", 404);
  return article;
}
function requireOwned(state: State, id: string) {
  const article = state.articles.find((a) => a.id === id);
  if (!article) throw new RepositoryError("Черновик не найден", 404);
  if (article.author.id !== demoUser.id)
    throw new RepositoryError("Этот черновик принадлежит другому автору", 403);
  return article;
}
export function exportLegacyData(): Blob | null {
  const raw = localStorage.getItem("crossroad.posts.v2");
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new RepositoryError(
      "Старые данные повреждены. Сохраните копию из инструментов браузера.",
      422,
    );
  }
  if (!z.array(legacyPost).safeParse(value).success)
    throw new RepositoryError(
      "Старая схема не распознана; автоматический экспорт недоступен.",
      422,
    );
  return new Blob(
    [
      JSON.stringify(
        {
          format: "crossroad.posts.v2",
          exportedAt: new Date().toISOString(),
          posts: value,
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
}
export function exportDemoData(): Blob | null {
  const raw = localStorage.getItem(key);
  return raw === null ? null : new Blob([raw], { type: "text/plain" });
}
export const demoRepository: Repository = {
  mode: "demo",
  async session(): Promise<Session> {
    return { user: demoUser, demo: true };
  },
  async login() {
    throw new RepositoryError("В демо нет учётных записей", 400);
  },
  async register() {
    throw new RepositoryError("В демо нет учётных записей", 400);
  },
  async logout() {},
  async articles(page, query): Promise<Page<ArticleView>> {
    const q = query?.trim().toLowerCase();
    const all = load()
      .articles.filter(
        (a) =>
          a.status === "PUBLISHED" &&
          (!q ||
            `${a.title} ${a.summary} ${a.body} ${a.tags.join(" ")} ${a.author.handle}`
              .toLowerCase()
              .includes(q)),
      )
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
    return {
      items: all.slice((page - 1) * 10, page * 10),
      total: all.length,
      page,
      pageSize: 10,
    };
  },
  async article(slug) {
    const article = requireArticle(load(), slug);
    if (article.status !== "PUBLISHED" && article.author.id !== demoUser.id)
      throw new RepositoryError("Материал не найден", 404);
    return article;
  },
  async mine() {
    return load().articles.filter((a) => a.author.id === demoUser.id);
  },
  async create(data: ArticleInput) {
    const state = load();
    const id = crypto.randomUUID();
    const article: ArticleView = {
      ...data,
      id,
      slug: `local-${id}`,
      status: "DRAFT",
      version: 1,
      createdAt: new Date().toISOString(),
      publishedAt: null,
      author: demoUser,
      commentCount: 0,
      bookmarkCount: 0,
    };
    state.articles.unshift(article);
    save(state);
    return article;
  },
  async update(id, data, version) {
    const state = load();
    const article = requireOwned(state, id);
    if (article.status !== "DRAFT" || article.version !== version)
      throw new RepositoryError("Черновик изменился. Обновите страницу.", 409);
    Object.assign(article, data, { version: version + 1 });
    save(state);
    return article;
  },
  async publish(id) {
    const state = load();
    const article = requireOwned(state, id);
    if (article.status !== "DRAFT")
      throw new RepositoryError("Материал уже опубликован", 409);
    article.status = "PUBLISHED";
    article.publishedAt = new Date().toISOString();
    article.version++;
    save(state);
    return article;
  },
  async comments(slug) {
    const state = load();
    requireArticle(state, slug);
    return state.comments[slug] ?? [];
  },
  async comment(slug, body) {
    const state = load();
    const article = requireArticle(state, slug);
    const comment: CommentView = {
      id: crypto.randomUUID(),
      body,
      author: demoUser,
      createdAt: new Date().toISOString(),
    };
    state.comments[slug] = [...(state.comments[slug] ?? []), comment];
    article.commentCount++;
    save(state);
    return comment;
  },
  async bookmarks(): Promise<BookmarkView[]> {
    const state = load();
    return state.articles
      .filter((a) => state.bookmarks.includes(a.slug))
      .map((a) => ({
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        author: { handle: a.author.handle },
      }));
  },
  async bookmark(slug, add) {
    const state = load();
    const article = requireArticle(state, slug);
    const has = state.bookmarks.includes(slug);
    if (add && !has) {
      state.bookmarks.push(slug);
      article.bookmarkCount++;
    }
    if (!add && has) {
      state.bookmarks = state.bookmarks.filter((x) => x !== slug);
      article.bookmarkCount--;
    }
    save(state);
  },
};
