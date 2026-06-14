import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QuotasModule } from '../quotas/quotas.module';
import { ChartsController } from './charts.controller';
import { ChartsService } from './services/charts.service';

@Module({
  imports: [DatabaseModule, QuotasModule],
  controllers: [ChartsController],
  providers: [ChartsService],
  exports: [ChartsService],
})
export class ChartsModule {}
