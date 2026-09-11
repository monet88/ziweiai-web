import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UnauthorizedException } from '@nestjs/common';
import { apiEnv } from '../../config/env';
import { isPublicRouteKey } from '../auth/decorators/public.decorator';

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

  it('should be decorated with @Public() so it is not blocked by global SupabaseAuthGuard', () => {
    const reflector = new Reflector();
    const isPublic = reflector.get<boolean>(isPublicRouteKey, NotificationsController);
    expect(isPublic).toBe(true);
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

    it('should reject unauthorized admin broadcast when CRON_SECRET is configured and secret is missing/wrong', async () => {
      const originalSecret = apiEnv.CRON_SECRET;
      (apiEnv as any).CRON_SECRET = 'configured-admin-secret';

      try {
        await expect(controller.adminBroadcastDaily({ force: true, secret: 'wrong-secret' })).rejects.toThrow(
          UnauthorizedException,
        );
      } finally {
        (apiEnv as any).CRON_SECRET = originalSecret;
      }
    });

    it('should accept admin broadcast when valid secret is provided in body or header', async () => {
      const originalSecret = apiEnv.CRON_SECRET;
      (apiEnv as any).CRON_SECRET = 'configured-admin-secret';
      service.sendDailyMorningPushNotifications.mockResolvedValue({
        dispatchedCount: 1,
        successCount: 1,
        failureCount: 0,
        dryRun: true,
        message: 'Dispatched',
      });

      try {
        const res = await controller.adminBroadcastDaily(
          { force: true },
          undefined,
          'configured-admin-secret',
        );
        expect(res.success).toBe(true);
      } finally {
        (apiEnv as any).CRON_SECRET = originalSecret;
      }
    });
  });

  describe('getInAppNotifications', () => {
    it('should throw BadRequestException if userId is missing', async () => {
      const mockReq = { authenticatedUser: undefined } as any;
      await expect(controller.getInAppNotifications(mockReq)).rejects.toThrow();
    });

    it('should return in-app notifications for authenticated user', async () => {
      const mockReq = {
        authenticatedUser: { userId: 'user-uuid-abc' },
      } as any;

      (service as any).getUserInAppNotifications = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'notif-1',
            type: 'topup_success',
            title: 'Nạp XU thành công',
            body: '+50 XU',
            createdAt: '2026-09-11T12:00:00.000Z',
            isRead: false,
          },
        ],
        unreadCount: 1,
      });

      const res = await controller.getInAppNotifications(mockReq);
      expect(res.unreadCount).toBe(1);
      expect(res.data[0].id).toBe('notif-1');
      expect((service as any).getUserInAppNotifications).toHaveBeenCalledWith('user-uuid-abc');
    });
  });
});
