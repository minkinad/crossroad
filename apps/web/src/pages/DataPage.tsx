import { useState } from "react";
import { exportDemoData, exportLegacyData } from "../lib/demo";
import { Status, message } from "../ui";

export function DataPage() {
  const [error, setError] = useState("");
  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportData(kind: "legacy" | "demo") {
    try {
      const blob = kind === "legacy" ? exportLegacyData() : exportDemoData();
      if (!blob) {
        setError("Локальные данные не найдены.");
        return;
      }
      download(
        blob,
        kind === "legacy"
          ? "crossroad-legacy-export.json"
          : "crossroad-demo-raw.txt",
      );
      setError("");
    } catch (cause) {
      setError(message(cause));
    }
  }
  return (
    <div className="page-wrap utility-page">
      <p className="eyebrow">Данные в вашем браузере</p>
      <h1>Экспорт записей</h1>
      <p>
        Если вы пользовались прежним прототипом, записи из{" "}
        <code>crossroad.posts.v2</code> можно скачать. Они не отправляются на
        сервер и не удаляются при экспорте. Импорт в новый аккаунт пока не
        поддерживается: у старых записей нет проверяемого владельца.
      </p>
      <div className="editor-actions">
        <button className="button" onClick={() => exportData("legacy")}>
          Скачать старые записи
        </button>
        <button className="button secondary" onClick={() => exportData("demo")}>
          Скачать данные демо
        </button>
      </div>
      {error && <Status kind="error">{error}</Status>}
    </div>
  );
}
