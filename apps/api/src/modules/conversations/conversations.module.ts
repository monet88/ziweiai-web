import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ConversationProviderRouter } from '../../providers/ai/conversation-provider-router';
import { DeepseekExplanationProvider } from '../../providers/ai/deepseek-explanation-provider';
import { GeminiExplanationProvider } from '../../providers/ai/gemini-explanation-provider';
import { OpenAiCompatibleExplanationProvider } from '../../providers/ai/openai-compatible-explanation-provider';
import { QuotasModule } from '../quotas/quotas.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './services/conversations.service';

@Module({
  imports: [DatabaseModule, QuotasModule],
  controllers: [ConversationsController],
  providers: [
    ConversationProviderRouter,
    ConversationsService,
    DeepseekExplanationProvider,
    GeminiExplanationProvider,
    OpenAiCompatibleExplanationProvider,
  ],
})
export class ConversationsModule {}
