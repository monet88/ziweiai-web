import { describe, it, expect } from 'vitest';
import { userFcmTokenRequestSchema, userFcmTokenResponseSchema } from './fcm-token';

describe('userFcmTokenRequestSchema', () => {
  it('should accept valid token and platform', () => {
    const valid = {
      token: 'fcm_sample_token_12345',
      platform: 'android',
    };
    const parsed = userFcmTokenRequestSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('should reject empty token', () => {
    const invalid = {
      token: '',
      platform: 'ios',
    };
    const parsed = userFcmTokenRequestSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('should validate response schema', () => {
    const res = { success: true };
    const parsed = userFcmTokenResponseSchema.safeParse(res);
    expect(parsed.success).toBe(true);
  });
});
