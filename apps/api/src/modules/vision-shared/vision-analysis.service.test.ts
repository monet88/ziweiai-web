import { HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { visionAnalysisSchema, type AuthenticatedUser } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import type { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderUnavailableError } from '../../providers/ai/provider-errors';
import { RateLimitWindowError } from '../quotas/quota-errors';
import type { QuotasService } from '../quotas/quotas.service';
import { VisionAnalysisService } from './vision-analysis.service';
import type { VisionStorageGateway } from './vision-storage.gateway';
import type { SupabasePersistenceGateway } from '../../database/supabase-persistence.gateway';

function expectApiError(error: unknown, status: HttpStatus, code: string): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string };
  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
}

describe('VisionAnalysisService', () => {
  const originalFaceEnabled = apiEnv.EXTENDED_SYSTEM_FACE_ENABLED;
  const originalFreeForAll = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
  const emailUser: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  const anonUser: AuthenticatedUser = { userId: '22222222-2222-2222-2222-222222222222', email: null };
  const imageBytes = new Uint8Array([1, 2, 3, 4]);

  let quotasService: Pick<QuotasService, 'assertCanCreateVisionAnalysis'>;
  let providerRouter: Pick<ExplanationProviderRouter, 'generate'>;
  let storageGateway: Pick<VisionStorageGateway, 'uploadVisionImage' | 'deleteVisionImage'>;
  let persistence: Pick<
    SupabasePersistenceGateway,
    'createVisionResult' | 'createHistoryView' | 'findVisionResultById' | 'deleteVisionResult'
  >;
  let service: VisionAnalysisService;

  beforeEach(() => {
    apiEnv.EXTENDED_SYSTEM_FACE_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    quotasService = { assertCanCreateVisionAnalysis: vi.fn().mockResolvedValue(undefined) };
    providerRouter = {
      generate: vi.fn().mockResolvedValue({ renderedMarkdown: 'Phân tích tướng mặt.', providerMetadata: { provider: 'deepseek' } }),
    };
    storageGateway = {
      uploadVisionImage: vi.fn().mockResolvedValue({ imagePath: 'owner/req.png' }),
      deleteVisionImage: vi.fn().mockResolvedValue(undefined),
    };
    persistence = {
      createVisionResult: vi.fn().mockResolvedValue({ id: '33333333-3333-4333-8333-333333333333' }),
      createHistoryView: vi.fn().mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444' }),
      findVisionResultById: vi.fn(),
      deleteVisionResult: vi.fn().mockResolvedValue(undefined),
    };
    service = new VisionAnalysisService(
      quotasService as QuotasService,
      providerRouter as ExplanationProviderRouter,
      storageGateway as VisionStorageGateway,
      persistence as SupabasePersistenceGateway,
    );
  });

  afterEach(() => {
    apiEnv.EXTENDED_SYSTEM_FACE_ENABLED = originalFaceEnabled;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = originalFreeForAll;
    vi.restoreAllMocks();
  });

  function baseInput(overrides: Partial<Parameters<VisionAnalysisService['analyze']>[0]> = {}) {
    return {
      kind: 'face' as const,
      user: emailUser,
      ipAddress: '127.0.0.1',
      imageBytes,
      mimeType: 'image/png',
      ...overrides,
    };
  }

  it('chặn FEATURE_DISABLED khi cờ Face tắt (trước mọi gate khác)', async () => {
    apiEnv.EXTENDED_SYSTEM_FACE_ENABLED = false;
    try {
      await service.analyze(baseInput());
      throw new Error('expected feature gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.FORBIDDEN, 'FEATURE_DISABLED');
    }
    expect(storageGateway.uploadVisionImage).not.toHaveBeenCalled();
    expect(providerRouter.generate).not.toHaveBeenCalled();
  });

  it('chặn IDENTITY_REQUIRED cho user ẩn danh (email null)', async () => {
    try {
      await service.analyze(baseInput({ user: anonUser }));
      throw new Error('expected identity gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.FORBIDDEN, 'IDENTITY_REQUIRED');
    }
    expect(quotasService.assertCanCreateVisionAnalysis).not.toHaveBeenCalled();
  });

  it('chặn PAYMENT_REQUIRED khi AI gate không free-for-all (trước quota)', async () => {
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = false;
    try {
      await service.analyze(baseInput());
      throw new Error('expected premium gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED');
    }
    expect(quotasService.assertCanCreateVisionAnalysis).not.toHaveBeenCalled();
  });

  it('map lỗi quota vision thành 429 VISION_QUOTA_EXCEEDED', async () => {
    quotasService.assertCanCreateVisionAnalysis = vi.fn().mockRejectedValue(new Error('Daily vision quota exceeded.'));
    try {
      await service.analyze(baseInput());
      throw new Error('expected vision quota to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.TOO_MANY_REQUESTS, 'VISION_QUOTA_EXCEEDED');
    }
    expect(storageGateway.uploadVisionImage).not.toHaveBeenCalled();
  });

  it('rate-limit per-phút (RateLimitWindowError) map thành 429 RATE_LIMITED, KHÔNG phải VISION_QUOTA_EXCEEDED', async () => {
    quotasService.assertCanCreateVisionAnalysis = vi.fn().mockRejectedValue(new RateLimitWindowError());
    try {
      await service.analyze(baseInput());
      throw new Error('expected rate-limit to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED');
    }
    expect(storageGateway.uploadVisionImage).not.toHaveBeenCalled();
  });

  it('LLM lỗi → KHÔNG upload ảnh (tránh để lại ảnh sinh trắc mồ côi trong Storage)', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new ProviderUnavailableError('Chưa cấu hình nhà cung cấp AI có khả năng đọc ảnh.'));
    try {
      await service.analyze(baseInput());
      throw new Error('expected provider failure to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.BAD_GATEWAY, 'PROVIDER_UNAVAILABLE');
    }
    // Đảo thứ tự (LLM trước, upload sau): provider lỗi → upload KHÔNG được gọi.
    expect(storageGateway.uploadVisionImage).not.toHaveBeenCalled();
  });

  it('happy-path: upload ảnh + gọi vision LLM với imageInput rồi parse visionAnalysisSchema', async () => {
    const result = await service.analyze(baseInput({ question: 'Sự nghiệp của tôi?' }));

    expect(visionAnalysisSchema.safeParse(result).success).toBe(true);
    expect(result.kind).toBe('face');
    expect(result.imagePath).toBe('owner/req.png');
    expect(storageGateway.uploadVisionImage).toHaveBeenCalledWith({
      ownerUserId: emailUser.userId,
      imageBytes,
      mimeType: 'image/png',
    });
    const generateMock = providerRouter.generate as ReturnType<typeof vi.fn>;
    const payload = generateMock.mock.calls[0]?.[1] as { imageInput?: { base64: string; mimeType: string }; promptOverride?: string };
    expect(payload.imageInput).toEqual({ base64: Buffer.from(imageBytes).toString('base64'), mimeType: 'image/png' });
    expect(payload.promptOverride).toContain('Sự nghiệp của tôi?');
    expect(payload.promptOverride).toContain('Nhiệm vụ chính của bạn là TRẢ LỜI');

    // US-017 follow-up (decision 0023): persist vĩnh viễn vision_result + history_view.
    expect(persistence.createVisionResult).toHaveBeenCalledWith({
      ownerUserId: emailUser.userId,
      kind: 'face',
      imagePath: 'owner/req.png',
      question: 'Sự nghiệp của tôi?',
      renderedMarkdown: 'Phân tích tướng mặt.',
      providerMetadata: { provider: 'deepseek' },
    });
    expect(persistence.createHistoryView).toHaveBeenCalledWith({
      ownerUserId: emailUser.userId,
      chartSnapshotId: null,
      explanationResultId: null,
      visionResultId: '33333333-3333-4333-8333-333333333333',
    });
  });

  it('câu hỏi rỗng/khoảng trắng → lưu question=null (không ép chuỗi trắng vào lịch sử)', async () => {
    await service.analyze(baseInput({ question: '   ' }));
    const createMock = persistence.createVisionResult as ReturnType<typeof vi.fn>;
    expect(createMock.mock.calls[0]?.[0]?.question).toBeNull();
  });

  it('persist lịch sử lỗi KHÔNG làm hỏng response (người dùng đã chờ LLM)', async () => {
    persistence.createVisionResult = vi.fn().mockRejectedValue(new Error('db down'));
    const result = await service.analyze(baseInput());
    // Kết quả vision vẫn trả về bình thường dù ghi lịch sử thất bại.
    expect(visionAnalysisSchema.safeParse(result).success).toBe(true);
    expect(result.imagePath).toBe('owner/req.png');
  });

  it('palm dùng cờ EXTENDED_SYSTEM_PALM_ENABLED riêng (Face bật không mở Palm)', async () => {
    const originalPalm = apiEnv.EXTENDED_SYSTEM_PALM_ENABLED;
    apiEnv.EXTENDED_SYSTEM_PALM_ENABLED = false;
    try {
      await service.analyze(baseInput({ kind: 'palm' }));
      throw new Error('expected palm feature gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.FORBIDDEN, 'FEATURE_DISABLED');
    } finally {
      apiEnv.EXTENDED_SYSTEM_PALM_ENABLED = originalPalm;
    }
  });

  it('palm happy-path: dùng prompt Xem Tay + kind=palm khi cờ PALM bật (US-017f)', async () => {
    const originalPalm = apiEnv.EXTENDED_SYSTEM_PALM_ENABLED;
    apiEnv.EXTENDED_SYSTEM_PALM_ENABLED = true;
    try {
      const result = await service.analyze(baseInput({ kind: 'palm' }));
      expect(result.kind).toBe('palm');
      const generateMock = providerRouter.generate as ReturnType<typeof vi.fn>;
      const payload = generateMock.mock.calls[0]?.[1] as { promptOverride?: string };
      // Prompt Xem Tay (palm) khác Xem Tướng (face): nhắc "lòng bàn tay" + "đường sinh đạo".
      expect(payload.promptOverride).toContain('lòng bàn tay');
    } finally {
      apiEnv.EXTENDED_SYSTEM_PALM_ENABLED = originalPalm;
    }
  });

  // US-017 follow-up (decision 0023): quyền được quên — xoá ảnh sinh trắc TRƯỚC, rồi xoá row DB.
  describe('deleteVisionResult', () => {
    const VISION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    function existingRecord(overrides: Record<string, unknown> = {}) {
      return {
        id: VISION_ID,
        ownerUserId: emailUser.userId,
        kind: 'face',
        imagePath: `${emailUser.userId}/img.png`,
        question: null,
        renderedMarkdown: 'Luận giải đã lưu.',
        providerMetadata: {},
        createdAt: '2026-06-26T00:00:00.000Z',
        ...overrides,
      };
    }

    it('xoá ảnh khỏi Storage TRƯỚC rồi mới xoá row DB (không để ảnh sinh trắc mồ côi)', async () => {
      persistence.findVisionResultById = vi.fn().mockResolvedValue(existingRecord());
      const deleteImage = storageGateway.deleteVisionImage as ReturnType<typeof vi.fn>;
      const deleteRow = persistence.deleteVisionResult as ReturnType<typeof vi.fn>;

      await service.deleteVisionResult(emailUser, VISION_ID);

      expect(deleteImage).toHaveBeenCalledWith(`${emailUser.userId}/img.png`);
      expect(deleteRow).toHaveBeenCalledWith(emailUser.userId, VISION_ID);
      expect(deleteImage.mock.invocationCallOrder[0]).toBeLessThan(deleteRow.mock.invocationCallOrder[0]);
    });

    it('không tìm thấy mục của owner → 404 NOT_FOUND, KHÔNG đụng Storage', async () => {
      persistence.findVisionResultById = vi.fn().mockResolvedValue(null);

      try {
        await service.deleteVisionResult(emailUser, VISION_ID);
        throw new Error('expected NOT_FOUND');
      } catch (error) {
        expectApiError(error, HttpStatus.NOT_FOUND, 'NOT_FOUND');
      }
      expect(storageGateway.deleteVisionImage).not.toHaveBeenCalled();
      expect(persistence.deleteVisionResult).not.toHaveBeenCalled();
    });

    it('lỗi xoá ảnh → ném (KHÔNG xoá row): tránh row mất nhưng ảnh còn mồ côi', async () => {
      persistence.findVisionResultById = vi.fn().mockResolvedValue(existingRecord());
      storageGateway.deleteVisionImage = vi.fn().mockRejectedValue(new Error('storage down'));

      await expect(service.deleteVisionResult(emailUser, VISION_ID)).rejects.toThrow('storage down');
      expect(persistence.deleteVisionResult).not.toHaveBeenCalled();
    });

    it('tài khoản khách (email null) → 403 IDENTITY_REQUIRED', async () => {
      try {
        await service.deleteVisionResult(anonUser, VISION_ID);
        throw new Error('expected IDENTITY_REQUIRED');
      } catch (error) {
        expectApiError(error, HttpStatus.FORBIDDEN, 'IDENTITY_REQUIRED');
      }
      expect(persistence.findVisionResultById).not.toHaveBeenCalled();
    });
  });
});
