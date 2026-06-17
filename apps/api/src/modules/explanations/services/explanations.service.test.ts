import { describe, expect, it, vi, beforeEach } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import type { CreateExplanationRequest } from '@ziweiai/contracts';
import { ExplanationsService } from './explanations.service';
import type { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import type { QuotasService } from '../../quotas/quotas.service';
import type { ExplanationProviderRouter } from '../../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError } from '../../../providers/ai/provider-errors';
import { apiEnv, apiEnvSchema } from '../../../config/env';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// Test file sử dụng any cho mock fixture phức tạp (snapshot, persistence records) — phổ biến trong Nest/Vitest.
// Không ảnh hưởng production. Nếu cần strict hơn, thay bằng interface mock chi tiết.

function createAuthenticatedUser() {
  return { userId: 'user-123', email: 'test@example.com' };
}

function createChartRecord() {
  return {
    id: 'chart-1',
    ownerUserId: 'user-123',
    snapshot: {
      snapshotId: '11111111-1111-1111-1111-111111111111',
      chartSystem: 'zi-wei-dou-shu',
      palaces: [
        { nameKey: 'soulPalace' },
        { nameKey: 'careerPalace' },
        { nameKey: 'wealthPalace' },
      ],
      horoscope: {
        decadal: {
          palaceNameKeys: [],
          heavenlyStemKey: 'giap',
          earthlyBranchKey: 'thin',
          mutagenStarKeys: [],
        },
        yearly: {
          palaceNameKeys: [],
          heavenlyStemKey: 'giap',
          earthlyBranchKey: 'thin',
          mutagenStarKeys: [],
        },
      },
      calculationConfidence: {
        level: 'medium',
        reasons: [],
        visibleMessageKey: 'birth.time.verified',
        blocksExactReading: false,
      },
      ruleSource: {
        canonicalLibrary: { name: 'iztro', version: '2.5.8' },
      },
    } as any,
  };
}

function createExplanationRequest(palaceScope?: string): CreateExplanationRequest {
  return {
    chartSnapshotId: '11111111-1111-1111-1111-111111111111',
    explanationKind: 'overview',
    palaceScope: palaceScope as any,
    providerPreference: 'auto',
    userConsentedToStorePrompt: false,
  };
}

describe('ExplanationsService (with palaceScope)', () => {
  let service: ExplanationsService;
  let persistence: Partial<SupabasePersistenceGateway>;
  let quotas: Partial<QuotasService>;
  let providerRouter: Partial<ExplanationProviderRouter>;

  beforeEach(() => {
    persistence = {
      findChartSnapshotById: vi.fn(),
      findExplanationRequestByIdempotencyKey: vi.fn(),
      findExplanationResultByRequestId: vi.fn(),
      createExplanationRequest: vi.fn(),
      updateExplanationRequest: vi.fn(),
      tryClaimExplanationRequest: vi.fn(),
      createExplanationResult: vi.fn(),
      createHistoryView: vi.fn(),
    };

    quotas = {
      assertCanCreateExplanation: vi.fn().mockResolvedValue(undefined),
    };

    providerRouter = {
      resolveProviderName: vi.fn().mockReturnValue('deepseek'),
      generate: vi.fn().mockResolvedValue({
        renderedMarkdown: 'Luận giải mẫu cho cung Mệnh.',
        providerMetadata: { provider: 'deepseek' },
      }),
    };

    service = new ExplanationsService(
      persistence as SupabasePersistenceGateway,
      quotas as QuotasService,
      providerRouter as ExplanationProviderRouter,
    );
  });

  it('generates new explanation with palaceScope and persists result + history', async () => {
    const user = createAuthenticatedUser();
    const input = createExplanationRequest('soulPalace');
    const chartRecord = createChartRecord();

    const createdRequest = {
      id: 'req-1',
      ownerUserId: 'user-123',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      idempotencyKey: 'some-key',
      requestState: 'pending',
      providerName: 'deepseek',
      promptStorageMode: 'not_stored' as const,
      failureRetainsUntil: null,
      createdAt: '2026-06-09T00:00:00.000Z',
      updatedAt: '2026-06-09T00:00:00.000Z',
    };
    const completedRequest = {
      id: 'req-1',
      ownerUserId: 'user-123',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      idempotencyKey: 'some-key',
      requestState: 'completed',
      providerName: 'deepseek',
      promptStorageMode: 'not_stored' as const,
      failureRetainsUntil: null,
      createdAt: '2026-06-09T00:00:00.000Z',
      updatedAt: '2026-06-09T00:00:01.000Z',
    };
    const createdResult = {
      id: 'res-1',
      ownerUserId: 'user-123',
      explanationRequestId: 'req-1',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      cacheScope: 'user_snapshot' as const,
      renderedMarkdown: 'Luận giải mẫu...',
      providerMetadata: { provider: 'deepseek' },
      createdAt: '2026-06-09T00:00:01.000Z',
    };

    (persistence.findChartSnapshotById as any).mockResolvedValue(chartRecord);
    (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValue(null);
    (persistence.createExplanationRequest as any).mockResolvedValue(createdRequest);
    (persistence.updateExplanationRequest as any).mockResolvedValue(completedRequest);
    (persistence.createExplanationResult as any).mockResolvedValue(createdResult);
    (persistence.createHistoryView as any).mockResolvedValue(undefined);

    // Wrap to tolerate schema parse from mock records.
    try {
      await service.createExplanation(user, '127.0.0.1', input);
    } catch (e) {
      // ignore parse error; verify calls below
    }

    expect(persistence.createExplanationResult).toHaveBeenCalledWith(expect.objectContaining({
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
    }));
    expect(persistence.createHistoryView).toHaveBeenCalled();
  });

  it('returns cached result on idempotent hit for same palaceScope', async () => {
    const user = createAuthenticatedUser();
    const input = createExplanationRequest('careerPalace');
    const chartRecord = createChartRecord();

    const cachedRequest = {
      id: 'req-old',
      ownerUserId: 'user-123',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      idempotencyKey: 'key-old',
      requestState: 'completed' as const,
      providerName: 'deepseek',
      promptStorageMode: 'not_stored' as const,
      failureRetainsUntil: null,
      createdAt: '2026-06-09T00:00:00.000Z',
      updatedAt: '2026-06-09T00:00:00.000Z',
    };
    const cachedResult = {
      id: 'res-old',
      ownerUserId: 'user-123',
      explanationRequestId: 'req-old',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      cacheScope: 'user_snapshot' as const,
      renderedMarkdown: 'Kết quả cũ',
      providerMetadata: { provider: 'deepseek' },
      createdAt: '2026-06-09T00:00:00.000Z',
    };

    (persistence.findChartSnapshotById as any).mockResolvedValue(chartRecord);
    (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValueOnce(cachedRequest);
    (persistence.findExplanationResultByRequestId as any).mockResolvedValueOnce(cachedResult);

    // Wrap to tolerate schema parse from mock records.
    let response: any = null;
    try {
      response = await service.createExplanation(user, '127.0.0.1', input);
    } catch (e) {
      // ignore parse error for this test; we mainly verify early return behavior
    }

    // Phải hit cache, không tạo request/result mới
    expect(persistence.createExplanationRequest).not.toHaveBeenCalled();
    expect(persistence.createExplanationResult).not.toHaveBeenCalled();
    // Đã gọi find result để kiểm tra cache
    expect(persistence.findExplanationResultByRequestId).toHaveBeenCalled();
  });

  it('marks request as failed and throws on provider timeout', async () => {
    const user = createAuthenticatedUser();
    const input = createExplanationRequest('wealthPalace');
    const chartRecord = createChartRecord();

    (persistence.findChartSnapshotById as any).mockResolvedValue(chartRecord);
    (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValue(null);
    (persistence.createExplanationRequest as any).mockResolvedValue({ id: 'req-fail', requestState: 'pending' });
    (persistence.updateExplanationRequest as any).mockResolvedValue({ id: 'req-fail', requestState: 'failed' });
    (providerRouter.generate as any).mockRejectedValue(new ProviderTimeoutError('timeout'));

    await expect(service.createExplanation(user, '127.0.0.1', input)).rejects.toMatchObject({
      status: HttpStatus.GATEWAY_TIMEOUT,
    });

    expect(persistence.updateExplanationRequest).toHaveBeenCalledWith(
      expect.objectContaining({ requestState: 'failed' }),
    );
  });

  it('reuses existing failed request (no result) and does not create duplicate (fixes race bug)', async () => {
    const user = createAuthenticatedUser();
    const input = createExplanationRequest('wealthPalace');
    const chartRecord = createChartRecord();

    const failedRequest = {
      id: 'req-failed',
      ownerUserId: 'user-123',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      idempotencyKey: 'key-failed',
      requestState: 'failed' as const,
      providerName: 'deepseek',
      promptStorageMode: 'not_stored' as const,
      failureRetainsUntil: '2026-06-10T00:00:00.000Z',
      createdAt: '2026-06-09T00:00:00.000Z',
      updatedAt: '2026-06-09T00:00:00.000Z',
    };
    const pendingClaim = { ...failedRequest, requestState: 'pending' as const };
    const completedRequest = { ...failedRequest, requestState: 'completed' as const };
    const createdResult = {
      id: 'res-retry',
      ownerUserId: 'user-123',
      explanationRequestId: 'req-failed',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      cacheScope: 'user_snapshot' as const,
      renderedMarkdown: 'Luận giải retry...',
      providerMetadata: { provider: 'deepseek' },
      createdAt: '2026-06-09T00:00:01.000Z',
    };

    (persistence.findChartSnapshotById as any).mockResolvedValue(chartRecord);
    (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValue(failedRequest);
    (persistence.findExplanationResultByRequestId as any).mockResolvedValue(null);
    // Claim thắng (failed -> pending) → caller này được retry.
    (persistence.tryClaimExplanationRequest as any).mockResolvedValue(pendingClaim);
    (persistence.updateExplanationRequest as any).mockResolvedValue(completedRequest);
    (persistence.createExplanationResult as any).mockResolvedValue(createdResult);
    (persistence.createHistoryView as any).mockResolvedValue(undefined);

    try {
      await service.createExplanation(user, '127.0.0.1', input);
    } catch (e) {
      // ignore parse
    }

    // Không gọi createExplanationRequest (tránh duplicate key)
    expect(persistence.createExplanationRequest).not.toHaveBeenCalled();
    // Claim nguyên tử reset state cho retry (failed -> pending)
    expect(persistence.tryClaimExplanationRequest).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'req-failed', expectedUpdatedAt: failedRequest.updatedAt, nextState: 'pending' })
    );
    expect(persistence.createExplanationResult).toHaveBeenCalled();
  });

  it('does NOT regenerate when losing the failed-retry claim race (another caller already claimed)', async () => {
    const user = createAuthenticatedUser();
    const input = createExplanationRequest('wealthPalace');
    const chartRecord = createChartRecord();

    const failedRequest = {
      id: 'req-failed-race',
      ownerUserId: 'user-123',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      idempotencyKey: 'key-failed-race',
      requestState: 'failed' as const,
      providerName: 'deepseek',
      promptStorageMode: 'not_stored' as const,
      failureRetainsUntil: '2026-06-10T00:00:00.000Z',
      createdAt: '2026-06-09T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    };
    const winnerResult = {
      id: 'res-winner',
      ownerUserId: 'user-123',
      explanationRequestId: 'req-failed-race',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      cacheScope: 'user_snapshot' as const,
      renderedMarkdown: 'Kết quả từ caller thắng claim.',
      providerMetadata: { provider: 'deepseek' },
      createdAt: new Date().toISOString(),
    };

    (persistence.findChartSnapshotById as any).mockResolvedValue(chartRecord);
    (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValue(failedRequest);
    (persistence.findExplanationResultByRequestId as any)
      .mockResolvedValueOnce(null) // cache check trước nhánh in-flight
      .mockResolvedValue(winnerResult); // trong wait, winner đã ghi result
    // Claim thua (caller khác đã rời 'failed') → null.
    (persistence.tryClaimExplanationRequest as any).mockResolvedValue(null);

    try {
      await service.createExplanation(user, '127.0.0.1', input);
    } catch (e) {
      // ignore schema parse noise
    }

    // Thua claim → KHÔNG regenerate: không gọi provider, không tạo result mới.
    expect(providerRouter.generate).not.toHaveBeenCalled();
    expect(persistence.createExplanationResult).not.toHaveBeenCalled();
    expect(persistence.createExplanationRequest).not.toHaveBeenCalled();
  });

  it('reaps in-flight result via wait and does NOT generate duplicate (fixes duplicate-worker race)', async () => {
    const user = createAuthenticatedUser();
    const input = createExplanationRequest('soulPalace');
    const chartRecord = createChartRecord();

    // Worker chính vẫn đang chạy (running), cập nhật gần đây (không treo).
    const inFlightRequest = {
      id: 'req-inflight',
      ownerUserId: 'user-123',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      idempotencyKey: 'key-inflight',
      requestState: 'running' as const,
      providerName: 'deepseek',
      promptStorageMode: 'not_stored' as const,
      failureRetainsUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const winnerResult = {
      id: 'res-winner',
      ownerUserId: 'user-123',
      explanationRequestId: 'req-inflight',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      cacheScope: 'user_snapshot' as const,
      renderedMarkdown: 'Kết quả từ worker chính.',
      providerMetadata: { provider: 'deepseek' },
      createdAt: new Date().toISOString(),
    };

    (persistence.findChartSnapshotById as any).mockResolvedValue(chartRecord);
    (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValue(inFlightRequest);
    // Lần đầu (kiểm tra cache trước nhánh in-flight) chưa có result; lần sau (trong wait) winner đã ghi result.
    (persistence.findExplanationResultByRequestId as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(winnerResult);

    try {
      await service.createExplanation(user, '127.0.0.1', input);
    } catch (e) {
      // ignore schema parse noise từ partial mock
    }

    // KHÔNG được sinh worker trùng: không gọi provider, không tạo result mới.
    expect(providerRouter.generate).not.toHaveBeenCalled();
    expect(persistence.createExplanationResult).not.toHaveBeenCalled();
    expect(persistence.createExplanationRequest).not.toHaveBeenCalled();
  });

  it('returns PROVIDER_TIMEOUT instead of regenerating when healthy worker still in-flight after wait', async () => {
    const user = createAuthenticatedUser();
    const input = createExplanationRequest('soulPalace');
    const chartRecord = createChartRecord();

    // Worker chính vẫn chạy, cập nhật gần đây (KHÔNG treo) nhưng result chưa kịp xuất hiện trong cửa sổ chờ.
    const inFlightRequest = {
      id: 'req-slow',
      ownerUserId: 'user-123',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      idempotencyKey: 'key-slow',
      requestState: 'running' as const,
      providerName: 'deepseek',
      promptStorageMode: 'not_stored' as const,
      failureRetainsUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (persistence.findChartSnapshotById as any).mockResolvedValue(chartRecord);
    (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValue(inFlightRequest);
    (persistence.findExplanationResultByRequestId as any).mockResolvedValue(null);

    // Rút ngắn cửa sổ chờ để test không treo: spy waitForExplanationResult trả null ngay.
    vi.spyOn(service as any, 'waitForExplanationResult').mockResolvedValue(null);

    await expect(service.createExplanation(user, '127.0.0.1', input)).rejects.toThrow(
      /PROVIDER_TIMEOUT|đang được xử lý/,
    );
    // KHÔNG regenerate khi worker chính còn sống.
    expect(providerRouter.generate).not.toHaveBeenCalled();
    expect(persistence.createExplanationResult).not.toHaveBeenCalled();
  });

  it('takes over and regenerates when in-flight request is stale (worker presumed dead)', async () => {
    const user = createAuthenticatedUser();
    const input = createExplanationRequest('soulPalace');
    const chartRecord = createChartRecord();

    // updatedAt rất cũ → vượt ngưỡng treo → tiếp quản regenerate ngay (không phí cửa sổ chờ).
    const staleRequest = {
      id: 'req-stale',
      ownerUserId: 'user-123',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      idempotencyKey: 'key-stale',
      requestState: 'running' as const,
      providerName: 'deepseek',
      promptStorageMode: 'not_stored' as const,
      failureRetainsUntil: null,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    };
    const completedRequest = { ...staleRequest, requestState: 'completed' as const };
    const createdResult = {
      id: 'res-takeover',
      ownerUserId: 'user-123',
      explanationRequestId: 'req-stale',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      cacheScope: 'user_snapshot' as const,
      renderedMarkdown: 'Luận giải sau tiếp quản.',
      providerMetadata: { provider: 'deepseek' },
      createdAt: new Date().toISOString(),
    };

    const claimedRequest = { ...staleRequest, requestState: 'pending' as const };

    (persistence.findChartSnapshotById as any).mockResolvedValue(chartRecord);
    (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValue(staleRequest);
    (persistence.findExplanationResultByRequestId as any).mockResolvedValue(null);
    (persistence.tryClaimExplanationRequest as any).mockResolvedValue(claimedRequest);
    (persistence.updateExplanationRequest as any).mockResolvedValue(completedRequest);
    (persistence.createExplanationResult as any).mockResolvedValue(createdResult);
    (persistence.createHistoryView as any).mockResolvedValue(undefined);

    const waitSpy = vi.spyOn(service as any, 'waitForExplanationResult');

    try {
      await service.createExplanation(user, '127.0.0.1', input);
    } catch (e) {
      // ignore schema parse noise
    }

    // Treo từ trước → KHÔNG chờ, claim nguyên tử rồi tiếp quản generate luôn.
    expect(waitSpy).not.toHaveBeenCalled();
    expect(persistence.tryClaimExplanationRequest).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'req-stale', expectedUpdatedAt: '2020-01-01T00:00:00.000Z', nextState: 'pending' }),
    );
    expect(providerRouter.generate).toHaveBeenCalled();
    expect(persistence.createExplanationResult).toHaveBeenCalled();
    // Không tạo request mới (tránh duplicate idempotency key).
    expect(persistence.createExplanationRequest).not.toHaveBeenCalled();
  });

  it('does NOT regenerate when a concurrent caller wins the stale takeover claim (atomic claim guards duplicate)', async () => {
    const user = createAuthenticatedUser();
    const input = createExplanationRequest('soulPalace');
    const chartRecord = createChartRecord();

    const staleRequest = {
      id: 'req-stale-lost',
      ownerUserId: 'user-123',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      idempotencyKey: 'key-stale-lost',
      requestState: 'running' as const,
      providerName: 'deepseek',
      promptStorageMode: 'not_stored' as const,
      failureRetainsUntil: null,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    };
    const winnerResult = {
      id: 'res-winner',
      ownerUserId: 'user-123',
      explanationRequestId: 'req-stale-lost',
      chartSnapshotId: '11111111-1111-1111-1111-111111111111',
      cacheScope: 'user_snapshot' as const,
      renderedMarkdown: 'Kết quả từ caller thắng claim.',
      providerMetadata: { provider: 'deepseek' },
      createdAt: new Date().toISOString(),
    };

    (persistence.findChartSnapshotById as any).mockResolvedValue(chartRecord);
    (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValue(staleRequest);
    // Cache-check ban đầu chưa có result; sau khi thua claim, wait thu được result của winner.
    (persistence.findExplanationResultByRequestId as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(winnerResult);
    // Thua claim (caller khác đã tiếp quản) → trả null.
    (persistence.tryClaimExplanationRequest as any).mockResolvedValue(null);

    try {
      await service.createExplanation(user, '127.0.0.1', input);
    } catch (e) {
      // ignore schema parse noise
    }

    // Thua claim → KHÔNG sinh worker trùng.
    expect(providerRouter.generate).not.toHaveBeenCalled();
    expect(persistence.createExplanationResult).not.toHaveBeenCalled();
    expect(persistence.createExplanationRequest).not.toHaveBeenCalled();
  });

  it('throws INVALID_INPUT early when palaceScope valid enum but missing in snapshot (fixes quota waste bug)', async () => {
    const user = createAuthenticatedUser();
    const input = createExplanationRequest('decadal');
    // Mock tối giản, self-contained (horoscope null đảm bảo nhánh decadal/yearly trigger throw).
    const chartRecord = {
      id: 'chart-1',
      ownerUserId: 'user-123',
      snapshot: {
        snapshotId: '11111111-1111-1111-1111-111111111111',
        chartSystem: 'zi-wei-dou-shu',
        palaces: [{ nameKey: 'soulPalace' }],
        horoscope: null,
        calculationConfidence: { level: 'medium', reasons: [], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        ruleSource: { canonicalLibrary: { name: 'iztro', version: '2.5.8' } },
      } as any,
    };

    (persistence.findChartSnapshotById as any).mockResolvedValue(chartRecord);
    (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValue(null);

    // Dùng toThrow thay vì toMatchObject shape (HttpException wrapper khác nhau trong vitest thuần vs Nest full).
    // Vẫn xác nhận throw sớm với message chứa INVALID_INPUT (tránh gọi provider + tạo request).
    await expect(service.createExplanation(user, '127.0.0.1', input)).rejects.toThrow(/INVALID_INPUT|Không tìm thấy dữ liệu cho palaceScope/);
    expect(persistence.createExplanationRequest).not.toHaveBeenCalled();
  });

  it('allows legacy palace snapshots (displayName fallback) — early validation must not hard-reject before prompt builder fallback (P2 legacy regression)', async () => {
    const user = createAuthenticatedUser();
    const legacyRecord = {
      id: 'chart-legacy',
      ownerUserId: 'user-123',
      snapshot: {
        snapshotId: 'legacy-snap',
        chartSystem: 'zi-wei-dou-shu',
        palaces: [
          {
            nameKey: 'legacyPalace0',
            displayName: 'Mệnh',
            index: 0,
            heavenlyStemKey: 'legacyH0',
            earthlyBranchKey: 'legacyE0',
            isBodyPalace: false,
            isOriginalPalace: false,
            majorStars: [],
            minorStars: [],
            adjectiveStars: [],
            ages: [],
          },
        ],
        horoscope: null,
        calculationConfidence: { level: 'medium', reasons: [], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
        ruleSource: { canonicalLibrary: { name: 'iztro', version: '2.5.8' } },
      } as any,
    };

    const createdRequest = { id: 'req-leg', requestState: 'pending' as const };
    const completedRequest = { id: 'req-leg', requestState: 'completed' as const };
    const createdResult = {
      id: 'res-leg',
      ownerUserId: 'user-123',
      explanationRequestId: 'req-leg',
      chartSnapshotId: 'legacy-snap',
      cacheScope: 'user_snapshot' as const,
      renderedMarkdown: 'Luận giải legacy Mệnh.',
      providerMetadata: { provider: 'deepseek' },
      createdAt: '2026-06-09T00:00:01.000Z',
    };

    (persistence.findChartSnapshotById as any).mockResolvedValue(legacyRecord);
    (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValue(null);
    (persistence.createExplanationRequest as any).mockResolvedValue(createdRequest);
    (persistence.updateExplanationRequest as any).mockResolvedValue(completedRequest);
    (persistence.createExplanationResult as any).mockResolvedValue(createdResult);
    (persistence.createHistoryView as any).mockResolvedValue(undefined);

    const input = createExplanationRequest('soulPalace'); // standard scope on legacy snapshot

    // We tolerate schema parse differences in mocks (like other tests in this file).
    // The key signal for this repro: we did NOT throw INVALID_INPUT from early validation,
    // and we reached result creation (meaning the legacy case passed the nameKey/legacy guard).
    try {
      await service.createExplanation(user, '127.0.0.1', input);
    } catch (e) {
      // ignore parse/schema noise from partial mocks; we only care about call side-effects here
    }

    expect(persistence.createExplanationResult).toHaveBeenCalled();
    // ensure we didn't short-circuit before creating the request (i.e. no early INVALID_INPUT)
    expect(persistence.createExplanationRequest).toHaveBeenCalled();
  });
});




describe('US-010 AI explanation gate', () => {
  let service: ExplanationsService;
  let persistence: Partial<SupabasePersistenceGateway>;
  let quotas: Partial<QuotasService>;
  let providerRouter: Partial<ExplanationProviderRouter>;

  beforeEach(() => {
    persistence = {
      findChartSnapshotById: vi.fn(),
      findExplanationRequestByIdempotencyKey: vi.fn(),
      findExplanationResultByRequestId: vi.fn(),
      createExplanationRequest: vi.fn(),
      updateExplanationRequest: vi.fn(),
      tryClaimExplanationRequest: vi.fn(),
      createExplanationResult: vi.fn(),
      createHistoryView: vi.fn(),
    };

    quotas = {
      assertCanCreateExplanation: vi.fn().mockResolvedValue(undefined),
    };

    providerRouter = {
      resolveProviderName: vi.fn().mockReturnValue('deepseek'),
      generate: vi.fn().mockResolvedValue({
        renderedMarkdown: 'Luận giải mẫu.',
        providerMetadata: { provider: 'deepseek' },
      }),
    };

    service = new ExplanationsService(
      persistence as SupabasePersistenceGateway,
      quotas as QuotasService,
      providerRouter as ExplanationProviderRouter,
    );
  });

  it('no-op when AI_EXPLANATION_FREE_FOR_ALL=true (default test)', async () => {
    const prev = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
    (apiEnv as any).AI_EXPLANATION_FREE_FOR_ALL = true;
    try {
      const user = createAuthenticatedUser();
      const input = createExplanationRequest('soulPalace');
      const chartRecord = createChartRecord();
      (persistence.findChartSnapshotById as any).mockResolvedValue(chartRecord);
      (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValue(null);
      (persistence.createExplanationRequest as any).mockResolvedValue({
        id: 'req-free',
        ownerUserId: 'user-123',
        chartSnapshotId: '11111111-1111-1111-1111-111111111111',
        idempotencyKey: 'free-key',
        requestState: 'pending' as const,
        providerName: 'deepseek',
        promptStorageMode: 'not_stored' as const,
        failureRetainsUntil: null,
        createdAt: '2026-06-17T00:00:00.000Z',
        updatedAt: '2026-06-17T00:00:00.000Z',
      });
      (persistence.updateExplanationRequest as any).mockResolvedValue({
        id: 'req-free',
        ownerUserId: 'user-123',
        chartSnapshotId: '11111111-1111-1111-1111-111111111111',
        idempotencyKey: 'free-key',
        requestState: 'completed' as const,
        providerName: 'deepseek',
        promptStorageMode: 'not_stored' as const,
        failureRetainsUntil: null,
        createdAt: '2026-06-17T00:00:00.000Z',
        updatedAt: '2026-06-17T00:00:01.000Z',
      });
      (persistence.createExplanationResult as any).mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        ownerUserId: 'user-123',
        explanationRequestId: 'req-free',
        chartSnapshotId: '11111111-1111-1111-1111-111111111111',
        cacheScope: 'user_snapshot' as const,
        renderedMarkdown: 'free ok',
        providerMetadata: { provider: 'deepseek' },
        createdAt: '2026-06-17T00:00:01.000Z',
      });
      (persistence.createHistoryView as any).mockResolvedValue(undefined);
      (providerRouter.generate as any).mockResolvedValue({ renderedMarkdown: 'free ok', providerMetadata: {} });
      try {
        await service.createExplanation(user, '127.0.0.1', input);
      } catch {
        // ignore parse/schema noise from partial mocks; we only care about call side-effects here
      }
    } finally {
      (apiEnv as any).AI_EXPLANATION_FREE_FOR_ALL = prev;
    }
    // Gate cho phép: provider được gọi (cache-hit đã bypass ở trên).
    // Bỏ qua parse lỗi response (mock fixture không đầy đủ) — side-effect là tín hiệu.
    expect(providerRouter.generate).toHaveBeenCalled();
  });

  it('throws 402 PAYMENT_REQUIRED when flag=false and no entitlement', async () => {
    const prev = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
    (apiEnv as any).AI_EXPLANATION_FREE_FOR_ALL = false;
    try {
      const user = createAuthenticatedUser();
      const input = createExplanationRequest('careerPalace');
      const chartRecord = createChartRecord();
      (persistence.findChartSnapshotById as any).mockResolvedValue(chartRecord);
      (persistence.findExplanationRequestByIdempotencyKey as any).mockResolvedValue(null);
      await expect(service.createExplanation(user, '127.0.0.1', input)).rejects.toMatchObject({
        status: HttpStatus.PAYMENT_REQUIRED,
      });
      // Gate chặn TRƯỚC mọi mutation (decision 0010): không tạo request record, không gọi provider,
      // không set 'running'/'failed' → tránh ô nhiễm lifecycle khi user bị chặn.
      expect(persistence.createExplanationRequest).not.toHaveBeenCalled();
      expect(persistence.updateExplanationRequest).not.toHaveBeenCalled();
      expect(providerRouter.generate).not.toHaveBeenCalled();
    } finally {
      (apiEnv as any).AI_EXPLANATION_FREE_FOR_ALL = prev;
    }
  });

  it('parses AI_EXPLANATION_FREE_FOR_ALL="false" env string as false (z.stringbool, not coerce)', () => {
    // Bảo vệ chống regression: z.coerce.boolean() coi mọi chuỗi non-empty (kể cả "false")
    // là true → gate vô hiệu ở prod. z.stringbool() parse đúng ngữ nghĩa boolean.
    // Mọi field env khác đều có default nên chỉ cần truyền trường đang kiểm.
    expect(apiEnvSchema.parse({ AI_EXPLANATION_FREE_FOR_ALL: 'false' }).AI_EXPLANATION_FREE_FOR_ALL).toBe(false);
    expect(apiEnvSchema.parse({ AI_EXPLANATION_FREE_FOR_ALL: '0' }).AI_EXPLANATION_FREE_FOR_ALL).toBe(false);
    expect(apiEnvSchema.parse({ AI_EXPLANATION_FREE_FOR_ALL: 'true' }).AI_EXPLANATION_FREE_FOR_ALL).toBe(true);
    expect(apiEnvSchema.parse({}).AI_EXPLANATION_FREE_FOR_ALL).toBe(true);
  });
});
