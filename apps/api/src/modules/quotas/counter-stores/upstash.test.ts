import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { UpstashRestQuotaCounterStore } from './upstash';
import { createQuotaCounterStore } from './index';

function mockFetchResult(incrResult: number): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => [{ result: incrResult }, { result: 1 }],
    })) as never,
  );
}

const config = {
  restUrl: 'https://example.upstash.io',
  restToken: 'token-abc',
  failMode: 'open' as const,
};

describe('UpstashRestQuotaCounterStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('allows under the limit', async () => {
    mockFetchResult(1);
    const store = new UpstashRestQuotaCounterStore(config);
    const result = await store.incrementAndCheck('k', 3, 86_400);
    expect(result).toEqual({ count: 1, allowed: true });
  });

  it('allows exactly at the limit', async () => {
    mockFetchResult(2);
    const store = new UpstashRestQuotaCounterStore(config);
    const result = await store.incrementAndCheck('k', 2, 86_400);
    expect(result).toEqual({ count: 2, allowed: true });
  });

  it('blocks over the limit', async () => {
    mockFetchResult(3);
    const store = new UpstashRestQuotaCounterStore(config);
    const result = await store.incrementAndCheck('k', 2, 86_400);
    expect(result).toEqual({ count: 3, allowed: false });
  });

  it('sends INCR + EXPIRE NX pipeline to the /pipeline endpoint with bearer auth', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => [{ result: 1 }, { result: 1 }],
    }));
    vi.stubGlobal('fetch', fetchSpy as never);

    const store = new UpstashRestQuotaCounterStore(config);
    await store.incrementAndCheck('anon-chart:1.2.3.4:2026-06-17', 20, 86_400);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.upstash.io/pipeline');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer token-abc');
    expect(JSON.parse(init.body as string)).toEqual([
      ['INCR', 'anon-chart:1.2.3.4:2026-06-17'],
      ['EXPIRE', 'anon-chart:1.2.3.4:2026-06-17', '86400', 'NX'],
    ]);
  });

  it('fail-open: store down (fetch rejects) → allowed=true', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }) as never);
    const store = new UpstashRestQuotaCounterStore({ ...config, failMode: 'open' });
    const result = await store.incrementAndCheck('k', 1, 86_400);
    expect(result.allowed).toBe(true);
  });

  it('fail-closed: store down (fetch rejects) → allowed=false', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }) as never);
    const store = new UpstashRestQuotaCounterStore({ ...config, failMode: 'closed' });
    const result = await store.incrementAndCheck('k', 1, 86_400);
    expect(result.allowed).toBe(false);
  });

  it('fail-open: non-ok HTTP status → allowed=true', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => [] })) as never);
    const store = new UpstashRestQuotaCounterStore({ ...config, failMode: 'open' });
    const result = await store.incrementAndCheck('k', 1, 86_400);
    expect(result.allowed).toBe(true);
  });

  it('fail-open: fetch timeout → allowed=true', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
      }) as never,
    );
    const store = new UpstashRestQuotaCounterStore({ ...config, failMode: 'open' });
    const result = await store.incrementAndCheck('k', 1, 86_400);
    expect(result.allowed).toBe(true);
  });

  it('logs warn when EXPIRE fails but still returns INCR count', async () => {
    const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => [
        { result: 5 },
        { error: 'EXPIRE NX failed' },
      ],
    }));
    vi.stubGlobal('fetch', fetchSpy as never);

    const store = new UpstashRestQuotaCounterStore(config);
    const result = await store.incrementAndCheck('k', 10, 86_400);

    expect(result).toEqual({ count: 5, allowed: true });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('quota-store.expire_failed'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('EXPIRE NX failed'),
    );
  });

  it('resilient memory fallback: ngăn chặn spam lặp đi lặp lại khi Upstash gặp sự cố (failMode=open)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }) as never);
    const store = new UpstashRestQuotaCounterStore({ ...config, failMode: 'open' });

    // Limit = 2
    const res1 = await store.incrementAndCheck('anon-test:key', 2, 86_400);
    expect(res1).toEqual({ count: 1, allowed: true });

    const res2 = await store.incrementAndCheck('anon-test:key', 2, 86_400);
    expect(res2).toEqual({ count: 2, allowed: true });

    // Vượt quá limit 2 trong đợt Upstash outage -> chặn ở memory fallback
    const res3 = await store.incrementAndCheck('anon-test:key', 2, 86_400);
    expect(res3).toEqual({ count: 3, allowed: false });
  });

  it('createQuotaCounterStore: falls back to memory when upstash driver selected without credentials in dev', () => {
    const store = createQuotaCounterStore({
      QUOTA_STORE_DRIVER: 'upstash',
      QUOTA_FAIL_MODE: 'open',
    } as never);
    expect(store).toBeDefined();
  });

  describe('createQuotaCounterStore in production', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalFlag = process.env.ALLOW_INSECURE_MEMORY_QUOTA_IN_PROD;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_INSECURE_MEMORY_QUOTA_IN_PROD;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      if (originalFlag !== undefined) {
        process.env.ALLOW_INSECURE_MEMORY_QUOTA_IN_PROD = originalFlag;
      } else {
        delete process.env.ALLOW_INSECURE_MEMORY_QUOTA_IN_PROD;
      }
    });

    it('throws error when memory driver is used in production without break-glass flag', () => {
      expect(() =>
        createQuotaCounterStore({
          QUOTA_STORE_DRIVER: 'memory',
          QUOTA_FAIL_MODE: 'closed',
        } as never),
      ).toThrowError(/CRITICAL: QUOTA_STORE_DRIVER=memory is strictly forbidden in production/);
    });

    it('allows memory driver in production when break-glass flag ALLOW_INSECURE_MEMORY_QUOTA_IN_PROD=true is set', () => {
      process.env.ALLOW_INSECURE_MEMORY_QUOTA_IN_PROD = 'true';
      const store = createQuotaCounterStore({
        QUOTA_STORE_DRIVER: 'memory',
        QUOTA_FAIL_MODE: 'closed',
      } as never);
      expect(store).toBeDefined();
    });

    it('throws error when upstash driver is selected in production without credentials', () => {
      expect(() =>
        createQuotaCounterStore({
          QUOTA_STORE_DRIVER: 'upstash',
          QUOTA_FAIL_MODE: 'closed',
        } as never),
      ).toThrowError(/CRITICAL: QUOTA_STORE_DRIVER=upstash requires QUOTA_UPSTASH_REST_URL and QUOTA_UPSTASH_REST_TOKEN in production/);
    });
  });
});


