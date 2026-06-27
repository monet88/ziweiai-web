import { HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dreamInterpretationSchema, type AuthenticatedUser } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import type { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../providers/ai/provider-errors';
import type { QuotasService } from '../quotas/quotas.service';
import { DreamsService } from './dreams.service';

function expectApiError(error: unknown, status: HttpStatus, code: string): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string };
  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
}

describe('DreamsService', () => {
  const originalEnabled = apiEnv.EXTENDED_SYSTEM_DREAM_ENABLED;
  const originalFreeForAll = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  let quotasService: Pick<QuotasService, 'assertCanCreateDreamReading'>;
  let providerRouter: Pick<ExplanationProviderRouter, 'generate'>;
  let service: DreamsService;

  beforeEach(() => {
    apiEnv.EXTENDED_SYSTEM_DREAM_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    quotasService = { assertCanCreateDreamReading: vi.fn().mockResolvedValue(undefined) };
    providerRouter = {
      generate: vi.fn().mockResolvedValue({
        renderedMarkdown: 'Luận giải giấc mơ từ LLM.\n\n## Tóm lại\nGiữ chủ động.',
        providerMetadata: { provider: 'mock' },
      }),
    };
    service = new DreamsService(quotasService as QuotasService, providerRouter as ExplanationProviderRouter);
  });

  afterEach(() => {
    apiEnv.EXTENDED_SYSTEM_DREAM_ENABLED = originalEnabled;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = originalFreeForAll;
    vi.restoreAllMocks();
  });

  it('chặn FEATURE_DISABLED khi flag tắt', async () => {
    apiEnv.EXTENDED_SYSTEM_DREAM_ENABLED = false;
    try {
      await service.interpretDream(user, '127.0.0.1', 'Tôi mơ thấy rắn');
      throw new Error('expected flag gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.FORBIDDEN, 'FEATURE_DISABLED');
    }
    expect(quotasService.assertCanCreateDreamReading).not.toHaveBeenCalled();
  });

  it('chặn PAYMENT_REQUIRED khi không free-for-all', async () => {
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = false;
    try {
      await service.interpretDream(user, '127.0.0.1', 'Tôi mơ thấy rắn');
      throw new Error('expected premium gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED');
    }
  });

  it('trả payload hợp lệ + khớp biểu tượng + gọi quota khi bật + free-for-all', async () => {
    const result = await service.interpretDream(user, '127.0.0.1', 'Tôi mơ thấy một con rắn lớn');
    expect(dreamInterpretationSchema.safeParse(result).success).toBe(true);
    expect(result.symbols.length).toBeGreaterThan(0);
    expect(result.narrative).toContain('Luận giải giấc mơ từ LLM.');
    expect(providerRouter.generate).toHaveBeenCalledTimes(1);
    expect(quotasService.assertCanCreateDreamReading).toHaveBeenCalledWith(user.userId, '127.0.0.1', false);
  });

  it('dùng quota anon khi user không có email', async () => {
    const anon: AuthenticatedUser = { userId: '22222222-2222-2222-2222-222222222222', email: null };
    await service.interpretDream(anon, '10.0.0.1', 'Giấc mơ ngắn');
    expect(quotasService.assertCanCreateDreamReading).toHaveBeenCalledWith(anon.userId, '10.0.0.1', true);
  });

  it('map lỗi quota thành 429 RATE_LIMITED', async () => {
    quotasService.assertCanCreateDreamReading = vi.fn().mockRejectedValue(new Error('Daily explanation quota exceeded.'));
    try {
      await service.interpretDream(user, '127.0.0.1', 'Tôi mơ thấy rắn');
      throw new Error('expected quota rejection to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED');
    }
  });

  it('luận giải tự do (symbols rỗng) khi mô tả không khớp biểu tượng', async () => {
    const result = await service.interpretDream(user, '127.0.0.1', 'xyz qwerty không biểu tượng');
    expect(result.symbols).toEqual([]);
    expect(dreamInterpretationSchema.safeParse(result).success).toBe(true);
  });

  it('rơi về template khi provider không khả dụng', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new ProviderUnavailableError('no provider'));
    const result = await service.interpretDream(user, '127.0.0.1', 'Tôi mơ thấy rắn');
    expect(result.narrative.length).toBeGreaterThan(0);
    expect(dreamInterpretationSchema.safeParse(result).success).toBe(true);
  });

  it('rơi về template khi provider timeout', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new ProviderTimeoutError('slow'));
    const result = await service.interpretDream(user, '127.0.0.1', 'Tôi mơ thấy rắn');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('ném tiếp lỗi không phải provider', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new Error('unexpected boom'));
    await expect(service.interpretDream(user, '127.0.0.1', 'Tôi mơ thấy rắn')).rejects.toThrow('unexpected boom');
  });

  it('trim mô tả và chặn mô tả chỉ chứa khoảng trắng', async () => {
    const trimmed = await service.interpretDream(user, '127.0.0.1', '  Tôi mơ thấy rắn  ');
    expect(trimmed.dream).toBe('Tôi mơ thấy rắn');
    try {
      await service.interpretDream(user, '127.0.0.1', '   ');
      throw new Error('expected blank dream to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.BAD_REQUEST, 'INVALID_INPUT');
    }
  });
});
