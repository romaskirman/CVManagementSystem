import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  periodStart: z.string().datetime().nullable().optional(),
  periodEnd: z.string().datetime().nullable().optional(),
  descriptionMarkdown: z.string().min(1),
  tags: z.array(z.string().min(1).max(50)).default([])
});

export const updateProjectSchema = createProjectSchema.extend({
  version: z.number().int().positive()
});

export const tagSuggestionsQuerySchema = z.object({
  query: z.string().trim().min(1)
});
