export type DiscussionPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorRoles?: string[];
  authorPublicProfileUrl?: string | null;
  createdAt: string;
  contentMarkdown: string;
  bodyMarkdown: string;
};
