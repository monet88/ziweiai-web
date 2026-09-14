import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import * as opsAlert from '../../observability/ops-alert';
import { ProviderTimeoutError } from './provider-errors';
import { AiFeatureExecutionOrchestrator } from './ai-feature-execution.orchestrator';

describe('AiFeatureExecutionOrchestrator', () => {
  let quotasService: { assertCanExecute: ReturnType<typeof vi.fn> };
  let providerRouter: { generate: ReturnType<typeof vi.fn> };
  let walletEngine: { deductXU: ReturnType<typeof vi.fn> };
  let orchestrator: AiFeatureExecutionOrchestrator;
  let reportOpsAlertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    opsAlert.resetOpsAlertThrottleForTests();
    (apiEnv as any).AI_EXPLANATION_FREE_FOR_ALL = false;
    reportOpsAlertSpy = vi.spyOn(opsAlert, 'reportOpsAlert').mockResolvedValue(undefined);

    quotasService = {
      assertCanExecute: vi.fn().mockResolvedValue(undefined),
    };

    providerRouter = {
      generate: vi.fn().mockResolvedValue({
        renderedMarkdown: 'Bản luận giải Tarot huyền bí và sâu sắc.',
        providerMetadata: { provider: 'gemini' },
      }),
    };

    walletEngine = {
      deductXU: vi.fn().mockResolvedValue(true),
    };

    orchestrator = new AiFeatureExecutionOrchestrator(
      quotasService as any,
      providerRouter as any,
      walletEngine as any,
    );
  });

  const baseOptions = {
    userId: 'user_123',
    ipAddress: '127.0.0.1',
    isAnonymous: false,
    quotaFeatureKey: 'tarot',
    quotaErrorMessage: 'Đã vượt quá giới hạn bói Tarot hôm nay.',
    explanationKind: 'tarot',
    cost: 5,
    paymentErrorMessage: 'Cần đăng nhập để trải bài.',
    paymentInsufficientFundsMessage: 'Bạn không đủ XU để trải bài.',
    promptOverride: 'Prompt tarot',
    generateFallback: () => 'Bản luận giải fallback tĩnh cho Tarot.',
  };

  it('executes successfully and returns renderedMarkdown', async () => {
    const result = await orchestrator.executeFeature(baseOptions);

    expect(result).toBe('Bản luận giải Tarot huyền bí và sâu sắc.');
    expect(walletEngine.deductXU).toHaveBeenCalledWith('user_123', 5, 'ai_usage');
    expect(quotasService.assertCanExecute).toHaveBeenCalledWith('tarot', 'user_123', '127.0.0.1', false);
    expect(providerRouter.generate).toHaveBeenCalledWith('auto', {
      explanationKind: 'tarot',
      promptOverride: 'Prompt tarot',
      tier: 'light',
    });
    expect(reportOpsAlertSpy).not.toHaveBeenCalled();
  });

  it('supports explicit tier deep override', async () => {
    await orchestrator.executeFeature({
      ...baseOptions,
      tier: 'deep',
    });

    expect(providerRouter.generate).toHaveBeenCalledWith('auto', {
      explanationKind: 'tarot',
      promptOverride: 'Prompt tarot',
      tier: 'deep',
    });
  });

  it('throws INSUFFICIENT_FUNDS if walletEngine returns false', async () => {
    walletEngine.deductXU.mockResolvedValue(false);

    await expect(orchestrator.executeFeature(baseOptions)).rejects.toThrowError(
      'Bạn không đủ XU để trải bài.',
    );
  });

  it('reports CRITICAL_500_WALLET_DEDUCTION ops alert when wallet deduction encounters unexpected failure', async () => {
    walletEngine.deductXU.mockRejectedValue(new Error('Database connection pool timeout'));

    await expect(orchestrator.executeFeature(baseOptions)).rejects.toThrowError(
      'Database connection pool timeout',
    );

    expect(reportOpsAlertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        code: 'CRITICAL_500_WALLET_DEDUCTION',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        tags: expect.objectContaining({
          user_id: 'user_123',
          cost: '5',
          feature: 'tarot',
        }),
      }),
    );
  });

  it('activates static fallback and reports AI_PROVIDER_CHAIN_EXHAUSTED alert when all AI providers fail', async () => {
    providerRouter.generate.mockRejectedValue(
      new ProviderTimeoutError('Gemini and fallback providers all timed out'),
    );

    const result = await orchestrator.executeFeature(baseOptions);

    expect(result).toBe('Bản luận giải fallback tĩnh cho Tarot.');
    expect(reportOpsAlertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'warning',
        code: 'AI_PROVIDER_CHAIN_EXHAUSTED',
        status: 504,
        tags: expect.objectContaining({
          quota_feature: 'tarot',
          user_id: 'user_123',
        }),
      }),
    );
  });

  it('reports CRITICAL_500_AI_EXECUTION ops alert on unexpected unhandled runtime exception', async () => {
    providerRouter.generate.mockRejectedValue(new TypeError('Cannot read properties of undefined'));

    await expect(orchestrator.executeFeature(baseOptions)).rejects.toThrowError(
      'Cannot read properties of undefined',
    );

    expect(reportOpsAlertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        code: 'CRITICAL_500_AI_EXECUTION',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        tags: expect.objectContaining({
          quota_feature: 'tarot',
          user_id: 'user_123',
          error_type: 'TypeError',
        }),
      }),
    );
  });
});
