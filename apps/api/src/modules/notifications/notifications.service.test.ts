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
});
