import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { apiEnv } from '../../../config/env';
import { buildFailedExplanationRetentionTimestamp } from '../../../database/persistence-lifecycle';
import { ExplanationsRepository } from '../../../database/repositories/explanations.repository';

const EXPLANATION_INFLIGHT_WAIT_MS = apiEnv.AI_PROVIDER_TIMEOUT_MS + 2_000;
const EXPLANATION_INFLIGHT_STALE_MS = apiEnv.AI_PROVIDER_TIMEOUT_MS * 2 + 5_000;

export type RaceResolutionResult = 
  | { isCompleted: true; request: any; result: any }
  | { isCompleted: false; claimedRequest: any };

@Injectable()
export class ExplanationRaceControllerService {
  private readonly logger = new Logger(ExplanationRaceControllerService.name);

  constructor(private readonly explanationsRepository: ExplanationsRepository) {}

  /**
   * Resolves an existing explanation request by either returning a cached result,
   * waiting for an in-flight worker to finish, or claiming it for regeneration.
   */
  async resolveExistingRequest(
    userId: string,
    idempotencyKey: string,
    existingRequest: any,
    palaceScope: string | undefined,
  ): Promise<RaceResolutionResult> {
    const existingResult = await this.explanationsRepository.findExplanationResultByRequestId(userId, existingRequest.id);
    if (existingResult) {
      this.logger.log(`Explanation cache hit`, {
        userId,
        requestId: existingRequest.id,
        palaceScope: palaceScope ?? null,
      });
      return { isCompleted: true, request: existingRequest, result: existingResult };
    }

    if (existingRequest.requestState === 'failed') {
      const newFailureRetains = buildFailedExplanationRetentionTimestamp(new Date());
      const claimed = await this.explanationsRepository.tryClaimExplanationRequest({
        ownerUserId: userId,
        requestId: existingRequest.id,
        expectedUpdatedAt: existingRequest.updatedAt,
        nextState: 'pending',
        failureRetainsUntil: newFailureRetains,
      });
      if (!claimed) {
        this.logger.log(`Một caller khác đã claim retry request failed — chờ kết quả thay vì regenerate`, {
          userId,
          requestId: existingRequest.id,
          palaceScope: palaceScope ?? null,
        });
        const waitedResult = await this.waitForExplanationResult(userId, existingRequest.id);
        if (waitedResult) {
          const freshRequest = await this.explanationsRepository.findExplanationRequestByIdempotencyKey(userId, idempotencyKey);
          return { isCompleted: true, request: freshRequest ?? existingRequest, result: waitedResult };
        }
        throw new ApiErrorHttpException(
          HttpStatus.GATEWAY_TIMEOUT,
          'PROVIDER_TIMEOUT',
          'Luận giải đang được xử lý, vui lòng thử lại sau giây lát.',
        );
      }
      return { isCompleted: false, claimedRequest: claimed };
    } 
    
    if (this.isExplanationRequestStale(existingRequest)) {
      const claimed = await this.explanationsRepository.tryClaimExplanationRequest({
        ownerUserId: userId,
        requestId: existingRequest.id,
        expectedUpdatedAt: existingRequest.updatedAt,
        nextState: 'pending',
      });
      if (!claimed) {
        this.logger.log(`Một caller khác đã tiếp quản request treo — chờ kết quả thay vì regenerate`, {
          userId,
          requestId: existingRequest.id,
          palaceScope: palaceScope ?? null,
        });
        const waitedResult = await this.waitForExplanationResult(userId, existingRequest.id);
        if (waitedResult) {
          const freshRequest = await this.explanationsRepository.findExplanationRequestByIdempotencyKey(userId, idempotencyKey);
          return { isCompleted: true, request: freshRequest ?? existingRequest, result: waitedResult };
        }
        throw new ApiErrorHttpException(
          HttpStatus.GATEWAY_TIMEOUT,
          'PROVIDER_TIMEOUT',
          'Luận giải đang được xử lý, vui lòng thử lại sau giây lát.',
        );
      }
      this.logger.log(`Yêu cầu in-flight đã treo từ trước (worker presumed chết) — tiếp quản regenerate ngay`, {
        userId,
        requestId: existingRequest.id,
        palaceScope: palaceScope ?? null,
      });
      return { isCompleted: false, claimedRequest: claimed };
    }

    this.logger.log(`Yêu cầu giải thích đang chạy (pending/running), chờ để thu kết quả (tránh worker trùng)`, {
      userId,
      requestId: existingRequest.id,
      palaceScope: palaceScope ?? null,
    });
    
    const waitedResult = await this.waitForExplanationResult(userId, existingRequest.id);
    if (waitedResult) {
      const freshRequest = await this.explanationsRepository.findExplanationRequestByIdempotencyKey(userId, idempotencyKey);
      this.logger.log(`Đã thu được kết quả từ worker đang chạy qua chờ đợi`, {
        userId,
        requestId: existingRequest.id,
        palaceScope: palaceScope ?? null,
      });
      return { isCompleted: true, request: freshRequest ?? existingRequest, result: waitedResult };
    }

    const freshAfterWait = await this.explanationsRepository.findExplanationRequestByIdempotencyKey(userId, idempotencyKey);
    const referenceRequest = freshAfterWait ?? existingRequest;
    if (!this.isExplanationRequestStale(referenceRequest)) {
      this.logger.log(`Worker chính vẫn đang xử lý sau khi hết giờ chờ — trả PROVIDER_TIMEOUT thay vì sinh worker trùng`, {
        userId,
        requestId: existingRequest.id,
        palaceScope: palaceScope ?? null,
      });
      throw new ApiErrorHttpException(
        HttpStatus.GATEWAY_TIMEOUT,
        'PROVIDER_TIMEOUT',
        'Luận giải đang được xử lý, vui lòng thử lại sau giây lát.',
      );
    }

    const claimed = await this.explanationsRepository.tryClaimExplanationRequest({
      ownerUserId: userId,
      requestId: existingRequest.id,
      expectedUpdatedAt: referenceRequest.updatedAt,
      nextState: 'pending',
    });
    
    if (!claimed) {
      this.logger.log(`Một caller khác đã tiếp quản request treo sau khi hết giờ chờ — chờ kết quả thay vì regenerate`, {
        userId,
        requestId: existingRequest.id,
        palaceScope: palaceScope ?? null,
      });
      const reapResult = await this.explanationsRepository.findExplanationResultByRequestId(userId, existingRequest.id);
      if (reapResult) {
        const freshRequest = await this.explanationsRepository.findExplanationRequestByIdempotencyKey(userId, idempotencyKey);
        return { isCompleted: true, request: freshRequest ?? existingRequest, result: reapResult };
      }
      throw new ApiErrorHttpException(
        HttpStatus.GATEWAY_TIMEOUT,
        'PROVIDER_TIMEOUT',
        'Luận giải đang được xử lý, vui lòng thử lại sau giây lát.',
      );
    }
    
    this.logger.log(`Yêu cầu in-flight được coi là treo (worker presumed chết) — tiếp quản regenerate`, {
      userId,
      requestId: existingRequest.id,
      palaceScope: palaceScope ?? null,
    });
    
    return { isCompleted: false, claimedRequest: claimed };
  }

  private async waitForExplanationResult(
    ownerUserId: string,
    requestId: string,
    maxWaitMs: number = EXPLANATION_INFLIGHT_WAIT_MS,
    pollIntervalMs: number = 250,
  ): Promise<Awaited<ReturnType<ExplanationsRepository['findExplanationResultByRequestId']>> | null> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const res = await this.explanationsRepository.findExplanationResultByRequestId(ownerUserId, requestId);
      if (res) {
        return res;
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    return null;
  }

  private isExplanationRequestStale(request: { updatedAt: string }): boolean {
    const updatedAtMs = Date.parse(request.updatedAt);
    if (Number.isNaN(updatedAtMs)) {
      return true;
    }
    return Date.now() - updatedAtMs > EXPLANATION_INFLIGHT_STALE_MS;
  }
}
