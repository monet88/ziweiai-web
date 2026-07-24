/** Referral codes are 8-char md5 substrings; allow a small band for forward safety. */
const REFERRAL_CODE_RE = /^[A-Za-z0-9]{4,16}$/;

export function sanitizeReferralCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!REFERRAL_CODE_RE.test(trimmed)) return null;
  // DB codes are upper(md5 hex); normalize so messenger/URL lowercasing still redeems.
  return trimmed.toUpperCase();
}

/**
 * Append `?ref=` / `&ref=` when rawRef is a safe referral code.
 * Invalid or missing ref → return baseUrl unchanged.
 */
export function appendReferralQuery(baseUrl: string, rawRef: unknown): string {
  const code = sanitizeReferralCode(rawRef);
  if (!code) return baseUrl;

  const hashIndex = baseUrl.indexOf('#');
  const withoutHash = hashIndex >= 0 ? baseUrl.slice(0, hashIndex) : baseUrl;
  const hash = hashIndex >= 0 ? baseUrl.slice(hashIndex) : '';
  const joiner = withoutHash.includes('?') ? '&' : '?';
  return `${withoutHash}${joiner}ref=${encodeURIComponent(code)}${hash}`;
}
