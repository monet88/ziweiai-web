import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TurnstileService } from './turnstile.service';

describe('TurnstileService', () => {
  let service: TurnstileService;
  const originalEnv = process.env.TURNSTILE_SECRET_KEY;

  beforeEach(() => {
    service = new TurnstileService();
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  afterEach(() => {
    process.env.TURNSTILE_SECRET_KEY = originalEnv;
    vi.restoreAllMocks();
  });

  it('bypasses gracefully when TURNSTILE_SECRET_KEY is not configured', async () => {
    const result = await service.verifyToken('any-token');
    expect(result.success).toBe(true);
    expect(result.isBypassed).toBe(true);
  });

  it('rejects empty or whitespace token when secret key is set', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-123';
    const result = await service.verifyToken('  ');
    expect(result.success).toBe(false);
    expect(result.errorCodes).toContain('missing-input-response');
  });

  it('verifies token successfully against Cloudflare API', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'valid-secret-key';
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        challenge_ts: '2026-09-09T12:00:00Z',
        hostname: 'tuvitoantap.vercel.app',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await service.verifyToken('valid-token-xyz', '127.0.0.1');
    expect(result.success).toBe(true);
    expect(result.hostname).toBe('tuvitoantap.vercel.app');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects token when Cloudflare API returns success: false', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'valid-secret-key';
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        'error-codes': ['invalid-input-response'],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await service.verifyToken('invalid-token', '127.0.0.1');
    expect(result.success).toBe(false);
    expect(result.errorCodes).toContain('invalid-input-response');
  });

  it('fallbacks gracefully when Cloudflare API throws network error', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'valid-secret-key';
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network timeout'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await service.verifyToken('valid-token', '127.0.0.1');
    expect(result.success).toBe(true);
    expect(result.isBypassed).toBe(true);
  });
});
