import { Controller, Post, Body, Headers, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { apiEnv } from '../../config/env';
import { sepayWebhookSchema, revenuecatWebhookSchema } from '@ziweiai/contracts';

@Controller('webhooks/sepay')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async handleSepayWebhook(
    @Headers('Authorization') authHeader: string,
    @Body() payload: unknown,
  ) {
    if (apiEnv.SEPAY_WEBHOOK_SECRET) {
      if (!authHeader || authHeader !== `Bearer ${apiEnv.SEPAY_WEBHOOK_SECRET}`) {
        this.logger.warn('Invalid or missing Authorization header for SePay webhook');
        throw new UnauthorizedException('Invalid webhook token');
      }
    }

    const parseResult = sepayWebhookSchema.safeParse(payload);
    if (!parseResult.success) {
      this.logger.error('Invalid SePay webhook payload', parseResult.error);
      throw new BadRequestException('Invalid payload');
    }

    await this.paymentService.processTransaction(parseResult.data);

    return { success: true };
  }

  @Post('revenuecat')
  async handleRevenueCatWebhook(
    @Headers('Authorization') authHeader: string,
    @Body() payload: unknown,
  ) {
    if (apiEnv.REVENUECAT_WEBHOOK_SECRET) {
      if (!authHeader || authHeader !== `Bearer ${apiEnv.REVENUECAT_WEBHOOK_SECRET}`) {
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
