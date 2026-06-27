import { Body, Controller, Get, HttpStatus, Logger, Param, Post, Query, Req, Res } from '@nestjs/common';
import {
  createConversationRequestSchema,
  createConversationMessageRequestSchema,
  conversationStreamEventSchema,
  type AuthenticatedUser,
} from '@ziweiai/contracts';
import { z } from 'zod';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { ConversationsService } from './services/conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  private readonly logger = new Logger(ConversationsController.name);

  // Đồng nhất với VisionController: validate input bằng safeParse rồi ném ApiErrorHttpException
  // (INVALID_INPUT, thông điệp tiếng Việt) thay vì để Zod ném ZodError thô. Gom về một helper để
  // mọi handler dùng chung một dạng lỗi 400 cho dữ liệu thiếu/sai.
  private parseOrBadRequest<T>(schema: z.ZodType<T>, value: unknown, message: string): T {
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new ApiErrorHttpException(HttpStatus.BAD_REQUEST, 'INVALID_INPUT', message);
    }
    return result.data;
  }

  @Post()
  async createConversation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const input = this.parseOrBadRequest(
      createConversationRequestSchema,
      body,
      'Dữ liệu tạo cuộc trò chuyện không hợp lệ.',
    );
    return this.conversationsService.createConversation(currentUser, input);
  }

  @Get()
  async listConversations(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('chartSnapshotId') chartSnapshotId: string | undefined,
  ) {
    // List-by-chart: the client always scopes conversations to a chart (the assistant panel lives on
    // the chart-detail screen). chartSnapshotId is required — without it there is no useful "all my
    // conversations" view in the product, and an unscoped list would be an unbounded cross-chart scan.
    const parsedChartId = this.parseOrBadRequest(
      z.uuid(),
      chartSnapshotId,
      'Thiếu hoặc sai mã lá số (chartSnapshotId).',
    );
    return this.conversationsService.listConversationsForChart(currentUser.userId, parsedChartId);
  }

  @Get(':conversationId')
  async getConversationDetail(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ) {
    const parsedId = this.parseOrBadRequest(
      z.uuid(),
      conversationId,
      'Mã cuộc trò chuyện không hợp lệ.',
    );
    return this.conversationsService.getConversationDetail(currentUser.userId, parsedId);
  }

  @Post(':conversationId/messages')
  async appendMessage(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ) {
    const parsedId = this.parseOrBadRequest(
      z.uuid(),
      conversationId,
      'Mã cuộc trò chuyện không hợp lệ.',
    );
    const input = this.parseOrBadRequest(
      createConversationMessageRequestSchema,
      body,
      'Dữ liệu tin nhắn không hợp lệ.',
    );
    // Non-streaming path: persist user + generate assistant, return full assistant message via detail.
    // Pass the real client IP so per-IP daily quota / rate-limit applies (anon abuse control); the
    // streaming path already does this. A hardcoded value would collapse all anon callers into one key.
    await this.conversationsService.appendMessageAndGenerate(
      currentUser,
      request.ip ?? 'unknown',
      parsedId,
      input,
    );
    return this.conversationsService.getConversationDetail(currentUser.userId, parsedId);
  }

  @Post(':conversationId/messages/stream')
  async appendMessageStream(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const parsedId = this.parseOrBadRequest(
      z.uuid(),
      conversationId,
      'Mã cuộc trò chuyện không hợp lệ.',
    );
    const input = this.parseOrBadRequest(
      createConversationMessageRequestSchema,
      body,
      'Dữ liệu tin nhắn không hợp lệ.',
    );

    const send = (event: unknown) => {
      const validated = conversationStreamEventSchema.parse(event);
      res.write(`data: ${JSON.stringify(validated)}\n\n`);
    };

    // Flush SSE headers lazily: only once the first byte is ready to go out. Flushing earlier would
    // lock a 200 status, so a gate/provider error firing BEFORE any token could no longer set the
    // real HTTP status. With this guard, a pre-stream failure (entitlement 402, quota 429, feature
    // flag 403, provider error before the first delta) still lands in the catch branch with headers
    // unsent and returns a clean JSON error.
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

    // US-027 (decision 0026) + backlog #34 (lossless client-disconnect): abort the upstream provider
    // fetch when the client goes away so we stop burning tokens, WITHOUT ever dropping the reply the
    // user already saw. The signal is threaded to the service -> provider; on abort the provider stops
    // reading upstream and returns the text accumulated so far (it does NOT throw), so the service
    // still persists the partial assistant message. The disconnect signal is res.destroyed, polled in
    // the loop on the real socket state — NOT the 'close' event, which fires while the response is
    // still writable under Node/Express and previously caused spurious aborts that lost the reply.
    const abortController = new AbortController();
    // Pre-first-token disconnect guard. The loop below polls res.destroyed BETWEEN deltas, so a client
    // that disconnects during a slow or hung first-token pull would not be noticed until a token finally
    // arrives or the provider times out — holding the request and burning upstream work meanwhile. We
    // listen for 'close' ONLY for this opening window: nothing is accumulated yet, so an abort here can
    // never truncate a reply the user saw. Once the first delta arrives we disarm it and hand back to
    // the res.destroyed poll, because the 'close' event misfires mid-stream under Node/Express and a
    // spurious abort there previously dropped the reply (backlog #34).
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
      // The service runs all gates (enabled -> entitlement 402 -> quota 429) and persists the user
      // message BEFORE the first delta, so any failure up to here throws before a byte is sent. Each
      // delta becomes a `chunk` frame; the generator's return value is the persisted assistant message
      // for the `done` frame. When no provider supports streaming, the service falls back to non-stream
      // generation and emits the full text as a single delta, preserving the chunk -> done contract.
      const generator = this.conversationsService.appendMessageAndGenerateStream(
        currentUser,
        request.ip ?? 'unknown',
        parsedId,
        input,
        abortController.signal,
      );

      let next = await generator.next();
      while (!next.done) {
        if (res.destroyed) {
          // Client gone: abort the upstream fetch so the provider stops pulling tokens. The provider
          // returns the accumulated text (lossless), so we keep draining the generator to its return
          // value and let the service persist the partial reply. We just stop writing to the dead socket.
          if (!abortController.signal.aborted) {
            abortController.abort();
          }
        } else {
          // First delta committed: streaming has started, so the opening-window guard is no longer
          // needed (and would misfire mid-stream). Disarm it and rely on the res.destroyed poll above.
          disarmPreStreamGuard();
          // The first delta is the safe point to commit headers: generation has started successfully.
          ensureHeaders();
          send({ type: 'chunk', delta: next.value });
        }
        next = await generator.next();
      }

      if (!res.destroyed) {
        // Headers may still be unsent if the stream produced zero deltas (defensive: providers reject
        // empty content upstream, but the contract still needs a `done` frame).
        ensureHeaders();
        send({ type: 'done', message: next.value });
      }
    } catch (error) {
      // Known failures arrive as ApiErrorHttpException (typed code + status) from the service: quota
      // (429 RATE_LIMITED), feature flag (403 FEATURE_DISABLED), provider timeout/unavailable, etc.
      // Use those instead of fragile message string-matching.
      const requestId = request.requestId ?? null;
      const { status, code, message } = this.resolveStreamError(error);

      if (res.destroyed) {
        // Client already gone: the socket is dead, so any write (JSON status OR SSE frame) would
        // throw ERR_STREAM_WRITE_AFTER_END. Skip writing entirely; the error is already logged in
        // resolveStreamError for non-typed faults. Guarding the WHOLE block (not just the SSE arm)
        // covers the pre-stream path too: a disconnect before the first byte leaves headersSent
        // false AND destroyed true, where res.status().json() would still crash.
      } else if (!res.headersSent) {
        // Stream never started — respond with a normal JSON error the client already understands.
        res.status(status).json({ code, message, requestId });
      } else {
        // Stream already open — the status is locked; surface the error as an SSE error frame.
        send({ type: 'error', error: { code, message, requestId } });
      }
    } finally {
      // Drop the opening-window listener on every exit path (it is a no-op once already disarmed).
      disarmPreStreamGuard();
      if (!res.destroyed) {
        res.end();
      }
    }
  }

  private resolveStreamError(error: unknown): { status: number; code: string; message: string } {
    if (error instanceof ApiErrorHttpException) {
      const payload = error.getResponse();
      const shaped = typeof payload === 'object' && payload !== null ? (payload as { code?: string; message?: string }) : {};
      return {
        status: error.getStatus(),
        code: shaped.code ?? 'PROVIDER_UNAVAILABLE',
        message: shaped.message ?? 'Generation failed',
      };
    }
    // Medium-1: a non-typed error (not ApiError/ProviderError) may carry internal detail (stack, DSN,
    // credentials). Log it server-side for diagnosis but return a generic Vietnamese message so the
    // raw text never reaches the client. Typed errors above keep their already-safe messages.
    this.logger.error(
      'Conversation stream failed with a non-typed error.',
      error instanceof Error ? error.stack : String(error),
    );
    return {
      status: HttpStatus.BAD_GATEWAY,
      code: 'PROVIDER_UNAVAILABLE',
      message: 'Đã xảy ra lỗi khi tạo nội dung. Vui lòng thử lại.',
    };
  }
}
