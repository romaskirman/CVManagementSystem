import { z } from 'zod';

export const attributeOptionSchema = z.object({
  label: z.string().trim().min(1).max(100),
  sortOrder: z.number().int().min(0).optional()
});

export const createAttributeSchema = z.object({
  category: z.enum([
    'PERSONAL_INFORMATION',
    'CERTIFICATION',
    'DOMAIN_KNOWLEDGE',
    'SOFT_SKILLS',
    'HARD_SKILLS',
    'EDUCATION',
    'LANGUAGE',
    'EXPERIENCE',
    'OTHER'
  ]),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  type: z.enum([
    'STRING',
    'TEXT',
    'IMAGE',
    'NUMERIC',
    'DATE',
    'PERIOD',
    'BOOLEAN',
    'ONE_OF_MANY'
  ]),
  options: z.array(attributeOptionSchema).default([])
});

export const updateAttributeSchema = createAttributeSchema.extend({
  version: z.number().int().positive().optional()
});

export const attributesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  prefix: z.string().trim().optional(),
  category: z
    .enum([
      'PERSONAL_INFORMATION',
      'CERTIFICATION',
      'DOMAIN_KNOWLEDGE',
      'SOFT_SKILLS',
      'HARD_SKILLS',
      'EDUCATION',
      'LANGUAGE',
      'EXPERIENCE',
      'OTHER'
    ])
    .optional(),
  type: z
    .enum(['STRING', 'TEXT', 'IMAGE', 'NUMERIC', 'DATE', 'PERIOD', 'BOOLEAN', 'ONE_OF_MANY'])
    .optional(),
  recentlyUsedOnly: z.coerce.boolean().optional()
});
