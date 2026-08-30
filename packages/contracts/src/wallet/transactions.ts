import { z } from 'zod';

export const transactionStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded', 'cancelled']);

export const transactionDtoSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  coin_amount: z.number(),
  status: transactionStatusSchema,
  gateway: z.string().nullable(),
  gateway_transaction_id: z.string().nullable(),
  created_at: z.string(),
});

export type TransactionDto = z.infer<typeof transactionDtoSchema>;

export const transactionListResponseSchema = z.object({
  data: z.array(transactionDtoSchema),
  total: z.number(),
});

export type TransactionListResponse = z.infer<typeof transactionListResponseSchema>;

export const adRewardResponseSchema = z.object({
  success: z.boolean(),
  xu_added: z.number(),
  new_balance: z.number(),
});

export type AdRewardResponse = z.infer<typeof adRewardResponseSchema>;

