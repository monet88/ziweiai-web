import { apiEnv } from '../../../config/env';
import type { QuotaCounterStore } from './quota-counter-store';
import { MemoryQuotaCounterStore } from './memory';
import { UpstashRestQuotaCounterStore } from './upstash';

type ApiEnv = typeof apiEnv;

/**
 * Factory chọn driver bộ đếm quota theo env (US-013).
 *
 * Validate cấu hình driver thật ở resolve-time (không phải parse-time) để default
 * `memory` luôn chạy được mà không cần env mới. Log 1 dòng driver đã chọn ở bootstrap.
 */
export function createQuotaCounterStore(env: ApiEnv = apiEnv): QuotaCounterStore {
  const driver = env.QUOTA_STORE_DRIVER;

  switch (driver) {
    case 'upstash': {
      if (!env.QUOTA_UPSTASH_REST_URL || !env.QUOTA_UPSTASH_REST_TOKEN) {
        throw new Error(
          'QUOTA_STORE_DRIVER=upstash requires QUOTA_UPSTASH_REST_URL and QUOTA_UPSTASH_REST_TOKEN',
        );
      }
      logDriver('upstash');
      return new UpstashRestQuotaCounterStore({
        restUrl: env.QUOTA_UPSTASH_REST_URL,
        restToken: env.QUOTA_UPSTASH_REST_TOKEN,
        failMode: env.QUOTA_FAIL_MODE,
      });
    }
    case 'redis':
      // Enum giữ mở sẵn cho đường upgrade dùng ioredis (INCR + EXPIRE NX qua TCP).
      // Chưa triển khai: chốt một driver thật (upstash) ở MVP để tránh thêm dependency native.
      throw new Error('QUOTA_STORE_DRIVER=redis not implemented yet — use "upstash" or "memory"');
    case 'memory':
    default:
      logDriver('memory');
      return new MemoryQuotaCounterStore();
  }
}

function logDriver(name: string): void {
  console.log(`[quotas] counter store driver=${name}`);
}
