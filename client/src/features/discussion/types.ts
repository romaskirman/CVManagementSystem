export type DiscussionPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorPublicProfileUrl?: string | null;
  createdAt: string;
  contentMarkdown: string;
  bodyMarkdown: string;
};
