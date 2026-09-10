import { z } from 'zod';

export const userFcmTokenRequestSchema = z.object({
  token: z.string().min(1, 'FCM token must not be empty'),
  platform: z.string().optional(),
});
export type UserFcmTokenRequest = z.infer<typeof userFcmTokenRequestSchema>;

export const userFcmTokenResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
export type UserFcmTokenResponse = z.infer<typeof userFcmTokenResponseSchema>;
