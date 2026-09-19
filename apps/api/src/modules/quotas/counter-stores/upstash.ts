import { Logger } from '@nestjs/common';
import type { QuotaCounterStore } from './quota-counter-store';
import { MemoryQuotaCounterStore } from './memory';

type FailMode = 'open' | 'closed';

interface UpstashConfig {
  restUrl: string;
  restToken: string;
  failMode: FailMode;
  memoryFallback?: QuotaCounterStore;
}

interface UpstashPipelineResult {
  result?: number | string;
  error?: string;
}

/**
 * UpstashRestQuotaCounterStore: driver bộ đếm qua Upstash Redis REST API (prod).
 *
 * Gọi HTTPS `fetch` (không thêm dependency native) — hợp boundary 0007 (chỉ apps/api).
 * Pipeline atomic `INCR` + `EXPIRE … NX` trong 1 request: `EXPIRE NX` đảm bảo TTL chỉ
 * set ở lần tạo khoá đầu, không reset cửa sổ giữa chừng.
 *
 * Khi store ngoài lỗi (fetch reject / status != ok): theo `failMode` —
 *   - open: ghi warn và fallback sang `memoryFallback` cục bộ (vừa đảm bảo tính liên tục,
 *     vừa ngăn chặn việc spam lặp đi lặp lại không giới hạn trên cùng 1 instance).
 *   - closed: trả allowed=false (chặn tuyệt đối).
 *
 * Alternative khi deploy có Redis TCP sẵn: dùng `ioredis` với pipeline
 * `INCR key` + `EXPIRE key ttl NX` (rẻ hơn REST khi QPS cao, nhưng cần dependency
 * native + TCP egress). Giữ REST làm mặc định prod vì zero-dependency + edge-friendly.
 */
export class UpstashRestQuotaCounterStore implements QuotaCounterStore {
  private readonly logger = new Logger(UpstashRestQuotaCounterStore.name);
  private readonly restUrl: string;
  private readonly restToken: string;
  private readonly failMode: FailMode;
  private readonly memoryFallback: QuotaCounterStore;

  constructor(config: UpstashConfig) {
    // Bỏ dấu / cuối để ghép path /pipeline không bị double-slash.
    this.restUrl = config.restUrl.replace(/\/+$/, '');
    this.restToken = config.restToken;
    this.failMode = config.failMode;
    this.memoryFallback = config.memoryFallback ?? new MemoryQuotaCounterStore();
  }

  async incrementAndCheck(
    key: string,
    limit: number,
    ttlSeconds: number,
  ): Promise<{ count: number; allowed: boolean }> {
    try {
      const response = await fetch(`${this.restUrl}/pipeline`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.restToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, String(ttlSeconds), 'NX'],
        ]),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return this.onUnavailable(`status ${response.status}`, key, limit, ttlSeconds);
      }

      const payload = (await response.json()) as UpstashPipelineResult[];
      const incrResult = payload?.[0];
      const expireResult = payload?.[1];
      if (!incrResult || incrResult.error !== undefined || incrResult.result === undefined) {
        return this.onUnavailable('malformed pipeline response', key, limit, ttlSeconds);
      }
      if (expireResult?.error !== undefined) {
        this.logger.warn(
          `quota-store.expire_failed driver=upstash key=${key} error=${expireResult.error}`,
        );
      }

      const count = Number(incrResult.result);
      if (!Number.isFinite(count)) {
        return this.onUnavailable('non-numeric INCR result', key, limit, ttlSeconds);
      }

      return { count, allowed: count <= limit };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      return this.onUnavailable(reason, key, limit, ttlSeconds);
    }
  }

  private async onUnavailable(
    reason: string,
    key: string,
    limit: number,
    ttlSeconds: number,
  ): Promise<{ count: number; allowed: boolean }> {
    this.logger.warn(`quota-store.unavailable driver=upstash failMode=${this.failMode} reason=${reason}`);
    if (this.failMode === 'closed' || process.env.NODE_ENV === 'production') {
      return { count: Number.POSITIVE_INFINITY, allowed: false };
    }
    // Resilient memory fallback cho dev/test
    return this.memoryFallback.incrementAndCheck(key, limit, ttlSeconds);
  }
}
