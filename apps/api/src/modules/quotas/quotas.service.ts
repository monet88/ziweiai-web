import { Inject, Injectable } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';
import { QUOTA_COUNTER_STORE, type QuotaCounterStore } from './counter-stores/quota-counter-store';

interface SlidingWindowBucket {
  readonly hits: number[];
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_DAY_SECONDS = 24 * 60 * 60;

/** Khoá ngày UTC (yyyy-mm-dd) để cửa sổ quota tự cuốn theo ngày; TTL 24h là backstop. */
function utcDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

@Injectable()
export class QuotasService {
  private readonly ipBuckets = new Map<string, SlidingWindowBucket>();
  private readonly userBuckets = new Map<string, SlidingWindowBucket>();

  // Trần daily-per-IP CHỈ cho đường ẩn danh (decision 0009): anon userId reset được bằng cách
  // xoá localStorage / mở incognito → quota daily-per-user (đếm theo DB) bị reset trắng. IP
  // thường cố định hơn nên dùng làm khoá chặn lạm dụng dài hạn cho anon (đặc biệt /explanations
  // gọi LLM tốn chi phí thật). User thường vẫn đếm daily theo DB.
  //
  // US-013: bộ đếm này chuyển sang `QuotaCounterStore` (driver memory/upstash qua env) để bền
  // qua restart + chia sẻ đa-instance. Rate-limit per-minute (ipBuckets/userBuckets) giữ
  // in-memory: cửa sổ 60s đủ ngắn để drift sau restart không có hậu quả thật.
  constructor(
    private readonly persistenceGateway: SupabasePersistenceGateway,
    @Inject(QUOTA_COUNTER_STORE) private readonly counterStore: QuotaCounterStore,
  ) {}

  async assertCanCreateChart(userId: string, ipAddress: string, isAnonymous = false): Promise<void> {
    this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_IP, 60_000);
    this.assertSlidingWindow(this.userBuckets, `user:${userId}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_USER, 60_000);

    if (isAnonymous) {
      await this.assertAnonDailyQuota(
        `anon-chart:${ipAddress}:${utcDayKey(Date.now())}`,
        apiEnv.API_CHARTS_PER_DAY_PER_USER,
        'Daily chart quota exceeded.',
      );
      return;
    }

    const sinceIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
    const chartsCreated = await this.persistenceGateway.countChartSnapshotsSince(userId, sinceIso);
    if (chartsCreated >= apiEnv.API_CHARTS_PER_DAY_PER_USER) {
      throw new Error('Daily chart quota exceeded.');
    }
  }

  async assertCanCreateExplanation(userId: string, ipAddress: string, isAnonymous = false): Promise<void> {
    this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_IP, 60_000);
    this.assertSlidingWindow(this.userBuckets, `user:${userId}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_USER, 60_000);

    if (isAnonymous) {
      await this.assertAnonDailyQuota(
        `anon-explanation:${ipAddress}:${utcDayKey(Date.now())}`,
        apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER,
        'Daily explanation quota exceeded.',
      );
      return;
    }

    const sinceIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
    const explanationsCreated = await this.persistenceGateway.countExplanationRequestsSince(userId, sinceIso);
    if (explanationsCreated >= apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER) {
      throw new Error('Daily explanation quota exceeded.');
    }
  }

  /**
   * Quota riêng cho báo cáo năm (US-016): KHÔNG dùng chung quota explanations.
   *
   * Đường này tốn token LLM cao nên trần thấp (`API_ANNUAL_REPORTS_PER_DAY_PER_USER`,
   * mặc định 2/ngày/user). Đếm qua `QuotaCounterStore` (bền qua restart sau US-013) với
   * cửa sổ ngày UTC. Anon đếm theo IP (chống reset phiên bằng cách xoá localStorage /
   * incognito — cùng lý do `assertCanCreateExplanation`), user thường đếm theo userId.
   * Rate-limit per-minute per-IP/per-user vẫn áp như các đường khác.
   */
  async assertCanCreateAnnualReport(userId: string, ipAddress: string, isAnonymous = false): Promise<void> {
    this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_IP, 60_000);
    this.assertSlidingWindow(this.userBuckets, `user:${userId}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_USER, 60_000);

    const dayKey = utcDayKey(Date.now());
    const counterKey = isAnonymous
      ? `annual-report:ip:${ipAddress}:${dayKey}`
      : `annual-report:user:${userId}:${dayKey}`;
    await this.assertAnonDailyQuota(counterKey, apiEnv.API_ANNUAL_REPORTS_PER_DAY_PER_USER, 'Daily annual report quota exceeded.');
  }

  private async assertAnonDailyQuota(key: string, limit: number, message: string): Promise<void> {
    const { allowed } = await this.counterStore.incrementAndCheck(key, limit, ONE_DAY_SECONDS);
    if (!allowed) {
      throw new Error(message);
    }
  }

  private assertSlidingWindow(
    store: Map<string, SlidingWindowBucket>,
    key: string,
    limit: number,
    windowMs: number,
    message = 'Too many requests in the current time window.',
  ): void {
    const now = Date.now();
    const bucket = store.get(key) ?? { hits: [] };
    const freshHits = bucket.hits.filter((hitAt) => now - hitAt < windowMs);

    if (freshHits.length >= limit) {
      store.set(key, { hits: freshHits });
      throw new Error(message);
    }

    freshHits.push(now);
    store.set(key, { hits: freshHits });
  }
}
