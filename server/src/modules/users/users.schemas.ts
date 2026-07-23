import { z } from 'zod';

export const usersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional()
});

export const updateRolesSchema = z.object({
  roles: z.array(z.enum(['CANDIDATE', 'RECRUITER', 'ADMIN'])).min(1)
});
