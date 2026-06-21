import { Module } from '@nestjs/common';
import { QuotasModule } from '../quotas/quotas.module';
import { PairingsController } from './pairings.controller';
import { PairingsService } from './pairings.service';

@Module({
  imports: [QuotasModule],
  controllers: [PairingsController],
  providers: [PairingsService],
})
export class PairingsModule {}
