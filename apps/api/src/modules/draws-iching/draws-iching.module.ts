import { Module } from '@nestjs/common';
import { DrawsIchingService } from './draws-iching.service';
import { DrawsIchingController } from './draws-iching.controller';
import { IChingGroundingAdapter } from './adapters/iching-grounding.adapter';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [AiProvidersModule, DatabaseModule],
  controllers: [DrawsIchingController],
  providers: [DrawsIchingService, IChingGroundingAdapter],
  exports: [DrawsIchingService],
})
export class DrawsIchingModule {}
