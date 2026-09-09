import { Inject, Injectable } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { QUOTA_COUNTER_STORE, type QuotaCounterStore } from './counter-stores/quota-counter-store';
import { DailyQuotaExceededError, RateLimitWindowError } from './quota-errors';
import { QuotasRegistry } from './quotas.registry';

interface SlidingWindowBucket {
  readonly hits: number[];
}

const ONE_DAY_SECONDS = 24 * 60 * 60;

/** Khoá ngày UTC (yyyy-mm-dd) để cửa sổ quota tự cuốn theo ngày; TTL 24h là backstop. */
export function utcDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

@Injectable()
export class QuotasService {
  private readonly ipBuckets = new Map<string, SlidingWindowBucket>();
  private readonly userBuckets = new Map<string, SlidingWindowBucket>();

  constructor(
    private readonly registry: QuotasRegistry,
    @Inject(QUOTA_COUNTER_STORE) private readonly counterStore: QuotaCounterStore,
  ) {}

  async assertCanExecute(featureKey: string, userId: string, ipAddress: string, isAnonymous = false): Promise<void> {
    const rule = this.registry.get(featureKey);
    if (!rule) {
      throw new Error(`Unknown quota feature: ${featureKey}`);
    }

    // 1. In-memory Rate Limiting
    const ipLimit = rule.ipMinuteLimit ?? apiEnv.API_REQUESTS_PER_MINUTE_PER_IP;
    this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, ipLimit, 60_000);

    // Chỉ áp dụng rate limit per-user cho tài khoản đã xác thực có userId thật
    if (!isAnonymous && userId) {
      const userLimit = rule.userMinuteLimit ?? apiEnv.API_REQUESTS_PER_MINUTE_PER_USER;
      this.assertSlidingWindow(this.userBuckets, `user:${userId}`, userLimit, 60_000);
    }

    // 2. Daily Quota Enforcement
    const dayKey = utcDayKey(Date.now());
    
    if (isAnonymous) {
      // Anon ALWAYS uses counterStore to prevent bypass (e.g. incognito)
      const anonLimit = rule.anonDailyLimit ?? rule.dailyLimit;
      let prefix = rule.featureKey;
      if (['chart', 'explanation', 'conversation'].includes(rule.featureKey)) {
        prefix = `anon-${rule.featureKey}`;
      } else {
        prefix = `anon:${rule.featureKey}`;
      }
      const counterKey = `${prefix}:ip:${ipAddress}:${dayKey}`;
      await this.assertDailyQuota(counterKey, anonLimit, rule.dailyErrorMessage);
      return;
    }

    // Signed-in User
    if (rule.countSignedInDailyUsage) {
      // Use the feature's custom DB counting logic (e.g. countChartSnapshotsSince)
      const usage = await rule.countSignedInDailyUsage(userId);
      if (usage >= rule.dailyLimit) {
        throw new DailyQuotaExceededError(rule.dailyErrorMessage);
      }
    } else {
      // Default generic counter store for signed-in users (e.g. tarot-draw, mbti-quiz)
      const counterKey = `${rule.featureKey}:user:${userId}:${dayKey}`;
      await this.assertDailyQuota(counterKey, rule.dailyLimit, rule.dailyErrorMessage);
    }
  }

  private async assertDailyQuota(key: string, limit: number, message: string): Promise<void> {
    const { allowed } = await this.counterStore.incrementAndCheck(key, limit, ONE_DAY_SECONDS);
    if (!allowed) {
      throw new DailyQuotaExceededError(message);
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
