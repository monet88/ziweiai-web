import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { throwQuotaRateLimited } from '../../modules/quotas/quota-http';
import { apiEnv } from '../../config/env';
import { reportOpsAlert } from '../../observability/ops-alert';
import { ExplanationProviderRouter } from './explanation-provider-router';
import { ProviderTimeoutError, ProviderUnavailableError } from './provider-errors';
import { QuotasService } from '../../modules/quotas/quotas.service';
import { WalletEngineService } from '../../modules/wallet/wallet-engine.service';

export interface AiFeatureExecutionOptions {
  userId: string;
  ipAddress: string;
  isAnonymous: boolean;
  quotaFeatureKey: string;
  quotaErrorMessage: string;
  explanationKind: string;
  cost: number;
  paymentErrorMessage: string;
  paymentInsufficientFundsMessage: string;
  promptOverride: string;
  generateFallback: () => string;
  tier?: 'light' | 'deep';
}

@Injectable()
export class AiFeatureExecutionOrchestrator {
  private readonly logger = new Logger(AiFeatureExecutionOrchestrator.name);

  constructor(
    private readonly quotasService: QuotasService,
    private readonly providerRouter: ExplanationProviderRouter,
    private readonly walletEngine: WalletEngineService,
  ) {}

  async executeFeature(options: AiFeatureExecutionOptions): Promise<string> {
    await this.assertPremiumEntitlement(
      options.userId,
      options.cost,
      options.paymentErrorMessage,
      options.paymentInsufficientFundsMessage,
      options.quotaFeatureKey,
    );
    await this.assertCanExecute(
      options.quotaFeatureKey,
      options.userId,
      options.ipAddress,
      options.isAnonymous,
      options.quotaErrorMessage,
    );

    try {
      const providerResult = await this.providerRouter.generate('auto', {
        explanationKind: options.explanationKind as any,
        promptOverride: options.promptOverride,
        tier: options.tier ?? 'light',
      });

      if (!providerResult || typeof providerResult.renderedMarkdown !== 'string') {
        throw new ProviderUnavailableError('LLM provider returned an empty or invalid narrative response.');
      }
      this.logger.log(
        `[ai-orchestrator] outcome=generated provider=${providerResult.providerMetadata.provider ?? 'unknown'} feature=${options.quotaFeatureKey}`,
      );
      return providerResult.renderedMarkdown;
    } catch (error) {
      if (error instanceof ProviderTimeoutError || error instanceof ProviderUnavailableError) {
        this.logger.warn(
          `[ai-orchestrator] outcome=fallback feature=${options.quotaFeatureKey} reason=${error.constructor.name} message=${error.message}`,
        );

        void reportOpsAlert({
          level: 'warning',
          code: 'AI_PROVIDER_CHAIN_EXHAUSTED',
          message: `Toàn bộ AI Provider chain thất bại cho tính năng [${options.quotaFeatureKey}]. Hệ thống kích hoạt bản luận giải dự phòng (Static Fallback).`,
          status: error instanceof ProviderTimeoutError ? 504 : 502,
          tags: {
            quota_feature: options.quotaFeatureKey,
            user_id: options.userId || 'anonymous',
            reason: error.message.slice(0, 150),
          },
          cause: error,
        });

        return options.generateFallback();
      }

      void reportOpsAlert({
        level: 'error',
        code: 'CRITICAL_500_AI_EXECUTION',
        message: `Lỗi nghiêm trọng không xác định khi thực thi AI cho tính năng [${options.quotaFeatureKey}]: ${error instanceof Error ? error.message : String(error)}`,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        tags: {
          quota_feature: options.quotaFeatureKey,
          user_id: options.userId || 'anonymous',
          error_type: error instanceof Error ? error.name : 'UnknownError',
        },
        cause: error,
      });

      throw error;
    }
  }

  private async assertPremiumEntitlement(
    userId: string,
    cost: number,
    paymentErrorMessage: string,
    paymentInsufficientFundsMessage: string,
    featureKey?: string,
  ): Promise<void> {
    if (apiEnv.AI_EXPLANATION_FREE_FOR_ALL) {
      return;
    }

    if (!userId) {
      throw new ApiErrorHttpException(HttpStatus.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED', paymentErrorMessage);
    }

    try {
      const success = await this.walletEngine.deductXU(userId, cost, 'ai_usage');
      if (!success) {
        throw new ApiErrorHttpException(
          HttpStatus.PAYMENT_REQUIRED,
          'INSUFFICIENT_FUNDS',
          paymentInsufficientFundsMessage,
        );
      }
    } catch (error) {
      if (error instanceof ApiErrorHttpException) {
        throw error;
      }

      void reportOpsAlert({
        level: 'error',
        code: 'CRITICAL_500_WALLET_DEDUCTION',
        message: `Lỗi nghiêm trọng khi trừ XU ví người dùng [${userId}] (Số XU: ${cost}, Feature: ${featureKey ?? 'unknown'}): ${error instanceof Error ? error.message : String(error)}`,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        tags: {
          user_id: userId,
          cost: String(cost),
          feature: featureKey ?? 'unknown',
        },
        cause: error,
      });

      throw error;
    }
  }

  private async assertCanExecute(
    featureKey: string,
    userId: string,
    ipAddress: string,
    isAnonymous: boolean,
    errorMessage: string,
  ): Promise<void> {
    try {
      await this.quotasService.assertCanExecute(featureKey as any, userId, ipAddress, isAnonymous);
    } catch (error) {
      throwQuotaRateLimited(error, errorMessage);
    }
  }
}
