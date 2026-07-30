import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { throwQuotaRateLimited } from '../../quotas/quota-http';
import { DailyQuotaExceededError } from '../../quotas/quota-errors';
import { QuotasService } from '../../quotas/quotas.service';
import { WalletEngineService } from '../../wallet/wallet-engine.service';
import type { CreateExplanationRequest } from '@ziweiai/contracts';
import { apiEnv } from '../../../config/env';

@Injectable()
export class ExplanationBillingService {
  constructor(
    private readonly quotasService: QuotasService,
    private readonly walletEngine: WalletEngineService,
  ) {}

  /**
   * Checks the initial daily quota without consuming XU.
   * Throws if quota is exhausted and it's an anonymous user.
   * Returns a boolean indicating if XU will be required.
   */
  async checkInitialQuota(userId: string, ipAddress: string, isAnonymous: boolean): Promise<{ requiresXu: boolean }> {
    let requiresXu = false;
    try {
      await this.quotasService.assertCanExecute('explanation', userId, ipAddress, isAnonymous);
    } catch (error) {
      if (error instanceof DailyQuotaExceededError && !isAnonymous) {
        requiresXu = true;
      } else {
        throwQuotaRateLimited(error, 'Đã vượt hạn mức tạo luận giải.');
      }
    }
    return { requiresXu };
  }

  async consumeXuIfNeeded(userId: string, input: CreateExplanationRequest, isOverDailyQuota: boolean): Promise<void> {
    const isPremium = input.explanationKind !== 'overview';
    const needsXu = (isPremium || isOverDailyQuota) && !apiEnv.AI_EXPLANATION_FREE_FOR_ALL;

    if (needsXu) {
      const success = await this.walletEngine.deductXU(userId, 10, 'ai_usage');
      if (!success) {
        const message = isPremium 
          ? 'Tính năng luận giải chuyên sâu yêu cầu 10 XU. Vui lòng nạp thêm XU để sử dụng.'
          : 'Bạn đã hết lượt luận giải miễn phí trong ngày. Vui lòng nạp XU (10 XU/lượt) để tiếp tục.';
        throw new ApiErrorHttpException(
          HttpStatus.PAYMENT_REQUIRED,
          'INSUFFICIENT_FUNDS',
          message
        );
      }
    }
  }
}
