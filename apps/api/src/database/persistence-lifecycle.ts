const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const FAILED_EXPLANATION_RETENTION_DAYS = 7;
export const DEFAULT_PROMPT_STORAGE_MODE = 'not_stored';
export const PERSONALIZED_CACHE_SCOPE = 'user_snapshot';

export function buildFailedExplanationRetentionTimestamp(now: Date): string {
  return new Date(now.getTime() + FAILED_EXPLANATION_RETENTION_DAYS * DAY_IN_MS).toISOString();
}

export function shouldStorePrompt(userConsented: boolean): boolean {
  return userConsented;
}
