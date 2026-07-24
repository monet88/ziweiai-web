import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { apiEnv } from '../../config/env';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  const mockPaymentService = {
    processTransaction: vi.fn().mockResolvedValue(undefined),
    processRevenueCatTransaction: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
    vi.clearAllMocks();
  });

  describe('handleSepayWebhook', () => {
    it('should throw UnauthorizedException when auth header is invalid and secret is set', async () => {
      const originalSecret = apiEnv.SEPAY_WEBHOOK_SECRET;
      Object.assign(apiEnv, { SEPAY_WEBHOOK_SECRET: 'test-secret' });

      try {
        await expect(
          controller.handleSepayWebhook('Bearer wrong-secret', {
            id: 123,
            gateway: 'MBBank',
            transactionDate: '2026-07-24 12:00:00',
            accountNumber: '0123456789',
            code: null,
            content: 'TVTT 12345678',
            transferType: 'in',
            transferAmount: 50000,
            accumulated: 150000,
            referenceCode: 'REF123',
            description: 'Test',
          }),
        ).rejects.toThrow(UnauthorizedException);
      } finally {
        Object.assign(apiEnv, { SEPAY_WEBHOOK_SECRET: originalSecret });
      }
    });

    it('should process transaction successfully with valid payload', async () => {
      const payload = {
        id: 123,
        gateway: 'MBBank',
        transactionDate: '2026-07-24 12:00:00',
        accountNumber: '0123456789',
        code: null,
        content: 'TVTT 12345678',
        transferType: 'in',
        transferAmount: 50000,
        accumulated: 150000,
        referenceCode: 'REF123',
        description: 'Test',
      };

      const result = await controller.handleSepayWebhook('', payload);
      expect(result).toEqual({ success: true });
      expect(service.processTransaction).toHaveBeenCalledWith(payload);
    });

    it('should throw BadRequestException on invalid payload format', async () => {
      await expect(
        controller.handleSepayWebhook('', { invalidField: true }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
