import { HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { xiaoLiuRenDrawSchema, type AuthenticatedUser } from '@ziweiai/contracts';
import type { WalletEngineService } from '../wallet/wallet-engine.service';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { apiEnv } from '../../config/env';
import type { ExplanationProviderRouter } from '../../providers/ai/explanation-provider-router';
import type { QuotasService } from '../quotas/quotas.service';
import { DrawsXiaoLiuRenService } from './draws-xiaoliuren.service';
import { AiFeatureExecutionOrchestrator } from '../../providers/ai/ai-feature-execution.orchestrator';

function expectApiError(error: unknown, status: HttpStatus, code: string): void {
  expect(error).toBeInstanceOf(ApiErrorHttpException);
  const apiError = error as ApiErrorHttpException;
  const response = apiError.getResponse() as { code: string };

  expect(apiError.getStatus()).toBe(status);
  expect(response.code).toBe(code);
}

describe('DrawsXiaoLiuRenService', () => {
  const originalEnabled = apiEnv.EXTENDED_SYSTEM_XIAOLIUREN_ENABLED;
  const originalFreeForAll = apiEnv.AI_EXPLANATION_FREE_FOR_ALL;
  const user: AuthenticatedUser = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };
  let quotasService: Pick<QuotasService, 'assertCanExecute'>;
  let providerRouter: Pick<ExplanationProviderRouter, 'generate'>;
  let walletEngine: Pick<WalletEngineService, 'deductXU'>;
  let service: DrawsXiaoLiuRenService;

  beforeEach(() => {
    apiEnv.EXTENDED_SYSTEM_XIAOLIUREN_ENABLED = true;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = true;
    walletEngine = { deductXU: vi.fn().mockResolvedValue(true) };
    quotasService = {
      assertCanExecute: vi.fn().mockResolvedValue(undefined),
    };
    providerRouter = {
      generate: vi.fn().mockResolvedValue({
        renderedMarkdown: 'Luận giải Tiểu Lục Nhâm từ LLM.\n\n## Tóm lại\nHành động ngay.',
        providerMetadata: { provider: 'mock' },
      }),
    };
    const orchestrator = new AiFeatureExecutionOrchestrator(
      quotasService as QuotasService,
      providerRouter as ExplanationProviderRouter,
      walletEngine as WalletEngineService
    );
    service = new DrawsXiaoLiuRenService(orchestrator);
  });

  afterEach(() => {
    apiEnv.EXTENDED_SYSTEM_XIAOLIUREN_ENABLED = originalEnabled;
    apiEnv.AI_EXPLANATION_FREE_FOR_ALL = originalFreeForAll;
    vi.restoreAllMocks();
  });

  it('từ chối khi tính năng bị tắt bằng cờ FEATURE_DISABLED', async () => {
    apiEnv.EXTENDED_SYSTEM_XIAOLIUREN_ENABLED = false;

    try {
      await service.drawXiaoLiuRen(user, '127.0.0.1', { question: 'Có nên đi xa?', method: 'time' });
      throw new Error('expected service to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.FORBIDDEN, 'FEATURE_DISABLED');
    }
  });

  it('từ chối câu hỏi rỗng với INVALID_INPUT', async () => {
    try {
      await service.drawXiaoLiuRen(user, '127.0.0.1', { question: '   ', method: 'time' });
      throw new Error('expected service to throw');
    } catch (error) {
      expectApiError(error, HttpStatus.BAD_REQUEST, 'INVALID_INPUT');
    }
  });

  it('gieo quẻ theo thời gian thành công và trả đúng schema', async () => {
    const result = await service.drawXiaoLiuRen(user, '127.0.0.1', {
      question: 'Dự án này có thuận lợi không?',
      method: 'time',
    });

    const parsed = xiaoLiuRenDrawSchema.parse(result);
    expect(parsed.question).toBe('Dự án này có thuận lợi không?');
    expect(parsed.method).toBe('time');
    expect(parsed.targetPalace).toBeDefined();
    expect(parsed.targetPalace.name).toBeDefined();
    expect(parsed.narrative).toContain('Luận giải Tiểu Lục Nhâm từ LLM');
  });

  it('gieo quẻ theo số thành công', async () => {
    const result = await service.drawXiaoLiuRen(user, '127.0.0.1', {
      question: 'Hỏi về cầu tài',
      method: 'numbers',
      numbers: [1, 1, 1],
    });

    expect(result.targetPalace.key).toBe('dai_an');
    expect(result.targetPalace.name).toBe('Đại An');
    expect(result.numbers).toEqual([1, 1, 1]);
  });
});
