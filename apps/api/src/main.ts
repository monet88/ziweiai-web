import { NestFactory } from '@nestjs/core';
import { ApiErrorFilter } from './common/http/api-error.filter';
import { AppModule } from './app.module';
import { allowedCorsOrigins, apiEnv } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useGlobalFilters(new ApiErrorFilter());
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedCorsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: false,
  });

  await app.listen(apiEnv.API_PORT);
}

void bootstrap();
