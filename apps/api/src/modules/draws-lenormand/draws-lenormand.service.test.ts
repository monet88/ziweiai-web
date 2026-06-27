import { HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lenormandDrawSchema, type AuthenticatedUser } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import type { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../providers/ai/provider-errors';
import type { QuotasService } from '../quotas/quotas.service';
import { DrawsLenormandService } from './draws-lenormand.service';

function expectApiError(error: unknown, status: HttpStatus, code: string): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string };
  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
}

describe('DrawsLenormandService', () => {
  const originalEnabled = apiEnv.EXTENDED_SYSTEM_LENORMAND_ENABLED;
  const originalFreeForAll = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  let quotasService: Pick<QuotasService, 'assertCanCreateLenormandDraw'>;
  let providerRouter: Pick<ExplanationProviderRouter, 'generate'>;
  let service: DrawsLenormandService;

  beforeEach(() => {
    apiEnv.EXTENDED_SYSTEM_LENORMAND_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    quotasService = { assertCanCreateLenormandDraw: vi.fn().mockResolvedValue(undefined) };
    providerRouter = {
      generate: vi.fn().mockResolvedValue({
        renderedMarkdown: 'Bài đọc Lenormand từ LLM.\n\n## Tóm lại\nGiữ chủ động.',
        providerMetadata: { provider: 'mock' },
      }),
    };
    service = new DrawsLenormandService(
      quotasService as QuotasService,
      providerRouter as ExplanationProviderRouter,
    );
  });

  afterEach(() => {
    apiEnv.EXTENDED_SYSTEM_LENORMAND_ENABLED = originalEnabled;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = originalFreeForAll;
    vi.restoreAllMocks();
  });

  it('chặn FEATURE_DISABLED khi flag tắt', async () => {
    apiEnv.EXTENDED_SYSTEM_LENORMAND_ENABLED = false;
    try {
      await service.drawLenormand(user, '127.0.0.1', 'Tôi nên tập trung điều gì?', 'three', 'seed-1');
      throw new Error('expected flag gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.FORBIDDEN, 'FEATURE_DISABLED');
    }
    expect(quotasService.assertCanCreateLenormandDraw).not.toHaveBeenCalled();
  });

  it('chặn PAYMENT_REQUIRED khi bật nhưng AI gate không free-for-all', async () => {
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = false;
    try {
      await service.drawLenormand(user, '127.0.0.1', 'Tôi nên tập trung điều gì?', 'three', 'seed-1');
      throw new Error('expected premium gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED');
    }
  });

  it('trả payload hợp lệ + gọi quota khi bật + free-for-all', async () => {
    const result = await service.drawLenormand(user, '127.0.0.1', 'Tôi nên tập trung điều gì?', 'three', 'seed-1');
    expect(lenormandDrawSchema.safeParse(result).success).toBe(true);
    expect(result.cards).toHaveLength(3);
    expect(result.cards.map((c) => c.position)).toEqual([0, 1, 2]);
    expect(result.narrative).toContain('Bài đọc Lenormand từ LLM.');
    expect(quotasService.assertCanCreateLenormandDraw).toHaveBeenCalledWith(user.userId, '127.0.0.1', false);
  });

  it('dùng quota anon khi user không có email', async () => {
    const anon: AuthenticatedUser = { userId: '22222222-2222-2222-2222-222222222222', email: null };
    await service.drawLenormand(anon, '10.0.0.1', 'Một câu hỏi ngắn', 'three', 'seed-2');
    expect(quotasService.assertCanCreateLenormandDraw).toHaveBeenCalledWith(anon.userId, '10.0.0.1', true);
  });

  it('bố cục nine trả 9 lá', async () => {
    const result = await service.drawLenormand(user, '127.0.0.1', 'Nhìn toàn cảnh ra sao?', 'nine', 'seed-3');
    expect(result.cards).toHaveLength(9);
    expect(result.spread).toBe('nine');
  });

  it('map lỗi quota (raw Error) thành 429 RATE_LIMITED', async () => {
    quotasService.assertCanCreateLenormandDraw = vi.fn().mockRejectedValue(new Error('Daily explanation quota exceeded.'));
    try {
      await service.drawLenormand(user, '127.0.0.1', 'Tôi nên tập trung điều gì?', 'three', 'seed-1');
      throw new Error('expected quota rejection to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED');
    }
  });

  it('rơi về template khi provider không khả dụng', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new ProviderUnavailableError('no provider'));
    const result = await service.drawLenormand(user, '127.0.0.1', 'Tôi nên tập trung điều gì?', 'three', 'seed-1');
    // Fallback narrative dùng spreadName từ dataset (tiếng Việt đã dịch), không phải label SPREAD_LABELS.
    expect(result.narrative).toContain(result.spreadName);
    expect(lenormandDrawSchema.safeParse(result).success).toBe(true);
  });

  it('rơi về template khi provider timeout', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new ProviderTimeoutError('slow'));
    const result = await service.drawLenormand(user, '127.0.0.1', 'Một câu hỏi', 'three', 'seed-7');
    expect(result.narrative).toContain(result.spreadName);
  });

  it('ném tiếp lỗi không phải provider', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new Error('unexpected boom'));
    await expect(
      service.drawLenormand(user, '127.0.0.1', 'Một câu hỏi', 'three', 'seed-8'),
    ).rejects.toThrow('unexpected boom');
  });

  it('trim câu hỏi + chặn câu hỏi chỉ khoảng trắng', async () => {
    const trimmed = await service.drawLenormand(user, '127.0.0.1', '  Tôi nên làm gì?  ', 'three', 'seed-4');
    expect(trimmed.question).toBe('Tôi nên làm gì?');
    try {
      await service.drawLenormand(user, '127.0.0.1', '   ', 'three', 'seed-5');
      throw new Error('expected blank question to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.BAD_REQUEST, 'INVALID_INPUT');
    }
  });
});
