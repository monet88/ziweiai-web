import { HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MBTI_QUESTIONS, type AuthenticatedUser, type MbtiAnswer } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import type { QuotasService } from '../quotas/quotas.service';
import { QuizzesMbtiService } from './quizzes-mbti.service';

function expectApiError(error: unknown, status: HttpStatus, code: string): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string };

  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
}

const NEUTRAL_ANSWERS: MbtiAnswer[] = MBTI_QUESTIONS.map((q) => ({ questionId: q.id, choice: 4 }));

describe('QuizzesMbtiService', () => {
  const originalMbtiEnabled = apiEnv.EXTENDED_SYSTEM_MBTI_ENABLED;
  const originalFreeForAll = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  let quotasService: Pick<QuotasService, 'assertCanCreateMbtiQuiz'>;
  let service: QuizzesMbtiService;

  beforeEach(() => {
    apiEnv.EXTENDED_SYSTEM_MBTI_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    quotasService = { assertCanCreateMbtiQuiz: vi.fn().mockResolvedValue(undefined) };
    service = new QuizzesMbtiService(quotasService as QuotasService);
  });

  afterEach(() => {
    apiEnv.EXTENDED_SYSTEM_MBTI_ENABLED = originalMbtiEnabled;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = originalFreeForAll;
    vi.restoreAllMocks();
  });

  it('chặn FEATURE_DISABLED khi cờ MBTI tắt', async () => {
    apiEnv.EXTENDED_SYSTEM_MBTI_ENABLED = false;

    try {
      await service.submitQuiz(user, '127.0.0.1', NEUTRAL_ANSWERS);
      throw new Error('expected MBTI flag gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.FORBIDDEN, 'FEATURE_DISABLED');
    }

    expect(quotasService.assertCanCreateMbtiQuiz).not.toHaveBeenCalled();
  });

  it('chặn PAYMENT_REQUIRED khi đã bật MBTI nhưng AI gate không free-for-all', async () => {
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = false;

    try {
      await service.submitQuiz(user, '127.0.0.1', NEUTRAL_ANSWERS);
      throw new Error('expected premium gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED');
    }

    expect(quotasService.assertCanCreateMbtiQuiz).not.toHaveBeenCalled();
  });

  it('bọc lỗi quota raw thành 429 RATE_LIMITED', async () => {
    quotasService.assertCanCreateMbtiQuiz = vi.fn().mockRejectedValue(new Error('Daily explanation quota exceeded.'));
    service = new QuizzesMbtiService(quotasService as QuotasService);

    try {
      await service.submitQuiz(user, '127.0.0.1', NEUTRAL_ANSWERS);
      throw new Error('expected quota gate to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED');
    }
  });

  it('trả kết quả hợp lệ + gọi quota khi MBTI bật + free-for-all', async () => {
    const result = await service.submitQuiz(user, '127.0.0.1', NEUTRAL_ANSWERS);

    expect(result.type).toMatch(/^[EI][SN][TF][JP]$/);
    expect(result.axes).toHaveLength(4);
    expect(result.narrative.length).toBeGreaterThan(0);
    expect(quotasService.assertCanCreateMbtiQuiz).toHaveBeenCalledWith(user.userId, '127.0.0.1', false);
  });

  it('coi email rỗng là phiên ẩn danh (truyền isAnonymous=true cho quota)', async () => {
    const anon: AuthenticatedUser = { userId: '22222222-2222-2222-2222-222222222222', email: '' };

    await service.submitQuiz(anon, '127.0.0.1', NEUTRAL_ANSWERS);

    expect(quotasService.assertCanCreateMbtiQuiz).toHaveBeenCalledWith(anon.userId, '127.0.0.1', true);
  });
});
