import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

export type OpsAlertLevel = 'error' | 'warning';

export interface OpsAlertPayload {
  level: OpsAlertLevel;
  /** Machine code e.g. INTERNAL_ERROR, PROVIDER_TIMEOUT */
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
const DEFAULT_THROTTLE_MS = 60_000;

function throttleKey(payload: OpsAlertPayload): string {
  return `${payload.code}|${payload.status ?? ''}|${payload.path ?? ''}`;
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

/**
 * Report production-relevant failures:
 * 1) Always structured log (Vercel Function logs)
 * 2) Sentry when initialized / DSN present
 * 3) Optional webhook (Telegram bot API, Slack, Discord, etc.)
 *
 * Fire-and-forget — never throws into request path.
 */
export async function reportOpsAlert(
  payload: OpsAlertPayload,
  options?: {
    webhookUrl?: string | null;
    throttleMs?: number;
    fetchImpl?: typeof fetch;
  },
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

    const webhookUrl = options?.webhookUrl?.trim();
    if (!webhookUrl) {
      return;
    }

    const fetchImpl = options?.fetchImpl ?? fetch;
    const body = {
      text: `🚨 Tử Vi Toàn Tập [${payload.level}] ${payload.code}\nstatus=${payload.status ?? 'n/a'} path=${payload.path ?? 'n/a'}\nrequestId=${payload.requestId ?? 'null'}\n${payload.message.slice(0, 300)}`,
      // Telegram Bot API compatible when URL is https://api.telegram.org/bot<token>/sendMessage
      // Caller may point webhook at a small bridge; we also send chat-agnostic JSON.
      ...telegramFields(webhookUrl, payload),
    };

    // Do not await long — but we still await with short timeout for serverless flush reliability.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
      await fetchImpl(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
  // If URL already encodes chat, skip. If OPS uses .../sendMessage, require chat_id via query ?chat_id=
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
]);

export function shouldAlertHttpStatus(status: number, code?: string): boolean {
  if (status >= 500) return true;
  if (code && AI_OPS_ALERT_CODES.has(code)) return true;
  return false;
}
