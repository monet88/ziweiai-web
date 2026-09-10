import { Body, Controller, HttpStatus, Logger, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  createExplanationRequestSchema,
  type ApiErrorCode,
  type AuthenticatedUser,
  type ExplanationStreamEvent,
} from '@ziweiai/contracts';
import { z } from 'zod';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { ExplanationsService } from './services/explanations.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiErrorHttpException } from '../../common/http/api-error';

@Controller('explanations')
export class ExplanationsController {
  private readonly logger = new Logger(ExplanationsController.name);

  constructor(private readonly explanationsService: ExplanationsService) {}

  @Post()
  async createExplanation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createExplanationRequestSchema)) input: z.infer<typeof createExplanationRequestSchema>,
  ) {
    return this.explanationsService.createExplanation(currentUser, request.ip ?? 'unknown', input);
  }

  @Post('stream')
  async createExplanationStream(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
    @Body(new ZodValidationPipe(createExplanationRequestSchema)) input: z.infer<typeof createExplanationRequestSchema>,
  ) {
    const send = (event: ExplanationStreamEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    let headersFlushed = false;
    const ensureHeaders = () => {
      if (headersFlushed) {
        return;
      }
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      headersFlushed = true;
    };

    const abortController = new AbortController();
    const onPreStreamClose = () => {
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    };
    let preStreamGuardArmed = false;
    const disarmPreStreamGuard = () => {
      if (preStreamGuardArmed) {
        res.off('close', onPreStreamClose);
        preStreamGuardArmed = false;
      }
    };
    res.on('close', onPreStreamClose);
    preStreamGuardArmed = true;

    try {
      const generator = this.explanationsService.createExplanationStream(
        currentUser,
        request.ip ?? 'unknown',
        input,
        abortController.signal,
      );

      let next = await generator.next();
      while (!next.done) {
        if (res.destroyed) {
          if (!abortController.signal.aborted) {
            abortController.abort();
          }
        } else {
          disarmPreStreamGuard();
          ensureHeaders();
          send({ type: 'chunk', delta: next.value as string });
        }
        next = await generator.next();
      }

      if (!res.destroyed) {
        ensureHeaders();
        send({ type: 'done', ...(next.value as any) });
      }
    } catch (error) {
      const requestId = request.requestId ?? null;
      const { status, code, message } = this.resolveStreamError(error);

      if (res.destroyed) {
        // Socket is dead, do not write
      } else if (!res.headersSent) {
        res.status(status).json({ code, message, requestId });
      } else {
        send({ type: 'error', error: { code, message, requestId } });
      }
    } finally {
      disarmPreStreamGuard();
      if (!res.destroyed) {
        res.end();
      }
    }
  }

  private resolveStreamError(error: unknown): { status: number; code: ApiErrorCode; message: string } {
    if (error instanceof ApiErrorHttpException) {
      const payload = error.getResponse();
      const shaped = typeof payload === 'object' && payload !== null ? (payload as { code?: ApiErrorCode; message?: string }) : {};
      return {
        status: error.getStatus(),
        code: shaped.code ?? 'PROVIDER_UNAVAILABLE',
        message: shaped.message ?? 'Generation failed',
      };
    }
    this.logger.error(
      'Explanation stream failed with a non-typed error.',
      error instanceof Error ? error.stack : String(error),
    );
    return {
      status: HttpStatus.BAD_GATEWAY,
      code: 'PROVIDER_UNAVAILABLE',
      message: 'Đã xảy ra lỗi khi tạo luận giải. Vui lòng thử lại.',
    };
  }
}
