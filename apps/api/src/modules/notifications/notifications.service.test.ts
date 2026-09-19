import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationsService } from './notifications.service';
import { ProfilesRepository } from '../../database/repositories/profiles.repository';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockProfilesRepo: {
    listActiveFcmTokens: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockProfilesRepo = {
      listActiveFcmTokens: vi.fn(),
    };
    service = new NotificationsService(mockProfilesRepo as unknown as ProfilesRepository);
  });

  afterEach(() => {
    service.onModuleDestroy();
    vi.restoreAllMocks();
  });

  it('should return empty stats when no active tokens are found', async () => {
    mockProfilesRepo.listActiveFcmTokens.mockResolvedValue([]);

    const res = await service.sendDailyMorningPushNotifications();

    expect(res.dispatchedCount).toBe(0);
    expect(res.successCount).toBe(0);
    expect(res.failureCount).toBe(0);
    expect(res.message).toContain('No active registered FCM devices found');
  });

  it('should gracefully fallback and simulate dispatch when service account is not present', async () => {
    mockProfilesRepo.listActiveFcmTokens.mockResolvedValue([
      { userId: 'user-1', token: 'fcm-token-1', platform: 'android' },
      { userId: 'user-2', token: 'fcm-token-2', platform: 'ios' },
    ]);

    const res = await service.sendDailyMorningPushNotifications();

    expect(res.dispatchedCount).toBe(2);
    expect(res.successCount).toBe(2);
    expect(res.failureCount).toBe(0);
    expect(res.dryRun).toBe(true);
    expect(res.message).toContain('Simulated dispatch for 2 registered devices');
  });

  it('should broadcast custom push notification payload correctly', async () => {
    mockProfilesRepo.listActiveFcmTokens.mockResolvedValue([
      { userId: 'user-1', token: 'fcm-token-1', platform: 'android' },
    ]);

    const res = await service.broadcastPushNotification({
      title: 'Khâm Thiên Giám Ngự Bút',
      body: 'Chiêm tinh hôm nay đại cát',
      data: { key: 'val' },
    });

    expect(res.dispatchedCount).toBe(1);
    expect(res.successCount).toBe(1);
    expect(res.dryRun).toBe(true);
  });

  describe('getUserInAppNotifications', () => {
    it('should return empty list when Supabase client is not available', async () => {
      const res = await service.getUserInAppNotifications('user-1');
      expect(res.data).toEqual([]);
      expect(res.unreadCount).toBe(0);
    });

    it('should remind checkin with +1 XU when user has not checked in today (streak 0)', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'xu_transactions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { last_checkin_date: '2026-01-01', checkin_streak: 0 },
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      const customService = new NotificationsService(
        mockProfilesRepo as unknown as ProfilesRepository,
        mockSupabase as any,
      );

      const res = await customService.getUserInAppNotifications('user-1');
      const reminder = res.data.find((n) => n.id.startsWith('daily-reminder'));

      expect(reminder).toBeDefined();
      expect(reminder?.amountXu).toBe(1);
      expect(reminder?.body).toContain('1 XU');
      expect(reminder?.body).not.toContain('5 XU');
    });

    it('should remind checkin with +3 XU jackpot when next streak is day 7', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'xu_transactions') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { last_checkin_date: '2026-01-01', checkin_streak: 6 },
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      const customService = new NotificationsService(
        mockProfilesRepo as unknown as ProfilesRepository,
        mockSupabase as any,
      );

      const res = await customService.getUserInAppNotifications('user-1');
      const reminder = res.data.find((n) => n.id.startsWith('daily-reminder'));

      expect(reminder).toBeDefined();
      expect(reminder?.amountXu).toBe(3);
      expect(reminder?.body).toContain('3 XU Jackpot');
    });
  });
});
