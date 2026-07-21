import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  createExplanationResponseSchema,
  explanationContextSchema,
  type AuthenticatedUser,
  type CreateExplanationRequest,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { buildExplanationRequestIdempotencyKey } from '../../../database/idempotency';
import { buildFailedExplanationRetentionTimestamp, DEFAULT_PROMPT_STORAGE_MODE, PERSONALIZED_CACHE_SCOPE, shouldStorePrompt } from '../../../database/persistence-lifecycle';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import { ExplanationProviderRouter } from '../../../providers/ai/explanation-provider-router';
import { resolveDivinationInquiry } from '../../../providers/ai/divination-inquiry';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../../providers/ai/provider-errors';
import { ExplanationValidatorService } from './explanation-validator.service';
import { ExplanationBillingService } from './explanation-billing.service';
import { ExplanationRaceControllerService } from './explanation-race-controller.service';

@Injectable()
export class ExplanationsService {
  private readonly logger = new Logger(ExplanationsService.name);

  constructor(
    private readonly persistenceGateway: SupabasePersistenceGateway,
    private readonly providerRouter: ExplanationProviderRouter,
    private readonly validatorService: ExplanationValidatorService,
    private readonly billingService: ExplanationBillingService,
    private readonly raceController: ExplanationRaceControllerService,
  ) {}

  async createExplanation(user: AuthenticatedUser, ipAddress: string, input: CreateExplanationRequest) {
    const isAnonymous = user.email === null;
    const { requiresXu } = await this.billingService.checkInitialQuota(user.userId, ipAddress, isAnonymous);

    const chartRecord = await this.persistenceGateway.findChartSnapshotById(user.userId, input.chartSnapshotId);
    this.validatorService.validateSnapshot(chartRecord, input);

    const providerName = this.providerRouter.resolveProviderName(input.providerPreference);
    const idempotencyKey = buildExplanationRequestIdempotencyKey({
      ownerUserId: user.userId,
      chartSnapshotId: input.chartSnapshotId,
      providerName,
      explanationKind: input.explanationKind,
      palaceScope: input.palaceScope ?? undefined,
    });

    const existingRequest = await this.persistenceGateway.findExplanationRequestByIdempotencyKey(user.userId, idempotencyKey);
    let request;

    if (existingRequest) {
      const resolution = await this.raceController.resolveExistingRequest(
        user.userId,
        idempotencyKey,
        existingRequest,
        input.palaceScope ?? undefined,
      );

      if (resolution.isCompleted) {
        return createExplanationResponseSchema.parse({
          request: { ...resolution.request, requestState: 'completed' },
          result: resolution.result,
          explanationContext: this.buildExplanationContext(chartRecord!.snapshot),
        });
      }
      
      // If claimed (it was failed or stale), pay before generating!
      await this.billingService.consumeXuIfNeeded(user.userId, input, requiresXu);
      request = resolution.claimedRequest;
      this.logger.log(`Yêu cầu giải thích được tái sử dụng (khôi phục race/idempotency hoặc retry từ failed)`, {
        userId: user.userId,
        requestId: existingRequest.id,
        palaceScope: input.palaceScope ?? null,
      });
    } else {
      await this.billingService.consumeXuIfNeeded(user.userId, input, requiresXu);
      const failureRetainsUntil = buildFailedExplanationRetentionTimestamp(new Date());
      request = await this.persistenceGateway.createExplanationRequest({
        ownerUserId: user.userId,
        chartSnapshotId: input.chartSnapshotId,
        idempotencyKey,
        providerName,
        promptStorageMode: shouldStorePrompt(input.userConsentedToStorePrompt) ? 'consented_redacted' : DEFAULT_PROMPT_STORAGE_MODE,
        failureRetainsUntil,
      });
    }

    this.logger.log(`Explanation generation started`, {
      userId: user.userId,
      chartSnapshotId: input.chartSnapshotId,
      explanationKind: input.explanationKind,
      palaceScope: input.palaceScope ?? null,
      providerName,
    });

    if (input.palaceScope) {
      this.logger.log(`Per-palace explanation (contributes to 14x quota per chart)`, {
        chartSnapshotId: input.chartSnapshotId,
        palaceScope: input.palaceScope ?? undefined,
        explanationKind: input.explanationKind,
      });
    }

    const explanationContext = this.buildExplanationContext(chartRecord!.snapshot);

    try {
      const divinationInquiry = await resolveDivinationInquiry(
        this.persistenceGateway,
        user.userId,
        input.chartSnapshotId,
        chartRecord!.snapshot.chartSystem,
      );

      await this.persistenceGateway.updateExplanationRequest({
        ownerUserId: user.userId,
        requestId: request.id,
        requestState: 'running',
      });

      const providerResult = await this.providerRouter.generate(input.providerPreference, {
        chartSnapshot: chartRecord!.snapshot,
        explanationKind: input.explanationKind,
        explanationContext,
        palaceScope: input.palaceScope ?? undefined,
        divinationInquiry,
      });

      const result = await this.persistenceGateway.createExplanationResult({
        ownerUserId: user.userId,
        explanationRequestId: request.id,
        chartSnapshotId: input.chartSnapshotId,
        cacheScope: PERSONALIZED_CACHE_SCOPE,
        renderedMarkdown: providerResult.renderedMarkdown,
        providerMetadata: {
          ...providerResult.providerMetadata,
          explanationKind: input.explanationKind,
          ...(input.palaceScope ? { palaceScope: input.palaceScope } : {}),
        },
      });

      const completedRequest = await this.persistenceGateway.updateExplanationRequest({
        ownerUserId: user.userId,
        requestId: request.id,
        requestState: 'completed',
        failureRetainsUntil: null,
      });

      await this.persistenceGateway.createHistoryView({
        ownerUserId: user.userId,
        chartSnapshotId: input.chartSnapshotId,
        explanationResultId: result.id,
      });

      this.logger.log(`Explanation generation completed`, {
        userId: user.userId,
        chartSnapshotId: input.chartSnapshotId,
        explanationKind: input.explanationKind,
        palaceScope: input.palaceScope ?? null,
        providerName,
        requestId: request.id,
      });

      return createExplanationResponseSchema.parse({
        request: completedRequest,
        result,
        explanationContext,
      });
    } catch (error) {
      const resultAfterError = await this.persistenceGateway.findExplanationResultByRequestId(user.userId, request.id);
      if (resultAfterError) {
        const freshRequest = await this.persistenceGateway.findExplanationRequestByIdempotencyKey(user.userId, idempotencyKey);
        this.logger.log(`Đã phát hiện result từ concurrent winner sau lỗi, trả cached success cho idempotency (P2 race)`, {
          userId: user.userId,
          requestId: request.id,
          palaceScope: input.palaceScope ?? null,
        });
        return createExplanationResponseSchema.parse({
          request: freshRequest ?? request,
          result: resultAfterError,
          explanationContext,
        });
      }

      await this.persistenceGateway.updateExplanationRequest({
        ownerUserId: user.userId,
        requestId: request.id,
        requestState: 'failed',
        failureRetainsUntil: buildFailedExplanationRetentionTimestamp(new Date()),
      });

      if (error instanceof ProviderTimeoutError) {
        throw new ApiErrorHttpException(HttpStatus.GATEWAY_TIMEOUT, 'PROVIDER_TIMEOUT', error.message);
      }

      if (error instanceof ProviderUnavailableError) {
        throw new ApiErrorHttpException(HttpStatus.BAD_GATEWAY, 'PROVIDER_UNAVAILABLE', error.message);
      }

      throw error;
    }
  }

  private buildExplanationContext(snapshot: { calculationConfidence: { reasons: string[]; visibleMessageKey: string; level: string; blocksExactReading: boolean }; chartSystem: string; ruleSource: { canonicalLibrary: { name: string; version: string } } }) {
    return explanationContextSchema.parse({
      chartSystem: snapshot.chartSystem,
      visibleMessageKeys: [snapshot.calculationConfidence.visibleMessageKey],
      confidence: snapshot.calculationConfidence,
      sourceLabel: `${snapshot.ruleSource.canonicalLibrary.name}@${snapshot.ruleSource.canonicalLibrary.version}`,
    });
  }
}
