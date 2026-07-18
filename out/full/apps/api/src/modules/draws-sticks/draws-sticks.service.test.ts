import { HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stickDrawSchema, type AuthenticatedUser } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import type { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../providers/ai/provider-errors';
import type { QuotasService } from '../quotas/quotas.service';
import { DrawsSticksService } from './draws-sticks.service';

function expectApiError(error: unknown, status: HttpStatus, code: string): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string };

  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
}

describe('DrawsSticksService', () => {
  const originalStickEnabled = apiEnv.EXTENDED_SYSTEM_STICKS_ENABLED;
  const originalFreeForAll = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  let quotasService: Pick<QuotasService, 'assertCanCreateStickDraw'>;
  let providerRouter: Pick<ExplanationProviderRouter, 'generate'>;
  let service: DrawsSticksService;

  beforeEach(() => {
    apiEnv.EXTENDED_SYSTEM_STICKS_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    quotasService = {
      assertCanCreateStickDraw: vi.fn().mockResolvedValue(undefined),
    };
    providerRouter = {
      generate: vi.fn().mockResolvedValue({
        renderedMarkdown: 'Luận giải xăm từ LLM.\n\n## Tóm lại\nGiữ chủ động.',
        providerMetadata: { provider: 'mock' },
      }),
    };
    service = new DrawsSticksService(
      quotasService as QuotasService,
      providerRouter as ExplanationProviderRouter,
    );
  });

  afterEach(() => {
    apiEnv.EXTENDED_SYSTEM_STICKS_ENABLED = originalStickEnabled;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = originalFreeForAll;
    vi.restoreAllMocks();
  });

  it('chặn FEATURE_DISABLED khi flag Xin xăm tắt', async () => {
    apiEnv.EXTENDED_SYSTEM_STICKS_ENABLED = false;

    try {
      await service.drawStick(user, '127.0.0.1', 'Công việc sắp tới thế nào?', 'seed-1');
      throw new Error('expected stick flag gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.FORBIDDEN, 'FEATURE_DISABLED');
    }

    expect(quotasService.assertCanCreateStickDraw).not.toHaveBeenCalled();
  });

  it('chặn PAYMENT_REQUIRED khi đã bật nhưng AI gate không free-for-all', async () => {
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = false;

    try {
      await service.drawStick(user, '127.0.0.1', 'Công việc sắp tới thế nào?', 'seed-1');
      throw new Error('expected premium gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED');
    }
  });

  it('trả payload hợp lệ + rút deterministic theo seed', async () => {
    const result = await service.drawStick(user, '127.0.0.1', 'Công việc sắp tới thế nào?', 'seed-1');

    expect(stickDrawSchema.safeParse(result).success).toBe(true);
    expect(result.narrative).toContain('Luận giải xăm từ LLM.');
    expect(providerRouter.generate).toHaveBeenCalledTimes(1);
    expect(quotasService.assertCanCreateStickDraw).toHaveBeenCalledWith(user.userId, '127.0.0.1', false);

    const again = await service.drawStick(user, '127.0.0.1', 'Công việc sắp tới thế nào?', 'seed-1');
    expect(again.stick.id).toBe(result.stick.id);
  });

  it('dùng quota anon khi user không có email', async () => {
    const anonymousUser: AuthenticatedUser = { userId: '22222222-2222-2222-2222-222222222222', email: null };

    await service.drawStick(anonymousUser, '10.0.0.1', 'Một câu hỏi ngắn', 'seed-2');

    expect(quotasService.assertCanCreateStickDraw).toHaveBeenCalledWith(anonymousUser.userId, '10.0.0.1', true);
  });

  it('coi email="" là anon → dùng quota anon', async () => {
    const emptyEmailUser: AuthenticatedUser = { userId: '33333333-3333-3333-3333-333333333333', email: '' };

    await service.drawStick(emptyEmailUser, '10.0.0.9', 'Một câu hỏi', 'seed-9');

    expect(quotasService.assertCanCreateStickDraw).toHaveBeenCalledWith(emptyEmailUser.userId, '10.0.0.9', true);
  });

  it('map lỗi quota (raw Error) thành 429 RATE_LIMITED', async () => {
    quotasService.assertCanCreateStickDraw = vi
      .fn()
      .mockRejectedValue(new Error('Daily explanation quota exceeded.'));

    try {
      await service.drawStick(user, '127.0.0.1', 'Công việc sắp tới thế nào?', 'seed-1');
      throw new Error('expected quota rejection to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED');
    }
  });

  it('rơi về template khi provider không khả dụng', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new ProviderUnavailableError('no provider'));

    const result = await service.drawStick(user, '127.0.0.1', 'Công việc sắp tới thế nào?', 'seed-1');

    expect(result.narrative).toContain('quẻ số');
    expect(stickDrawSchema.safeParse(result).success).toBe(true);
  });

  it('rơi về template khi provider timeout', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new ProviderTimeoutError('slow'));

    const result = await service.drawStick(user, '127.0.0.1', 'Một câu hỏi', 'seed-7');

    expect(result.narrative).toContain('quẻ số');
  });

  it('ném tiếp lỗi không phải provider', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new Error('unexpected boom'));

    await expect(
      service.drawStick(user, '127.0.0.1', 'Một câu hỏi', 'seed-8'),
    ).rejects.toThrow('unexpected boom');
  });

  it('trim câu hỏi và chặn câu hỏi chỉ chứa khoảng trắng', async () => {
    const trimmed = await service.drawStick(user, '127.0.0.1', '  Tôi nên làm gì?  ', 'seed-4');
    expect(trimmed.question).toBe('Tôi nên làm gì?');

    try {
      await service.drawStick(user, '127.0.0.1', '   ', 'seed-5');
      throw new Error('expected blank question to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.BAD_REQUEST, 'INVALID_INPUT');
    }
  });
});
