import { z } from 'zod';

export const createDiscussionPostSchema = z.object({
  bodyMarkdown: z.string().trim().min(1).max(5000)
});

export const discussionPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
});
