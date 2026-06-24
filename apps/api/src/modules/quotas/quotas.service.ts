import { Inject, Injectable } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';
import { QUOTA_COUNTER_STORE, type QuotaCounterStore } from './counter-stores/quota-counter-store';
import { DailyQuotaExceededError, RateLimitWindowError } from './quota-errors';

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
      throw new DailyQuotaExceededError('Daily chart quota exceeded.');
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
      throw new DailyQuotaExceededError('Daily explanation quota exceeded.');
    }
  }

  /**
   * Quota cho lượt rút Tarot (US-017).
   *
   * Tarot proof deterministic KHÔNG ghi `explanation_request` row, nên không thể đếm qua
   * `countExplanationRequestsSince` như đường /explanations (user có email sẽ không bao giờ chạm
   * trần daily). Vì vậy đếm qua `QuotaCounterStore` — mỗi lượt draw tăng đếm cho CẢ user thường
   * lẫn anon (anon đếm theo IP để chống reset phiên: xoá localStorage / incognito; cùng lý do
   * `assertCanCreateExplanation`). Dùng chung trần `API_EXPLANATIONS_PER_DAY_PER_USER` (tarot là
   * một dạng luận giải AI). Rate-limit per-minute per-IP/per-user vẫn áp như các đường khác.
   */
  async assertCanCreateTarotDraw(userId: string, ipAddress: string, isAnonymous = false): Promise<void> {
    this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_IP, 60_000);
    this.assertSlidingWindow(this.userBuckets, `user:${userId}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_USER, 60_000);

    const dayKey = utcDayKey(Date.now());
    const counterKey = isAnonymous
      ? `tarot-draw:ip:${ipAddress}:${dayKey}`
      : `tarot-draw:user:${userId}:${dayKey}`;
    await this.assertAnonDailyQuota(counterKey, apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER, 'Daily explanation quota exceeded.');
  }

  /**
   * Quota cho lượt làm trắc nghiệm MBTI (US-017b).
   *
   * Giống Tarot: MBTI sinh diễn giải qua đường AI nhưng KHÔNG ghi `explanation_request` row,
   * nên đếm qua `QuotaCounterStore` thay vì `countExplanationRequestsSince`. Mỗi lượt tăng đếm
   * cho cả user thường lẫn anon (anon đếm theo IP để chống reset phiên). Dùng chung trần
   * `API_EXPLANATIONS_PER_DAY_PER_USER` (MBTI là một dạng luận giải AI text).
   */
  async assertCanCreateMbtiQuiz(userId: string, ipAddress: string, isAnonymous = false): Promise<void> {
    this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_IP, 60_000);
    this.assertSlidingWindow(this.userBuckets, `user:${userId}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_USER, 60_000);

    const dayKey = utcDayKey(Date.now());
    const counterKey = isAnonymous
      ? `mbti-quiz:ip:${ipAddress}:${dayKey}`
      : `mbti-quiz:user:${userId}:${dayKey}`;
    await this.assertAnonDailyQuota(counterKey, apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER, 'Daily explanation quota exceeded.');
  }

  /**
   * Quota cho lượt ghép Hợp Hôn (US-017c).
   *
   * Giống Tarot/MBTI: sinh diễn giải qua đường AI nhưng KHÔNG ghi `explanation_request` row,
   * nên đếm qua `QuotaCounterStore`. Mỗi lượt ghép tăng đếm cho cả user thường lẫn anon (anon
   * đếm theo IP để chống reset phiên). Dùng chung trần `API_EXPLANATIONS_PER_DAY_PER_USER`.
   */
  async assertCanCreatePairing(userId: string, ipAddress: string, isAnonymous = false): Promise<void> {
    this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_IP, 60_000);
    this.assertSlidingWindow(this.userBuckets, `user:${userId}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_USER, 60_000);

    const dayKey = utcDayKey(Date.now());
    const counterKey = isAnonymous
      ? `pairing:ip:${ipAddress}:${dayKey}`
      : `pairing:user:${userId}:${dayKey}`;
    await this.assertAnonDailyQuota(counterKey, apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER, 'Daily explanation quota exceeded.');
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

  /**
   * Quota riêng cho luận giải vision (Xem Tướng/Xem Tay — US-017e/f).
   *
   * Vision đắt token gấp 5-10× text nên KHÔNG dùng chung `API_EXPLANATIONS_PER_DAY_PER_USER`; trần
   * riêng `API_VISION_REQUESTS_PER_DAY_PER_USER` (mặc định 5/ngày/user). face/palm chặn anon ở tầng
   * trên (assertEmailIdentityRequired) nên ở đây chỉ đếm theo userId (không có nhánh anon-by-IP).
   * Đếm chung cho cả face + palm: bảo vệ chi phí ở cấp người dùng, không tách theo loại ảnh. Đếm qua
   * `QuotaCounterStore` (bền qua restart sau US-013) với cửa sổ ngày UTC. Rate-limit per-minute vẫn áp.
   */
  async assertCanCreateVisionAnalysis(userId: string, ipAddress: string): Promise<void> {
    this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_IP, 60_000);
    this.assertSlidingWindow(this.userBuckets, `user:${userId}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_USER, 60_000);

    const dayKey = utcDayKey(Date.now());
    const counterKey = `vision-analysis:user:${userId}:${dayKey}`;
    await this.assertAnonDailyQuota(counterKey, apiEnv.API_VISION_REQUESTS_PER_DAY_PER_USER, 'Daily vision quota exceeded.');
  }

  private async assertAnonDailyQuota(key: string, limit: number, message: string): Promise<void> {
    const { allowed } = await this.counterStore.incrementAndCheck(key, limit, ONE_DAY_SECONDS);
    if (!allowed) {
      throw new DailyQuotaExceededError(message);
    }
  }

  async assertCanCreateConversationMessage(userId: string, ipAddress: string, isAnonymous = false): Promise<void> {
    this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_IP, 60_000);
    this.assertSlidingWindow(this.userBuckets, `user:${userId}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_USER, 60_000);

    if (isAnonymous) {
      // US-013: anon daily quota dùng QuotaCounterStore bền qua restart (thay Map in-memory cũ),
      // đếm theo IP + ngày UTC để chống reset phiên (xoá localStorage / incognito).
      await this.assertAnonDailyQuota(
        `anon-conversation:${ipAddress}:${utcDayKey(Date.now())}`,
        apiEnv.API_CONVERSATION_MESSAGES_PER_DAY_PER_USER,
        'Daily conversation quota exceeded.',
      );
      return;
    }

    const sinceIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
    const messagesCreated = await this.persistenceGateway.countConversationMessagesSince(userId, sinceIso);
    if (messagesCreated >= apiEnv.API_CONVERSATION_MESSAGES_PER_DAY_PER_USER) {
      throw new DailyQuotaExceededError('Daily conversation quota exceeded.');
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
      throw new RateLimitWindowError(message);
    }

    freshHits.push(now);
    store.set(key, { hits: freshHits });
  }
}
