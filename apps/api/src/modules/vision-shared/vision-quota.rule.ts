import { Injectable, OnModuleInit } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { QuotasRegistry } from '../quotas/quotas.registry';

@Injectable()
export class VisionQuotaRule implements OnModuleInit {
  constructor(private readonly registry: QuotasRegistry) {}

  onModuleInit(): void {
    this.registry.register({
      featureKey: 'vision-analysis',
      dailyLimit: apiEnv.API_VISION_REQUESTS_PER_DAY_PER_USER,
      dailyErrorMessage: 'Daily vision analysis quota exceeded.',
    });
  }
}
