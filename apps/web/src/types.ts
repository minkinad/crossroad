export type PostType = "article" | "discussion";

export interface CommentItem {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface PostItem {
  id: string;
  type: PostType;
  title: string;
  summary: string;
  body: string;
  author: string;
  tags: string[];
  createdAt: string;
  likes: number;
  comments: CommentItem[];
}
