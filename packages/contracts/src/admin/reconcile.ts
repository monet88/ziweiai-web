import { z } from 'zod';

export const reconcileTransactionSchema = z.object({
  transactionId: z.string().min(1),
  targetUserId: z.string().min(1),
});

export type ReconcileTransactionInput = z.infer<typeof reconcileTransactionSchema>;
