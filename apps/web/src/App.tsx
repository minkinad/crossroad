import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { repository } from "./lib";
import type { Session } from "./lib/repository";
import { SessionContext } from "./session";
import { Shell } from "./components/Shell";
import { Loading } from "./ui";

const Home = lazy(() =>
  import("./pages/Home").then(({ Home }) => ({ default: Home })),
);
const ArticlePage = lazy(() =>
  import("./pages/ArticlePage").then(({ ArticlePage }) => ({
    default: ArticlePage,
  })),
);
const Editor = lazy(() =>
  import("./pages/Editor").then(({ Editor }) => ({ default: Editor })),
);
const WritingHome = lazy(() =>
  import("./pages/WritingHome").then(({ WritingHome }) => ({
    default: WritingHome,
  })),
);
const Bookmarks = lazy(() =>
  import("./pages/Bookmarks").then(({ Bookmarks }) => ({ default: Bookmarks })),
);
const AuthPage = lazy(() =>
  import("./pages/AuthPage").then(({ AuthPage }) => ({ default: AuthPage })),
);
const DataPage = lazy(() =>
  import("./pages/DataPage").then(({ DataPage }) => ({ default: DataPage })),
);
const NotFound = lazy(() =>
  import("./pages/NotFound").then(({ NotFound }) => ({ default: NotFound })),
);

function AppRoutes() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    repository
      .session()
      .then((value) => {
        if (active) setSession(value);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <SessionContext.Provider value={{ session, setSession, loading }}>
      <Shell>
        <Suspense
          fallback={
            <div className="page-wrap">
              <Loading />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
            <Route path="/write" element={<WritingHome />} />
            <Route path="/write/new" element={<Editor />} />
            <Route path="/write/:id" element={<Editor />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/signin" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage register />} />
            <Route path="/data" element={<DataPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Shell>
    </SessionContext.Provider>
  );
}
export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  );
}
