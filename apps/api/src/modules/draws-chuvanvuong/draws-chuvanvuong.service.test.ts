import { HttpStatus } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chuVanVuongDrawSchema, type AuthenticatedUser } from '@ziweiai/contracts';
import type { WalletEngineService } from '../wallet/wallet-engine.service';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import type { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import { ProviderUnavailableError } from '../../providers/ai/provider-errors';
import type { QuotasService } from '../quotas/quotas.service';
import { DrawsChuVanVuongService } from './draws-chuvanvuong.service';
import { AiFeatureExecutionOrchestrator } from '../../providers/ai/ai-feature-execution.orchestrator';

function expectApiError(error: unknown, status: HttpStatus, code: string): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string };

  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
}

describe('DrawsChuVanVuongService', () => {
  const user: AuthenticatedUser = {
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'user@example.com',
  };
  let quotasService: Pick<QuotasService, 'assertCanExecute'>;
  let providerRouter: Pick<ExplanationProviderRouter, 'generate'>;
  let walletEngine: Pick<WalletEngineService, 'deductXU'>;
  let service: DrawsChuVanVuongService;

  beforeEach(() => {
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    walletEngine = { deductXU: vi.fn().mockResolvedValue(true) };
    quotasService = {
      assertCanExecute: vi.fn().mockResolvedValue(undefined),
    };
    providerRouter = {
      generate: vi.fn().mockResolvedValue({
        renderedMarkdown: 'Luận giải AI quẻ Chu Văn Vương chi tiết cho người hỏi.',
        providerMetadata: { model: 'mock-model' },
      }),
    };
    const orchestrator = new AiFeatureExecutionOrchestrator(
      quotasService as QuotasService,
      providerRouter as ExplanationProviderRouter,
      walletEngine as WalletEngineService,
    );
    service = new DrawsChuVanVuongService(orchestrator);
  });

  it('từ chối câu hỏi rỗng với INVALID_INPUT', async () => {
    await expect(
      service.drawChuVanVuong(user, '127.0.0.1', { question: '   ', method: 'coins' }),
    ).rejects.toSatisfy((error) => {
      expectApiError(error, HttpStatus.BAD_REQUEST, 'INVALID_INPUT');
      return true;
    });
  });

  it('gieo quẻ thành công và trả về dữ liệu chuẩn schema', async () => {
    const result = await service.drawChuVanVuong(user, '127.0.0.1', {
      question: 'Dự án mới có thuận lợi không?',
      method: 'coins',
      coins: [3, 3, 3, 3, 3, 3],
    });

    expect(result.question).toBe('Dự án mới có thuận lợi không?');
    expect(result.hexagram).toBeDefined();
    expect(result.hexagram.id).toBeGreaterThanOrEqual(1);
    expect(result.hexagram.id).toBeLessThanOrEqual(64);
    expect(result.narrative).toContain('Luận giải AI');
    expect(chuVanVuongDrawSchema.safeParse(result).success).toBe(true);
  });

  it('gieo quẻ theo 2 con số thành công', async () => {
    const result = await service.drawChuVanVuong(user, '127.0.0.1', {
      question: 'Cầu tài tháng này',
      method: 'numbers',
      numbers: [1, 1],
    });

    expect(result.hexagram.id).toBe(1);
    expect(result.hexagram.name).toBe('Thuần Càn');
    expect(result.hexagram.omen).toBe('dai_cat');
    expect(chuVanVuongDrawSchema.safeParse(result).success).toBe(true);
  });

  it('fallback sang diễn giải tất định khi AI provider thất bại', async () => {
    providerRouter.generate = vi
      .fn()
      .mockRejectedValue(new ProviderUnavailableError('AI provider error'));
    const result = await service.drawChuVanVuong(user, '127.0.0.1', {
      question: 'Vận hạn sắp tới ra sao?',
      method: 'manual',
      hexagramId: 11,
    });

    expect(result.hexagram.id).toBe(11);
    expect(result.hexagram.name).toBe('Địa Thiên Thái');
    expect(result.narrative).toContain('Quẻ Số 11: Địa Thiên Thái');
    expect(chuVanVuongDrawSchema.safeParse(result).success).toBe(true);
  });
});
