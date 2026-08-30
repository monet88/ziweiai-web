import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { apiEnv } from '../config/env';

export type OpsAlertLevel = 'error' | 'warning';

export interface OpsAlertPayload {
  level: OpsAlertLevel;
  /** Machine code e.g. INTERNAL_ERROR, PROVIDER_TIMEOUT, AI_FALLBACK_ALERT */
  code: string;
  message: string;
  requestId?: string | null;
  path?: string | null;
  status?: number | null;
  /** Extra safe tags (no secrets / PII) */
  tags?: Record<string, string>;
  /** Underlying error for Sentry stack when available */
  cause?: unknown;
}

const logger = new Logger('OpsAlert');

/** In-memory throttle: one fire per key per window (serverless instance-local). */
const lastSentAt = new Map<string, number>();
export const DEFAULT_THROTTLE_MS = 60_000;

function throttleKey(payload: OpsAlertPayload): string {
  const providerTag = payload.tags?.provider ?? payload.tags?.from_provider ?? '';
  const featureTag = payload.tags?.feature ?? payload.tags?.quota_feature ?? '';
  return `${payload.code}|${payload.status ?? ''}|${payload.path ?? ''}|${providerTag}|${featureTag}`;
}

export function shouldSendOpsAlert(
  payload: OpsAlertPayload,
  nowMs = Date.now(),
  throttleMs = DEFAULT_THROTTLE_MS,
): boolean {
  const key = throttleKey(payload);
  const prev = lastSentAt.get(key);
  if (prev !== undefined && nowMs - prev < throttleMs) {
    return false;
  }
  lastSentAt.set(key, nowMs);
  return true;
}

/** Test helper */
export function resetOpsAlertThrottleForTests(): void {
  lastSentAt.clear();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatTelegramMessage(payload: OpsAlertPayload): { text: string; parse_mode: string } {
  const icon = payload.level === 'error' ? '🚨' : '⚠️';
  const header = `${icon} <b>Tử Vi Toàn Tập [${payload.level.toUpperCase()}]</b>`;
  const codeSection = `<b>Mã lỗi:</b> <code>${escapeHtml(payload.code)}</code>`;
  const msgSection = `<b>Mô tả:</b> ${escapeHtml(payload.message.slice(0, 300))}`;

  const details: string[] = [];
  if (payload.status != null) details.push(`• Status: <code>${payload.status}</code>`);
  if (payload.path) details.push(`• Path: <code>${escapeHtml(payload.path)}</code>`);
  if (payload.requestId) details.push(`• Request ID: <code>${escapeHtml(payload.requestId)}</code>`);

  if (payload.tags) {
    for (const [k, v] of Object.entries(payload.tags)) {
      if (v) {
        details.push(`• ${escapeHtml(k)}: <code>${escapeHtml(String(v))}</code>`);
      }
    }
  }

  const sections = [header, codeSection, msgSection];
  if (details.length > 0) {
    sections.push(`<b>Chi tiết:</b>\n${details.join('\n')}`);
  }

  return {
    text: sections.join('\n\n'),
    parse_mode: 'HTML',
  };
}

export interface ReportOpsAlertOptions {
  webhookUrl?: string | null;
  telegramBotToken?: string | null;
  telegramChatId?: string | null;
  throttleMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Report production-relevant failures:
 * 1) Always structured log (Vercel Function logs)
 * 2) Sentry when initialized / DSN present
 * 3) Telegram / Webhook push when configured
 *
 * Fire-and-forget — never throws into request path.
 */
export async function reportOpsAlert(
  payload: OpsAlertPayload,
  options?: ReportOpsAlertOptions,
): Promise<void> {
  try {
    if (!shouldSendOpsAlert(payload, Date.now(), options?.throttleMs ?? DEFAULT_THROTTLE_MS)) {
      return;
    }

    const line = [
      `[ops-alert]`,
      `level=${payload.level}`,
      `code=${payload.code}`,
      `status=${payload.status ?? 'n/a'}`,
      `requestId=${payload.requestId ?? 'null'}`,
      `path=${payload.path ?? 'n/a'}`,
      `message=${payload.message.slice(0, 200)}`,
    ].join(' ');

    if (payload.level === 'error') {
      logger.error(line);
    } else {
      logger.warn(line);
    }

    const tags: Record<string, string> = {
      ops_code: payload.code,
      ...(payload.requestId ? { requestId: payload.requestId } : {}),
      ...(payload.path ? { path: payload.path } : {}),
      ...(payload.status != null ? { http_status: String(payload.status) } : {}),
      ...payload.tags,
    };

    if (payload.cause instanceof Error) {
      Sentry.captureException(payload.cause, { level: payload.level, tags });
    } else {
      Sentry.captureMessage(`${payload.code}: ${payload.message}`, {
        level: payload.level,
        tags,
        extra: payload.cause !== undefined ? { cause: String(payload.cause) } : undefined,
      });
    }

    const fetchImpl = options?.fetchImpl ?? fetch;
    const botToken = options?.telegramBotToken ?? apiEnv.TELEGRAM_BOT_TOKEN;
    const chatId = options?.telegramChatId ?? apiEnv.TELEGRAM_CHAT_ID;
    const directWebhook = options?.webhookUrl ?? apiEnv.OPS_ALERT_WEBHOOK_URL;

    let targetUrl: string | null = null;
    let requestBody: Record<string, unknown> = {};

    if (botToken && chatId) {
      targetUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const formatted = formatTelegramMessage(payload);
      requestBody = {
        chat_id: chatId,
        text: formatted.text,
        parse_mode: formatted.parse_mode,
      };
    } else if (directWebhook && directWebhook.trim().length > 0) {
      targetUrl = directWebhook.trim();
      requestBody = {
        text: `🚨 Tử Vi Toàn Tập [${payload.level}] ${payload.code}\nstatus=${payload.status ?? 'n/a'} path=${payload.path ?? 'n/a'}\nrequestId=${payload.requestId ?? 'null'}\n${payload.message.slice(0, 300)}`,
        ...telegramFields(targetUrl, payload),
      };
    }

    if (!targetUrl) {
      return;
    }

    // Do not await long — short timeout for serverless flush reliability.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      await fetchImpl(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    logger.warn(
      `ops-alert secondary failure: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function telegramFields(
  webhookUrl: string,
  payload: OpsAlertPayload,
): { chat_id?: string; parse_mode?: string } {
  try {
    const url = new URL(webhookUrl);
    const chatId = url.searchParams.get('chat_id');
    if (chatId) {
      return {
        chat_id: chatId,
        parse_mode: 'HTML',
      };
    }
  } catch {
    // ignore invalid URL — fetch will fail and be swallowed
  }
  void payload;
  return {};
}

/** Codes that always warrant ops noise (even when status is 502/504 expected UX). */
export const AI_OPS_ALERT_CODES = new Set([
  'PROVIDER_TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'INTERNAL_ERROR',
  'AI_FALLBACK_ALERT',
  'AI_PROVIDER_CHAIN_EXHAUSTED',
  'CRITICAL_500_WALLET_DEDUCTION',
  'CRITICAL_500_AI_EXECUTION',
]);

export function shouldAlertHttpStatus(status: number, code?: string): boolean {
  if (status >= 500) return true;
  if (code && AI_OPS_ALERT_CODES.has(code)) return true;
  return false;
}
