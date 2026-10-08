import type * as React from "react";
import { Link } from "react-router-dom";
import type { ArticleView } from "@crossroad/contracts";

const date = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
export function formatDate(value: string | null) {
  return value ? date.format(new Date(value)) : "Черновик";
}
export function countLabel(
  count: number,
  one: string,
  few: string,
  many: string,
) {
  const lastTwo = count % 100;
  const last = count % 10;
  const noun =
    lastTwo >= 11 && lastTwo <= 14
      ? many
      : last === 1
        ? one
        : last >= 2 && last <= 4
          ? few
          : many;
  return `${count} ${noun}`;
}
export function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Не удалось выполнить действие";
}
export function Status({
  children,
  kind = "info",
}: {
  children: React.ReactNode;
  kind?: "info" | "error";
}) {
  return (
    <p
      className={`status status-${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">✳</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="skeleton" />
      <span className="skeleton short" />
      <span className="skeleton" />
      <span className="visually-hidden">Загрузка</span>
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="empty-state" role="alert">
      <h2>Не удалось загрузить данные</h2>
      <p>{message(error)}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Повторить
        </button>
      )}
    </div>
  );
}
export function ArticleCard({
  article,
  featured = false,
}: {
  article: ArticleView;
  featured?: boolean;
}) {
  return (
    <article
      className={featured ? "article-card featured-card" : "article-card"}
    >
      {featured && <span className="featured-label">✳ В центре внимания</span>}
      <div className="article-overline">
        <span>{article.tags[0] ? `#${article.tags[0]}` : "Статья"}</span>
        <span>{formatDate(article.publishedAt)}</span>
      </div>
      <h3>
        <Link to={`/article/${article.slug}`}>{article.title}</Link>
      </h3>
      <p>{article.summary}</p>
      <div className="article-byline">
        <span className="avatar" aria-hidden="true">
          {article.author.handle.charAt(0).toUpperCase()}
        </span>
        <span>{article.author.handle}</span>
        <span className="dot">·</span>
        <span>{Math.max(1, Math.ceil(article.body.length / 1000))} мин</span>
      </div>
      <span className="card-arrow" aria-hidden="true">
        ↗
      </span>
    </article>
  );
}
