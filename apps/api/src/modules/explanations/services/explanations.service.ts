import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  createExplanationResponseSchema,
  explanationContextSchema,
  isZiweiChartSnapshot,
  type AuthenticatedUser,
  type CreateExplanationRequest,
  type ExplanationRequestRecord,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { throwQuotaRateLimited } from '../../quotas/quota-http';
import { assertCanUseAiExplanation } from '../../../common/entitlement/ai-entitlement.guard';
import { apiEnv } from '../../../config/env';
import { buildExplanationRequestIdempotencyKey } from '../../../database/idempotency';
import { buildFailedExplanationRetentionTimestamp, DEFAULT_PROMPT_STORAGE_MODE, PERSONALIZED_CACHE_SCOPE, shouldStorePrompt } from '../../../database/persistence-lifecycle';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import { ExplanationProviderRouter } from '../../../providers/ai/explanation-provider-router';
import { resolveDivinationInquiry } from '../../../providers/ai/divination-inquiry';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../../providers/ai/provider-errors';
import { QuotasService } from '../../quotas/quotas.service';

// Cửa sổ chờ in-flight phải PHỦ TRỌN thời gian provider có thể chạy (AI_PROVIDER_TIMEOUT_MS),
// cộng đệm cho lần ghi DB sau khi provider trả về. Nếu chờ ngắn hơn provider timeout, một worker
// chậm-nhưng-hợp-lệ (ví dụ 8–15s) sẽ khiến caller thứ hai hết giờ chờ rồi sinh AI call trùng.
const EXPLANATION_INFLIGHT_WAIT_MS = apiEnv.AI_PROVIDER_TIMEOUT_MS + 2_000;
// Ngưỡng coi một request pending/running là "treo" (worker presumed chết): vượt ngưỡng này mới
// cho phép tiếp quản regenerate. Dưới ngưỡng nghĩa là worker chính vẫn còn khả năng hoàn tất.
const EXPLANATION_INFLIGHT_STALE_MS = apiEnv.AI_PROVIDER_TIMEOUT_MS * 2 + 5_000;

@Injectable()
export class ExplanationsService {
  private readonly logger = new Logger(ExplanationsService.name);

  constructor(
    private readonly persistenceGateway: SupabasePersistenceGateway,
    private readonly quotasService: QuotasService,
    private readonly providerRouter: ExplanationProviderRouter,
  ) {}

  async createExplanation(user: AuthenticatedUser, ipAddress: string, input: CreateExplanationRequest) {
    // email === null ⟺ phiên ẩn danh (decision 0009): app chỉ có email+password, anon JWT
    // không mang email → dùng làm tín hiệu áp trần daily-per-IP cho đường anon.
    await this.assertCanCreateExplanation(user.userId, ipAddress, user.email === null);

    const chartRecord = await this.persistenceGateway.findChartSnapshotById(user.userId, input.chartSnapshotId);
    if (!chartRecord) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy lá số đã lưu.');
    }

    // Early validation palaceScope vs snapshot (P1 fix từ review PR #5)
    // Mục đích: fail fast trước khi tạo request / tốn quota, khi palaceScope hợp lệ theo enum
    // nhưng snapshot thiếu dữ liệu tương ứng (ví dụ: decadal/yearly mà horoscope null, hoặc cung không tồn tại).
    // scope = null (Tổng quan) luôn được phép (backward compatible, không gửi palaceScope field).
    if (input.palaceScope) {
      const snap = chartRecord.snapshot;
      if (!isZiweiChartSnapshot(snap)) {
        throw new ApiErrorHttpException(
          HttpStatus.BAD_REQUEST,
          'INVALID_INPUT',
          'palaceScope chỉ áp dụng cho lá số Tử Vi Đẩu Số.'
        );
      }

      if (input.palaceScope === 'decadal' || input.palaceScope === 'yearly') {
        if (!snap.horoscope || !snap.horoscope[input.palaceScope]) {
          throw new ApiErrorHttpException(
            HttpStatus.BAD_REQUEST,
            'INVALID_INPUT',
            `Không tìm thấy dữ liệu cho palaceScope: ${input.palaceScope}`
          );
        }
      } else {
        // 12 cung: kiểm tra theo nameKey (phù hợp contract engine + prompt builder primary path)
        // Legacy support (P2 fix per review 4457601719): if the snapshot contains legacy palaces (nameKey like legacyPalace0 + displayName),
        // allow the request to proceed so the prompt builder's displayName fallback can run. This prevents INVALID_INPUT for old stored
        // Ziwei snapshots while still fast-failing truly missing scopes on modern snapshots.
        const palaceExists = Array.isArray(snap.palaces) &&
          snap.palaces.some((p: { nameKey?: unknown }) => {
            if (!p) return false;
            if (p.nameKey === input.palaceScope) return true;
            if (typeof p.nameKey === 'string' && p.nameKey.startsWith('legacyPalace')) return true;
            return false;
          });
        if (!palaceExists) {
          throw new ApiErrorHttpException(
            HttpStatus.BAD_REQUEST,
            'INVALID_INPUT',
            `Không tìm thấy dữ liệu cho palaceScope: ${input.palaceScope}`
          );
        }
      }
    }

    const providerName = this.providerRouter.resolveProviderName(input.providerPreference);
    const idempotencyKey = buildExplanationRequestIdempotencyKey({
      ownerUserId: user.userId,
      chartSnapshotId: input.chartSnapshotId,
      providerName,
      explanationKind: input.explanationKind,
      palaceScope: input.palaceScope,
    });

    const existingRequest = await this.persistenceGateway.findExplanationRequestByIdempotencyKey(user.userId, idempotencyKey);
    let request: Awaited<ReturnType<SupabasePersistenceGateway['createExplanationRequest']>> | Awaited<ReturnType<SupabasePersistenceGateway['findExplanationRequestByIdempotencyKey']>>;

    if (existingRequest) {
      const existingResult = await this.persistenceGateway.findExplanationResultByRequestId(user.userId, existingRequest.id);
      if (existingResult) {
        this.logger.log(`Explanation cache hit`, {
          userId: user.userId,
          chartSnapshotId: input.chartSnapshotId,
          explanationKind: input.explanationKind,
          palaceScope: input.palaceScope ?? null,
          providerName,
        });
        return createExplanationResponseSchema.parse({
          request: existingRequest,
          result: existingResult,
          explanationContext: this.buildExplanationContext(chartRecord.snapshot),
        });
      }

      // US-010 (decision 0010): gate ENTITLEMENT đặt TRƯỚC mọi thao tác tạo/claim request record
      // sinh generation mới. Cache-hit ở trên đã free (kết quả đã có). Khi flag=false + chưa entitled
      // → ném 402 ngay, KHÔNG ghi/đổi state request (tránh ô nhiễm 'failed' + tốn lifecycle).
      this.assertCanUseAiExplanation();

      // Sửa P1 race (violation): logic reuse trước đây (line 68) cho cả pending/running/failed gây duplicate worker
      // (hai concurrent call cùng idempotencyKey đều thấy no-result -> đều generate + createResult).
      // + race: loser createResult unique conflict (do constraint explanation_request_id unique) -> catch set 'failed'
      // có thể ghi đè completed từ winner.
      // Refine: CHỈ reset+regen khi failed hoặc treo. Với pending/running (in-flight) còn tươi: poll-wait để
      // "reap" result từ worker chính (tránh duplicate generation tốn kém).
      // Mọi nhánh tiếp quản (retry failed / takeover treo) đều dùng tryClaimExplanationRequest (conditional update
      // theo request_state) để chỉ MỘT caller thắng claim — kẻ thua chờ kết quả thay vì gọi provider trùng.
      // Unique constraint DB: (owner_user_id, idempotency_key) trên requests; explanation_request_id unique trên results.
      request = existingRequest;
      if (existingRequest.requestState === 'failed') {
        // Claim nguyên tử trước khi retry: chỉ caller thắng (failed -> pending) mới được generate.
        // Hai client cùng retry một request failed: kẻ thua nhận null (state đã rời 'failed') -> chờ kết quả
        // từ caller thắng thay vì cùng gọi provider (tránh đốt AI call trùng + đua unique explanation_request_id).
        const newFailureRetains = buildFailedExplanationRetentionTimestamp(new Date());
        const claimed = await this.persistenceGateway.tryClaimExplanationRequest({
          ownerUserId: user.userId,
          requestId: existingRequest.id,
          expectedUpdatedAt: existingRequest.updatedAt,
          nextState: 'pending',
          failureRetainsUntil: newFailureRetains,
        });
        if (!claimed) {
          // Caller khác đã claim retry: chờ kết quả của họ thay vì sinh worker trùng.
          this.logger.log(`Một caller khác đã claim retry request failed — chờ kết quả thay vì regenerate`, {
            userId: user.userId,
            requestId: existingRequest.id,
            palaceScope: input.palaceScope ?? null,
          });
          const waitedResult = await this.waitForExplanationResult(user.userId, existingRequest.id, EXPLANATION_INFLIGHT_WAIT_MS);
          if (waitedResult) {
            const freshRequest = await this.persistenceGateway.findExplanationRequestByIdempotencyKey(user.userId, idempotencyKey);
            return this.buildReapedCompletedResponse(
              freshRequest ?? existingRequest,
              waitedResult,
              this.buildExplanationContext(chartRecord.snapshot),
            );
          }
          throw new ApiErrorHttpException(
            HttpStatus.GATEWAY_TIMEOUT,
            'PROVIDER_TIMEOUT',
            'Luận giải đang được xử lý, vui lòng thử lại sau giây lát.',
          );
        }
        request = claimed;
      } else if (this.isExplanationRequestStale(existingRequest)) {
        // In-flight nhưng đã đứng yên quá lâu ngay từ đầu (worker presumed chết từ trước): tiếp quản
        // regenerate ngay, không phí cửa sổ chờ block caller cho một worker không còn sống.
        // Claim nguyên tử theo state hiện tại để chỉ một caller tiếp quản (tránh hai caller cùng regenerate).
        const claimed = await this.persistenceGateway.tryClaimExplanationRequest({
          ownerUserId: user.userId,
          requestId: existingRequest.id,
          expectedUpdatedAt: existingRequest.updatedAt,
          nextState: 'pending',
        });
        if (!claimed) {
          // Caller khác đã tiếp quản: chờ kết quả của họ thay vì sinh worker trùng.
          this.logger.log(`Một caller khác đã tiếp quản request treo — chờ kết quả thay vì regenerate`, {
            userId: user.userId,
            requestId: existingRequest.id,
            palaceScope: input.palaceScope ?? null,
          });
          const waitedResult = await this.waitForExplanationResult(user.userId, existingRequest.id, EXPLANATION_INFLIGHT_WAIT_MS);
          if (waitedResult) {
            const freshRequest = await this.persistenceGateway.findExplanationRequestByIdempotencyKey(user.userId, idempotencyKey);
            return this.buildReapedCompletedResponse(
              freshRequest ?? existingRequest,
              waitedResult,
              this.buildExplanationContext(chartRecord.snapshot),
            );
          }
          throw new ApiErrorHttpException(
            HttpStatus.GATEWAY_TIMEOUT,
            'PROVIDER_TIMEOUT',
            'Luận giải đang được xử lý, vui lòng thử lại sau giây lát.',
          );
        }
        this.logger.log(`Yêu cầu in-flight đã treo từ trước (worker presumed chết) — tiếp quản regenerate ngay`, {
          userId: user.userId,
          requestId: existingRequest.id,
          palaceScope: input.palaceScope ?? null,
        });
        request = claimed;
      } else {
        // In-flight (pending/running) còn tươi: chờ đủ lâu để thu kết quả từ worker chính, tránh sinh worker trùng.
        // Cửa sổ chờ phủ trọn provider timeout nên worker chậm-nhưng-hợp-lệ sẽ kịp ghi result trước khi caller này nhả.
        this.logger.log(`Yêu cầu giải thích đang chạy (pending/running), chờ để thu kết quả (tránh worker trùng)`, {
          userId: user.userId,
          requestId: existingRequest.id,
          palaceScope: input.palaceScope ?? null,
        });
        const waitedResult = await this.waitForExplanationResult(user.userId, existingRequest.id, EXPLANATION_INFLIGHT_WAIT_MS);
        if (waitedResult) {
          const freshRequest = await this.persistenceGateway.findExplanationRequestByIdempotencyKey(user.userId, idempotencyKey);
          this.logger.log(`Đã thu được kết quả từ worker đang chạy qua chờ đợi`, {
            userId: user.userId,
            requestId: existingRequest.id,
            palaceScope: input.palaceScope ?? null,
          });
          return this.buildReapedCompletedResponse(
            freshRequest ?? existingRequest,
            waitedResult,
            this.buildExplanationContext(chartRecord.snapshot),
          );
        }

        // Hết giờ chờ mà vẫn chưa có result. Phân biệt hai khả năng:
        //   (a) Worker chính vẫn đang chạy hợp lệ (chưa quá ngưỡng "treo") → KHÔNG regenerate (tránh duplicate AI call
        //       + race unique explanation_request_id). Trả PROVIDER_TIMEOUT để client poll/thử lại sau.
        //   (b) Worker chính presumed chết (request đứng yên quá EXPLANATION_INFLIGHT_STALE_MS) → an toàn tiếp quản regenerate.
        const freshAfterWait = await this.persistenceGateway.findExplanationRequestByIdempotencyKey(user.userId, idempotencyKey);
        const referenceRequest = freshAfterWait ?? existingRequest;
        if (!this.isExplanationRequestStale(referenceRequest)) {
          this.logger.log(`Worker chính vẫn đang xử lý sau khi hết giờ chờ — trả PROVIDER_TIMEOUT thay vì sinh worker trùng`, {
            userId: user.userId,
            requestId: existingRequest.id,
            palaceScope: input.palaceScope ?? null,
          });
          throw new ApiErrorHttpException(
            HttpStatus.GATEWAY_TIMEOUT,
            'PROVIDER_TIMEOUT',
            'Luận giải đang được xử lý, vui lòng thử lại sau giây lát.',
          );
        }
        // Worker presumed chết: claim nguyên tử theo state hiện tại rồi tiếp quản generate bên dưới.
        // Nếu claim thua (caller khác đã tiếp quản), thử thu kết quả của họ rồi mới trả PROVIDER_TIMEOUT.
        const claimed = await this.persistenceGateway.tryClaimExplanationRequest({
          ownerUserId: user.userId,
          requestId: existingRequest.id,
          expectedUpdatedAt: referenceRequest.updatedAt,
          nextState: 'pending',
        });
        if (!claimed) {
          this.logger.log(`Một caller khác đã tiếp quản request treo sau khi hết giờ chờ — chờ kết quả thay vì regenerate`, {
            userId: user.userId,
            requestId: existingRequest.id,
            palaceScope: input.palaceScope ?? null,
          });
          const reapResult = await this.persistenceGateway.findExplanationResultByRequestId(user.userId, existingRequest.id);
          if (reapResult) {
            const freshRequest = await this.persistenceGateway.findExplanationRequestByIdempotencyKey(user.userId, idempotencyKey);
            return this.buildReapedCompletedResponse(
              freshRequest ?? existingRequest,
              reapResult,
              this.buildExplanationContext(chartRecord.snapshot),
            );
          }
          throw new ApiErrorHttpException(
            HttpStatus.GATEWAY_TIMEOUT,
            'PROVIDER_TIMEOUT',
            'Luận giải đang được xử lý, vui lòng thử lại sau giây lát.',
          );
        }
        this.logger.log(`Yêu cầu in-flight được coi là treo (worker presumed chết) — tiếp quản regenerate`, {
          userId: user.userId,
          requestId: existingRequest.id,
          palaceScope: input.palaceScope ?? null,
        });
        request = claimed;
      }
      this.logger.log(`Yêu cầu giải thích được tái sử dụng (khôi phục race/idempotency hoặc retry từ failed)`, {
        userId: user.userId,
        requestId: existingRequest.id,
        palaceScope: input.palaceScope ?? null,
      });
    } else {
      // US-010 (decision 0010): gate TRƯỚC khi tạo request record mới (cache-hit đã bypass ở trên).
      this.assertCanUseAiExplanation();
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

    // Quota monitoring note (per review): per-palace can lead to up to 14 calls per chart (12 cung + decadal + yearly).
    // Logs include palaceScope for production aggregation/monitoring of quota usage.
    if (input.palaceScope) {
      this.logger.log(`Per-palace explanation (contributes to 14x quota per chart)`, {
        chartSnapshotId: input.chartSnapshotId,
        palaceScope: input.palaceScope,
        explanationKind: input.explanationKind,
      });
    }

    const explanationContext = this.buildExplanationContext(chartRecord.snapshot);

    try {
      // Inside try so a DB failure here is caught by the handler below and the
      // request is marked 'failed' (otherwise it leaks in 'pending' with no cleanup).
      const divinationInquiry = await resolveDivinationInquiry(
        this.persistenceGateway,
        user.userId,
        input.chartSnapshotId,
        chartRecord.snapshot.chartSystem,
      );

      await this.persistenceGateway.updateExplanationRequest({
        ownerUserId: user.userId,
        requestId: request.id,
        requestState: 'running',
      });

      const providerResult = await this.providerRouter.generate(input.providerPreference, {
        chartSnapshot: chartRecord.snapshot,
        explanationKind: input.explanationKind,
        explanationContext,
        palaceScope: input.palaceScope,
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
      // Guard P1 race: chỉ set 'failed' nếu CHƯA có result (đã được worker khác tạo thành công).
      // Tránh trường hợp race flip completed -> failed sau khi createResult bị unique-key conflict (explanation_request_id).
      // P2 fix: Nếu resultAfterError tồn tại (winner concurrent đã lưu success cho cùng request id), fetch fresh request
      // và return createExplanationResponseSchema.parse success thay vì rethrow. Tránh concurrent idempotent calls
      // fail spuriously sau khi winner đã store result (race khi một call error nhưng result đã tồn tại từ call khác).
      // Dùng fresh retention chỉ khi thực sự mark failed.
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

  // Khi đã thu được result từ caller thắng (qua wait/reap), state DB của request có thể chưa kịp chuyển 'completed'
  // (winner ghi result trước, set 'completed' sau — có khe race rất nhỏ). Vì đã chắc chắn có result hợp lệ, ép
  // requestState='completed' trong response để frontend không kẹt loading/báo lỗi giả.
  private buildReapedCompletedResponse(
    requestSource: { requestState: ExplanationRequestRecord['requestState'] } & Record<string, unknown>,
    result: unknown,
    explanationContext: unknown,
  ) {
    return createExplanationResponseSchema.parse({
      request: { ...requestSource, requestState: 'completed' },
      result,
      explanationContext,
    });
  }

  private buildExplanationContext(snapshot: { calculationConfidence: { reasons: string[]; visibleMessageKey: string; level: string; blocksExactReading: boolean }; chartSystem: string; ruleSource: { canonicalLibrary: { name: string; version: string } } }) {
    return explanationContextSchema.parse({
      chartSystem: snapshot.chartSystem,
      visibleMessageKeys: [snapshot.calculationConfidence.visibleMessageKey],
      confidence: snapshot.calculationConfidence,
      sourceLabel: `${snapshot.ruleSource.canonicalLibrary.name}@${snapshot.ruleSource.canonicalLibrary.version}`,
    });
  }

  private async assertCanCreateExplanation(userId: string, ipAddress: string, isAnonymous: boolean): Promise<void> {
    try {
      await this.quotasService.assertCanCreateExplanation(userId, ipAddress, isAnonymous);
    } catch (error) {
      throwQuotaRateLimited(error, 'Đã vượt hạn mức tạo luận giải.');
    }
  }

  /**
   * Chờ (poll) cho result xuất hiện trên request id đã có (từ worker in-flight khác).
   * Dùng để refine reuse: tránh duplicate worker sinh generation cho cùng request khi thấy pending/running.
   * Nếu result xuất hiện trong thời gian chờ -> reap và return cache (không gọi provider).
   * Timeout thì trả null để caller quyết định: nếu worker chính vẫn hợp lệ thì trả PROVIDER_TIMEOUT,
   * nếu request đã treo quá lâu (worker presumed chết) thì tiếp quản regenerate.
   * Cửa sổ chờ mặc định phủ trọn provider timeout (EXPLANATION_INFLIGHT_WAIT_MS) để worker chậm-nhưng-hợp-lệ kịp ghi result.
   */
  private async waitForExplanationResult(
    ownerUserId: string,
    requestId: string,
    maxWaitMs: number = EXPLANATION_INFLIGHT_WAIT_MS,
    pollIntervalMs: number = 250,
  ): Promise<Awaited<ReturnType<SupabasePersistenceGateway['findExplanationResultByRequestId']>> | null> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const res = await this.persistenceGateway.findExplanationResultByRequestId(ownerUserId, requestId);
      if (res) {
        return res;
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    return null;
  }

  /**
   * Một request in-flight (pending/running) được coi là "treo" khi đã đứng yên quá EXPLANATION_INFLIGHT_STALE_MS
   * tính từ updatedAt. Quá ngưỡng này nghĩa là worker chính nhiều khả năng đã chết (process restart, crash giữa
   * chừng) nên việc tiếp quản regenerate là an toàn. Dưới ngưỡng thì worker chính vẫn còn cơ hội hoàn tất, không
   * nên sinh AI call trùng.
   */
  private isExplanationRequestStale(request: { updatedAt: string }): boolean {
    const updatedAtMs = Date.parse(request.updatedAt);
    if (Number.isNaN(updatedAtMs)) {
      // Không parse được mốc thời gian → coi như treo để tránh kẹt vĩnh viễn.
      return true;
    }
    return Date.now() - updatedAtMs > EXPLANATION_INFLIGHT_STALE_MS;
  }

  private assertCanUseAiExplanation(): void {
    // US-016: logic gate đã trích ra module chung `common/entitlement/ai-entitlement.guard`
    // để AnnualReportService dùng lại (decision 0010). Giữ method wrapper để 2 call-site cũ
    // trong service này không đổi.
    assertCanUseAiExplanation(this.logger);
  }

}
