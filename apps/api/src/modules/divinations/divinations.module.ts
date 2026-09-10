import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QuotasModule } from '../quotas/quotas.module';
import { AiProvidersModule } from '../../providers/ai/ai-providers.module';
import { WalletModule } from '../wallet/wallet.module';
import { DivinationsController } from './divinations.controller';
import { DivinationsService } from './services/divinations.service';
import { DivinationChatService } from './services/divination-chat.service';
import { DivinationQuotaRules } from './divination-quota.rules';

@Module({
  imports: [DatabaseModule, QuotasModule, AiProvidersModule, WalletModule],
  controllers: [DivinationsController],
  providers: [DivinationsService, DivinationChatService, DivinationQuotaRules],
  exports: [DivinationsService, DivinationChatService],
})
export class DivinationsModule {}
