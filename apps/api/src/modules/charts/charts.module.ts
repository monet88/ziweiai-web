import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { QuotasModule } from '../quotas/quotas.module';
import { ChartsController } from './charts.controller';
import { ChartsService } from './services/charts.service';
import { ChartQuotaRule } from './chart-quota.rule';

@Module({
  imports: [DatabaseModule, QuotasModule, WalletModule],
  controllers: [ChartsController],
  providers: [ChartsService, ChartQuotaRule],
  exports: [ChartsService],
})
export class ChartsModule {}
