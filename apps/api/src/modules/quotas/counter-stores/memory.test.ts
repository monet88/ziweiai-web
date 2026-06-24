import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryQuotaCounterStore } from './memory';

describe('MemoryQuotaCounterStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows under-limit counts', async () => {
    const store = new MemoryQuotaCounterStore();
    const r1 = await store.incrementAndCheck('k', 3, 60);
    const r2 = await store.incrementAndCheck('k', 3, 60);
    expect(r1).toEqual({ count: 1, allowed: true });
    expect(r2).toEqual({ count: 2, allowed: true });
  });

  it('allows exactly at the limit', async () => {
    const store = new MemoryQuotaCounterStore();
    await store.incrementAndCheck('k', 2, 60);
    const atLimit = await store.incrementAndCheck('k', 2, 60);
    expect(atLimit).toEqual({ count: 2, allowed: true });
  });

  it('blocks over the limit', async () => {
    const store = new MemoryQuotaCounterStore();
    await store.incrementAndCheck('k', 2, 60);
    await store.incrementAndCheck('k', 2, 60);
    const over = await store.incrementAndCheck('k', 2, 60);
    expect(over).toEqual({ count: 3, allowed: false });
  });

  it('does not reset the TTL window between increments', async () => {
    const store = new MemoryQuotaCounterStore();
    await store.incrementAndCheck('k', 5, 60); // window set: expires at +60s
    vi.advanceTimersByTime(30_000); // still within window
    const second = await store.incrementAndCheck('k', 5, 60);
    expect(second.count).toBe(2); // count carried, TTL not reset
  });

  it('resets the counter after TTL expiry', async () => {
    const store = new MemoryQuotaCounterStore();
    await store.incrementAndCheck('k', 5, 60);
    await store.incrementAndCheck('k', 5, 60); // count = 2
    vi.advanceTimersByTime(61_000); // window expired
    const afterExpiry = await store.incrementAndCheck('k', 5, 60);
    expect(afterExpiry).toEqual({ count: 1, allowed: true });
  });

  it('tracks keys independently', async () => {
    const store = new MemoryQuotaCounterStore();
    await store.incrementAndCheck('a', 1, 60);
    const b = await store.incrementAndCheck('b', 1, 60);
    expect(b).toEqual({ count: 1, allowed: true });
  });
});
