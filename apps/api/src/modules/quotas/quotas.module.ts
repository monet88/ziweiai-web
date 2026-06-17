import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QuotasService } from './quotas.service';
import { QUOTA_COUNTER_STORE } from './counter-stores/quota-counter-store';
import { createQuotaCounterStore } from './counter-stores';

@Module({
  imports: [DatabaseModule],
  providers: [
    QuotasService,
    {
      provide: QUOTA_COUNTER_STORE,
      useFactory: () => createQuotaCounterStore(),
    },
  ],
  exports: [QuotasService],
})
export class QuotasModule {}
