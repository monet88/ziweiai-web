import { Module } from '@nestjs/common';
import { QuotasModule } from '../quotas/quotas.module';
import { DrawsTarotController } from './draws-tarot.controller';
import { DrawsTarotService } from './draws-tarot.service';

@Module({
  imports: [QuotasModule],
  controllers: [DrawsTarotController],
  providers: [DrawsTarotService],
})
export class DrawsTarotModule {}
