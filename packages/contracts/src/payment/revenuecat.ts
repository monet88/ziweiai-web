import { z } from 'zod';

export const revenuecatWebhookSchema = z.object({
  api_version: z.string(),
  event: z.object({
    id: z.string(),
    type: z.enum([
      'TEST',
      'INITIAL_PURCHASE',
      'NON_RENEWING_PURCHASE',
      'RENEWAL',
      'PRODUCT_CHANGE',
      'CANCELLATION',
      'UNCANCELLATION',
      'BILLING_ISSUE',
      'SUBSCRIBER_ALIAS',
      'SUBSCRIPTION_PAUSED',
      'TRANSFER',
      'EXPIRATION',
    ]),
    app_user_id: z.string(),
    aliases: z.array(z.string()).optional(),
    original_app_user_id: z.string().optional(),
    product_id: z.string(),
    entitlement_ids: z.array(z.string()).optional(),
    entitlement_id: z.string().optional(),
    purchased_at_ms: z.number().optional(),
    expiration_at_ms: z.number().optional(),
    environment: z.enum(['SANDBOX', 'PRODUCTION']),
    price: z.number().optional(),
    currency: z.string().optional(),
    price_in_purchased_currency: z.number().optional(),
    transaction_id: z.string().optional(),
    original_transaction_id: z.string().optional(),
    store: z.enum(['APP_STORE', 'MAC_APP_STORE', 'PLAY_STORE', 'STRIPE', 'PROMOTIONAL', 'AMAZON']).optional(),
  }),
});

export type RevenueCatWebhookPayload = z.infer<typeof revenuecatWebhookSchema>;
