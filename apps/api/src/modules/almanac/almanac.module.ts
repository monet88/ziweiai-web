import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { AlmanacController } from './almanac.controller';
import { AlmanacService } from './almanac.service';

@Module({
  imports: [DatabaseModule, WalletModule, QuotasModule, AiProvidersModule],
  controllers: [AlmanacController],
  providers: [AlmanacService],
})
export class AlmanacModule {}
