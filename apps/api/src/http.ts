import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { ZodType } from "zod";

export function input<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "Invalid request body",
      details: result.error.flatten(),
    });
  return result.data;
}
export function pageNumber(value: unknown): number {
  const n = Number(value ?? 1);
  if (!Number.isInteger(n) || n < 1 || n > 10000)
    throw new BadRequestException("Invalid page");
  return n;
}
export function bearer(request: Request): string {
  const match = /^Bearer (\S+)$/.exec(request.header("authorization") ?? "");
  if (!match) throw new UnauthorizedException();
  return match[1];
}
