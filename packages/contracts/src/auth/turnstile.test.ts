import { describe, it, expect } from 'vitest';
import {
  CLOUDFLARE_TURNSTILE_TEST_KEYS,
  TurnstileVerifyRequestSchema,
  TurnstileVerifyResponseSchema,
} from './turnstile';

describe('Turnstile contracts & schemas', () => {
  it('defines valid test keys for Cloudflare Turnstile', () => {
    expect(CLOUDFLARE_TURNSTILE_TEST_KEYS.ALWAYS_PASSES_SITEKEY).toBe('1x00000000000000000000AA');
    expect(CLOUDFLARE_TURNSTILE_TEST_KEYS.ALWAYS_PASSES_SECRETKEY).toBe('1x0000000000000000000000000000000AA');
    expect(CLOUDFLARE_TURNSTILE_TEST_KEYS.ALWAYS_BLOCKS_SITEKEY).toBe('2x00000000000000000000AB');
    expect(CLOUDFLARE_TURNSTILE_TEST_KEYS.INVISIBLE_PASSES_SITEKEY).toBe('1x00000000000000000000BB');
  });

  it('validates TurnstileVerifyRequestSchema correctly', () => {
    const valid = TurnstileVerifyRequestSchema.parse({
      token: 'dummy-token-abc',
      remoteIp: '127.0.0.1',
    });
    expect(valid.token).toBe('dummy-token-abc');
    expect(valid.remoteIp).toBe('127.0.0.1');

    // Token empty should fail
    expect(() => TurnstileVerifyRequestSchema.parse({ token: '' })).toThrow();
  });

  it('validates TurnstileVerifyResponseSchema correctly', () => {
    const successRes = TurnstileVerifyResponseSchema.parse({
      success: true,
      challengeTs: '2026-09-09T12:00:00Z',
      hostname: 'tuvitoantap.vercel.app',
    });
    expect(successRes.success).toBe(true);

    const failureRes = TurnstileVerifyResponseSchema.parse({
      success: false,
      errorCodes: ['invalid-input-response'],
      message: 'Turnstile verification failed',
    });
    expect(failureRes.success).toBe(false);
    expect(failureRes.errorCodes).toContain('invalid-input-response');
  });
});
