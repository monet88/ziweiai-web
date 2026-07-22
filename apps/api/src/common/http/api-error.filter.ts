import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { apiErrorSchema } from '@ziweiai/contracts';
import type { Response } from 'express';
import { ZodError } from 'zod';
import { apiEnv } from '../../config/env';
import { reportOpsAlert, shouldAlertHttpStatus } from '../../observability/ops-alert';
import type { RequestWithRequestId } from '../request-id.middleware';

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithRequestId>();
    const response = context.getResponse<Response>();
    const requestId = request.requestId ?? null;
    const path = request.originalUrl ?? request.url ?? null;

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
      let code = status === HttpStatus.UNAUTHORIZED ? 'UNAUTHORIZED' : 'INTERNAL_ERROR';
      let message = exception.message;

      if (typeof payload === 'object' && payload !== null) {
        const parsed = apiErrorSchema.safeParse(payload);
        if (parsed.success) {
          code = parsed.data.code;
          message = parsed.data.message;
          response.status(status).json(parsed.data);
          this.maybeAlert({ status, code, message, requestId, path, exception });
          return;
        }
      }

      response.status(status).json(
        apiErrorSchema.parse({
          code,
          message,
          requestId,
        }),
      );
      this.maybeAlert({ status, code, message, requestId, path, exception });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      apiErrorSchema.parse({
        code: 'INTERNAL_ERROR',
        message: 'Đã xảy ra lỗi máy chủ ngoài dự kiến.',
        requestId,
      }),
    );

    // Unexpected non-HttpException — always alert.
    void reportOpsAlert(
      {
        level: 'error',
        code: 'INTERNAL_ERROR',
        message:
          exception instanceof Error ? exception.message : String(exception),
        requestId,
        path,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        cause: exception,
      },
      { webhookUrl: apiEnv.OPS_ALERT_WEBHOOK_URL },
    );

    this.logger.error(
      `Lỗi máy chủ ngoài dự kiến (requestId=${requestId ?? 'null'}): ${exception instanceof Error ? exception.message : String(exception)}`,
      exception instanceof Error ? exception.stack : undefined,
    );
  }

  private maybeAlert(input: {
    status: number;
    code: string;
    message: string;
    requestId: string | null;
    path: string | null;
    exception: unknown;
  }): void {
    if (!shouldAlertHttpStatus(input.status, input.code)) {
      return;
    }

    void reportOpsAlert(
      {
        level: 'error',
        code: input.code,
        message: input.message,
        requestId: input.requestId,
        path: input.path,
        status: input.status,
        cause: input.exception,
      },
      { webhookUrl: apiEnv.OPS_ALERT_WEBHOOK_URL },
    );
  }
}

