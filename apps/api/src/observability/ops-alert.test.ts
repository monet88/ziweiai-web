import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatTelegramMessage,
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
    expect(shouldAlertHttpStatus(429, 'AI_FALLBACK_ALERT')).toBe(true);
    expect(shouldAlertHttpStatus(500, 'CRITICAL_500_WALLET_DEDUCTION')).toBe(true);
    expect(shouldAlertHttpStatus(500, 'CRITICAL_500_AI_EXECUTION')).toBe(true);
  });

  it('throttles repeated alerts for the same code/path/provider/feature', () => {
    const payload = {
      level: 'warning' as const,
      code: 'AI_FALLBACK_ALERT',
      message: 'Gemini 429 fallback to DeepSeek',
      path: '/numerology/explain',
      status: 429,
      tags: {
        provider: 'gemini',
        feature: 'numerology',
      },
    };
    const t0 = 1_000_000;
    expect(shouldSendOpsAlert(payload, t0, 60_000)).toBe(true);
    expect(shouldSendOpsAlert(payload, t0 + 10_000, 60_000)).toBe(false);
    expect(shouldSendOpsAlert(payload, t0 + 61_000, 60_000)).toBe(true);
  });

  it('formats HTML message correctly for Telegram', () => {
    const formatted = formatTelegramMessage({
      level: 'error',
      code: 'CRITICAL_500_WALLET_DEDUCTION',
      message: 'DB pool connection failed <test & check>',
      status: 500,
      path: '/tarot/draw',
      requestId: 'req-abc-123',
      tags: {
        user_id: 'user_456',
        cost: '10',
      },
    });

    expect(formatted.parse_mode).toBe('HTML');
    expect(formatted.text).toContain('🚨 <b>Tử Vi Toàn Tập [ERROR]</b>');
    expect(formatted.text).toContain('<code>CRITICAL_500_WALLET_DEDUCTION</code>');
    expect(formatted.text).toContain('DB pool connection failed &lt;test &amp; check&gt;');
    expect(formatted.text).toContain('• Status: <code>500</code>');
    expect(formatted.text).toContain('• Request ID: <code>req-abc-123</code>');
    expect(formatted.text).toContain('• user_id: <code>user_456</code>');
    expect(formatted.text).toContain('• cost: <code>10</code>');
  });

  it('posts directly to Telegram Bot API when bot token and chat id are provided', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    await reportOpsAlert(
      {
        level: 'warning',
        code: 'AI_FALLBACK_ALERT',
        message: 'Gemini 429 fallback to deepseek',
        status: 429,
        tags: {
          from_provider: 'gemini',
          to_provider: 'deepseek',
        },
      },
      {
        telegramBotToken: 'mock_token_123',
        telegramChatId: '-100987654321',
        fetchImpl: fetchImpl as unknown as typeof fetch,
        throttleMs: 0,
      },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.telegram.org/botmock_token_123/sendMessage');
    expect(init.method).toBe('POST');
    const body = JSON.parse(String(init.body)) as { chat_id: string; text: string; parse_mode: string };
    expect(body.chat_id).toBe('-100987654321');
    expect(body.parse_mode).toBe('HTML');
    expect(body.text).toContain('AI_FALLBACK_ALERT');
    expect(body.text).toContain('from_provider: <code>gemini</code>');
  });

  it('posts webhook when direct webhook is configured', async () => {
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
