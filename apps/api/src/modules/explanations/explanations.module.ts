import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { DeepseekExplanationProvider } from '../../providers/ai/deepseek-explanation-provider';
import { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { GeminiExplanationProvider } from '../../providers/ai/gemini-explanation-provider';
import { OpenAiCompatibleExplanationProvider } from '../../providers/ai/openai-compatible-explanation-provider';
import { QuotasModule } from '../quotas/quotas.module';
import { ExplanationsController } from './explanations.controller';
import { ExplanationsService } from './services/explanations.service';

@Module({
  imports: [DatabaseModule, QuotasModule],
  controllers: [ExplanationsController],
  providers: [
    DeepseekExplanationProvider,
    ExplanationProviderRouter,
    ExplanationsService,
    GeminiExplanationProvider,
    OpenAiCompatibleExplanationProvider,
  ],
})
export class ExplanationsModule {}
