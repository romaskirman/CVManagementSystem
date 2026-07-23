import { z } from 'zod';

const positionAttributeSchema = z.object({
  attributeId: z.string().min(1),
  sortOrder: z.number().int().min(0).optional(),
  isRequired: z.boolean().default(true)
});

const accessRuleSchema = z.object({
  attributeId: z.string().min(1),
  operator: z.enum([
    'EQUALS',
    'NOT_EQUALS',
    'CONTAINS',
    'STARTS_WITH',
    'GREATER_THAN',
    'GREATER_THAN_OR_EQUAL',
    'LESS_THAN',
    'LESS_THAN_OR_EQUAL',
    'IS_TRUE',
    'IS_FALSE',
    'BEFORE',
    'AFTER',
    'ON',
    'OVERLAPS',
    'IN_SET'
  ]),
  stringValue: z.string().nullable().optional(),
  numberValue: z.number().nullable().optional(),
  booleanValue: z.boolean().nullable().optional(),
  dateValue: z.string().datetime().nullable().optional(),
  secondDateValue: z.string().datetime().nullable().optional(),
  optionId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const createPositionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  shortDescription: z.string().trim().min(1).max(2000),
  visibilityMode: z.enum(['PUBLIC', 'RESTRICTED']).default('PUBLIC'),
  company: z.string().trim().max(200).nullable().optional(),
  level: z.enum(['JUNIOR', 'MIDDLE', 'SENIOR', 'C_LEVEL']).nullable().optional(),
  maxProjects: z.number().int().min(0).max(20).default(3),
  attributes: z.array(positionAttributeSchema).default([]),
  accessRules: z.array(accessRuleSchema).default([]),
  projectTags: z.array(z.string().min(1)).default([])
});

export const updatePositionSchema = createPositionSchema.extend({
  version: z.number().int().positive()
});

export const positionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  visibilityMode: z.enum(['PUBLIC', 'RESTRICTED']).optional(),
  company: z.string().trim().optional(),
  level: z.enum(['JUNIOR', 'MIDDLE', 'SENIOR', 'C_LEVEL']).optional(),
  accessibleOnly: z.coerce.boolean().optional()
});
