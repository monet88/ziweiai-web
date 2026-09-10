import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { DynamicThrottlerGuard } from './common/guards/dynamic-throttler.guard';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChartsModule } from './modules/charts/charts.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { DivinationsModule } from './modules/divinations/divinations.module';
import { ExplanationsModule } from './modules/explanations/explanations.module';
import { DrawsTarotModule } from './modules/draws-tarot/draws-tarot.module';
import { DrawsIchingModule } from './modules/draws-iching/draws-iching.module';
import { NumerologyModule } from './modules/numerology/numerology.module';
import { DrawsLenormandModule } from './modules/draws-lenormand/draws-lenormand.module';
import { DreamsModule } from './modules/dreams/dreams.module';
import { DrawsSticksModule } from './modules/draws-sticks/draws-sticks.module';
import { AlmanacModule } from './modules/almanac/almanac.module';
import { FortuneModule } from './modules/fortune/fortune.module';
import { HistoryModule } from './modules/history/history.module';
import { QuotasModule } from './modules/quotas/quotas.module';
import { QuizzesMbtiModule } from './modules/quizzes-mbti/quizzes-mbti.module';
import { PairingsModule } from './modules/pairings/pairings.module';
import { VisionSharedModule } from './modules/vision-shared/vision-shared.module';
import { PaymentModule } from './modules/payment/payment.module';
import { UsersModule } from './modules/users/users.module';
import { ShareModule } from './modules/share/share.module';
import { AdminModule } from './modules/admin/admin.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { WalletModule } from './modules/wallet/wallet.module';

import { TurnstileModule } from './common/turnstile/turnstile.module';
import { DossierModule } from './modules/dossier/dossier.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    DatabaseModule,
    WalletModule, AlmanacModule, AuthModule, ChartsModule, ConversationsModule, DivinationsModule, DrawsIchingModule, DrawsTarotModule, NumerologyModule, DrawsLenormandModule, DreamsModule, DrawsSticksModule, ExplanationsModule, FortuneModule, HealthModule, HistoryModule, PairingsModule, QuizzesMbtiModule, QuotasModule, VisionSharedModule, PaymentModule, UsersModule, ShareModule, AdminModule, RewardsModule, TurnstileModule, DossierModule, NotificationsModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: DynamicThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
