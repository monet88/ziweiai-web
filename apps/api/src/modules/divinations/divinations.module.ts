import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QuotasModule } from '../quotas/quotas.module';
import { DivinationsController } from './divinations.controller';
import { DivinationsService } from './services/divinations.service';

@Module({
  imports: [DatabaseModule, QuotasModule],
  controllers: [DivinationsController],
  providers: [DivinationsService],
  exports: [DivinationsService],
})
export class DivinationsModule {}
