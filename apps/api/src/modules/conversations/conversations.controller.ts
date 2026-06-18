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
  ) {
    const parsedId = z.uuid().parse(conversationId);
    const input = createConversationMessageRequestSchema.parse(body);
    // Non-streaming path: persist user + generate assistant, return full assistant message via detail.
    await this.conversationsService.appendMessageAndGenerate(
      currentUser,
      'unknown',
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

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

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
      const status = (error as { status?: number }).status ?? HttpStatus.BAD_GATEWAY;
      const code =
        (error as { response?: { code?: string } }).response?.code ??
        ((error as { message?: string }).message?.includes('FEATURE_DISABLED') ? 'FEATURE_DISABLED' : 'PROVIDER_UNAVAILABLE');
      const message = (error as Error).message ?? 'Generation failed';
      send({
        type: 'error',
        error: { code, message, requestId: (request as { requestId?: string }).requestId ?? null },
      });
      res.status(status);
    } finally {
      res.end();
    }
  }
}
