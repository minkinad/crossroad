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
              ×
            </span>
            <span>CrossRoad</span>
          </Link>
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
          Демо-режим · изменения сохраняются только в этом браузере. Учётных
          записей здесь нет.
        </div>
      )}
      <main id="main">{children}</main>
      <footer className="site-footer">
        <span>CrossRoad · Write. Discover. Discuss. Connect.</span>
        <span>
          <Link to="/data">Мои локальные данные</Link> · Код: MIT · Контент: CC
          BY-NC-SA 4.0
        </span>
      </footer>
    </div>
  );
}
