import { Injectable } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';

interface SlidingWindowBucket {
  readonly hits: number[];
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class QuotasService {
  private readonly ipBuckets = new Map<string, SlidingWindowBucket>();
  private readonly userBuckets = new Map<string, SlidingWindowBucket>();
  // Trần daily-per-IP in-memory CHỈ cho đường ẩn danh (decision 0009): anon userId reset
  // được bằng cách xoá localStorage / mở incognito → quota daily-per-user (đếm theo DB) bị
  // reset trắng. IP thường cố định hơn nên dùng làm khoá chặn lạm dụng dài hạn cho anon
  // (đặc biệt /explanations gọi LLM tốn chi phí thật). User thường vẫn đếm daily theo DB.
  //
  // TODO(backlog #20): bộ đếm này in-memory nên KHÔNG bền — restart process reset trắng,
  // và chạy đa-instance thì mỗi instance đếm riêng → trần thực tế nhân theo số instance.
  // Khi có Redis (hoặc store chia sẻ tương đương) → chuyển anonDailyIpBuckets sang INCR +
  // EXPIRE theo khoá `anon-{chart|explanation}:{ip}` để chia sẻ trạng thái + tự hết hạn.
  // Chưa làm migration DB cho việc này: tránh lưu IP (PII) vào bảng owned + thêm schema.
  private readonly anonDailyIpBuckets = new Map<string, SlidingWindowBucket>();

  constructor(private readonly persistenceGateway: SupabasePersistenceGateway) {}

  async assertCanCreateChart(userId: string, ipAddress: string, isAnonymous = false): Promise<void> {
    this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_IP, 60_000);
    this.assertSlidingWindow(this.userBuckets, `user:${userId}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_USER, 60_000);

    if (isAnonymous) {
      this.assertSlidingWindow(this.anonDailyIpBuckets, `anon-chart:${ipAddress}`, apiEnv.API_CHARTS_PER_DAY_PER_USER, ONE_DAY_MS, 'Daily chart quota exceeded.');
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
      this.assertSlidingWindow(this.anonDailyIpBuckets, `anon-explanation:${ipAddress}`, apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER, ONE_DAY_MS, 'Daily explanation quota exceeded.');
      return;
    }

    const sinceIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
    const explanationsCreated = await this.persistenceGateway.countExplanationRequestsSince(userId, sinceIso);
    if (explanationsCreated >= apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER) {
      throw new Error('Daily explanation quota exceeded.');
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
