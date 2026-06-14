import { Injectable } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';

interface SlidingWindowBucket {
  readonly hits: number[];
}

@Injectable()
export class QuotasService {
  private readonly ipBuckets = new Map<string, SlidingWindowBucket>();
  private readonly userBuckets = new Map<string, SlidingWindowBucket>();

  constructor(private readonly persistenceGateway: SupabasePersistenceGateway) {}

  async assertCanCreateChart(userId: string, ipAddress: string): Promise<void> {
    this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_IP, 60_000);
    this.assertSlidingWindow(this.userBuckets, `user:${userId}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_USER, 60_000);

    const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const chartsCreated = await this.persistenceGateway.countChartSnapshotsSince(userId, sinceIso);
    if (chartsCreated >= apiEnv.API_CHARTS_PER_DAY_PER_USER) {
      throw new Error('Daily chart quota exceeded.');
    }
  }

  async assertCanCreateExplanation(userId: string, ipAddress: string): Promise<void> {
    this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_IP, 60_000);
    this.assertSlidingWindow(this.userBuckets, `user:${userId}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_USER, 60_000);

    const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
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
  ): void {
    const now = Date.now();
    const bucket = store.get(key) ?? { hits: [] };
    const freshHits = bucket.hits.filter((hitAt) => now - hitAt < windowMs);

    if (freshHits.length >= limit) {
      store.set(key, { hits: freshHits });
      throw new Error('Too many requests in the current time window.');
    }

    freshHits.push(now);
    store.set(key, { hits: freshHits });
  }
}
