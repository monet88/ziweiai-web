import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  reportOpsAlert,
  resetOpsAlertThrottleForTests,
  shouldAlertHttpStatus,
  shouldSendOpsAlert,
} from './ops-alert';

describe('ops-alert', () => {
  afterEach(() => {
    resetOpsAlertThrottleForTests();
    vi.restoreAllMocks();
  });

  it('shouldAlertHttpStatus covers 5xx and AI provider codes', () => {
    expect(shouldAlertHttpStatus(500)).toBe(true);
    expect(shouldAlertHttpStatus(502, 'PROVIDER_UNAVAILABLE')).toBe(true);
    expect(shouldAlertHttpStatus(504, 'PROVIDER_TIMEOUT')).toBe(true);
    expect(shouldAlertHttpStatus(400, 'INVALID_INPUT')).toBe(false);
    expect(shouldAlertHttpStatus(401, 'UNAUTHORIZED')).toBe(false);
  });

  it('throttles repeated alerts for the same code/path', () => {
    const payload = {
      level: 'error' as const,
      code: 'PROVIDER_TIMEOUT',
      message: 'slow',
      path: '/explanations',
      status: 504,
    };
    const t0 = 1_000_000;
    expect(shouldSendOpsAlert(payload, t0, 60_000)).toBe(true);
    expect(shouldSendOpsAlert(payload, t0 + 10_000, 60_000)).toBe(false);
    expect(shouldSendOpsAlert(payload, t0 + 61_000, 60_000)).toBe(true);
  });

  it('posts webhook when configured', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    await reportOpsAlert(
      {
        level: 'error',
        code: 'INTERNAL_ERROR',
        message: 'boom',
        requestId: 'req-1',
        path: '/api/og/charts/x',
        status: 500,
      },
      {
        webhookUrl: 'https://example.test/hooks/ops',
        fetchImpl: fetchImpl as unknown as typeof fetch,
        throttleMs: 0,
      },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    const body = JSON.parse(String(init.body)) as { text: string };
    expect(body.text).toContain('INTERNAL_ERROR');
    expect(body.text).toContain('req-1');
  });

  it('does not throw when webhook fails', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'));
    await expect(
      reportOpsAlert(
        {
          level: 'error',
          code: 'PROVIDER_UNAVAILABLE',
          message: 'no provider',
          status: 502,
        },
        {
          webhookUrl: 'https://example.test/hooks/ops',
          fetchImpl: fetchImpl as unknown as typeof fetch,
          throttleMs: 0,
        },
      ),
    ).resolves.toBeUndefined();
  });
});
