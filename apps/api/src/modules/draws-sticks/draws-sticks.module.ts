import { Module } from '@nestjs/common';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { DrawsSticksController } from './draws-sticks.controller';
import { DrawsSticksService } from './draws-sticks.service';

@Module({
  imports: [QuotasModule, AiProvidersModule],
  controllers: [DrawsSticksController],
  providers: [DrawsSticksService],
})
export class DrawsSticksModule {}
