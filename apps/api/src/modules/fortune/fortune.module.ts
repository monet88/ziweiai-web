import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { DeepseekExplanationProvider } from '../../providers/ai/deepseek-explanation-provider';
import { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { GeminiExplanationProvider } from '../../providers/ai/gemini-explanation-provider';
import { OpenAiCompatibleExplanationProvider } from '../../providers/ai/openai-compatible-explanation-provider';
import { QuotasModule } from '../quotas/quotas.module';
import { FortuneController } from './fortune.controller';
import { AnnualReportService } from './services/annual-report.service';
import { FortuneService } from './services/fortune.service';
import { HoroscopeEngineAdapter } from './services/horoscope-engine.adapter';

@Module({
  imports: [DatabaseModule, QuotasModule],
  controllers: [FortuneController],
  providers: [
    FortuneService,
    AnnualReportService,
    HoroscopeEngineAdapter,
    ExplanationProviderRouter,
    DeepseekExplanationProvider,
    OpenAiCompatibleExplanationProvider,
    GeminiExplanationProvider,
  ],
})
export class FortuneModule {}
