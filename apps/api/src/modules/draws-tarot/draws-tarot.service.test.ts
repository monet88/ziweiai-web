import { HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tarotDrawSchema, type AuthenticatedUser } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import type { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from '../../providers/ai/provider-errors';
import type { QuotasService } from '../quotas/quotas.service';
import { DrawsTarotService } from './draws-tarot.service';

function expectApiError(error: unknown, status: HttpStatus, code: string): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string };

  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
}

describe('DrawsTarotService', () => {
  const originalTarotEnabled = apiEnv.EXTENDED_SYSTEM_TAROT_ENABLED;
  const originalFreeForAll = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  let quotasService: Pick<QuotasService, 'assertCanCreateTarotDraw'>;
  let providerRouter: Pick<ExplanationProviderRouter, 'generate'>;
  let service: DrawsTarotService;

  beforeEach(() => {
    apiEnv.EXTENDED_SYSTEM_TAROT_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    quotasService = {
      assertCanCreateTarotDraw: vi.fn().mockResolvedValue(undefined),
    };
    providerRouter = {
      generate: vi.fn().mockResolvedValue({
        renderedMarkdown: 'Diễn giải Tarot từ LLM.\n\n## Tóm lại\nGiữ chủ động.',
        providerMetadata: { provider: 'mock' },
      }),
    };
    service = new DrawsTarotService(
      quotasService as QuotasService,
      providerRouter as ExplanationProviderRouter,
    );
  });

  afterEach(() => {
    apiEnv.EXTENDED_SYSTEM_TAROT_ENABLED = originalTarotEnabled;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = originalFreeForAll;
    vi.restoreAllMocks();
  });

  it('chặn FEATURE_DISABLED khi flag Tarot tắt', async () => {
    apiEnv.EXTENDED_SYSTEM_TAROT_ENABLED = false;

    try {
      await service.drawTarot(user, '127.0.0.1', 'Tôi nên tập trung điều gì?', 'three-card', 'seed-1');
      throw new Error('expected tarot flag gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.FORBIDDEN, 'FEATURE_DISABLED');
    }

    expect(quotasService.assertCanCreateTarotDraw).not.toHaveBeenCalled();
  });

  it('chặn PAYMENT_REQUIRED khi đã bật Tarot nhưng AI gate không free-for-all', async () => {
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = false;

    try {
      await service.drawTarot(user, '127.0.0.1', 'Tôi nên tập trung điều gì?', 'three-card', 'seed-1');
      throw new Error('expected premium gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED');
    }
  });

  it('trả payload hợp lệ và gọi quota explanation khi Tarot bật + free-for-all', async () => {
    const result = await service.drawTarot(user, '127.0.0.1', 'Tôi nên tập trung điều gì?', 'three-card', 'seed-1');

    expect(tarotDrawSchema.safeParse(result).success).toBe(true);
    expect(result.cards).toHaveLength(3);
    expect(result.cards.map((card) => card.position)).toEqual([0, 1, 2]);
    expect(result.narrative).toContain('Diễn giải Tarot từ LLM.');
    expect(providerRouter.generate).toHaveBeenCalledTimes(1);
    expect(quotasService.assertCanCreateTarotDraw).toHaveBeenCalledWith(user.userId, '127.0.0.1', false);
  });

  it('dùng quota anon khi user không có email', async () => {
    const anonymousUser: AuthenticatedUser = { userId: '22222222-2222-2222-2222-222222222222', email: null };

    await service.drawTarot(anonymousUser, '10.0.0.1', 'Một câu hỏi ngắn', 'three-card', 'seed-2');

    expect(quotasService.assertCanCreateTarotDraw).toHaveBeenCalledWith(anonymousUser.userId, '10.0.0.1', true);
  });

  it('coi email="" là anon (anon JWT có email rỗng) → dùng quota anon', async () => {
    const emptyEmailUser: AuthenticatedUser = { userId: '33333333-3333-3333-3333-333333333333', email: '' };

    await service.drawTarot(emptyEmailUser, '10.0.0.9', 'Một câu hỏi', 'three-card', 'seed-9');

    expect(quotasService.assertCanCreateTarotDraw).toHaveBeenCalledWith(emptyEmailUser.userId, '10.0.0.9', true);
  });

  it('map lỗi quota (raw Error) thành 429 RATE_LIMITED', async () => {
    quotasService.assertCanCreateTarotDraw = vi
      .fn()
      .mockRejectedValue(new Error('Daily explanation quota exceeded.'));

    try {
      await service.drawTarot(user, '127.0.0.1', 'Tôi nên tập trung điều gì?', 'three-card', 'seed-1');
      throw new Error('expected quota rejection to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED');
    }
  });

  it('Celtic Cross trả 10 lá', async () => {
    const result = await service.drawTarot(user, '127.0.0.1', 'Tôi nên nhìn rộng hơn ra sao?', 'celtic-cross', 'seed-3');

    expect(result.cards).toHaveLength(10);
    const payload = (providerRouter.generate as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as { promptOverride?: string };
    expect(payload.promptOverride).toContain('Celtic Cross');
  });

  it('rơi về diễn giải template khi provider AI không khả dụng', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new ProviderUnavailableError('no provider'));

    const result = await service.drawTarot(user, '127.0.0.1', 'Tôi nên tập trung điều gì?', 'three-card', 'seed-1');

    expect(result.narrative).toContain('trải bài ba lá');
    expect(tarotDrawSchema.safeParse(result).success).toBe(true);
  });

  it('rơi về diễn giải template khi provider AI timeout', async () => {
    providerRouter.generate = vi.fn().mockRejectedValue(new ProviderTimeoutError('slow'));

    const result = await service.drawTarot(user, '127.0.0.1', 'Một câu hỏi', 'three-card', 'seed-7');

    expect(result.narrative).toContain('trải bài ba lá');
  });

  it('ném tiếp lỗi không phải provider (không nuốt thành fallback)', async () => {
    // Chỉ ProviderUnavailableError/ProviderTimeoutError mới rơi về template. Lỗi bất ngờ khác phải
    // propagate để không che giấu sự cố thật (vd bug lập trình) dưới một bài đọc template.
    providerRouter.generate = vi.fn().mockRejectedValue(new Error('unexpected boom'));

    await expect(
      service.drawTarot(user, '127.0.0.1', 'Một câu hỏi', 'three-card', 'seed-8'),
    ).rejects.toThrow('unexpected boom');
  });

  it('trim câu hỏi và chặn câu hỏi chỉ chứa khoảng trắng ở service path', async () => {
    const trimmed = await service.drawTarot(user, '127.0.0.1', '  Tôi nên làm gì?  ', 'three-card', 'seed-4');
    expect(trimmed.question).toBe('Tôi nên làm gì?');

    try {
      await service.drawTarot(user, '127.0.0.1', '   ', 'three-card', 'seed-5');
      throw new Error('expected blank question to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.BAD_REQUEST, 'INVALID_INPUT');
    }
  });
});
