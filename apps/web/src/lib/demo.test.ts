import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoRepository, exportDemoData, exportLegacyData } from "./demo";

const map = new Map<string, string>();
beforeEach(() => {
  map.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  });
});
describe("browser-only demo repository", () => {
  it("saves a draft and rejects stale edits", async () => {
    const data = {
      title: "A useful title",
      summary: "A useful summary for this article",
      body: "A long enough body for the article to be accepted.",
      tags: ["test"],
    };
    const draft = await demoRepository.create(data);
    expect(
      (await demoRepository.mine()).some((item) => item.id === draft.id),
    ).toBe(true);
    const updated = await demoRepository.update(
      draft.id,
      { ...data, title: "A better title" },
      draft.version,
    );
    expect(updated.version).toBe(2);
    await expect(
      demoRepository.update(draft.id, data, 1),
    ).rejects.toMatchObject({ status: 409 });
    expect((await demoRepository.publish(draft.id)).status).toBe("PUBLISHED");
  });
  it("exports the old key without deleting it", async () => {
    map.set(
      "crossroad.posts.v2",
      JSON.stringify([
        {
          id: "one",
          type: "article",
          title: "Old",
          summary: "Old summary",
          body: "Legacy text",
          author: "Visitor",
          tags: [],
          createdAt: "2026-03-08T10:15:00.000Z",
          likes: 0,
          comments: [],
        },
      ]),
    );
    const blob = exportLegacyData();
    expect(blob).not.toBeNull();
    expect(JSON.parse(await blob!.text()).format).toBe("crossroad.posts.v2");
    expect(map.has("crossroad.posts.v2")).toBe(true);
  });
  it("preserves malformed demo data for a raw export", async () => {
    map.set("crossroad.demo.v3", "{broken");
    await expect(demoRepository.articles(1)).rejects.toMatchObject({
      status: 422,
    });
    expect(await exportDemoData()?.text()).toBe("{broken");
    expect(map.get("crossroad.demo.v3")).toBe("{broken");
  });
});
