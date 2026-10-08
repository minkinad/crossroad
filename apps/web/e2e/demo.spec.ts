import { expect, test } from "@playwright/test";

test("demo reader becomes a local author and saves an article", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Демо-режим")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Главные истории" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Написать" }).click();
  await page.getByRole("link", { name: "Новая история ↗" }).click();
  await page.getByLabel("Заголовок").fill("Почему мы пишем о системах");
  await page
    .getByLabel("Краткое описание")
    .fill("Небольшая заметка о ясности инженерных решений.");
  await page
    .getByLabel("Текст")
    .fill(
      "Хорошая архитектура начинается с конкретного сценария. Она должна оставаться понятной людям, которые работают с системой.",
    );
  await page.getByLabel("Теги через запятую").fill("architecture, writing");
  await page.getByRole("button", { name: "Опубликовать ↗" }).click();
  await expect(
    page.getByRole("heading", { name: "Почему мы пишем о системах" }),
  ).toBeVisible();
  await page.getByLabel("Ваш комментарий").fill("Полезная мысль о ясности.");
  await page.getByRole("button", { name: "Отправить комментарий" }).click();
  await expect(page.getByText("Полезная мысль о ясности.")).toBeVisible();
  await page.getByRole("button", { name: /Сохранить/ }).click();
  await page.getByRole("link", { name: "Закладки" }).click();
  await expect(
    page.getByRole("link", { name: "Почему мы пишем о системах" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Почему мы пишем о системах" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Лента" }).click();
  await page.getByLabel("Поиск по CrossRoad").fill("architecture");
  await page.getByRole("button", { name: "Искать" }).click();
  await expect(
    page.getByRole("heading", { name: "Результаты поиска" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Почему мы пишем о системах" }),
  ).toBeVisible();
});

test("demo does not imply real accounts and keeps keyboard navigation", async ({
  page,
}) => {
  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: "В демо нет учётных записей" }),
  ).toBeVisible();
  await page.goto("/");
  await page.screenshot({ path: "docs/images/home.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "docs/images/mobile.png", fullPage: true });
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "К содержимому" })).toBeFocused();
});
