import { Injectable, OnModuleInit } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { QuotasRegistry } from '../quotas/quotas.registry';

@Injectable()
export class PairingQuotaRule implements OnModuleInit {
  constructor(private readonly registry: QuotasRegistry) {}

  onModuleInit(): void {
    this.registry.register({
      featureKey: 'pairing',
      dailyLimit: apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER, // Using explanation limit as default
      dailyErrorMessage: 'Daily explanation quota exceeded.',
    });
  }
}
