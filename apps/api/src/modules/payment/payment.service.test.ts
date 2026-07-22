import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockSupabaseClient: any;

  beforeEach(async () => {
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      rpc: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: SUPABASE_CLIENT,
          useValue: mockSupabaseClient,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('processTransaction (SePay)', () => {
    it('should skip if no valid TVTT code is in content', async () => {
      await service.processTransaction({
        id: 1,
        gateway: 'MB',
        transactionDate: '2023-10-10',
        accountNumber: '123',
        code: null,
        content: 'Chuyen tien nhe',
        transferType: 'in',
        transferAmount: 50000,
        accumulated: 100000,
        referenceCode: 'ref1',
        description: 'desc',
      });
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should add XU and record transaction if valid', async () => {
      // 1. Transaction not found
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      // 2. User found
      mockSupabaseClient.ilike.mockResolvedValueOnce({
        data: [{ user_id: 'a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }],
        error: null,
      });
      // 3. Insert tx
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null });
      // 4. RPC add_xu
      mockSupabaseClient.rpc.mockResolvedValueOnce({ error: null });

      await service.processTransaction({
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
      });

      // Verifications
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('transactions');
      expect(mockSupabaseClient.ilike).toHaveBeenCalledWith('user_id', 'a1b2c3d4-%');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        owner_user_id: 'a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        amount_vnd: 50000,
        xu_added: 50,
        sepay_transaction_id: '2',
      });
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('add_xu', {
        user_id: 'a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        amount: 50,
      });
    });
  });

  describe('processRevenueCatTransaction', () => {
    it('should add XU based on product mapping', async () => {
      // 1. Transaction not found
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      // 2. Insert tx
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null });
      // 3. RPC add_xu
      mockSupabaseClient.rpc.mockResolvedValueOnce({ error: null });

      await service.processRevenueCatTransaction({
        event: {
          type: 'INITIAL_PURCHASE',
          id: 'evt_123',
          app_user_id: 'user123',
          product_id: 'xu_100_tier1',
          price: 100000,
        } as any,
        api_version: '1.0'
      });

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        owner_user_id: 'user123',
        amount_vnd: 100000,
        xu_added: 100,
        revenuecat_transaction_id: 'evt_123',
      });
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('add_xu', {
        user_id: 'user123',
        amount: 100,
      });
    });
  });
});
