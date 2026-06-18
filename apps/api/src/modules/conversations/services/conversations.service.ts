import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  conversationDetailResponseSchema,
  createConversationResponseSchema,
  explanationContextSchema,
  type AuthenticatedUser,
  type ConversationDetailResponse,
  type ConversationMessageRecord,
  type CreateConversationMessageRequest,
  type CreateConversationRequest,
  type CreateConversationResponse,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { apiEnv } from '../../../config/env';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import { ConversationProviderRouter } from '../../../providers/ai/conversation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../../providers/ai/provider-errors';
import { resolveQuickPrompt } from '../../../providers/ai/quick-prompts';
import { QuotasService } from '../../quotas/quotas.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly persistenceGateway: SupabasePersistenceGateway,
    private readonly quotasService: QuotasService,
    private readonly conversationRouter: ConversationProviderRouter,
  ) {}

  async createConversation(
    user: AuthenticatedUser,
    input: CreateConversationRequest,
  ): Promise<CreateConversationResponse> {
    this.assertConversationEnabled();

    const chartRecord = await this.persistenceGateway.findChartSnapshotById(user.userId, input.chartSnapshotId);
    if (!chartRecord) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy lá số đã lưu.');
    }

    const conversation = await this.persistenceGateway.createConversation({
      ownerUserId: user.userId,
      chartSnapshotId: input.chartSnapshotId,
      title: input.title ?? null,
    });

    return createConversationResponseSchema.parse({ conversation });
  }

  async appendMessageAndGenerate(
    user: AuthenticatedUser,
    ipAddress: string,
    conversationId: string,
    input: CreateConversationMessageRequest,
  ): Promise<{ assistantMessage: ConversationMessageRecord; fullText: string }> {
    this.assertConversationEnabled();

    const conversation = await this.persistenceGateway.findConversationById(user.userId, conversationId);
    if (!conversation) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy cuộc hội thoại.');
    }

    const chartRecord = await this.persistenceGateway.findChartSnapshotById(user.userId, conversation.chartSnapshotId);
    if (!chartRecord) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy lá số liên kết.');
    }

    await this.assertCanCreateConversationMessage(user.userId, ipAddress, user.email === null);

    // Resolve final user content (server owns the prompt text for quick prompts)
    let userContent: string;
    if (input.quickPromptKey) {
      userContent = resolveQuickPrompt(input.quickPromptKey);
    } else if (input.content) {
      userContent = input.content;
    } else {
      throw new ApiErrorHttpException(HttpStatus.BAD_REQUEST, 'INVALID_INPUT', 'Thiếu nội dung tin nhắn.');
    }

    const historyLimit = apiEnv.AI_CONVERSATION_BUFFER_MESSAGES;
    // Fetch recent history BEFORE inserting the new user turn so the prompt context
    // contains only prior turns. The current user message is passed separately as
    // `userMessage` and rendered under "Câu hỏi hiện tại".
    const previousMessages = await this.persistenceGateway.listRecentConversationMessages(
      user.userId,
      conversationId,
      historyLimit,
    );

    // Persist user message (durable even if AI fails later)
    await this.persistenceGateway.createConversationMessage({
      ownerUserId: user.userId,
      conversationId,
      role: 'user',
      content: userContent,
      quickPromptKey: input.quickPromptKey ?? null,
      providerName: null,
      providerMetadata: {},
    });

    const explanationContext = this.buildExplanationContext(chartRecord.snapshot);

    this.logger.log('Conversation generation started', {
      userId: user.userId,
      conversationId,
      providerPreference: input.providerPreference,
      quickPromptKey: input.quickPromptKey ?? null,
    });

    try {
      const providerResult = await this.conversationRouter.generate(input.providerPreference, {
        chartSnapshot: chartRecord.snapshot,
        explanationContext,
        messages: previousMessages,
        userMessage: userContent,
        quickPromptKey: input.quickPromptKey,
      });

      const assistantMessage = await this.persistenceGateway.createConversationMessage({
        ownerUserId: user.userId,
        conversationId,
        role: 'assistant',
        content: providerResult.renderedMarkdown,
        quickPromptKey: null,
        providerName: providerResult.providerMetadata.provider ?? null,
        providerMetadata: providerResult.providerMetadata,
      });

      this.logger.log('Conversation generation completed', {
        userId: user.userId,
        conversationId,
      });

      return {
        assistantMessage,
        fullText: providerResult.renderedMarkdown,
      };
    } catch (error) {
      if (error instanceof ProviderTimeoutError) {
        throw new ApiErrorHttpException(HttpStatus.GATEWAY_TIMEOUT, 'PROVIDER_TIMEOUT', error.message);
      }
      if (error instanceof ProviderUnavailableError) {
        throw new ApiErrorHttpException(HttpStatus.BAD_GATEWAY, 'PROVIDER_UNAVAILABLE', error.message);
      }
      throw error;
    }
  }

  async getConversationDetail(userId: string, conversationId: string): Promise<ConversationDetailResponse> {
    const conversation = await this.persistenceGateway.findConversationById(userId, conversationId);
    if (!conversation) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy cuộc hội thoại.');
    }

    const messages = await this.persistenceGateway.listRecentConversationMessages(userId, conversationId, 200);
    return conversationDetailResponseSchema.parse({
      conversation,
      messages,
    });
  }

  private buildExplanationContext(snapshot: {
    calculationConfidence: { reasons: string[]; visibleMessageKey: string; level: string; blocksExactReading: boolean };
    chartSystem: string;
    ruleSource: { canonicalLibrary: { name: string; version: string } };
  }) {
    return explanationContextSchema.parse({
      chartSystem: snapshot.chartSystem,
      visibleMessageKeys: [snapshot.calculationConfidence.visibleMessageKey],
      confidence: snapshot.calculationConfidence,
      sourceLabel: `${snapshot.ruleSource.canonicalLibrary.name}@${snapshot.ruleSource.canonicalLibrary.version}`,
    });
  }

  private async assertCanCreateConversationMessage(userId: string, ipAddress: string, isAnonymous: boolean): Promise<void> {
    try {
      await this.quotasService.assertCanCreateConversationMessage(userId, ipAddress, isAnonymous);
    } catch (error) {
      throw new ApiErrorHttpException(
        HttpStatus.TOO_MANY_REQUESTS,
        'RATE_LIMITED',
        error instanceof Error ? error.message : 'Đã vượt hạn mức hội thoại.',
      );
    }
  }

  private assertConversationEnabled(): void {
    if (apiEnv.AI_CONVERSATION_ENABLED) {
      return;
    }
    throw new ApiErrorHttpException(
      HttpStatus.FORBIDDEN,
      'FEATURE_DISABLED',
      'Tính năng Trợ lý AI hội thoại chưa được bật.',
    );
  }
}
