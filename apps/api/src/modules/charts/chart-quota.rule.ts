import { Injectable, OnModuleInit } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { QuotasRegistry } from '../quotas/quotas.registry';
import { ChartsRepository } from '../../database/repositories/charts.repository';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ChartQuotaRule implements OnModuleInit {
  constructor(
    private readonly registry: QuotasRegistry,
    private readonly repository: ChartsRepository,
  ) {}

  onModuleInit(): void {
    this.registry.register({
      featureKey: 'chart',
      dailyLimit: apiEnv.API_CHARTS_PER_DAY_PER_USER,
      dailyErrorMessage: 'Daily chart quota exceeded.',
      countSignedInDailyUsage: async (userId: string) => {
        const sinceIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
        return this.repository.countChartSnapshotsSince(userId, sinceIso);
      },
    });
  }
}
