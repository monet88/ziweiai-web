import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { ConversationProviderRouter } from '../../providers/ai/conversation-provider-router';
import { DeepseekExplanationProvider } from '../../providers/ai/deepseek-explanation-provider';
import { GeminiExplanationProvider } from '../../providers/ai/gemini-explanation-provider';
import { OpenAiCompatibleExplanationProvider } from '../../providers/ai/openai-compatible-explanation-provider';
import { QuotasModule } from '../quotas/quotas.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './services/conversations.service';
import { ConversationQuotaRule } from './conversation-quota.rule';

@Module({
  imports: [DatabaseModule, WalletModule, QuotasModule],
  controllers: [ConversationsController],
  providers: [
    ConversationProviderRouter,
    ConversationsService,
    DeepseekExplanationProvider,
    GeminiExplanationProvider,
    OpenAiCompatibleExplanationProvider,
    ConversationQuotaRule,
  ],
})
export class ConversationsModule {}
