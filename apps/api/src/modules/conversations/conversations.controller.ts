import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import {
  createConversationRequestSchema,
  createConversationMessageRequestSchema,
  conversationListResponseSchema,
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

  @Post()
  async createConversation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const input = createConversationRequestSchema.parse(body);
    return this.conversationsService.createConversation(currentUser, input);
  }

  @Get()
  async listConversations(
    @CurrentUser() _currentUser: AuthenticatedUser,
    @Req() _request: AuthenticatedRequest,
  ) {
    // For now list by chart via query param is not implemented; expose detail by id instead.
    // Return empty shape to keep contract; actual list-by-chart is via ChartDetail enrichment later.
    return conversationListResponseSchema.parse({ items: [] });
  }

  @Get(':conversationId')
  async getConversationDetail(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ) {
    const parsedId = z.uuid().parse(conversationId);
    return this.conversationsService.getConversationDetail(currentUser.userId, parsedId);
  }

  @Post(':conversationId/messages')
  async appendMessage(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ) {
    const parsedId = z.uuid().parse(conversationId);
    const input = createConversationMessageRequestSchema.parse(body);
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
    const parsedId = z.uuid().parse(conversationId);
    const input = createConversationMessageRequestSchema.parse(body);

    const send = (event: unknown) => {
      const validated = conversationStreamEventSchema.parse(event);
      res.write(`data: ${JSON.stringify(validated)}\n\n`);
    };

    try {
      // Persist user message + generate assistant (full text); stream chunks if provider supports.
      // Current providers return full text; simulate chunking for contract compatibility.
      const { fullText, assistantMessage } = await this.conversationsService.appendMessageAndGenerate(
        currentUser,
        request.ip ?? 'unknown',
        parsedId,
        input,
      );

      // Flush SSE headers ONLY after generation succeeds. Flushing earlier sends a 200 status, so a
      // later failure can no longer set the real HTTP status (ERR_HTTP_HEADERS_SENT). With this order,
      // a pre-stream failure returns a clean JSON error with the correct status (catch branch below).
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      // Naive chunking to satisfy stream contract (word-by-word-ish). Real streaming can replace this later.
      const words = fullText.split(/(\s+)/);
      for (const w of words) {
        if (!w) continue;
        send({ type: 'chunk', delta: w });
        // small delay to make stream observable in dev; harmless in prod
        await new Promise((r) => setTimeout(r, 5));
      }

      send({ type: 'done', message: assistantMessage });
    } catch (error) {
      // Known failures arrive as ApiErrorHttpException (typed code + status) from the service: quota
      // (429 RATE_LIMITED), feature flag (403 FEATURE_DISABLED), provider timeout/unavailable, etc.
      // Use those instead of fragile message string-matching.
      const requestId = request.requestId ?? null;
      const { status, code, message } = this.resolveStreamError(error);

      if (!res.headersSent) {
        // Stream never started — respond with a normal JSON error the client already understands.
        res.status(status).json({ code, message, requestId });
      } else {
        // Stream already open — the status is locked; surface the error as an SSE error frame.
        send({ type: 'error', error: { code, message, requestId } });
      }
    } finally {
      res.end();
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
    return {
      status: HttpStatus.BAD_GATEWAY,
      code: 'PROVIDER_UNAVAILABLE',
      message: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}
