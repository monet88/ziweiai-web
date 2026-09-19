import { Injectable, OnModuleInit } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { QuotasRegistry } from '../quotas/quotas.registry';
import { ExplanationsRepository } from '../../database/repositories/explanations.repository';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ExplanationQuotaRule implements OnModuleInit {
  constructor(
    private readonly registry: QuotasRegistry,
    private readonly repository: ExplanationsRepository,
  ) {}

  onModuleInit(): void {
    this.registry.register({
      featureKey: 'explanation',
      dailyLimit: apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER,
      dailyErrorMessage: 'Daily explanation quota exceeded.',
      countSignedInDailyUsage: async (userId: string) => {
        const sinceIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
        return this.repository.countExplanationRequestsSince(userId, sinceIso);
      },
    });
  }
}
