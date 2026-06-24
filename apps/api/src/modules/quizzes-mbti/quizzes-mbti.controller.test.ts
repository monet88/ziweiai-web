import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser, MbtiResult } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import type { QuizzesMbtiService } from './quizzes-mbti.service';
import { QuizzesMbtiController } from './quizzes-mbti.controller';

function expectApiError(error: unknown, status: HttpStatus, code: string, requestId: string | null): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string; requestId: string | null };

  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
  expect(response.requestId).toBe(requestId);
}

const VALID_ANSWERS = [
  { questionId: 'q1', choice: 1 },
  { questionId: 'q2', choice: 4 },
  { questionId: 'q3', choice: 7 },
  { questionId: 'q4', choice: 5 },
];

describe('QuizzesMbtiController', () => {
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  const request = { ip: '127.0.0.1', requestId: 'req-1' } as AuthenticatedRequest;

  it('từ chối body sai với INVALID_INPUT (kèm requestId)', async () => {
    const service = { submitQuiz: vi.fn() } as Pick<QuizzesMbtiService, 'submitQuiz'>;
    const controller = new QuizzesMbtiController(service as QuizzesMbtiService);

    try {
      await controller.submit(user, request, { answers: [{ questionId: 'q1', choice: 9 }] });
      throw new Error('expected controller to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.BAD_REQUEST, 'INVALID_INPUT', 'req-1');
    }

    expect(service.submitQuiz).not.toHaveBeenCalled();
  });

  it('truyền answers, user và ip xuống service', async () => {
    const response = {
      type: 'ENTP',
      axes: [
        { key: 'EI', score: 60, label: 'Hướng ngoại (E)' },
        { key: 'SN', score: 55, label: 'Trực giác (N)' },
        { key: 'TF', score: 52, label: 'Lý trí (T)' },
        { key: 'JP', score: 58, label: 'Linh hoạt (P)' },
      ],
      narrative: 'Luận giải mẫu.',
    } satisfies MbtiResult;
    const service = { submitQuiz: vi.fn().mockResolvedValue(response) } as Pick<QuizzesMbtiService, 'submitQuiz'>;
    const controller = new QuizzesMbtiController(service as QuizzesMbtiService);

    await expect(controller.submit(user, request, { answers: VALID_ANSWERS })).resolves.toEqual(response);

    expect(service.submitQuiz).toHaveBeenCalledWith(user, '127.0.0.1', VALID_ANSWERS);
  });

  it('dùng ip fallback "unknown" khi request.ip vắng', async () => {
    const response = {
      type: 'ISFJ',
      axes: [
        { key: 'EI', score: 70, label: 'Hướng nội (I)' },
        { key: 'SN', score: 65, label: 'Giác quan (S)' },
        { key: 'TF', score: 60, label: 'Cảm xúc (F)' },
        { key: 'JP', score: 62, label: 'Nguyên tắc (J)' },
      ],
      narrative: 'Luận giải mẫu.',
    } satisfies MbtiResult;
    const service = { submitQuiz: vi.fn().mockResolvedValue(response) } as Pick<QuizzesMbtiService, 'submitQuiz'>;
    const controller = new QuizzesMbtiController(service as QuizzesMbtiService);

    await controller.submit(user, { requestId: 'req-2' } as AuthenticatedRequest, { answers: VALID_ANSWERS });

    expect(service.submitQuiz).toHaveBeenCalledWith(user, 'unknown', VALID_ANSWERS);
  });
});
