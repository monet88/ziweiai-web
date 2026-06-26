import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  conversationDetailResponseSchema,
  conversationListResponseSchema,
  createConversationResponseSchema,
  explanationContextSchema,
  type AuthenticatedUser,
  type ConversationDetailResponse,
  type ConversationListResponse,
  type ConversationMessageRecord,
  type CreateConversationMessageRequest,
  type CreateConversationRequest,
  type CreateConversationResponse,
} from '@ziweiai/contracts';
import { assertCanUseAiExplanation } from '../../../common/entitlement/ai-entitlement.guard';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { apiEnv } from '../../../config/env';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import { ConversationProviderRouter } from '../../../providers/ai/conversation-provider-router';
import { resolveDivinationInquiry } from '../../../providers/ai/divination-inquiry';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../../providers/ai/provider-errors';
import { DailyQuotaExceededError, RateLimitWindowError } from '../../quotas/quota-errors';
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

    // Gate AI entitlement (402) BEFORE quota — mirrors every other LLM-backed path (explanations,
    // pairings, mbti, vision, annual). With AI_CONVERSATION_ENABLED=true but
    // AI_EXPLANATION_FREE_FOR_ALL=false, conversations must not bypass the shared paywall and burn
    // provider tokens. Shared guard (decision 0010) keeps one policy source for all AI text routes.
    assertCanUseAiExplanation(this.logger);

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
    // US-025 (decision 0021): for the four time-based divination charts, load the stored
    // question + purpose so the conversation prompt targets the original inquiry even when
    // a quick prompt / follow-up does not restate it. Undefined for natal/other systems.
    const divinationInquiry = await resolveDivinationInquiry(
      this.persistenceGateway,
      user.userId,
      conversation.chartSnapshotId,
      chartRecord.snapshot.chartSystem,
    );

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
        divinationInquiry,
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

  // List conversations bound to a chart (newest-first). Verify chart ownership first so an
  // attacker probing another user's chartSnapshotId gets NOT_FOUND, not an empty 200 that leaks
  // chart existence. The gateway already scopes by owner_user_id, so this is defense-in-depth +
  // a clearer client signal (the chart isn't theirs vs. it has no conversations yet).
  // The returned list is bounded: the gateway applies a defensive MAX_CONVERSATIONS_PER_CHART cap
  // (newest-first), so this never returns an unbounded set even for a chart with many conversations.
  async listConversationsForChart(userId: string, chartSnapshotId: string): Promise<ConversationListResponse> {
    const chartRecord = await this.persistenceGateway.findChartSnapshotById(userId, chartSnapshotId);
    if (!chartRecord) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy lá số đã lưu.');
    }

    const items = await this.persistenceGateway.listConversationsForChart(userId, chartSnapshotId);
    return conversationListResponseSchema.parse({ items });
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
      // Only typed quota/rate-limit errors map to 429. Anything else (e.g. a quota-store outage or
      // a persistence failure) must NOT be disguised as RATE_LIMITED — that masks real backend
      // problems and tells the client to "retry later" when the issue is server-side. Rethrow so the
      // global filter surfaces the true status (mirrors vision-analysis.service quota handling).
      if (error instanceof RateLimitWindowError) {
        throw new ApiErrorHttpException(
          HttpStatus.TOO_MANY_REQUESTS,
          'RATE_LIMITED',
          'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
        );
      }
      if (error instanceof DailyQuotaExceededError) {
        throw new ApiErrorHttpException(
          HttpStatus.TOO_MANY_REQUESTS,
          'RATE_LIMITED',
          'Đã vượt hạn mức hội thoại trong ngày.',
        );
      }
      throw error;
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
