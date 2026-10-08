import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { repository } from "../lib";
import { useSession } from "../session";
import { Empty, Status, message } from "../ui";

export function AuthPage({ register = false }: { register?: boolean }) {
  const { setSession } = useSession();
  const navigate = useNavigate();
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (repository.mode === "demo")
    return (
      <div className="page-wrap">
        <Empty title="В демо нет учётных записей">
          Попробуйте написать историю: она сохранится только в вашем браузере.
        </Empty>
      </div>
    );
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = register
        ? await repository.register({ handle, email, password })
        : await repository.login({ email, password });
      setSession(session);
      navigate("/write");
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">CrossRoad</p>
        <h1>{register ? "Присоединиться" : "С возвращением"}</h1>
        <p>Идеи становятся интереснее в разговоре.</p>
        <form onSubmit={submit}>
          {register && (
            <label>
              Имя пользователя
              <input
                autoComplete="username"
                required
                minLength={3}
                maxLength={24}
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 12 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <Status kind="error">{error}</Status>}
          <button className="button" disabled={busy}>
            {register ? "Создать аккаунт" : "Войти"}
          </button>
        </form>
        <p className="auth-switch">
          {register ? (
            <>
              Уже есть аккаунт? <Link to="/signin">Войти</Link>
            </>
          ) : (
            <>
              Впервые здесь? <Link to="/signup">Создать аккаунт</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
