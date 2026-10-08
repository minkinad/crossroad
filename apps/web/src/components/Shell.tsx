import type * as React from "react";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { repository } from "../lib";
import { useSession } from "../session";

function ThemeButton() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("crossroad.theme") === "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("crossroad.theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <button
      className="icon-button"
      type="button"
      aria-label={dark ? "Светлая тема" : "Тёмная тема"}
      title={dark ? "Светлая тема" : "Тёмная тема"}
      onClick={() => setDark(!dark)}
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const { session, setSession } = useSession();
  const navigate = useNavigate();
  async function logout() {
    await repository.logout();
    setSession(null);
    navigate("/");
  }
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              ✳
            </span>
            <span>
              Cross<span className="brand-accent">Road</span>
            </span>
          </Link>
          <span className="header-note">Пространство для новых идей</span>
          <nav className="main-nav" aria-label="Главное меню">
            <NavLink to="/" end>
              Лента
            </NavLink>
            <NavLink to="/bookmarks">Закладки</NavLink>
            <NavLink to="/write">Написать</NavLink>
          </nav>
          <div className="header-actions">
            <ThemeButton />
            {repository.mode === "api" &&
              (session ? (
                <button className="text-button" onClick={logout}>
                  Выйти
                </button>
              ) : (
                <Link className="button small" to="/signin">
                  Войти
                </Link>
              ))}
          </div>
        </div>
      </header>
      {repository.mode === "demo" && (
        <div className="demo-banner" role="note">
          <span className="demo-badge">Демо-режим</span>
          <span>
            Ваши истории и закладки сохраняются только в этом браузере.
          </span>
        </div>
      )}
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <Link to="/" className="footer-brand">
              CrossRoad<span>✳</span>
            </Link>
            <p>Место, где одна мысль становится началом разговора.</p>
          </div>
          <div className="footer-links">
            <Link to="/">Читать</Link>
            <Link to="/write">Писать</Link>
            <Link to="/bookmarks">Закладки</Link>
            <Link to="/data">Мои данные</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© CrossRoad · Для любопытных и неравнодушных</span>
          <span>Код: MIT · Контент: CC BY-NC-SA 4.0</span>
        </div>
      </footer>
    </div>
  );
}
