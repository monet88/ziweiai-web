import { NestFactory } from '@nestjs/core';
import { ApiErrorFilter } from './common/http/api-error.filter';
import { AppModule } from './app.module';
import { apiEnv } from './config/env';
import { initSentry } from './observability/init-sentry';

async function bootstrap() {
  initSentry(apiEnv.SENTRY_DSN);

  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });

  app.useGlobalFilters(new ApiErrorFilter());
    const allowedOriginsRaw = process.env.ALLOWED_CORS_ORIGINS || '';
  const allowedCorsOrigins = allowedOriginsRaw
    ? allowedOriginsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:3000',
        'https://ziweiai.vercel.app',
      ];
  app.enableCors({
    origin: allowedCorsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
  });

  await app.listen(apiEnv.API_PORT);
}

void bootstrap();
