import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { WalletEngineService } from '../wallet/wallet-engine.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockWalletEngine: any;

  beforeEach(async () => {
    mockWalletEngine = {
      processSePayDeposit: vi.fn().mockResolvedValue(undefined),
      processRevenueCatDeposit: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: WalletEngineService,
          useValue: mockWalletEngine,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('processTransaction (SePay)', () => {
    it('should delegate processSePayDeposit to WalletEngineService', async () => {
      const payload = {
        id: 2,
        gateway: 'MB',
        transactionDate: '2023-10-10',
        accountNumber: '123',
        code: null,
        content: 'TVTT a1b2c3d4 nap XU',
        transferType: 'in',
        transferAmount: 50000,
        accumulated: 100000,
        referenceCode: 'ref2',
        description: 'desc',
      };

      await service.processTransaction(payload);
      expect(mockWalletEngine.processSePayDeposit).toHaveBeenCalledWith(payload);
    });
  });

  describe('processRevenueCatTransaction', () => {
    it('should delegate processRevenueCatDeposit to WalletEngineService', async () => {
      const payload = {
        event: {
          type: 'INITIAL_PURCHASE',
          id: 'evt_123',
          app_user_id: 'user123',
          product_id: 'xu_100_tier1',
          price: 100000,
        } as any,
        api_version: '1.0',
      };

      await service.processRevenueCatTransaction(payload);
      expect(mockWalletEngine.processRevenueCatDeposit).toHaveBeenCalledWith(payload);
    });
  });
});
