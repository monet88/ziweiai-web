import { Module } from '@nestjs/common';
import { QuotasModule } from '../quotas/quotas.module';
import { QuizzesMbtiController } from './quizzes-mbti.controller';
import { QuizzesMbtiService } from './quizzes-mbti.service';

@Module({
  imports: [QuotasModule],
  controllers: [QuizzesMbtiController],
  providers: [QuizzesMbtiService],
})
export class QuizzesMbtiModule {}
