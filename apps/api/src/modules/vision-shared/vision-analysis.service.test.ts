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
  let storageGateway: Pick<VisionStorageGateway, 'uploadVisionImage'>;
  let service: VisionAnalysisService;

  beforeEach(() => {
    apiEnv.EXTENDED_SYSTEM_FACE_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    quotasService = { assertCanCreateVisionAnalysis: vi.fn().mockResolvedValue(undefined) };
    providerRouter = {
      generate: vi.fn().mockResolvedValue({ renderedMarkdown: 'Phân tích tướng mặt.', providerMetadata: { provider: 'deepseek' } }),
    };
    storageGateway = { uploadVisionImage: vi.fn().mockResolvedValue({ imagePath: 'owner/req.png' }) };
    service = new VisionAnalysisService(
      quotasService as QuotasService,
      providerRouter as ExplanationProviderRouter,
      storageGateway as VisionStorageGateway,
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
    expect(payload.promptOverride).toContain('Câu hỏi người dùng đặc biệt quan tâm: Sự nghiệp của tôi?');
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
});
