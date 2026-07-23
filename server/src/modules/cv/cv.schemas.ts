import { z } from 'zod';

export const createCvSchema = z.object({
  positionId: z.string().min(1)
});

export const updateCvAttributeSchema = z.object({
  attributeId: z.string().min(1),
  version: z.number().int().positive().optional(),
  stringValue: z.string().nullable().optional(),
  textValue: z.string().nullable().optional(),
  numberValue: z.number().nullable().optional(),
  booleanValue: z.boolean().nullable().optional(),
  dateValue: z.string().datetime().nullable().optional(),
  periodStart: z.string().datetime().nullable().optional(),
  periodEnd: z.string().datetime().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  optionId: z.string().nullable().optional()
});

export const reorderCvProjectsItemSchema = z.object({
  projectId: z.string().min(1),
  sortOrder: z.number().int().min(0).optional()
});

export const updateCvProjectsSchema = z.object({
  version: z.number().int().positive().optional(),
  projects: z
    .array(reorderCvProjectsItemSchema)
    .max(100)
    .superRefine((projects, ctx) => {
      const seen = new Set<string>();

      for (let index = 0; index < projects.length; index += 1) {
        const item = projects[index];

        if (seen.has(item.projectId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, 'projectId'],
            message: 'Project ids must be unique within CV project selection'
          });
          continue;
        }

        seen.add(item.projectId);
      }
    })
});

export const listCvsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  positionId: z.string().optional(),
  candidateUserId: z.string().optional()
});
