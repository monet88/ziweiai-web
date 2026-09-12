import { NestFactory } from '@nestjs/core';
import { ApiErrorFilter } from './common/http/api-error.filter';
import { AppModule } from './app.module';
import { apiEnv } from './config/env';
import { initSentry } from './observability/init-sentry';

async function bootstrap() {
  initSentry(apiEnv.SENTRY_DSN);

  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });

  app.useGlobalFilters(new ApiErrorFilter());
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
  });

  await app.listen(apiEnv.API_PORT);
}

void bootstrap();
