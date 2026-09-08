import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import type { WalletEngineService } from '../wallet/wallet-engine.service';
import type { ProfilesRepository } from '../../database/repositories/profiles.repository';

describe('RewardsController & RewardsService', () => {
  let mockSupabaseClient: any;
  let mockProfilesRepo: any;
  let mockWalletEngineService: any;
  let service: RewardsService;
  let controller: RewardsController;

  beforeEach(() => {
    mockSupabaseClient = {
      rpc: vi.fn(),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }),
        }),
      }),
    };

    mockProfilesRepo = {
      listReferralsByReferrerId: vi.fn(),
    } as unknown as ProfilesRepository;

    mockWalletEngineService = {
      addXU: vi.fn(),
      getBalance: vi.fn(),
    } as unknown as WalletEngineService;

    service = new RewardsService(
      mockSupabaseClient,
      mockProfilesRepo,
      mockWalletEngineService,
    );
    controller = new RewardsController(service);
  });

  describe('claimAdReward', () => {
    it('should successfully credit ad reward and return new balance', async () => {
      mockWalletEngineService.addXU.mockResolvedValueOnce(true);
      mockWalletEngineService.getBalance.mockResolvedValueOnce(35);

      const mockReq = {
        authenticatedUser: { userId: 'user-uuid-123' },
      } as AuthenticatedRequest;

      const result = await controller.claimAdReward(mockReq);

      expect(result).toEqual({
        success: true,
        xu_added: 5,
        new_balance: 35,
      });
      expect(mockWalletEngineService.addXU).toHaveBeenCalledWith('user-uuid-123', 5, 'ad_reward');
      expect(mockWalletEngineService.getBalance).toHaveBeenCalledWith('user-uuid-123');
    });

    it('should throw BadRequestException when user exceeds daily ad reward limit', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
            }),
          }),
        }),
      });

      const mockReq = {
        authenticatedUser: { userId: 'user-uuid-123' },
      } as AuthenticatedRequest;

      await expect(controller.claimAdReward(mockReq)).rejects.toThrow(
        'Bạn đã đạt giới hạn nhận thưởng quảng cáo trong ngày (tối đa 5 lượt/ngày).',
      );
    });

    it('should throw BadRequestException if userId is missing', async () => {
      const mockReq = {
        authenticatedUser: undefined,
      } as unknown as AuthenticatedRequest;

      await expect(controller.claimAdReward(mockReq)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if walletEngineService.addXU fails', async () => {
      mockWalletEngineService.addXU.mockResolvedValueOnce(false);

      const mockReq = {
        authenticatedUser: { userId: 'user-uuid-123' },
      } as AuthenticatedRequest;

      await expect(controller.claimAdReward(mockReq)).rejects.toThrow(BadRequestException);
    });
  });

  describe('dailyCheckin', () => {
    it('should return success and added xu on successful checkin', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: 5, error: null });

      const mockReq = {
        authenticatedUser: { userId: 'user-uuid-123' },
      } as AuthenticatedRequest;

      const result = await controller.checkin(mockReq, { referralCode: 'REF123' });
      expect(result).toEqual({ success: true, xu_added: 5 });
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('daily_checkin', {
        p_user_id: 'user-uuid-123',
        p_referral_code: 'REF123',
      });
    });
  });
});
