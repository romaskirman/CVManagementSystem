import { z } from 'zod';

export const globalSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  scope: z.enum(['ALL', 'POSITIONS', 'CVS', 'USERS']).default('ALL'),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(50).optional()
});
