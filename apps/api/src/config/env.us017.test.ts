import { describe, expect, it } from 'vitest';
import { apiEnvSchema } from './env';

describe('US-017 extended system env flags', () => {
  it('parses new flags with default false', () => {
    const parsed = apiEnvSchema.parse({});
    expect(parsed.EXTENDED_SYSTEM_HEPAN_ENABLED).toBe(false);
    expect(parsed.EXTENDED_SYSTEM_MANGPAI_ENABLED).toBe(false);
    expect(parsed.EXTENDED_SYSTEM_TAROT_ENABLED).toBe(false);
    expect(parsed.EXTENDED_SYSTEM_MBTI_ENABLED).toBe(false);
    expect(parsed.EXTENDED_SYSTEM_FACE_ENABLED).toBe(false);
    expect(parsed.EXTENDED_SYSTEM_PALM_ENABLED).toBe(false);
    expect(parsed.API_VISION_REQUESTS_PER_DAY_PER_USER).toBe(5);
  });

  it('rejects invalid bool-like strings for feature flags (via z.stringbool)', () => {
    // stringbool rejects non-bool-like strings at parse time for strictness
    const r = apiEnvSchema.safeParse({ EXTENDED_SYSTEM_TAROT_ENABLED: 'notabool' });
    expect(r.success).toBe(false);
  });

  it('accepts "true"/"false" strings for feature flags', () => {
    const r1 = apiEnvSchema.safeParse({ EXTENDED_SYSTEM_TAROT_ENABLED: 'true' });
    const r2 = apiEnvSchema.safeParse({ EXTENDED_SYSTEM_TAROT_ENABLED: 'false' });
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r1.data?.EXTENDED_SYSTEM_TAROT_ENABLED).toBe(true);
    expect(r2.data?.EXTENDED_SYSTEM_TAROT_ENABLED).toBe(false);
  });
});
