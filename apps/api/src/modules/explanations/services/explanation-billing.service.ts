import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiErrorHttpException } from '../../../common/http/api-error';
import { throwQuotaRateLimited } from '../../quotas/quota-http';
import { DailyQuotaExceededError } from '../../quotas/quota-errors';
import { QuotasService } from '../../quotas/quotas.service';
import { SupabasePersistenceGateway } from '../../../database/supabase-persistence.gateway';
import type { AuthenticatedUser, CreateExplanationRequest } from '@ziweiai/contracts';

@Injectable()
export class ExplanationBillingService {
  constructor(
    private readonly quotasService: QuotasService,
    private readonly persistenceGateway: SupabasePersistenceGateway,
  ) {}

  /**
   * Checks the initial daily quota without consuming XU.
   * Throws if quota is exhausted and it's an anonymous user.
   * Returns a boolean indicating if XU will be required.
   */
  async checkInitialQuota(userId: string, ipAddress: string, isAnonymous: boolean): Promise<{ requiresXu: boolean }> {
    let requiresXu = false;
    try {
      await this.quotasService.assertCanCreateExplanation(userId, ipAddress, isAnonymous);
    } catch (error) {
      if (error instanceof DailyQuotaExceededError && !isAnonymous) {
        requiresXu = true;
      } else {
        throwQuotaRateLimited(error, 'Đã vượt hạn mức tạo luận giải.');
      }
    }
    return { requiresXu };
  }

  /**
   * Consumes XU if it is required (either due to premium feature or over daily limit).
   * Throws PAYMENT_REQUIRED if the user doesn't have enough XU.
   */
  async consumeXuIfNeeded(userId: string, input: CreateExplanationRequest, isOverDailyQuota: boolean): Promise<void> {
    const isPremium = input.explanationKind !== 'overview';
    const needsXu = isPremium || isOverDailyQuota;

    if (needsXu) {
      const success = await this.persistenceGateway.deductXU(userId, 1);
      if (!success) {
        const message = isPremium 
          ? 'Tính năng luận giải chuyên sâu yêu cầu 1 XU. Vui lòng nạp thêm XU để sử dụng.'
          : 'Bạn đã hết lượt luận giải miễn phí trong ngày. Vui lòng nạp XU (1 XU/lượt) để tiếp tục.';
        throw new ApiErrorHttpException(
          HttpStatus.PAYMENT_REQUIRED,
          'PAYMENT_REQUIRED',
          message
        );
      }
    }
  }
}
