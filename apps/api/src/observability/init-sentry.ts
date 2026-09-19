import * as Sentry from '@sentry/node';

let initialized = false;

/**
 * Safe to call from Nest local bootstrap and Vercel serverless entry.
 * No-op when DSN missing or already initialized (warm lambda).
 */
export function initSentry(dsn: string | undefined | null): void {
  if (initialized || !dsn || dsn.trim().length === 0) {
    return;
  }

  Sentry.init({
    dsn: dsn.trim(),
    tracesSampleRate: 0,
    // Keep payload lean on serverless; tags carry request correlation.
    sendDefaultPii: false,
  });
  initialized = true;
}

export function isSentryInitialized(): boolean {
  return initialized;
}

/** Test-only reset. */
export function resetSentryInitForTests(): void {
  initialized = false;
}
