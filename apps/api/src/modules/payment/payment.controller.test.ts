import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { UnauthorizedException } from '@nestjs/common';

describe('PaymentController - SePay Webhook Authentication', () => {
  let controller: PaymentController;
  let mockPaymentService: any;
  const testSecret = 'spsk_live_test_secret_12345';

  beforeEach(() => {
    mockPaymentService = {
      processTransaction: vi.fn().mockResolvedValue({ success: true }),
      processRevenueCatTransaction: vi.fn().mockResolvedValue({ success: true }),
    };

    process.env.SEPAY_SECRET_KEY = testSecret;
    controller = new PaymentController(mockPaymentService as unknown as PaymentService);
  });

  const validPayload = {
    id: 999,
    gateway: 'TPBank',
    transactionDate: '2026-09-12 14:00:00',
    accountNumber: '36889338888',
    code: null,
    content: 'TVTT ABCD1234 test payment',
    transferType: 'in',
    transferAmount: 10000,
    accumulated: 10000,
    referenceCode: 'FT12345',
    description: 'test'
  };

  it('authenticates successfully via valid HMAC-SHA256 signature with timestamp', async () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const rawBody = JSON.stringify(validPayload);
    const signatureHex = crypto
      .createHmac('sha256', testSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

    const result = await controller.handleSepayWebhook(
      undefined,
      `sha256=${signatureHex}`,
      timestamp,
      { rawBody: Buffer.from(rawBody) } as any,
      validPayload,
    );

    expect(result).toEqual({ success: true });
    expect(mockPaymentService.processTransaction).toHaveBeenCalled();
  });

  it('authenticates successfully via valid Authorization Apikey token', async () => {
    const result = await controller.handleSepayWebhook(
      `Apikey ${testSecret}`,
      undefined,
      undefined,
      {} as any,
      validPayload,
    );

    expect(result).toEqual({ success: true });
    expect(mockPaymentService.processTransaction).toHaveBeenCalled();
  });

  it('rejects expired timestamp in HMAC-SHA256 (older than 5 minutes)', async () => {
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString();
    const rawBody = JSON.stringify(validPayload);
    const signatureHex = crypto
      .createHmac('sha256', testSecret)
      .update(`${oldTimestamp}.${rawBody}`)
      .digest('hex');

    await expect(
      controller.handleSepayWebhook(
        undefined,
        `sha256=${signatureHex}`,
        oldTimestamp,
        { rawBody: Buffer.from(rawBody) } as any,
        validPayload,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects invalid HMAC-SHA256 signature', async () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const rawBody = JSON.stringify(validPayload);

    await expect(
      controller.handleSepayWebhook(
        undefined,
        'sha256=invalid_hash_signature',
        timestamp,
        { rawBody: Buffer.from(rawBody) } as any,
        validPayload,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
