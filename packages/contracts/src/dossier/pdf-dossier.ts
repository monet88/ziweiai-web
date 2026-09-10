import { z } from 'zod';

export const dossierStatusResponseSchema = z.object({
  isUnlocked: z.boolean(),
  feeXu: z.number().int().min(0),
});

export type DossierStatusResponse = z.infer<typeof dossierStatusResponseSchema>;

export const dossierUnlockRequestSchema = z.object({
  chartId: z.string().uuid(),
});

export type DossierUnlockRequest = z.infer<typeof dossierUnlockRequestSchema>;

export const dossierUnlockResponseSchema = z.object({
  success: z.boolean(),
  unlocked: z.literal(true),
  alreadyUnlocked: z.boolean(),
  xuCharged: z.number().int().min(0),
  remainingBalance: z.number().int().min(0),
});

export type DossierUnlockResponse = z.infer<typeof dossierUnlockResponseSchema>;
