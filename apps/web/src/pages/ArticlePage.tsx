import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { commentInput } from "@crossroad/contracts";
import { repository } from "../lib";
import { useSession } from "../session";
import { ErrorState, Loading, Status, formatDate, message } from "../ui";

export function ArticlePage() {
  const { slug = "" } = useParams();
  const { session } = useSession();
  const cache = useQueryClient();
  const navigate = useNavigate();
  const article = useQuery({
    queryKey: ["article", slug],
    queryFn: () => repository.article(slug),
  });
  const comments = useQuery({
    queryKey: ["comments", slug],
    queryFn: () => repository.comments(slug),
  });
  const bookmarks = useQuery({
    queryKey: ["bookmarks"],
    queryFn: repository.bookmarks,
    enabled: Boolean(session),
  });
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const commenting = useMutation({
    mutationFn: (text: string) => repository.comment(slug, text),
    onSuccess: () => {
      setBody("");
      setError("");
      void cache.invalidateQueries({ queryKey: ["comments", slug] });
    },
  });
  const bookmarking = useMutation({
    mutationFn: (add: boolean) => repository.bookmark(slug, add),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["bookmarks"] });
      void cache.invalidateQueries({ queryKey: ["article", slug] });
    },
  });
  if (article.isPending)
    return (
      <div className="page-wrap">
        <Loading />
      </div>
    );
  if (article.isError)
    return (
      <div className="page-wrap">
        <ErrorState
          error={article.error}
          retry={() => void article.refetch()}
        />
      </div>
    );
  const value = article.data;
  const saved = bookmarks.data?.some((item) => item.slug === slug) ?? false;
  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = commentInput.safeParse({ body });
    if (!parsed.success) {
      setError("Комментарий должен содержать от 2 до 2000 символов.");
      return;
    }
    commenting.mutate(parsed.data.body);
  }
  return (
    <div className="article-page page-wrap">
      <div className="article-layout">
        <article className="article-full">
          <div className="breadcrumb">
            <Link to="/">Лента</Link>
            <span>/</span>
            <span>{value.tags[0] ?? "Статья"}</span>
          </div>
          <p className="eyebrow">
            {value.status === "DRAFT" ? "Черновик" : "Статья"} ·{" "}
            {formatDate(value.publishedAt)}
          </p>
          <h1>{value.title}</h1>
          <p className="article-deck">{value.summary}</p>
          <div className="article-meta">
            <span className="avatar large" aria-hidden="true">
              {value.author.handle.charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{value.author.handle}</strong>
              <span>
                {Math.max(1, Math.ceil(value.body.length / 1000))} мин чтения
              </span>
            </div>
          </div>
          <div className="article-body">
            {value.body.split(/\n\s*\n/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <div className="article-tags">
            {value.tags.map((tag) => (
              <Link key={tag} to={`/?q=${encodeURIComponent(tag)}`}>
                #{tag}
              </Link>
            ))}
          </div>
          <div className="article-actions">
            <button
              className="button secondary"
              disabled={bookmarking.isPending}
              onClick={() =>
                session ? bookmarking.mutate(!saved) : navigate("/signin")
              }
            >
              {saved ? "★ В закладках" : "☆ Сохранить"}
            </button>
            <button
              className="button secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setShareNotice("Ссылка скопирована.");
                } catch {
                  setShareNotice("Не удалось скопировать ссылку.");
                }
              }}
            >
              Поделиться ↗
            </button>
          </div>
          {bookmarking.isError && (
            <Status kind="error">{message(bookmarking.error)}</Status>
          )}
          {shareNotice && <Status>{shareNotice}</Status>}
          <section className="discussion" aria-labelledby="discussion-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Продолжите мысль</p>
                <h2 id="discussion-title">Обсуждение</h2>
              </div>
              <span>{comments.data?.length ?? 0} комментариев</span>
            </div>
            {comments.isPending ? (
              <Loading />
            ) : comments.isError ? (
              <ErrorState
                error={comments.error}
                retry={() => void comments.refetch()}
              />
            ) : comments.data?.length ? (
              <div className="comment-list">
                {comments.data.map((comment) => (
                  <article className="comment" key={comment.id}>
                    <span className="avatar" aria-hidden="true">
                      {comment.author.handle.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div className="comment-meta">
                        <strong>{comment.author.handle}</strong>
                        <time>{formatDate(comment.createdAt)}</time>
                      </div>
                      <p>{comment.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">
                Пока нет комментариев. Начните обсуждение.
              </p>
            )}
            {session ? (
              <form className="comment-form" onSubmit={submit}>
                <label htmlFor="comment-body">Ваш комментарий</label>
                <textarea
                  id="comment-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Какая мысль зацепила вас?"
                />
                {error && <Status kind="error">{error}</Status>}
                {commenting.isError && (
                  <Status kind="error">{message(commenting.error)}</Status>
                )}
                <button className="button" disabled={commenting.isPending}>
                  Отправить комментарий
                </button>
              </form>
            ) : (
              <p className="muted">
                <Link to="/signin">Войдите</Link>, чтобы участвовать в
                обсуждении.
              </p>
            )}
          </section>
        </article>
        <aside className="article-aside">
          <div className="aside-rule" />
          <p className="eyebrow">Об этой истории</p>
          <p>{value.summary}</p>
          <span>
            {value.commentCount} комментариев · {value.bookmarkCount} закладок
          </span>
          <Link to="/">← Все истории</Link>
        </aside>
      </div>
    </div>
  );
}
