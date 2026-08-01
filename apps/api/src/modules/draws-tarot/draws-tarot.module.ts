import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { WalletModule } from '../wallet/wallet.module';
import { DrawsTarotController } from './draws-tarot.controller';
import { DrawsTarotService } from './draws-tarot.service';

import { TarotGroundingAdapter } from './adapters/tarot-grounding.adapter';

@Module({
  imports: [DatabaseModule, QuotasModule, WalletModule, AiProvidersModule],
  controllers: [DrawsTarotController],
  providers: [DrawsTarotService, TarotGroundingAdapter],
})
export class DrawsTarotModule {}
