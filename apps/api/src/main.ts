import { NestFactory } from '@nestjs/core';
import { ApiErrorFilter } from './common/http/api-error.filter';
import { AppModule } from './app.module';
import { allowedCorsOrigins, apiEnv } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useGlobalFilters(new ApiErrorFilter());
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      // Origin lạ → callback(null, false): cors middleware bỏ qua header Access-Control-Allow-Origin
      // và request đi tiếp bình thường (browser tự chặn JS đọc response). KHÔNG ném Error — ném ở đây
      // khiến cors gọi next(err) → ApiErrorFilter bắt thành 500 cho MỌI request mang origin lạ
      // (kể cả /health public), thay vì hành vi CORS chuẩn là "lặng lẽ không cho phép".
      if (!origin || allowedCorsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: false,
  });

  await app.listen(apiEnv.API_PORT);
}

void bootstrap();
