import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UnauthorizedException } from '@nestjs/common';
import { apiEnv } from '../../config/env';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: {
    sendDailyMorningPushNotifications: ReturnType<typeof vi.fn>;
    broadcastPushNotification: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      sendDailyMorningPushNotifications: vi.fn(),
      broadcastPushNotification: vi.fn(),
    };
    controller = new NotificationsController(service as unknown as NotificationsService);
  });

  describe('triggerDailyMorningCron', () => {
    it('should trigger daily morning push successfully without secret when CRON_SECRET is empty', async () => {
      service.sendDailyMorningPushNotifications.mockResolvedValue({
        dispatchedCount: 1,
        successCount: 1,
        failureCount: 0,
        dryRun: true,
        message: 'Mock dispatch',
      });

      const res = await controller.triggerDailyMorningCron();

      expect(res.success).toBe(true);
      expect(service.sendDailyMorningPushNotifications).toHaveBeenCalled();
    });

    it('should reject unauthorized request when CRON_SECRET is configured but header is invalid', async () => {
      const originalSecret = apiEnv.CRON_SECRET;
      (apiEnv as any).CRON_SECRET = 'super-secret-cron-token';

      try {
        await expect(controller.triggerDailyMorningCron('Bearer wrong-token')).rejects.toThrow(
          UnauthorizedException,
        );
      } finally {
        (apiEnv as any).CRON_SECRET = originalSecret;
      }
    });

    it('should accept request when CRON_SECRET is valid', async () => {
      const originalSecret = apiEnv.CRON_SECRET;
      (apiEnv as any).CRON_SECRET = 'valid-token';
      service.sendDailyMorningPushNotifications.mockResolvedValue({
        dispatchedCount: 5,
        successCount: 5,
        failureCount: 0,
        dryRun: true,
        message: 'Dispatched',
      });

      try {
        const res = await controller.triggerDailyMorningCron('Bearer valid-token');
        expect(res.success).toBe(true);
        expect(res.result.dispatchedCount).toBe(5);
      } finally {
        (apiEnv as any).CRON_SECRET = originalSecret;
      }
    });
  });

  describe('adminBroadcastDaily', () => {
    it('should trigger broadcast daily notifications for admin', async () => {
      service.sendDailyMorningPushNotifications.mockResolvedValue({
        dispatchedCount: 3,
        successCount: 3,
        failureCount: 0,
        dryRun: true,
        message: 'Admin triggered dispatch',
      });

      const res = await controller.adminBroadcastDaily({ force: true });

      expect(res.success).toBe(true);
      expect(service.sendDailyMorningPushNotifications).toHaveBeenCalledWith({ force: true });
    });

    it('should trigger broadcast with custom content when provided', async () => {
      service.broadcastPushNotification.mockResolvedValue({
        dispatchedCount: 2,
        successCount: 2,
        failureCount: 0,
        dryRun: true,
        message: 'Custom broadcast',
      });

      const res = await controller.adminBroadcastDaily({
        customTitle: 'Thông Điệp Đặc Biệt',
        customBody: 'Nội dung tùy chỉnh từ Admin',
      });

      expect(res.success).toBe(true);
      expect(service.broadcastPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Thông Điệp Đặc Biệt',
          body: 'Nội dung tùy chỉnh từ Admin',
        }),
        true,
      );
    });
  });
});
