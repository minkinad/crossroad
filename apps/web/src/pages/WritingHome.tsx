import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { repository } from "../lib";
import { useSession } from "../session";
import { Empty, ErrorState, Loading } from "../ui";

export function WritingHome() {
  const { session, loading } = useSession();
  const drafts = useQuery({
    queryKey: ["mine"],
    queryFn: repository.mine,
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
        <Empty title="Войдите, чтобы писать">
          <Link to="/signin">Перейти ко входу</Link>
        </Empty>
      </div>
    );
  return (
    <div className="page-wrap utility-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Ваше пространство</p>
          <h1>Мои публикации</h1>
        </div>
        <Link className="button" to="/write/new">
          Новая история ↗
        </Link>
      </div>
      {drafts.isPending ? (
        <Loading />
      ) : drafts.isError ? (
        <ErrorState error={drafts.error} />
      ) : drafts.data?.length ? (
        <div className="utility-list">
          {drafts.data.map((item) => (
            <article key={item.id}>
              <span className="eyebrow">
                {item.status === "DRAFT" ? "Черновик" : "Опубликовано"}
              </span>
              <h2>
                <Link
                  to={
                    item.status === "DRAFT"
                      ? `/write/${item.id}`
                      : `/article/${item.slug}`
                  }
                >
                  {item.title}
                </Link>
              </h2>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="Здесь пока пусто">
          Создайте первую историю и сохраните её как черновик.
        </Empty>
      )}
    </div>
  );
}
