import { describe, expect, it } from "vitest";
import { articleInput, commentInput, registerInput } from "./index.js";

describe("write boundaries", () => {
  it("normalizes tags and rejects unsafe or oversized input", () => {
    const data = {
      title: "Useful title",
      summary: "A helpful short description",
      body: "A substantial body with enough words to publish safely.",
      tags: [" Architecture "],
    };
    expect(articleInput.parse(data).tags).toEqual(["architecture"]);
    expect(
      articleInput.parse({ ...data, tags: ["Architecture", "architecture"] })
        .tags,
    ).toEqual(["architecture"]);
    expect(
      articleInput.safeParse({ ...data, tags: ["<script>"] }).success,
    ).toBe(false);
    expect(articleInput.safeParse({ ...data, body: "short" }).success).toBe(
      false,
    );
  });
  it("requires meaningful comments and strong registration passwords", () => {
    expect(commentInput.safeParse({ body: "  " }).success).toBe(false);
    expect(
      registerInput.safeParse({
        handle: "abc",
        email: "a@example.com",
        password: "weak",
      }).success,
    ).toBe(false);
  });
});
