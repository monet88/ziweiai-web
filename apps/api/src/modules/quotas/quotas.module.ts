import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QuotasService } from './quotas.service';

@Module({
  imports: [DatabaseModule],
  providers: [QuotasService],
  exports: [QuotasService],
})
export class QuotasModule {}
