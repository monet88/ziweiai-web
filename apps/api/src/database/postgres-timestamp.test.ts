import { describe, expect, it } from 'vitest';
import { normalizePostgresTimestamp } from './postgres-timestamp';

describe('normalizePostgresTimestamp', () => {
  it('converts Postgres timestamptz text into strict ISO datetime', () => {
    expect(normalizePostgresTimestamp('2026-06-07 11:17:21.337+00')).toBe('2026-06-07T11:17:21.337Z');
  });

  it('preserves microsecond precision for CAS/version comparisons', () => {
    expect(normalizePostgresTimestamp('2026-06-07 11:17:21.337456+00')).toBe('2026-06-07T11:17:21.337456Z');
    expect(normalizePostgresTimestamp('2026-06-07T11:17:21.337456Z')).toBe('2026-06-07T11:17:21.337456Z');
  });

  it('returns null for nullish timestamps', () => {
    expect(normalizePostgresTimestamp(null)).toBeNull();
    expect(normalizePostgresTimestamp(undefined)).toBeNull();
  });
});
