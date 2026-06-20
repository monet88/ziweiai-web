import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { apiErrorSchema } from '@ziweiai/contracts';
import type { Response } from 'express';
import { ZodError } from 'zod';
import type { RequestWithRequestId } from '../request-id.middleware';

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithRequestId>();
    const response = context.getResponse<Response>();
    const requestId = request.requestId ?? null;

    if (exception instanceof ZodError) {
      response.status(HttpStatus.BAD_REQUEST).json(
        apiErrorSchema.parse({
          code: 'INVALID_INPUT',
          message: exception.issues[0]?.message ?? 'Dữ liệu yêu cầu không hợp lệ.',
          requestId,
        }),
      );
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'object' && payload !== null) {
        const parsed = apiErrorSchema.safeParse(payload);
        if (parsed.success) {
          response.status(status).json(parsed.data);
          return;
        }
      }

      response.status(status).json(
        apiErrorSchema.parse({
          code: status === HttpStatus.UNAUTHORIZED ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
          message: exception.message,
          requestId,
        }),
      );
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      apiErrorSchema.parse({
        code: 'INTERNAL_ERROR',
        message: 'Đã xảy ra lỗi máy chủ ngoài dự kiến.',
        requestId,
      }),
    );
    // Nhánh fallback (non-HttpException/non-Zod): lỗi ngoài dự kiến phải để lại stack trace,
    // không nuốt im lặng. requestId giúp truy vết theo header x-request-id.
    this.logger.error(
      `Lỗi máy chủ ngoài dự kiến (requestId=${requestId ?? 'null'})`,
      exception instanceof Error ? exception.stack : String(exception),
    );
  }
}
