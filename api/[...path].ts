import { NestFactory } from '@nestjs/core';

let serverPromise: Promise<(req: unknown, res: unknown) => void> | null = null;

async function createServer(): Promise<(req: unknown, res: unknown) => void> {
  const [{ ApiErrorFilter }, { AppModule }, { allowedCorsOrigins }] = await Promise.all([
    import('../apps/api/dist/apps/api/src/common/http/api-error.filter.js'),
    import('../apps/api/dist/apps/api/src/app.module.js'),
    import('../apps/api/dist/apps/api/src/config/env.js'),
  ]);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useGlobalFilters(new ApiErrorFilter());
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedCorsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: false,
  });

  await app.init();
  return app.getHttpAdapter().getInstance() as (req: unknown, res: unknown) => void;
}

export default async function handler(req: { url?: string }, res: unknown) {
  req.url = req.url?.replace(/^\/api(?=\/|$)/, '') || '/';
  serverPromise ??= createServer();
  const server = await serverPromise;
  return server(req, res);
}
