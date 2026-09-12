import { Injectable, Logger } from '@nestjs/common';
import { QuotaRule } from './quota-rule.interface';
import { apiEnv } from '../../config/env';

@Injectable()
export class QuotasRegistry {
  private readonly logger = new Logger(QuotasRegistry.name);
  private readonly rules = new Map<string, QuotaRule>();

  constructor() {
    // Đăng ký trước các quota keys cốt lõi để ngăn lỗi Unknown quota feature
    const defaultDailyLimit = apiEnv.API_EXPLANATIONS_PER_DAY_PER_USER;
    const defaultMsg = 'Hạn mức sử dụng hàng ngày cho tính năng này đã đạt tối đa.';

    const standardKeys = [
      'numerology-explain',
      'iching-draw',
      'divination_chat',
      'compatibility_explain',
      'astrological-synthesis',
    ];

    for (const key of standardKeys) {
      this.rules.set(key, {
        featureKey: key,
        dailyLimit: defaultDailyLimit,
        dailyErrorMessage: defaultMsg,
      });
    }
  }

  register(rule: QuotaRule): void {
    if (this.rules.has(rule.featureKey)) {
      this.logger.debug(`Updating quota rule for featureKey: ${rule.featureKey}`);
    }
    this.rules.set(rule.featureKey, rule);
    this.logger.debug(`Registered quota rule: ${rule.featureKey}`);
  }

  get(featureKey: string): QuotaRule | undefined {
    return this.rules.get(featureKey);
  }
}
