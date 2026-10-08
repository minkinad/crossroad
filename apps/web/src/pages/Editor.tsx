import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  articleInput,
  type ArticleInput,
  type ArticleView,
} from "@crossroad/contracts";
import { repository } from "../lib";
import { useSession } from "../session";
import { Empty, ErrorState, Loading, Status, message } from "../ui";

export function Editor() {
  const { id } = useParams();
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const drafts = useQuery({
    queryKey: ["mine"],
    queryFn: repository.mine,
    enabled: Boolean(session),
  });
  const existing = id ? drafts.data?.find((item) => item.id === id) : undefined;
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [draft, setDraft] = useState<ArticleView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const value = existing;
    if (value) {
      setTitle(value.title);
      setSummary(value.summary);
      setBody(value.body);
      setTags(value.tags.join(", "));
      setDraft(value);
    }
  }, [existing]);
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
  if (id && drafts.isPending)
    return (
      <div className="page-wrap">
        <Loading />
      </div>
    );
  if (id && !existing && !draft)
    return (
      <div className="page-wrap">
        <ErrorState error={new Error("Черновик не найден")} />
      </div>
    );
  const current = draft ?? existing;
  function collect(): ArticleInput | null {
    const parsed = articleInput.safeParse({
      title,
      summary,
      body,
      tags: tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
    if (!parsed.success) {
      setError(
        "Проверьте поля: заголовок от 5, описание от 10, текст от 30 символов; до 5 тегов.",
      );
      return null;
    }
    setError("");
    return parsed.data;
  }
  async function save(publish: boolean) {
    const data = collect();
    if (!data) return;
    setBusy(true);
    try {
      const saved = current
        ? await repository.update(current.id, data, current.version)
        : await repository.create(data);
      const result = publish ? await repository.publish(saved.id) : saved;
      setDraft(result);
      void cache.invalidateQueries({ queryKey: ["mine"] });
      void cache.invalidateQueries({ queryKey: ["articles"] });
      if (publish) navigate(`/article/${result.slug}`);
      else if (!id) navigate(`/write/${result.id}`);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-wrap editor-page">
      <div className="editor-top">
        <Link to="/write">← Мои черновики</Link>
        <span className="eyebrow">
          {current ? "Редактирование черновика" : "Новая история"}
        </span>
      </div>
      <div className="editor-layout">
        <div className="editor-main">
          <p className="eyebrow">Ваша история начинается здесь</p>
          <h1>Создать публикацию</h1>
          <div className="editor-fields">
            <label htmlFor="editor-title">Заголовок</label>
            <input
              id="editor-title"
              className="title-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={140}
              placeholder="О чём вы хотите рассказать?"
            />
            <label htmlFor="editor-summary">Краткое описание</label>
            <textarea
              id="editor-summary"
              rows={2}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              maxLength={300}
              placeholder="Суть вашей истории в двух предложениях"
            />
            <label htmlFor="editor-body">Текст</label>
            <textarea
              id="editor-body"
              rows={16}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={40000}
              placeholder="Начните с самой важной мысли…"
            />
            <label htmlFor="editor-tags">Теги через запятую</label>
            <input
              id="editor-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="design, product"
            />
          </div>
          {error && <Status kind="error">{error}</Status>}
          <div className="editor-actions">
            <button
              className="button secondary"
              disabled={busy || current?.status === "PUBLISHED"}
              onClick={() => void save(false)}
            >
              Сохранить черновик
            </button>
            <button
              className="button"
              disabled={busy || current?.status === "PUBLISHED"}
              onClick={() => void save(true)}
            >
              Опубликовать ↗
            </button>
          </div>
        </div>
        <aside className="editor-help">
          <p className="eyebrow">Перед публикацией</p>
          <h2>Хороший текст начинается с ясной мысли.</h2>
          <p>
            Заголовок помогает найти материал. Краткое описание даёт контекст.
            Теги связывают вашу историю с близкими темами.
          </p>
          <p>
            Текст хранится как обычный текст; разметка и изображения появятся в
            следующем выпуске.
          </p>
        </aside>
      </div>
    </div>
  );
}
