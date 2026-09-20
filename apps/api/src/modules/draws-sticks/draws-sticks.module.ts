import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { DrawsSticksController } from './draws-sticks.controller';
import { DrawsSticksService } from './draws-sticks.service';

@Module({
  imports: [DatabaseModule, AiProvidersModule],
  controllers: [DrawsSticksController],
  providers: [DrawsSticksService],
  exports: [DrawsSticksService],
})
export class DrawsSticksModule {}
