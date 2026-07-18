import { describe, expect, it } from 'vitest';
import { buildExplanationRequestIdempotencyKey } from './idempotency';

const base = {
  ownerUserId: 'user-a',
  chartSnapshotId: 'chart-1',
  providerName: 'deepseek',
  explanationKind: 'overview',
};

describe('buildExplanationRequestIdempotencyKey', () => {
  it('keeps the legacy overview key stable when no palace scope is supplied', () => {
    const first = buildExplanationRequestIdempotencyKey(base);
    const second = buildExplanationRequestIdempotencyKey({ ...base });

    expect(first).toBe(second);
  });

  it('separates explanations per palace scope', () => {
    const overview = buildExplanationRequestIdempotencyKey(base);
    const wealth = buildExplanationRequestIdempotencyKey({ ...base, palaceScope: 'wealthPalace' });
    const career = buildExplanationRequestIdempotencyKey({ ...base, palaceScope: 'careerPalace' });

    expect(wealth).not.toBe(overview);
    expect(wealth).not.toBe(career);
  });

  it('returns a stable key for the same palace scope', () => {
    const first = buildExplanationRequestIdempotencyKey({ ...base, palaceScope: 'decadal' });
    const second = buildExplanationRequestIdempotencyKey({ ...base, palaceScope: 'decadal' });

    expect(first).toBe(second);
  });
});
