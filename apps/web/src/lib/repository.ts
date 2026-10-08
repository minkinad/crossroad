import type {
  ArticleInput,
  ArticleView,
  CommentView,
  LoginInput,
  Page,
  RegisterInput,
  UserView,
} from "@crossroad/contracts";

export interface Session {
  user: UserView;
  accessToken?: string;
  demo: boolean;
}
export interface BookmarkView {
  slug: string;
  title: string;
  summary: string;
  author: { handle: string };
}
export interface Repository {
  mode: "demo" | "api";
  session(): Promise<Session | null>;
  login(input: LoginInput): Promise<Session>;
  register(input: RegisterInput): Promise<Session>;
  logout(): Promise<void>;
  articles(page: number, query?: string): Promise<Page<ArticleView>>;
  article(slug: string): Promise<ArticleView>;
  mine(): Promise<ArticleView[]>;
  create(input: ArticleInput): Promise<ArticleView>;
  update(
    id: string,
    input: ArticleInput,
    version: number,
  ): Promise<ArticleView>;
  publish(id: string): Promise<ArticleView>;
  comments(slug: string): Promise<CommentView[]>;
  comment(slug: string, body: string): Promise<CommentView>;
  bookmarks(): Promise<BookmarkView[]>;
  bookmark(slug: string, add: boolean): Promise<void>;
}
export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
