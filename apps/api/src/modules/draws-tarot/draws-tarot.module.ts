import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { DrawsTarotController } from './draws-tarot.controller';
import { DrawsTarotService } from './draws-tarot.service';

import { TarotGroundingAdapter } from './adapters/tarot-grounding.adapter';

@Module({
  imports: [DatabaseModule, AiProvidersModule],
  controllers: [DrawsTarotController],
  providers: [DrawsTarotService, TarotGroundingAdapter],
})
export class DrawsTarotModule {}
