import { z } from 'zod';

const attributeValuePayloadSchema = z.object({
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

export const updateProfileSchema = z.object({
  version: z.number().int().positive(),
  attributes: z.array(attributeValuePayloadSchema).default([])
});

export const upsertProfileAttributeSchema = attributeValuePayloadSchema.extend({
  version: z.number().int().positive().optional()
});
