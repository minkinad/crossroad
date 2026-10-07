import { z } from "zod";

export const articleInput = z.object({
  title: z.string().trim().min(5).max(140),
  summary: z.string().trim().min(10).max(300),
  body: z.string().trim().min(30).max(40000),
  tags: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[\p{L}\p{N}-]{2,32}$/u),
    )
    .max(5)
    .default([])
    .transform((tags) => [...new Set(tags)]),
});
export const commentInput = z.object({
  body: z.string().trim().min(2).max(2000),
});
export const registerInput = z.object({
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/),
  email: z.email().max(254).toLowerCase(),
  password: z.string().min(12).max(128),
});
export const loginInput = z.object({
  email: z.email().toLowerCase(),
  password: z.string(),
});
export type ArticleInput = z.infer<typeof articleInput>;
export type CommentInput = z.infer<typeof commentInput>;
export type RegisterInput = z.infer<typeof registerInput>;
export type LoginInput = z.infer<typeof loginInput>;

export interface UserView {
  id: string;
  handle: string;
  role: "USER" | "MODERATOR" | "ADMIN";
}
export interface CommentView {
  id: string;
  body: string;
  createdAt: string;
  author: UserView;
}
export interface ArticleView {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
  createdAt: string;
  publishedAt: string | null;
  author: UserView;
  commentCount: number;
  bookmarkCount: number;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
