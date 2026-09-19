import { Injectable, OnModuleInit } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { QuotasRegistry } from '../quotas/quotas.registry';

@Injectable()
export class FortuneQuotaRules implements OnModuleInit {
  constructor(private readonly registry: QuotasRegistry) {}

  onModuleInit(): void {
    this.registry.register({
      featureKey: 'annual-report',
      dailyLimit: apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER, // Using explanation limit as default for annual reports
      dailyErrorMessage: 'Daily annual report quota exceeded.',
    });
  }
}
