import { z } from 'zod';

export const sepayWebhookSchema = z.object({
  id: z.number(),
  gateway: z.string(),
  transactionDate: z.string(),
  accountNumber: z.string(),
  code: z.string().nullable(),
  content: z.string(),
  transferType: z.string(),
  transferAmount: z.number(),
  accumulated: z.number(),
  subAccount: z.string().nullable().optional(),
  referenceCode: z.string(),
  description: z.string(),
});

export type SepayWebhookPayload = z.infer<typeof sepayWebhookSchema>;
