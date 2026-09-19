import { Injectable, OnModuleInit } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { QuotasRegistry } from '../quotas/quotas.registry';

@Injectable()
export class DivinationQuotaRules implements OnModuleInit {
  constructor(private readonly registry: QuotasRegistry) {}

  onModuleInit(): void {
    const defaultDailyLimit = apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER;
    const defaultErrorMessage = 'Daily explanation quota exceeded.';

    // Tarot
    this.registry.register({
      featureKey: 'tarot-draw',
      dailyLimit: defaultDailyLimit,
      dailyErrorMessage: defaultErrorMessage,
    });

    // Lenormand
    this.registry.register({
      featureKey: 'lenormand-draw',
      dailyLimit: defaultDailyLimit,
      dailyErrorMessage: defaultErrorMessage,
    });

    // Dream Reading
    this.registry.register({
      featureKey: 'dream-reading',
      dailyLimit: defaultDailyLimit,
      dailyErrorMessage: defaultErrorMessage,
    });

    // Stick Draw
    this.registry.register({
      featureKey: 'stick-draw',
      dailyLimit: defaultDailyLimit,
      dailyErrorMessage: defaultErrorMessage,
    });

    // Almanac Selection
    this.registry.register({
      featureKey: 'almanac-selection',
      dailyLimit: defaultDailyLimit,
      dailyErrorMessage: defaultErrorMessage,
    });
  }
}
