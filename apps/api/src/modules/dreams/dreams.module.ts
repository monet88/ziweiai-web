import { Module } from '@nestjs/common';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { DreamsController } from './dreams.controller';
import { DreamsService } from './dreams.service';

@Module({
  imports: [QuotasModule, AiProvidersModule],
  controllers: [DreamsController],
  providers: [DreamsService],
})
export class DreamsModule {}
