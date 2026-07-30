import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { DrawsSticksController } from './draws-sticks.controller';
import { DrawsSticksService } from './draws-sticks.service';

@Module({
  imports: [DatabaseModule, WalletModule, QuotasModule, AiProvidersModule],
  controllers: [DrawsSticksController],
  providers: [DrawsSticksService],
})
export class DrawsSticksModule {}
