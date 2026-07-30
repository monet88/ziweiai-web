import { z } from 'zod';

export const adminTransactionSchema = z.object({
  id: z.string(),
  user_id: z.string().optional().nullable(),
  amount: z.number(),
  transaction_type: z.string(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  created_at: z.string(),
});
export type AdminTransaction = z.infer<typeof adminTransactionSchema>;

export const adminTransactionListResponseSchema = z.object({
  data: z.array(adminTransactionSchema),
  meta: z.object({
    total: z.number().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional(),
}).or(z.array(adminTransactionSchema));
export type AdminTransactionListResponse = z.infer<typeof adminTransactionListResponseSchema>;

export const adminTopupResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  newBalance: z.number().optional(),
}).passthrough();
export type AdminTopupResponse = z.infer<typeof adminTopupResponseSchema>;

export const adminConfigSchema = z.record(z.string(), z.any());
export type AdminConfigMap = z.infer<typeof adminConfigSchema>;

export const adminAuditLogSchema = z.object({
  id: z.string().optional(),
  action: z.string(),
  details: z.any(),
  created_at: z.string().optional(),
}).passthrough();
export type AdminAuditLog = z.infer<typeof adminAuditLogSchema>;

export const adminAuditLogListResponseSchema = z.object({
  data: z.array(adminAuditLogSchema),
  meta: z.object({
    total: z.number().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional(),
}).or(z.array(adminAuditLogSchema));
export type AdminAuditLogListResponse = z.infer<typeof adminAuditLogListResponseSchema>;

export const adminSuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
}).passthrough();
export type AdminSuccessResponse = z.infer<typeof adminSuccessResponseSchema>;
