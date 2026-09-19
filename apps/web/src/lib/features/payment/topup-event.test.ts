import { describe, expect, it } from 'vitest';

export function detectTopupEvent(
  previousBalance: number | null,
  newBalance: number | null | undefined,
): { added: number; newBalance: number } | null {
  if (previousBalance === null || newBalance === null || newBalance === undefined) {
    return null;
  }
  if (newBalance > previousBalance) {
    return {
      added: newBalance - previousBalance,
      newBalance,
    };
  }
  return null;
}

describe('detectTopupEvent', () => {
  it('returns null on initial load when previousBalance is null', () => {
    expect(detectTopupEvent(null, 50)).toBeNull();
  });

  it('detects topup event when new balance is strictly greater', () => {
    const event = detectTopupEvent(20, 70);
    expect(event).toEqual({ added: 50, newBalance: 70 });
  });

  it('returns null when balance stays the same or decreases (spending)', () => {
    expect(detectTopupEvent(50, 50)).toBeNull();
    expect(detectTopupEvent(50, 45)).toBeNull();
  });

  it('returns null for undefined or null newBalance', () => {
    expect(detectTopupEvent(50, undefined)).toBeNull();
    expect(detectTopupEvent(50, null)).toBeNull();
  });
});
