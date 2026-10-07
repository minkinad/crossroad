import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { CommentView, UserView } from "@crossroad/contracts";
import { PrismaService } from "./prisma.service";

const author = { select: { id: true, handle: true, role: true } } as const;
@Injectable()
export class SocialService {
  constructor(private readonly db: PrismaService) {}
  async comments(slug: string, page: number) {
    const article = await this.db.article.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    if (!article || article.status !== "PUBLISHED")
      throw new NotFoundException();
    const rows = await this.db.comment.findMany({
      where: { articleId: article.id, deletedAt: null },
      include: { author },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 20,
      skip: (page - 1) * 20,
    });
    return rows.map((row) => ({
      id: row.id,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      author: row.author,
    })) satisfies CommentView[];
  }
  async comment(user: UserView, slug: string, body: string) {
    const article = await this.db.article.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    if (!article || article.status !== "PUBLISHED")
      throw new NotFoundException();
    const row = await this.db.comment.create({
      data: { articleId: article.id, authorId: user.id, body },
      include: { author },
    });
    return {
      id: row.id,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      author: row.author,
    } satisfies CommentView;
  }
  async deleteComment(user: UserView, id: string) {
    const row = await this.db.comment.findUnique({ where: { id } });
    if (!row || row.deletedAt) throw new NotFoundException();
    if (row.authorId !== user.id && user.role === "USER")
      throw new ForbiddenException();
    await this.db.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  async bookmark(user: UserView, slug: string, add: boolean) {
    const article = await this.db.article.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    if (!article || article.status !== "PUBLISHED")
      throw new NotFoundException();
    if (add) {
      const created = await this.db.bookmark.createMany({
        data: [{ userId: user.id, articleId: article.id }],
        skipDuplicates: true,
      });
      if (!created.count) throw new ConflictException("Already bookmarked");
    } else
      await this.db.bookmark.deleteMany({
        where: { userId: user.id, articleId: article.id },
      });
  }
  async bookmarks(user: UserView) {
    const rows = await this.db.bookmark.findMany({
      where: { userId: user.id },
      include: {
        article: {
          select: {
            slug: true,
            title: true,
            summary: true,
            publishedAt: true,
            author: { select: { handle: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((row) => row.article);
  }
}
