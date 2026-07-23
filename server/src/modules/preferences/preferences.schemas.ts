import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  theme: z.enum(['LIGHT', 'DARK']).optional(),
  language: z.enum(['EN', 'RU']).optional()
});
