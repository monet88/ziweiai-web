import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { QuotasModule } from '../quotas/quotas.module';
import { ExplanationsController } from './explanations.controller';
import { ExplanationsService } from './services/explanations.service';
import { ExplanationValidatorService } from './services/explanation-validator.service';
import { ExplanationBillingService } from './services/explanation-billing.service';
import { ExplanationRaceControllerService } from './services/explanation-race-controller.service';

@Module({
  imports: [DatabaseModule, QuotasModule, AiProvidersModule],
  controllers: [ExplanationsController],
  providers: [
    ExplanationsService,
    ExplanationValidatorService,
    ExplanationBillingService,
    ExplanationRaceControllerService,
  ],
})
export class ExplanationsModule {}
