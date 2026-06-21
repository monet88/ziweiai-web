import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { IztroChartAdapter, analyzeHepanCompatibility } from '@ziweiai/astro-engine';
import {
  pairingSnapshotSchema,
  type AuthenticatedUser,
  type PairingRequest,
  type PairingSnapshot,
} from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { assertCanUseAiExplanation } from '../../common/entitlement/ai-entitlement.guard';
import { apiEnv } from '../../config/env';
import { QuotasService } from '../quotas/quotas.service';

@Injectable()
export class PairingsService {
  private readonly logger = new Logger(PairingsService.name);
  // Hợp Hôn ghép 2 lá số Tử Vi (decision 0012): dùng cùng adapter iztro như POST /charts.
  private readonly ziweiAdapter = new IztroChartAdapter();

  constructor(private readonly quotasService: QuotasService) {}

  async createPairing(user: AuthenticatedUser, ipAddress: string, input: PairingRequest): Promise<PairingSnapshot> {
    if (!apiEnv.EXTENDED_SYSTEM_HEPAN_ENABLED) {
      // Cờ tắt = từ chối có chủ đích (feature tồn tại nhưng chưa bật) → 403, đồng bộ Tarot/MBTI.
      throw new ApiErrorHttpException(
        HttpStatus.FORBIDDEN,
        'FEATURE_DISABLED',
        'Tính năng Hợp Hôn hiện chưa được bật.',
      );
    }

    // Gate AI (premium) TRƯỚC quota qua guard dùng chung (decision 0010), rồi mới tiêu quota.
    assertCanUseAiExplanation(this.logger);
    // email rỗng/null ⟺ phiên ẩn danh (decision 0009): dùng !user.email để không bỏ lọt anon.
    await this.assertCanCreatePairing(user.userId, ipAddress, !user.email);

    // Hai lá số ziwei độc lập (không viewYear). Tương hợp tính deterministic bằng bazi ở engine.
    const [primary, partner] = await Promise.all([
      this.ziweiAdapter.calculateChart(input.primary),
      this.ziweiAdapter.calculateChart(input.partner),
    ]);
    const compatibility = analyzeHepanCompatibility(input.primary, input.partner, input.relationType);

    return pairingSnapshotSchema.parse({
      primary,
      partner,
      relationType: input.relationType,
      compatibility,
    });
  }

  // Bọc lỗi quota (raw Error từ QuotasService) thành 429 RATE_LIMITED cho đồng bộ với các đường khác.
  private async assertCanCreatePairing(userId: string, ipAddress: string, isAnonymous: boolean): Promise<void> {
    try {
      await this.quotasService.assertCanCreatePairing(userId, ipAddress, isAnonymous);
    } catch (error) {
      throw new ApiErrorHttpException(
        HttpStatus.TOO_MANY_REQUESTS,
        'RATE_LIMITED',
        error instanceof Error ? error.message : 'Đã vượt hạn mức ghép Hợp Hôn.',
      );
    }
  }
}
