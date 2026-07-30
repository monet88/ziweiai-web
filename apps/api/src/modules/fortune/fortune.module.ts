import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { WalletModule } from '../wallet/wallet.module';
import { FortuneController } from './fortune.controller';
import { AnnualReportService } from './services/annual-report.service';
import { FortuneService } from './services/fortune.service';
import { HoroscopeEngineAdapter } from './services/horoscope-engine.adapter';
import { FortuneQuotaRules } from './fortune-quota.rules';

@Module({
  imports: [DatabaseModule, QuotasModule, WalletModule, AiProvidersModule],
  controllers: [FortuneController],
  providers: [
    FortuneService,
    AnnualReportService,
    HoroscopeEngineAdapter,
    FortuneQuotaRules,
  ],
})
export class FortuneModule {}
