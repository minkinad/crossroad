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
        <div className="masthead-copy">
          <p className="eyebrow hero-eyebrow">
            <span aria-hidden="true">✳</span> Место встречи идей
          </p>
          <h1>
            Идеи начинаются
            <br />
            <em>с разговора.</em>
          </h1>
          <p>
            Читайте истории людей, которым есть что сказать. Делитесь своими
            открытиями и находите тех, кто мыслит в том же направлении.
          </p>
          <div className="hero-actions">
            <a href="#stories" className="button hero-read">
              Читать истории <span aria-hidden="true">↘</span>
            </a>
            <Link to="/write" className="hero-write">
              Начать писать <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="hero-footnote">
            <span aria-hidden="true">↗</span> Точка пересечения разных взглядов
          </div>
        </div>
        <div className="masthead-art" aria-hidden="true">
          <span className="art-kicker">CROSSROAD / ИДЕИ В ДВИЖЕНИИ</span>
          <span className="art-orbit orbit-one" />
          <span className="art-orbit orbit-two" />
          <span className="art-center">
            C<span>×</span>R
          </span>
          <span className="art-stamp">
            Открыто
            <br />
            для всех <b>↗</b>
          </span>
          <span className="art-index">01 — ∞</span>
        </div>
      </section>
      <div className="discovery-panel" id="stories">
        <div className="discovery-intro">
          <span className="eyebrow">Найти своё</span>
          <strong>Какую историю ищем?</strong>
        </div>
        <form className="search-form" onSubmit={onSearch} role="search">
          <label htmlFor="site-search">Поиск по CrossRoad</label>
          <div className="search-control">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              id="site-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Тема, автор, ключевое слово…"
            />
            <button type="submit">
              Искать <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
        <div className="topic-filter" aria-label="Популярные темы">
          <span>Популярное:</span>
          {["product", "architecture", "design", "frontend", "mvp"].map(
            (tag) => (
              <button
                type="button"
                key={tag}
                aria-pressed={q === tag}
                onClick={() => {
                  setSearch(tag);
                  setParams({ q: tag });
                }}
              >
                #{tag}
              </button>
            ),
          )}
          {q && (
            <button
              type="button"
              className="clear-filter"
              onClick={() => {
                setSearch("");
                setParams({});
              }}
            >
              Сбросить ×
            </button>
          )}
        </div>
      </div>
      <div className="content-grid">
        <div className="content-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Лента / Свежие голоса</p>
              <h2>{q ? `Результаты поиска` : "Главные истории"}</h2>
            </div>
            <span className="section-index">
              Выбирайте, читайте, обсуждайте ↗
            </span>
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
          <div className="side-section side-about">
            <span className="side-asterisk" aria-hidden="true">
              ✳
            </span>
            <p className="eyebrow">Про CrossRoad</p>
            <h3>
              Разные взгляды.
              <br />
              Общая точка.
            </h3>
            <p>
              Здесь можно читать вдумчиво, писать свободно и продолжать разговор
              в комментариях.
            </p>
            <Link to="/write">
              Поделитесь своей мыслью <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="side-quote">
            <span aria-hidden="true">“</span>
            <p>Хорошая идея становится лучше, когда её можно обсудить.</p>
            <small>— ПРИНЦИП CROSSROAD</small>
          </div>
        </aside>
      </div>
    </div>
  );
}
