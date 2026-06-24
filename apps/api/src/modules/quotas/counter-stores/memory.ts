import type { QuotaCounterStore } from './quota-counter-store';

interface CounterEntry {
  count: number;
  expiresAt: number;
}

/**
 * MemoryQuotaCounterStore: driver bộ đếm in-memory (dev/test, mặc định).
 *
 * Tương đương hành vi cũ của `anonDailyIpBuckets` nhưng theo hợp đồng
 * `QuotaCounterStore`. KHÔNG bền qua restart và KHÔNG chia sẻ đa-instance —
 * đó là lý do prod nên dùng `upstash`. Dọn lười: khoá hết hạn được reset khi đọc.
 */
export class MemoryQuotaCounterStore implements QuotaCounterStore {
  private readonly entries = new Map<string, CounterEntry>();

  async incrementAndCheck(
    key: string,
    limit: number,
    ttlSeconds: number,
  ): Promise<{ count: number; allowed: boolean }> {
    const now = Date.now();
    const existing = this.entries.get(key);

    // Dọn lười: cửa sổ hết hạn → coi như chưa có khoá (count về 0 trước khi tăng).
    if (!existing || existing.expiresAt <= now) {
      const entry: CounterEntry = { count: 1, expiresAt: now + ttlSeconds * 1000 };
      this.entries.set(key, entry);
      return { count: 1, allowed: 1 <= limit };
    }

    // Khoá còn hiệu lực: tăng count, GIỮ nguyên expiresAt (không reset cửa sổ).
    const nextCount = existing.count + 1;
    this.entries.set(key, { count: nextCount, expiresAt: existing.expiresAt });
    return { count: nextCount, allowed: nextCount <= limit };
  }
}
