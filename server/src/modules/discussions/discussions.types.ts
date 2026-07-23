export interface CreateDiscussionPostInput {
  bodyMarkdown: string;
}

export interface DiscussionPostsQuery {
  page?: number;
  pageSize?: number;
}
