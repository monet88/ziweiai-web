import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { ExplanationsController } from './explanations.controller';
import { ExplanationsService } from './services/explanations.service';

@Module({
  imports: [DatabaseModule, QuotasModule, AiProvidersModule],
  controllers: [ExplanationsController],
  providers: [ExplanationsService],
})
export class ExplanationsModule {}
