import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QuotasModule } from '../quotas/quotas.module';
import { PairingsController } from './pairings.controller';
import { PairingsService } from './pairings.service';

@Module({
  imports: [QuotasModule, DatabaseModule],
  controllers: [PairingsController],
  providers: [PairingsService],
})
export class PairingsModule {}
