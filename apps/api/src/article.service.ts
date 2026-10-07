import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ArticleStatus, Prisma } from "@prisma/client";
import type {
  ArticleInput,
  ArticleView,
  Page,
  UserView,
} from "@crossroad/contracts";
import { PrismaService } from "./prisma.service";

const include = {
  author: { select: { id: true, handle: true, role: true } },
  tags: { include: { tag: true } },
  _count: {
    select: { comments: { where: { deletedAt: null } }, bookmarks: true },
  },
} satisfies Prisma.ArticleInclude;
type ArticleRow = Prisma.ArticleGetPayload<{ include: typeof include }>;
function view(row: ArticleRow): ArticleView {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    tags: row.tags.map(({ tag }) => tag.name),
    status: row.status,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    author: row.author,
    commentCount: row._count.comments,
    bookmarkCount: row._count.bookmarks,
  };
}
function slug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 130);
}
@Injectable()
export class ArticleService {
  constructor(private readonly db: PrismaService) {}
  async list(page: number, query?: string): Promise<Page<ArticleView>> {
    const pageSize = 10;
    const search = query?.trim().slice(0, 120);
    if (search) {
      const matches = await this.db.$queryRaw<{ id: string; total: number }[]>`
        SELECT a."id", COUNT(*) OVER()::int AS total
        FROM "Article" a JOIN "User" u ON u."id" = a."authorId"
        WHERE a."status" = 'PUBLISHED'
          AND (
            to_tsvector('simple', a."title" || ' ' || a."summary" || ' ' || a."body") @@ websearch_to_tsquery('simple', ${search})
            OR u."handle" ILIKE '%' || ${search} || '%'
            OR EXISTS (SELECT 1 FROM "ArticleTag" at JOIN "Tag" t ON t."id" = at."tagId" WHERE at."articleId" = a."id" AND t."name" ILIKE '%' || ${search} || '%')
          )
        ORDER BY ts_rank_cd(to_tsvector('simple', a."title" || ' ' || a."summary" || ' ' || a."body"), websearch_to_tsquery('simple', ${search})) DESC,
                 a."publishedAt" DESC, a."id" DESC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
      `;
      if (!matches.length) {
        const [count] = await this.db.$queryRaw<{ total: number }[]>`
          SELECT COUNT(*)::int AS total FROM "Article" a JOIN "User" u ON u."id" = a."authorId"
          WHERE a."status" = 'PUBLISHED'
            AND (
              to_tsvector('simple', a."title" || ' ' || a."summary" || ' ' || a."body") @@ websearch_to_tsquery('simple', ${search})
              OR u."handle" ILIKE '%' || ${search} || '%'
              OR EXISTS (SELECT 1 FROM "ArticleTag" at JOIN "Tag" t ON t."id" = at."tagId" WHERE at."articleId" = a."id" AND t."name" ILIKE '%' || ${search} || '%')
            )
        `;
        return { items: [], total: count?.total ?? 0, page, pageSize };
      }
      const rows = await this.db.article.findMany({
        where: { id: { in: matches.map((match) => match.id) } },
        include,
      });
      const byId = new Map(rows.map((row) => [row.id, row]));
      return {
        items: matches.flatMap((match) => {
          const row = byId.get(match.id);
          return row ? [view(row)] : [];
        }),
        total: matches[0].total,
        page,
        pageSize,
      };
    }
    const where: Prisma.ArticleWhereInput = { status: "PUBLISHED" };
    const [rows, total] = await this.db.$transaction([
      this.db.article.findMany({
        where,
        include,
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.article.count({ where }),
    ]);
    return { items: rows.map(view), total, page, pageSize };
  }
  async get(slugValue: string, user?: UserView) {
    const article = await this.db.article.findUnique({
      where: { slug: slugValue },
      include,
    });
    if (
      !article ||
      (article.status !== "PUBLISHED" &&
        article.authorId !== user?.id &&
        user?.role !== "MODERATOR" &&
        user?.role !== "ADMIN")
    )
      throw new NotFoundException();
    return view(article);
  }
  async mine(user: UserView) {
    const rows = await this.db.article.findMany({
      where: { authorId: user.id },
      include,
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return rows.map(view);
  }
  async create(user: UserView, data: ArticleInput) {
    const id = crypto.randomUUID();
    const article = await this.db.article.create({
      data: {
        id,
        slug: `${slug(data.title) || "article"}-${id.slice(0, 8)}`,
        title: data.title,
        summary: data.summary,
        body: data.body,
        authorId: user.id,
        tags: {
          create: data.tags.map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
      include,
    });
    return view(article);
  }
  async update(
    user: UserView,
    id: string,
    data: ArticleInput,
    version: number,
  ) {
    const article = await this.db.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException();
    if (article.authorId !== user.id) throw new ForbiddenException();
    if (article.status !== "DRAFT")
      throw new ConflictException("Only drafts can be edited");
    const updated = await this.db.$transaction(async (tx) => {
      const changed = await tx.article.updateMany({
        where: { id, authorId: user.id, status: "DRAFT", version },
        data: {
          title: data.title,
          summary: data.summary,
          body: data.body,
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1)
        throw new ConflictException("Draft changed; reload before editing");
      await tx.articleTag.deleteMany({ where: { articleId: id } });
      for (const name of data.tags) {
        const tag = await tx.tag.upsert({
          where: { name },
          create: { name },
          update: {},
        });
        await tx.articleTag.create({ data: { articleId: id, tagId: tag.id } });
      }
      return tx.article.findUniqueOrThrow({ where: { id }, include });
    });
    return view(updated);
  }
  async publish(user: UserView, id: string) {
    const article = await this.db.article.findUnique({
      where: { id },
      select: { authorId: true, status: true },
    });
    if (!article) throw new NotFoundException();
    if (article.authorId !== user.id) throw new ForbiddenException();
    if (article.status !== "DRAFT")
      throw new ConflictException("Already published or archived");
    const changed = await this.db.article.updateMany({
      where: { id, authorId: user.id, status: "DRAFT" },
      data: {
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (changed.count !== 1)
      throw new ConflictException("Draft changed while publishing");
    return view(
      await this.db.article.findUniqueOrThrow({ where: { id }, include }),
    );
  }
}
