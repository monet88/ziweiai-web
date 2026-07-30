import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QuotasModule } from '../quotas/quotas.module';
import { WalletModule } from '../wallet/wallet.module';
import { PairingsController } from './pairings.controller';
import { PairingsService } from './pairings.service';
import { PairingQuotaRule } from './pairing-quota.rule';

@Module({
  imports: [QuotasModule, DatabaseModule, WalletModule],
  controllers: [PairingsController],
  providers: [PairingsService, PairingQuotaRule],
})
export class PairingsModule {}
