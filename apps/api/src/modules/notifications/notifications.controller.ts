import { Controller, Get, Post, Headers, UnauthorizedException, HttpCode, HttpStatus, Logger, Body } from '@nestjs/common';
import { NotificationsService, PushNotificationResult } from './notifications.service';
import { apiEnv } from '../../config/env';

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Endpoint kích hoạt bởi Vercel Cron (định kỳ mỗi 00:00 UTC = 07:00 AM VN)
   * Header: Authorization: Bearer <CRON_SECRET>
   */
  @Get('notifications/cron/daily-morning')
  @HttpCode(HttpStatus.OK)
  async triggerDailyMorningCron(
    @Headers('authorization') authHeader?: string,
  ): Promise<{ success: boolean; result: PushNotificationResult }> {
    const configuredSecret = apiEnv.CRON_SECRET;

    if (configuredSecret) {
      const token = authHeader?.replace(/^Bearer\s+/i, '');
      if (token !== configuredSecret) {
        this.logger.warn('Truy cập cron daily-morning bị từ chối: CRON_SECRET không hợp lệ');
        throw new UnauthorizedException('Invalid cron authorization secret');
      }
    } else {
      this.logger.warn(
        'CRON_SECRET chưa được cấu hình. Cho phép thực thi ở chế độ bypass bảo mật (dev/demo).',
      );
    }

    this.logger.log('Khởi chạy Vercel Cron trigger: Daily Morning Push Notification');
    const result = await this.notificationsService.sendDailyMorningPushNotifications();

    return {
      success: true,
      result,
    };
  }

  /**
   * Endpoint dành cho Admin quản trị phát lệnh gửi thông báo tức thì
   */
  @Post('admin/notifications/broadcast-daily')
  @HttpCode(HttpStatus.OK)
  async adminBroadcastDaily(
    @Body() body?: { force?: boolean; customTitle?: string; customBody?: string },
  ): Promise<{ success: boolean; result: PushNotificationResult }> {
    this.logger.log('Admin phát lệnh broadcast daily notification thử nghiệm');

    if (body?.customTitle && body?.customBody) {
      const result = await this.notificationsService.broadcastPushNotification(
        {
          title: body.customTitle,
          body: body.customBody,
          data: {
            type: 'admin_broadcast',
            route: '/daily-horoscope',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            timestamp: new Date().toISOString(),
          },
        },
        body.force ?? true,
      );
      return { success: true, result };
    }

    const result = await this.notificationsService.sendDailyMorningPushNotifications({
      force: body?.force ?? true,
    });

    return {
      success: true,
      result,
    };
  }
}
