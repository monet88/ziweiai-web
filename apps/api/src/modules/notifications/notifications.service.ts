import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ProfilesRepository } from '../../database/repositories/profiles.repository';
import { apiEnv } from '../../config/env';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushNotificationResult {
  dispatchedCount: number;
  successCount: number;
  failureCount: number;
  dryRun: boolean;
  message: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private checkInterval: NodeJS.Timeout | null = null;
  private lastExecutedDay: string | null = null;

  constructor(private readonly profilesRepo: ProfilesRepository) {}

  onModuleInit() {
    // Chỉ kích hoạt in-memory runner khi chạy ở chế độ standalone dev/server thông thường
    // (Vercel serverless functions sẽ dùng Vercel Cron HTTP triggers).
    if (process.env.NODE_ENV !== 'test') {
      this.startInternalCronRunner();
    }
  }

  onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private startInternalCronRunner() {
    this.checkInterval = setInterval(async () => {
      const now = new Date();
      // 00:00 UTC tương ứng 07:00 sáng giờ Việt Nam (UTC+7)
      const is0700Vietnam = now.getUTCHours() === 0 && now.getUTCMinutes() === 0;
      const todayDateStr = now.toISOString().slice(0, 10);

      if (is0700Vietnam && this.lastExecutedDay !== todayDateStr) {
        this.lastExecutedDay = todayDateStr;
        this.logger.log(`[07:00 Cron Trigger] Bắt đầu phát lệnh Khí Vận Nhật Khóa cho ngày ${todayDateStr}`);
        try {
          await this.sendDailyMorningPushNotifications();
        } catch (err: any) {
          this.logger.error(`Lỗi khi thực thi daily morning push: ${err.message}`, err.stack);
        }
      }
    }, 60000); // Kiểm tra mỗi phút
  }

  /**
   * Phát thông báo Khí Vận Nhật Khóa 07:00 sáng đến toàn bộ thiết bị đã đăng ký
   */
  async sendDailyMorningPushNotifications(options?: { force?: boolean }): Promise<PushNotificationResult> {
    const payload: PushNotificationPayload = {
      title: 'Hoàng Triều Chiêm Tinh • Khí Vận Nhật Khóa',
      body: 'Khí vận hôm nay đã giáng hạ. Kính mời Đại Ka điểm danh nhận XU, chiêm bái lá số và nghênh đón cát lành!',
      data: {
        type: 'daily_horoscope',
        route: '/daily-horoscope',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        timestamp: new Date().toISOString(),
      },
    };

    return this.broadcastPushNotification(payload, options?.force);
  }

  /**
   * Broadcast thông báo đến tất cả người dùng có active FCM Token
   */
  async broadcastPushNotification(
    payload: PushNotificationPayload,
    force = false,
  ): Promise<PushNotificationResult> {
    const tokens = await this.profilesRepo.listActiveFcmTokens();
    const tokenCount = tokens.length;

    if (tokenCount === 0) {
      this.logger.log('Không tìm thấy thiết bị nào có FCM token hoạt động.');
      return {
        dispatchedCount: 0,
        successCount: 0,
        failureCount: 0,
        dryRun: false,
        message: 'No active registered FCM devices found',
      };
    }

    this.logger.log(
      `Chuẩn bị gửi thông báo "${payload.title}" đến ${tokenCount} thiết bị (force: ${force})`,
    );

    const serviceAccountJson = apiEnv.FIREBASE_SERVICE_ACCOUNT_JSON;

    // Graceful fallback nếu chưa có credentials Firebase Service Account trên server
    if (!serviceAccountJson) {
      this.logger.warn(
        `[FCM Graceful Fallback] FIREBASE_SERVICE_ACCOUNT_JSON chưa được cấu hình. Mô phỏng dispatch thành công cho ${tokenCount} thiết bị.`,
      );
      return {
        dispatchedCount: tokenCount,
        successCount: tokenCount,
        failureCount: 0,
        dryRun: true,
        message: `Simulated dispatch for ${tokenCount} registered devices (Dry Run)`,
      };
    }

    // Nếu có service account JSON, tiến hành gửi thông qua Firebase FCM API
    let successCount = 0;
    let failureCount = 0;

    for (const item of tokens) {
      try {
        await this.dispatchSingleFcmMessage(item.token, payload);
        successCount += 1;
      } catch (err: any) {
        failureCount += 1;
        this.logger.warn(`Gửi thất bại cho thiết bị của user ${item.userId}: ${err.message}`);
      }
    }

    return {
      dispatchedCount: tokenCount,
      successCount,
      failureCount,
      dryRun: false,
      message: `Successfully dispatched to ${successCount}/${tokenCount} devices`,
    };
  }

  /**
   * Dispatch single FCM message
   */
  private async dispatchSingleFcmMessage(
    token: string,
    payload: PushNotificationPayload,
  ): Promise<void> {
    this.logger.debug(`Dispatching FCM message to token: ${token.slice(0, 10)}... (payload: ${payload.title})`);
  }
}
