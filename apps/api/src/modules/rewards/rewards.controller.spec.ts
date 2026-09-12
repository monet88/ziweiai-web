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
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        if (table === 'referrals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
              gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }),
        };
      }),
    };

    mockProfilesRepo = {
      listReferralsByReferrerId: vi.fn(),
      getReferralLeaderboard: vi.fn().mockResolvedValue([]),
    } as unknown as ProfilesRepository;

    mockWalletEngineService = {
      addXU: vi.fn(),
      getBalance: vi.fn(),
    } as unknown as WalletEngineService;

    const mockTurnstileService = {
      verifyToken: vi.fn().mockResolvedValue({ success: true }),
    };

    service = new RewardsService(
      mockSupabaseClient,
      mockProfilesRepo,
      mockWalletEngineService,
    );
    controller = new RewardsController(service, mockTurnstileService as any);
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
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
            }),
          }),
        }),
      }));

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

    it('should skip referral code if referee has disposable email', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: 5, error: null });
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { display_name: 'bot@tempmail.com' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const mockReq = {
        authenticatedUser: { userId: 'bot-uuid' },
      } as AuthenticatedRequest;

      const result = await controller.checkin(mockReq, { referralCode: 'REF123' });
      expect(result).toEqual({ success: true, xu_added: 5 });
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('daily_checkin', {
        p_user_id: 'bot-uuid',
        p_referral_code: null, // Bị bỏ qua vì dùng disposable email
      });
    });

    it('should skip referral code if referrer reached daily referral cap', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: 5, error: null });
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((col: string, _val: string) => {
                if (col === 'user_id') {
                  return {
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { display_name: 'clean@gmail.com' },
                      error: null,
                    }),
                  };
                }
                return {
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { user_id: 'referrer-uuid' },
                    error: null,
                  }),
                };
              }),
            }),
          };
        }
        if (table === 'referrals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 5, error: null }), // Đã đủ 5 lượt
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const mockReq = {
        authenticatedUser: { userId: 'clean-user-uuid' },
      } as AuthenticatedRequest;

      const result = await controller.checkin(mockReq, { referralCode: 'REF123' });
      expect(result).toEqual({ success: true, xu_added: 5 });
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('daily_checkin', {
        p_user_id: 'clean-user-uuid',
        p_referral_code: null, // Bị bỏ qua vì referrer đã đạt trần 5 lượt/ngày
      });
    });

    it('should throw BadRequestException when Turnstile verification fails', async () => {
      const mockFailingTurnstile = {
        verifyToken: vi.fn().mockResolvedValue({ success: false }),
      };
      const failingController = new RewardsController(service, mockFailingTurnstile as any);

      const mockReq = {
        authenticatedUser: { userId: 'bot-user-uuid' },
        headers: {},
        socket: {},
      } as unknown as AuthenticatedRequest;

      await expect(
        failingController.checkin(mockReq, { referralCode: 'REF123', turnstileToken: 'bot-token' }),
      ).rejects.toThrow('Xác thực chống bot không thành công (Turnstile verification failed).');
    });
  });

  describe('getReferrals', () => {
    it('should return referral history for authenticated user', async () => {
      const mockHistory = [
        {
          id: 'ref-1',
          referrerId: 'user-uuid-123',
          refereeId: 'referee-1',
          rewardXu: 10,
          status: 'completed' as const,
          createdAt: '2026-09-09T10:00:00.000Z',
          completedAt: '2026-09-09T10:05:00.000Z',
          refereeEmailMasked: 'g***0@gmail.com',
        },
      ];
      (mockProfilesRepo.listReferralsByReferrerId as any).mockResolvedValueOnce(mockHistory);

      const mockReq = {
        authenticatedUser: { userId: 'user-uuid-123' },
      } as AuthenticatedRequest;

      const result = await controller.getReferrals(mockReq);
      expect(result).toEqual(mockHistory);
      expect(mockProfilesRepo.listReferralsByReferrerId).toHaveBeenCalledWith('user-uuid-123');
    });
  });

  describe('getStatus', () => {
    it('should return checkin status and streak info', async () => {
      const mockReq = {
        authenticatedUser: { userId: 'user-uuid-123' },
      } as AuthenticatedRequest;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { last_checkin_date: '2026-09-10', checkin_streak: 2 },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await controller.getStatus(mockReq);
      expect(res).toBeDefined();
      expect(typeof res.canCheckin).toBe('boolean');
      expect(typeof res.streak).toBe('number');
      expect(typeof res.rewardToday).toBe('number');
    });

    it('should throw BadRequestException if user id is missing', async () => {
      const mockReq = {
        authenticatedUser: undefined,
      } as any;

      await expect(controller.getStatus(mockReq)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPartnerHub', () => {
    it('should return complete partner hub data with tiers and leaderboard', async () => {
      const mockReq = {
        authenticatedUser: { userId: 'user-uuid-123' },
        headers: { host: 'tuvitoantap.vercel.app' },
      } as unknown as AuthenticatedRequest;

      mockProfilesRepo.findProfileByUserId = vi.fn().mockResolvedValue({
        userId: 'user-uuid-123',
        referralCode: 'ref_12345678',
      });
      mockProfilesRepo.listReferralsByReferrerId = vi.fn().mockResolvedValue([
        { id: '1', referrerId: 'user-uuid-123', refereeId: 'ref-1', rewardXu: 10, status: 'completed', createdAt: '2026-09-01T00:00:00Z' },
        { id: '2', referrerId: 'user-uuid-123', refereeId: 'ref-2', rewardXu: 10, status: 'completed', createdAt: '2026-09-02T00:00:00Z' },
      ]);
      mockProfilesRepo.getReferralLeaderboard = vi.fn().mockResolvedValue([
        {
          referrerId: 'user-top-1',
          maskedName: 'vip***@gmail.com',
          referralCount: 99,
          rewardXuEarned: 990,
        },
      ]);

      const res = await controller.getPartnerHub(mockReq);
      expect(res).toBeDefined();
      expect(res.referralCode).toBe('ref_12345678');
      expect(res.referralLink).toContain('ref=ref_12345678');
      expect(res.totalReferrals).toBe(2);
      expect(res.totalXuEarned).toBe(20);
      expect(res.tier).toBe('dong');
      expect(res.leaderboard).toHaveLength(10);
      expect(res.leaderboard[0]?.rank).toBe(1);
      expect(res.leaderboard[0]?.maskedName).toBe('vip***@gmail.com');
      expect(res.leaderboard[0]?.referralCount).toBe(99);
      expect(res.leaderboard[0]?.rewardXuEarned).toBe(990);
      expect(res.leaderboard[0]?.tier).toBe('kim_cuong');
      expect(res.leaderboard[0]?.badge).toBe('👑 Quán Quân Lan Tỏa');
    });

    it('should throw BadRequestException if user id is missing', async () => {
      const mockReq = {
        authenticatedUser: undefined,
      } as any;

      await expect(controller.getPartnerHub(mockReq)).rejects.toThrow(BadRequestException);
    });
  });
});
