import { Injectable, OnModuleInit } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { QuotasRegistry } from '../quotas/quotas.registry';

@Injectable()
export class VisionQuotaRule implements OnModuleInit {
  constructor(private readonly registry: QuotasRegistry) {}

  onModuleInit(): void {
    this.registry.register({
      featureKey: 'vision-analysis',
      dailyLimit: apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER, // Using explanation limit as default for vision
      dailyErrorMessage: 'Daily explanation quota exceeded.',
    });
  }
}
