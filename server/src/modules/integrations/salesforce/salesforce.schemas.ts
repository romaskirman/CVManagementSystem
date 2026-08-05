import { z } from 'zod';

export const exportSalesforceProfileSchema = z.object({
  company: z.string().min(1),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export type ExportSalesforceProfileInput = z.infer<typeof exportSalesforceProfileSchema>;
