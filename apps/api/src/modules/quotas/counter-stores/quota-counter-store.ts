/**
 * QuotaCounterStore (US-013): trừu tượng bộ đếm quota chia sẻ cho đường ẩn danh.
 *
 * Thay thế Map in-memory `anonDailyIpBuckets` (TODO #20) bằng abstraction có thể
 * swap driver qua env (`memory` cho dev/test, `upstash` cho prod). Mục tiêu: trần
 * daily-per-IP sống sót qua restart process + chia sẻ giữa các instance.
 *
 * Hợp đồng: `incrementAndCheck` tăng bộ đếm theo `key` lên 1, đặt TTL ở lần đầu
 * (không reset cửa sổ), và trả `allowed=false` khi count sau khi tăng VƯỢT `limit`.
 */
export interface QuotaCounterStore {
  /**
   * Tăng bộ đếm cho `key` lên 1 và kiểm tra so với `limit`.
   *
   * @param key Khoá đếm, vd `anon-chart:1.2.3.4:2026-06-17`.
   * @param limit Trần tối đa (count <= limit → allowed).
   * @param ttlSeconds TTL của khoá (giây); chỉ set ở lần tạo đầu để không reset cửa sổ.
   * @returns count sau khi tăng + cờ allowed (count <= limit).
   */
  incrementAndCheck(
    key: string,
    limit: number,
    ttlSeconds: number,
  ): Promise<{ count: number; allowed: boolean }>;
}

/** DI token cho `QuotaCounterStore` (NestJS provider). */
export const QUOTA_COUNTER_STORE = Symbol.for('QuotaCounterStore');
