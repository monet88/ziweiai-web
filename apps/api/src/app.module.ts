import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChartsModule } from './modules/charts/charts.module';
import { ExplanationsModule } from './modules/explanations/explanations.module';
import { HistoryModule } from './modules/history/history.module';
import { QuotasModule } from './modules/quotas/quotas.module';

@Module({
  imports: [AuthModule, ChartsModule, ExplanationsModule, HealthModule, HistoryModule, QuotasModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
