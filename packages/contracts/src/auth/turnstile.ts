import { z } from 'zod';

export const CLOUDFLARE_TURNSTILE_TEST_KEYS = {
  ALWAYS_PASSES_SITEKEY: '1x00000000000000000000AA',
  ALWAYS_PASSES_SECRETKEY: '1x0000000000000000000000000000000AA',
  ALWAYS_BLOCKS_SITEKEY: '2x00000000000000000000AB',
  ALWAYS_BLOCKS_SECRETKEY: '2x0000000000000000000000000000000AA',
  INVISIBLE_PASSES_SITEKEY: '1x00000000000000000000BB',
} as const;

export const TurnstileVerifyRequestSchema = z.object({
  token: z.string().min(1, 'Token không được để trống'),
  remoteIp: z.string().optional(),
});

export type TurnstileVerifyRequest = z.infer<typeof TurnstileVerifyRequestSchema>;

export const TurnstileVerifyResponseSchema = z.object({
  success: z.boolean(),
  errorCodes: z.array(z.string()).optional(),
  challengeTs: z.string().optional(),
  hostname: z.string().optional(),
  message: z.string().optional(),
});

export type TurnstileVerifyResponse = z.infer<typeof TurnstileVerifyResponseSchema>;
