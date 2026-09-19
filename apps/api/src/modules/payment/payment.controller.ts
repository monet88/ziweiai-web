import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UnauthorizedException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import crypto from 'node:crypto';
import type { Request } from 'express';
import { PaymentService } from './payment.service';
import { apiEnv } from '../../config/env';
import { sepayWebhookSchema, revenuecatWebhookSchema } from '@ziweiai/contracts';
import { Public } from '../auth/decorators/public.decorator';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

@Controller('webhooks/sepay')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Post()
  async handleSepayWebhook(
    @Headers('Authorization') authHeader: string | undefined,
    @Headers('x-sepay-signature') sepaySignature: string | undefined,
    @Headers('x-sepay-timestamp') sepayTimestamp: string | undefined,
    @Req() req: RequestWithRawBody,
    @Body() payload: unknown,
  ) {
    const configuredSecrets = [
      apiEnv.SEPAY_WEBHOOK_SECRET,
      process.env.SEPAY_SECRET_KEY,
      process.env.SEPAY_SERECT_KEY,
      apiEnv.SEPAY_API_KEY,
      apiEnv.SEPAY_TESTMODE_API,
    ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0);

    if (process.env.NODE_ENV === 'production' && configuredSecrets.length === 0) {
      this.logger.error(
        'SePay webhook secret (SEPAY_WEBHOOK_SECRET, SEPAY_SECRET_KEY, SEPAY_API_KEY, or SEPAY_TESTMODE_API) is not configured in production',
      );
      throw new UnauthorizedException('Webhook configuration error');
    }

    if (configuredSecrets.length > 0) {
      const isVerified = this.verifyWebhookRequest({
        authHeader,
        sepaySignature,
        sepayTimestamp,
        req,
        payload,
        configuredSecrets,
      });

      if (!isVerified) {
        this.logger.warn('Invalid or missing authentication credentials for SePay webhook');
        throw new UnauthorizedException('Invalid webhook token');
      }
    }

    const parseResult = sepayWebhookSchema.safeParse(payload);
    if (!parseResult.success) {
      this.logger.error('Invalid SePay webhook payload', parseResult.error.format());
      throw new BadRequestException('Invalid payload');
    }

    await this.paymentService.processTransaction(parseResult.data);

    return { success: true };
  }

  private verifyWebhookRequest(params: {
    authHeader?: string;
    sepaySignature?: string;
    sepayTimestamp?: string;
    req: RequestWithRawBody;
    payload: unknown;
    configuredSecrets: string[];
  }): boolean {
    const { authHeader, sepaySignature, sepayTimestamp, req, payload, configuredSecrets } = params;

    // 1. Kiểm tra xác thực HMAC-SHA256 (Chuẩn bảo mật SePay Webhook)
    if (sepaySignature && sepaySignature.trim().length > 0) {
      const signatureTrimmed = sepaySignature.trim();

      // Kiểm tra timestamp chống replay nếu có (±5 phút = 300s)
      if (sepayTimestamp) {
        const timestampNum = parseInt(sepayTimestamp, 10);
        if (!isNaN(timestampNum)) {
          const currentTimestampSec = Math.floor(Date.now() / 1000);
          if (Math.abs(currentTimestampSec - timestampNum) > 300) {
            this.logger.warn(`SePay webhook timestamp expired: timestamp=${timestampNum}, now=${currentTimestampSec}`);
            return false;
          }
        }
      }

      // Xác định raw body string
      const rawBodyStr = req.rawBody
        ? req.rawBody.toString('utf-8')
        : (typeof payload === 'string' ? payload : JSON.stringify(payload));

      for (const secret of configuredSecrets) {
        // Format chuẩn SePay: hmac(timestamp.body)
        const candidates: string[] = [];
        if (sepayTimestamp) {
          const hmacWithTimestamp = crypto
            .createHmac('sha256', secret)
            .update(`${sepayTimestamp}.${rawBodyStr}`)
            .digest('hex');
          candidates.push(`sha256=${hmacWithTimestamp}`, hmacWithTimestamp);
        }

        // Fallback: hmac(body) nếu webhook không gửi kèm timestamp
        const hmacDirect = crypto
          .createHmac('sha256', secret)
          .update(rawBodyStr)
          .digest('hex');
        candidates.push(`sha256=${hmacDirect}`, hmacDirect);

        // Fallback: signature gửi thẳng token bí mật
        candidates.push(secret);

        for (const candidate of candidates) {
          if (this.safeCompare(candidate, signatureTrimmed)) {
            return true;
          }
        }
      }
    }

    // 2. Kiểm tra xác thực qua Authorization header (API Key / Bearer / Plain Secret)
    if (authHeader && authHeader.trim().length > 0) {
      const token = this.extractAuthToken(authHeader);
      if (token) {
        for (const secret of configuredSecrets) {
          if (this.safeCompare(token, secret)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  private extractAuthToken(authHeader?: string): string | null {
    if (!authHeader) return null;
    const trimmed = authHeader.trim();
    const match = trimmed.match(/^(?:Apikey|Bearer)\s+(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    return trimmed;
  }

  @Public()
  @Post('revenuecat')
  async handleRevenueCatWebhook(
    @Headers('Authorization') authHeader: string,
    @Body() payload: unknown,
  ) {
    const revenuecatSecret = apiEnv.REVENUECAT_WEBHOOK_SECRET;
    if (process.env.NODE_ENV === 'production' && !revenuecatSecret) {
      this.logger.error('RevenueCat webhook secret is not configured in production');
      throw new UnauthorizedException('Webhook configuration error');
    }
    if (revenuecatSecret) {
      if (!authHeader || authHeader !== `Bearer ${revenuecatSecret}`) {
        this.logger.warn('Invalid or missing Authorization header for RevenueCat webhook');
        throw new UnauthorizedException('Invalid webhook token');
      }
    }

    const parseResult = revenuecatWebhookSchema.safeParse(payload);
    if (!parseResult.success) {
      this.logger.error('Invalid RevenueCat webhook payload', parseResult.error);
      throw new BadRequestException('Invalid payload');
    }

    await this.paymentService.processRevenueCatTransaction(parseResult.data);

    return { success: true };
  }
}
