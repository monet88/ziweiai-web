import { Injectable, Logger } from '@nestjs/common';
import { CLOUDFLARE_TURNSTILE_TEST_KEYS } from '@ziweiai/contracts';

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  challengeTs?: string;
  hostname?: string;
  isBypassed?: boolean;
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  async verifyToken(
    token?: string | null,
    remoteIp?: string,
    customSecretKey?: string,
  ): Promise<TurnstileVerificationResult> {
    const secretKey = customSecretKey ?? process.env.TURNSTILE_SECRET_KEY;

    // Graceful Bypass Mode: Chỉ cho phép ở môi trường dev/test khi không có secret key
    if (!secretKey) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(
          'CRITICAL: TURNSTILE_SECRET_KEY is not configured in production. Failing closed for bot protection.',
        );
        return { success: false, errorCodes: ['missing-secret-key'] };
      }
      this.logger.warn(
        'TURNSTILE_SECRET_KEY is not set. Operating in graceful bypass mode (bot defense disabled).',
      );
      return { success: true, isBypassed: true };
    }

    if (!token || token.trim() === '') {
      this.logger.warn('Empty turnstile token received.');
      return { success: false, errorCodes: ['missing-input-response'] };
    }

    // Nếu dùng test pass secret key thì luôn pass
    if (
      secretKey === CLOUDFLARE_TURNSTILE_TEST_KEYS.ALWAYS_PASSES_SECRETKEY &&
      token === CLOUDFLARE_TURNSTILE_TEST_KEYS.ALWAYS_BLOCKS_SITEKEY
    ) {
      return { success: false, errorCodes: ['invalid-input-response'] };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', secretKey);
      formData.append('response', token);
      if (remoteIp) {
        formData.append('remoteip', remoteIp);
      }

      const response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (!response.ok) {
        this.logger.error(
          `Cloudflare Turnstile verification HTTP error: ${response.status} ${response.statusText}`,
        );
        // Trong production: Fail Closed để chặn bot lợi dụng outage
        if (process.env.NODE_ENV === 'production') {
          return { success: false, errorCodes: ['turnstile-service-unavailable'] };
        }
        return { success: true, isBypassed: true };
      }

      const outcome = (await response.json()) as {
        success: boolean;
        'error-codes'?: string[];
        challenge_ts?: string;
        hostname?: string;
      };

      return {
        success: Boolean(outcome.success),
        errorCodes: outcome['error-codes'],
        challengeTs: outcome.challenge_ts,
        hostname: outcome.hostname,
      };
    } catch (error) {
      this.logger.error('Failed to communicate with Cloudflare Turnstile API', error);
      // Trong production: Fail Closed khi mạng gián đoạn
      if (process.env.NODE_ENV === 'production') {
        return { success: false, errorCodes: ['turnstile-network-error'] };
      }
      return { success: true, isBypassed: true };
    }
  }
}
