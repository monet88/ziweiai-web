import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { WalletModule } from '../wallet/wallet.module';
import { DreamsController } from './dreams.controller';
import { DreamsService } from './dreams.service';

@Module({
  imports: [DatabaseModule, QuotasModule, WalletModule, AiProvidersModule],
  controllers: [DreamsController],
  providers: [DreamsService],
})
export class DreamsModule {}
