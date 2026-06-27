import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChartsModule } from './modules/charts/charts.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { DivinationsModule } from './modules/divinations/divinations.module';
import { ExplanationsModule } from './modules/explanations/explanations.module';
import { DrawsTarotModule } from './modules/draws-tarot/draws-tarot.module';
import { FortuneModule } from './modules/fortune/fortune.module';
import { HistoryModule } from './modules/history/history.module';
import { QuotasModule } from './modules/quotas/quotas.module';
import { QuizzesMbtiModule } from './modules/quizzes-mbti/quizzes-mbti.module';
import { PairingsModule } from './modules/pairings/pairings.module';
import { VisionSharedModule } from './modules/vision-shared/vision-shared.module';

@Module({
  imports: [AuthModule, ChartsModule, ConversationsModule, DivinationsModule, DrawsTarotModule, ExplanationsModule, FortuneModule, HealthModule, HistoryModule, PairingsModule, QuizzesMbtiModule, QuotasModule, VisionSharedModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
