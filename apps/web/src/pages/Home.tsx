import { FormEvent, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { repository } from "../lib";
import { ArticleCard, Empty, ErrorState, Loading } from "../ui";

export function Home() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [page, setPage] = useState(1);
  const q = params.get("q") ?? "";
  const query = useQuery({
    queryKey: ["articles", page, q],
    queryFn: () => repository.articles(page, q),
  });
  useEffect(() => {
    setSearch(q);
    setPage(1);
  }, [q]);
  useEffect(() => {
    const normalized = search.trim();
    if (normalized === q) return;
    const timer = setTimeout(
      () => setParams(normalized ? { q: normalized } : {}),
      350,
    );
    return () => clearTimeout(timer);
  }, [search, q, setParams]);
  const items = query.data?.items ?? [];
  const feature = !q && page === 1 ? items[0] : undefined;
  const remaining = feature ? items.slice(1) : items;
  function onSearch(event: FormEvent) {
    event.preventDefault();
    setParams(search.trim() ? { q: search.trim() } : {});
  }
  return (
    <div className="page-wrap home-page">
      <section className="masthead">
        <div>
          <p className="eyebrow">Место встречи идей</p>
          <h1>
            Истории, у которых
            <br />
            <em>есть продолжение.</em>
          </h1>
          <p>
            Пишите о том, что исследуете. Находите интересные мысли. Обсуждайте
            по существу.
          </p>
          <Link to="/write" className="button">
            Начать писать <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="masthead-art" aria-hidden="true">
          <span className="art-orbit orbit-one" />
          <span className="art-orbit orbit-two" />
          <span className="art-center">
            C<span>×</span>R
          </span>
        </div>
      </section>
      <div className="content-grid">
        <div className="content-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Читайте и обсуждайте</p>
              <h2>{q ? `Результаты поиска` : "Главные истории"}</h2>
            </div>
            <span className="section-index">01 / Лента</span>
          </div>
          {q && (
            <p className="search-caption">
              Запрос: «{q}» · {query.data?.total ?? 0} материалов
            </p>
          )}
          {query.isPending ? (
            <Loading />
          ) : query.isError ? (
            <ErrorState
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : items.length === 0 ? (
            <Empty title="Пока ничего не найдено">
              Попробуйте другие слова или вернитесь к ленте.
            </Empty>
          ) : (
            <>
              {feature && <ArticleCard article={feature} featured />}
              <div className="story-list">
                {remaining.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
              <div className="pagination">
                <button
                  className="button secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Назад
                </button>
                <span>Страница {page}</span>
                <button
                  className="button secondary"
                  disabled={page * 10 >= (query.data?.total ?? 0)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Далее
                </button>
              </div>
            </>
          )}
        </div>
        <aside className="sidebar">
          <form className="search-form" onSubmit={onSearch} role="search">
            <label htmlFor="site-search">Поиск по CrossRoad</label>
            <div>
              <input
                id="site-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Тема, автор, тег…"
              />
              <button type="submit" aria-label="Искать">
                ↗
              </button>
            </div>
          </form>
          <div className="side-section">
            <p className="eyebrow">Темы для исследования</p>
            <div className="tag-cloud">
              {["product", "architecture", "design", "frontend", "mvp"].map(
                (tag) => (
                  <button key={tag} onClick={() => setParams({ q: tag })}>
                    #{tag}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="side-quote">
            <span aria-hidden="true">“</span>
            <p>Хорошая идея становится лучше, когда её можно обсудить.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
