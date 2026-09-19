import { Injectable, Logger, Inject, HttpStatus } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import {
  type AuthenticatedUser,
  type DossierStatusResponse,
  type DossierUnlockResponse,
  dossierStatusResponseSchema,
  dossierUnlockResponseSchema,
} from '@ziweiai/contracts';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { ChartsRepository } from '../../database/repositories/charts.repository';
import { WalletEngineService } from '../wallet/wallet-engine.service';
import { ApiErrorHttpException } from '../../common/http/api-error';

@Injectable()
export class DossierService {
  private readonly logger = new Logger(DossierService.name);
  static readonly DOSSIER_FEE_XU = 50;

  constructor(
    private readonly chartsRepository: ChartsRepository,
    private readonly walletEngine: WalletEngineService,
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
  ) {}

  async getDossierStatus(user: AuthenticatedUser, chartId: string): Promise<DossierStatusResponse> {
    const isUnlocked = await this.checkIsUnlocked(user.userId, chartId);
    return dossierStatusResponseSchema.parse({
      isUnlocked,
      feeXu: DossierService.DOSSIER_FEE_XU,
    });
  }

  async unlockDossier(user: AuthenticatedUser, chartId: string): Promise<DossierUnlockResponse> {
    const chart = await this.chartsRepository.findPublicChartSnapshotById(chartId);
    if (!chart) {
      throw new ApiErrorHttpException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Không tìm thấy lá số.');
    }

    const alreadyUnlocked = await this.checkIsUnlocked(user.userId, chartId);
    if (alreadyUnlocked) {
      const remainingBalance = await this.walletEngine.getBalance(user.userId);
      return dossierUnlockResponseSchema.parse({
        success: true,
        unlocked: true,
        alreadyUnlocked: true,
        xuCharged: 0,
        remainingBalance,
      });
    }

    const ref = `chart:${chartId}`;
    const success = await this.walletEngine.deductXU(
      user.userId,
      DossierService.DOSSIER_FEE_XU,
      'pdf_dossier',
      ref,
    );

    if (!success) {
      throw new ApiErrorHttpException(
        HttpStatus.PAYMENT_REQUIRED,
        'PAYMENT_REQUIRED',
        `Xuất Bản Hồ Sơ Mệnh Lý Hoàng Gia yêu cầu ${DossierService.DOSSIER_FEE_XU} XU. Vui lòng nạp thêm XU để tiếp tục.`,
      );
    }

    const remainingBalance = await this.walletEngine.getBalance(user.userId);
    this.logger.log(`[dossier] Unlocked deluxe PDF dossier chartId=${chartId} for userId=${user.userId} (-50 XU)`);

    return dossierUnlockResponseSchema.parse({
      success: true,
      unlocked: true,
      alreadyUnlocked: false,
      xuCharged: DossierService.DOSSIER_FEE_XU,
      remainingBalance,
    });
  }

  private async checkIsUnlocked(userId: string, chartId: string): Promise<boolean> {
    const ref = `chart:${chartId}`;
    const { data, error } = await this.client
      .from('xu_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('transaction_type', 'pdf_dossier')
      .eq('actor_email', ref)
      .limit(1);

    if (error) {
      this.logger.warn(`Failed to query dossier unlock status: ${error.message}`);
      return false;
    }
    return Boolean(data && data.length > 0);
  }
}
