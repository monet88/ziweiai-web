import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { DrawsTarotController } from './draws-tarot.controller';
import { DrawsTarotService } from './draws-tarot.service';

@Module({
  imports: [DatabaseModule, QuotasModule, AiProvidersModule],
  controllers: [DrawsTarotController],
  providers: [DrawsTarotService],
})
export class DrawsTarotModule {}
