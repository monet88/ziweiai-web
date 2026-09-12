import { Controller, Post, Body, Headers, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { apiEnv } from '../../config/env';
import { sepayWebhookSchema, revenuecatWebhookSchema } from '@ziweiai/contracts';
import { Public } from '../auth/decorators/public.decorator';

@Controller('webhooks/sepay')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Post()
  async handleSepayWebhook(
    @Headers('Authorization') authHeader: string,
    @Body() payload: unknown,
  ) {
    const configuredSecrets = [
      apiEnv.SEPAY_WEBHOOK_SECRET,
      apiEnv.SEPAY_API_KEY,
      apiEnv.SEPAY_TESTMODE_API,
    ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0);

    if (process.env.NODE_ENV === 'production' && configuredSecrets.length === 0) {
      this.logger.error(
        'SePay webhook secret (SEPAY_WEBHOOK_SECRET, SEPAY_API_KEY, or SEPAY_TESTMODE_API) is not configured in production',
      );
      throw new UnauthorizedException('Webhook configuration error');
    }

    if (configuredSecrets.length > 0) {
      const token = this.extractAuthToken(authHeader);
      if (!token || !configuredSecrets.includes(token)) {
        this.logger.warn(`Invalid or missing Authorization header for SePay webhook`);
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
