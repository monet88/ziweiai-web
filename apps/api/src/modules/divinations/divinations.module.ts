import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QuotasModule } from '../quotas/quotas.module';
import { DivinationsController } from './divinations.controller';
import { DivinationsService } from './services/divinations.service';
import { DivinationQuotaRules } from './divination-quota.rules';

@Module({
  imports: [DatabaseModule, QuotasModule],
  controllers: [DivinationsController],
  providers: [DivinationsService, DivinationQuotaRules],
  exports: [DivinationsService],
})
export class DivinationsModule {}
