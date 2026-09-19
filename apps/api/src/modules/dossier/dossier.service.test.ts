import { HttpStatus } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { DossierService } from './dossier.service';

describe('DossierService', () => {
  const user: AuthenticatedUser = {
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'user@example.com',
  };
  const chartId = '22222222-2222-2222-2222-222222222222';

  let chartsRepository: any;
  let walletEngine: any;
  let supabaseClient: any;
  let service: DossierService;

  beforeEach(() => {
    chartsRepository = {
      findPublicChartSnapshotById: vi.fn().mockResolvedValue({
        id: chartId,
        ownerUserId: user.userId,
        snapshot: { chartSystem: 'zi-wei-dou-shu' },
      }),
    };

    walletEngine = {
      getBalance: vi.fn().mockResolvedValue(100),
      deductXU: vi.fn().mockResolvedValue(true),
    };

    // Default supabase query returns empty (not yet unlocked)
    supabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };

    service = new DossierService(chartsRepository, walletEngine, supabaseClient);
  });

  describe('getDossierStatus', () => {
    it('returns isUnlocked = false when user has not unlocked yet', async () => {
      const status = await service.getDossierStatus(user, chartId);
      expect(status.isUnlocked).toBe(false);
      expect(status.feeXu).toBe(50);
    });

    it('returns isUnlocked = true when user previously unlocked', async () => {
      supabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: 'tx-1' }], error: null }),
      });

      const status = await service.getDossierStatus(user, chartId);
      expect(status.isUnlocked).toBe(true);
      expect(status.feeXu).toBe(50);
    });
  });

  describe('unlockDossier', () => {
    it('throws 404 if chart not found', async () => {
      chartsRepository.findPublicChartSnapshotById.mockResolvedValue(null);

      await expect(service.unlockDossier(user, chartId)).rejects.toThrow(ApiErrorHttpException);
    });

    it('returns alreadyUnlocked = true without charging if already unlocked', async () => {
      supabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: 'tx-1' }], error: null }),
      });

      const res = await service.unlockDossier(user, chartId);
      expect(res.alreadyUnlocked).toBe(true);
      expect(res.xuCharged).toBe(0);
      expect(walletEngine.deductXU).not.toHaveBeenCalled();
    });

    it('deducts 50 XU when unlocking first time and returns success', async () => {
      const res = await service.unlockDossier(user, chartId);
      expect(walletEngine.deductXU).toHaveBeenCalledWith(
        user.userId,
        50,
        'pdf_dossier',
        `chart:${chartId}`,
      );
      expect(res.success).toBe(true);
      expect(res.unlocked).toBe(true);
      expect(res.alreadyUnlocked).toBe(false);
      expect(res.xuCharged).toBe(50);
      expect(res.remainingBalance).toBe(100);
    });

    it('throws 402 PAYMENT_REQUIRED when user has insufficient XU', async () => {
      walletEngine.deductXU.mockResolvedValue(false);

      await expect(service.unlockDossier(user, chartId)).rejects.toMatchObject({
        status: HttpStatus.PAYMENT_REQUIRED,
      });
    });
  });
});
