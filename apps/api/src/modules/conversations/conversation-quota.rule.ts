import { Injectable, OnModuleInit } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { QuotasRegistry } from '../quotas/quotas.registry';
import { ConversationsRepository } from '../../database/repositories/conversations.repository';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ConversationQuotaRule implements OnModuleInit {
  constructor(
    private readonly registry: QuotasRegistry,
    private readonly repository: ConversationsRepository,
  ) {}

  onModuleInit(): void {
    this.registry.register({
      featureKey: 'conversation',
      dailyLimit: apiEnv.API_CONVERSATION_MESSAGES_PER_DAY_PER_USER,
      dailyErrorMessage: 'Daily conversation quota exceeded.',
      countSignedInDailyUsage: async (userId: string) => {
        const sinceIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
        return this.repository.countConversationUserMessagesSince(userId, sinceIso);
      },
    });
  }
}
