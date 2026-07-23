import { z } from 'zod';

const roleCodeSchema = z.enum(['CANDIDATE', 'RECRUITER', 'ADMIN']);

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  isBlocked: z.coerce.boolean().optional(),
  role: roleCodeSchema.optional()
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  roleCode: roleCodeSchema
});

export const assignRoleSchema = z.object({
  roleCode: roleCodeSchema
});

export const removeRoleSchema = z.object({
  roleCode: roleCodeSchema
});
