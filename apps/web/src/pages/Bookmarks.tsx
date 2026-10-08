import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { repository } from "../lib";
import { useSession } from "../session";
import { Empty, ErrorState, Loading } from "../ui";

export function Bookmarks() {
  const { session, loading } = useSession();
  const query = useQuery({
    queryKey: ["bookmarks"],
    queryFn: repository.bookmarks,
    enabled: Boolean(session),
  });
  if (loading)
    return (
      <div className="page-wrap">
        <Loading />
      </div>
    );
  if (!session)
    return (
      <div className="page-wrap">
        <Empty title="Войдите, чтобы сохранять истории">
          <Link to="/signin">Перейти ко входу</Link>
        </Empty>
      </div>
    );
  return (
    <div className="page-wrap utility-page">
      <p className="eyebrow">Личная библиотека</p>
      <h1>Закладки</h1>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} />
      ) : query.data?.length ? (
        <div className="utility-list">
          {query.data.map((item) => (
            <article key={item.slug}>
              <span className="eyebrow">{item.author.handle}</span>
              <h2>
                <Link to={`/article/${item.slug}`}>{item.title}</Link>
              </h2>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="Пока нет закладок">
          Сохраняйте статьи, к которым хотите вернуться.
        </Empty>
      )}
    </div>
  );
}
