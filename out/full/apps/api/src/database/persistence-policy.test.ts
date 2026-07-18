import { describe, expect, it } from 'vitest';
import {
  buildChartSnapshotDedupeKey,
  buildExplanationRequestIdempotencyKey,
} from './idempotency';
import { assertOwnedByUser, canAccessOwnedRecord, OwnershipScopeError } from './ownership';
import {
  buildFailedExplanationRetentionTimestamp,
  DEFAULT_PROMPT_STORAGE_MODE,
  PERSONALIZED_CACHE_SCOPE,
  shouldStorePrompt,
} from './persistence-lifecycle';

describe('ownership helpers', () => {
  it('allows only the owner to access the record', () => {
    expect(canAccessOwnedRecord('user-a', 'user-a')).toBe(true);
    expect(canAccessOwnedRecord('user-a', 'user-b')).toBe(false);
  });

  it('throws on cross-user access', () => {
    expect(() => assertOwnedByUser('user-a', 'user-b')).toThrow(OwnershipScopeError);
  });
});

describe('idempotency helpers', () => {
  it('builds a stable chart dedupe key for identical retries', () => {
    const first = buildChartSnapshotDedupeKey({
      ownerUserId: 'user-a',
      chartSystem: 'ba-zi',
      inputHashDigest: 'digest-1',
      engineSemver: '0.1.0',
      ruleSourceVersion: '1.7.7',
      schemaVersion: 'phase-3-contracts-v1',
    });
    const second = buildChartSnapshotDedupeKey({
      ownerUserId: 'user-a',
      chartSystem: 'ba-zi',
      inputHashDigest: 'digest-1',
      engineSemver: '0.1.0',
      ruleSourceVersion: '1.7.7',
      schemaVersion: 'phase-3-contracts-v1',
    });

    expect(first).toBe(second);
  });

  it('invalidates chart dedupe key when schema version changes', () => {
    const previous = buildChartSnapshotDedupeKey({
      ownerUserId: 'user-a',
      chartSystem: 'zi-wei-dou-shu',
      inputHashDigest: 'digest-1',
      engineSemver: '0.1.0',
      ruleSourceVersion: '2.5.8',
      schemaVersion: 'phase-3-contracts-v1',
    });
    const next = buildChartSnapshotDedupeKey({
      ownerUserId: 'user-a',
      chartSystem: 'zi-wei-dou-shu',
      inputHashDigest: 'digest-1',
      engineSemver: '0.1.0',
      ruleSourceVersion: '2.5.8',
      schemaVersion: 'phase-3-contracts-v2',
    });

    expect(previous).not.toBe(next);
  });

  it('scopes explanation idempotency to user plus snapshot', () => {
    const first = buildExplanationRequestIdempotencyKey({
      ownerUserId: 'user-a',
      chartSnapshotId: 'snapshot-1',
      providerName: 'deepseek',
      explanationKind: 'relationship',
    });
    const second = buildExplanationRequestIdempotencyKey({
      ownerUserId: 'user-b',
      chartSnapshotId: 'snapshot-1',
      providerName: 'deepseek',
      explanationKind: 'relationship',
    });

    expect(first).not.toBe(second);
  });
});

describe('persistence lifecycle helpers', () => {
  it('keeps prompt storage off by default and user-scoped cache only', () => {
    expect(DEFAULT_PROMPT_STORAGE_MODE).toBe('not_stored');
    expect(PERSONALIZED_CACHE_SCOPE).toBe('user_snapshot');
    expect(shouldStorePrompt(false)).toBe(false);
    expect(shouldStorePrompt(true)).toBe(true);
  });

  it('creates a failed-request retention timestamp in the future', () => {
    const now = new Date('2026-06-03T00:00:00.000Z');
    const retention = buildFailedExplanationRetentionTimestamp(now);

    expect(retention > now.toISOString()).toBe(true);
  });
});
