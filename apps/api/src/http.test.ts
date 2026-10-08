import { describe, expect, it } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { articleInput } from "@crossroad/contracts";
import { input, pageNumber } from "./http";

describe("HTTP validation", () => {
  it("bounds pagination before it reaches the database", () => {
    expect(pageNumber(undefined)).toBe(1);
    expect(pageNumber("10")).toBe(10);
    expect(() => pageNumber("-1")).toThrow(BadRequestException);
    expect(() => pageNumber("1.5")).toThrow(BadRequestException);
    expect(() => pageNumber("10001")).toThrow(BadRequestException);
  });
  it("rejects malformed article content", () => {
    expect(() => input(articleInput, { title: "x" })).toThrow(
      BadRequestException,
    );
  });
});
