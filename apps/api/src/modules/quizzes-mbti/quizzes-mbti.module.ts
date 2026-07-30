import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QuotasModule } from '../quotas/quotas.module';
import { WalletModule } from '../wallet/wallet.module';
import { QuizzesMbtiController } from './quizzes-mbti.controller';
import { QuizzesMbtiService } from './quizzes-mbti.service';
import { MbtiQuotaRule } from './mbti-quota.rule';

@Module({
  imports: [QuotasModule, DatabaseModule, WalletModule],
  controllers: [QuizzesMbtiController],
  providers: [QuizzesMbtiService, MbtiQuotaRule],
})
export class QuizzesMbtiModule {}
