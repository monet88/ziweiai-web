import { z } from 'zod';

export const sepayWebhookSchema = z.object({
  id: z.coerce.number(),
  gateway: z.string().optional().default(''),
  transactionDate: z.string(),
  accountNumber: z.string(),
  code: z.string().nullable().optional(),
  content: z.string(),
  transferType: z.string().optional().default('in'),
  transferAmount: z.coerce.number(),
  accumulated: z.coerce.number().nullable().optional().default(0),
  subAccount: z.string().nullable().optional(),
  referenceCode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type SepayWebhookPayload = z.infer<typeof sepayWebhookSchema>;
