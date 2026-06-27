import { HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { almanacSelectionSchema, type AuthenticatedUser } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import type { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../providers/ai/provider-errors';
import type { QuotasService } from '../quotas/quotas.service';
import { AlmanacService } from './almanac.service';

function expectApiError(error: unknown, status: HttpStatus, code: string): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string };
  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
}

describe('AlmanacService', () => {
  const originalEnabled = apiEnv.EXTENDED_SYSTEM_ALMANAC_ENABLED;
  const originalFreeForAll = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  let quotasService: Pick<QuotasService, 'assertCanCreateAlmanacSelection'>;
  let providerRouter: Pick<ExplanationProviderRouter, 'generate'>;
  let service: AlmanacService;

  beforeEach(() => {
    apiEnv.EXTENDED_SYSTEM_ALMANAC_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    quotasService = { assertCanCreateAlmanacSelection: vi.fn().mockResolvedValue(undefined) };
    providerRouter = {
      generate: vi.fn().mockResolvedValue({
        renderedMarkdown: 'Luận giải chọn ngày từ LLM.\n\n## Tóm lại\nTự cân nhắc lịch thực tế.',
        providerMetadata: { provider: 'mock' },
      }),
    };
    service = new AlmanacService(quotasService as QuotasService, providerRouter as ExplanationProviderRouter);
  });

  afterEach(() => {
    apiEnv.EXTENDED_SYSTEM_ALMANAC_ENABLED = originalEnabled;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = originalFreeForAll;
    vi.restoreAllMocks();
  });

  it('chặn FEATURE_DISABLED khi flag tắt', async () => {
    apiEnv.EXTENDED_SYSTEM_ALMANAC_ENABLED = false;
    try {
      await service.select(user, '127.0.0.1', 'marriage', '2026-01-01', '2026-01-05');
      throw new Error('expected flag gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.FORBIDDEN, 'FEATURE_DISABLED');
    }
    expect(quotasService.assertCanCreateAlmanacSelection).not.toHaveBeenCalled();
  });

  it('chặn PAYMENT_REQUIRED khi không free-for-all', async () => {
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = false;
    try {
      await service.select(user, '127.0.0.1', 'marriage', '2026-01-01', '2026-01-05');
      throw new Error('expected premium gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED');
    }
  });

  it('trả payload hợp lệ + gọi quota khi bật + free-for-all', async () => {
    const result = await service.select(user, '127.0.0.1', 'marriage', '2026-01-01', '2026-01-07');
    expect(almanacSelectionSchema.safeParse(result).success).toBe(true);
    expect(result.days.length).toBe(7);
    expect(result.topic).toBe('marriage');
    expect(result.narrative).toContain('Luận giải chọn ngày từ LLM.');
    expect(providerRouter.generate).toHaveBeenCalledTimes(1);
    expect(quotasService.assertCanCreateAlmanacSelection).toHaveBeenCalledWith(user.userId, '127.0.0.1', false);
  });

  it('dùng quota anon khi user không có email', async () => {
    const anon: AuthenticatedUser = { userId: '22222222-2222-2222-2222-222222222222', email: null };
    await service.select(anon, '10.0.0.1', 'travel', '2026-02-01', '2026-02-03');
    expect(quotasService.assertCanCreateAlmanacSelection).toHaveBeenCalledWith(anon.userId, '10.0.0.1', true);
  });

  it('map lỗi quota thành 429 RATE_LIMITED', async () => {
    quotasService.assertCanCreateAlmanacSelection = vi
      .fn()
      .mockRejectedValue(new Error('Daily explanation quota exceeded.'));
    try {
      await service.select(user, '127.0.0.1', 'marriage', '2026-01-01', '2026-01-05');
      throw new Error('expected quota rejection to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED');
    }
  });

  it('map lỗi engine (khoảng ngày sai) thành 400 INVALID_INPUT', async () => {
    try {
      await service.select(user, '127.0.0.1', 'marriage', '2026-02-10', '2026-02-01');
      throw new Error('expected engine error to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.BAD_REQUEST, 'INVALID_INPUT');
    }
  });

  it('rơi về template khi provider không khả dụng', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new ProviderUnavailableError('no provider'));
    const result = await service.select(user, '127.0.0.1', 'marriage', '2026-01-01', '2026-01-05');
    expect(result.narrative.length).toBeGreaterThan(0);
    expect(almanacSelectionSchema.safeParse(result).success).toBe(true);
  });

  it('rơi về template khi provider timeout', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new ProviderTimeoutError('slow'));
    const result = await service.select(user, '127.0.0.1', 'marriage', '2026-01-01', '2026-01-05');
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('ném tiếp lỗi không phải provider', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new Error('unexpected boom'));
    await expect(service.select(user, '127.0.0.1', 'marriage', '2026-01-01', '2026-01-05')).rejects.toThrow(
      'unexpected boom',
    );
  });
});
