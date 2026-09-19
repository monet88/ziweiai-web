import { Injectable, OnModuleInit } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { QuotasRegistry } from '../quotas/quotas.registry';

@Injectable()
export class MbtiQuotaRule implements OnModuleInit {
  constructor(private readonly registry: QuotasRegistry) {}

  onModuleInit(): void {
    this.registry.register({
      featureKey: 'mbti-quiz',
      dailyLimit: apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER,
      dailyErrorMessage: 'Daily explanation quota exceeded.',
    });
  }
}
