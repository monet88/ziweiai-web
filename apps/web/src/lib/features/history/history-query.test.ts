import { describe, expect, it } from 'vitest';
import { buildHistoryQueryKey } from './history-query';

describe('buildHistoryQueryKey', () => {
  it('includes user id and limit to avoid cache collisions between dashboard and history screen', () => {
    expect(buildHistoryQueryKey('user-1', 8)).toEqual(['history', 'user-1', 8]);
    expect(buildHistoryQueryKey('user-1', 20)).toEqual(['history', 'user-1', 20]);
  });

  it('returns a stable key shape for the same inputs', () => {
    expect(buildHistoryQueryKey('token-2', 20)).toEqual(buildHistoryQueryKey('token-2', 20));
  });
});
