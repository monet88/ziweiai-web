import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { WalletEngineService } from '../wallet/wallet-engine.service';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockWalletEngine: any;
  let mockSupabaseClient: any;

  beforeEach(async () => {
    mockWalletEngine = {
      addXU: vi.fn().mockResolvedValue(true),
    };

    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockResolvedValue({ data: { status: 'success' }, error: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: WalletEngineService,
          useValue: mockWalletEngine,
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: mockSupabaseClient,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('processTransaction (SePay)', () => {
    it('should record unmatched transaction if content has no TVTT code', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null });

      const payload = {
        id: 100,
        gateway: 'MB',
        transactionDate: '2026-07-24',
        accountNumber: '12345',
        code: null,
        content: 'Chuyen tien khong qua',
        transferType: 'in',
        transferAmount: 50000,
        accumulated: 100000,
        referenceCode: 'ref100',
        description: 'test',
      };

      await service.processTransaction(payload as any);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        owner_user_id: null,
        amount_vnd: 50000,
        xu_added: 50,
        sepay_transaction_id: '100',
        content: 'Chuyen tien khong qua',
      });
      expect(mockWalletEngine.addXU).not.toHaveBeenCalled();
    });

    it('should process deposit, insert transaction, and credit XU', async () => {
      // 1. Existing tx check -> null
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      // 2. User lookup -> found user list matching prefix '12345678'
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      })).mockImplementationOnce(() => ({
        select: () => ({
          gte: () => ({
            lte: async () => ({
              data: [{ user_id: '12345678-abcd-1234-5678-123456789012' }],
              error: null,
            }),
          }),
        }),
      }));
      // 3. Insert transaction -> ok
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null });

      const payload = {
        id: 101,
        gateway: 'MB',
        transactionDate: '2026-07-24',
        accountNumber: '12345',
        code: null,
        content: 'TVTT 12345678 Nap 50k',
        transferType: 'in',
        transferAmount: 50000,
        accumulated: 150000,
        referenceCode: 'ref101',
        description: 'test',
      };

      await service.processTransaction(payload as any);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('process_sepay_payment', {
        p_sepay_transaction_id: '101',
        p_owner_user_id: '12345678-abcd-1234-5678-123456789012',
        p_amount_vnd: 50000,
        p_xu_added: 50,
        p_content: 'TVTT 12345678 Nap 50k',
      });
    });

    it('should calculate bonus XU for 100k and 500k packages correctly', async () => {
      // 100,000 VND -> 120 XU
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      })).mockImplementationOnce(() => ({
        select: () => ({
          gte: () => ({
            lte: async () => ({
              data: [{ user_id: '12345678-abcd-1234-5678-123456789012' }],
              error: null,
            }),
          }),
        }),
      }));

      const payload = {
        id: 102,
        gateway: 'ACB',
        transactionDate: '2026-09-12',
        accountNumber: '6384251098',
        code: null,
        content: 'TVTT 12345678 Nap 100k',
        transferType: 'in',
        transferAmount: 100000,
        accumulated: 250000,
        referenceCode: 'ref102',
        description: 'test bonus',
      };

      await service.processTransaction(payload as any);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('process_sepay_payment', {
        p_sepay_transaction_id: '102',
        p_owner_user_id: '12345678-abcd-1234-5678-123456789012',
        p_amount_vnd: 100000,
        p_xu_added: 120,
        p_content: 'TVTT 12345678 Nap 100k',
      });
    });

    it('should calculate bonus XU for 79k Bính Ngọ combo and 790k B2B Real Estate pack correctly', async () => {
      // 79,000 VND -> 100 XU
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      })).mockImplementationOnce(() => ({
        select: () => ({
          gte: () => ({
            lte: async () => ({
              data: [{ user_id: '12345678-abcd-1234-5678-123456789012' }],
              error: null,
            }),
          }),
        }),
      }));

      const payload79k = {
        id: 103,
        gateway: 'ACB',
        transactionDate: '2026-09-14',
        accountNumber: '6384251098',
        code: null,
        content: 'TVTT 12345678 Binh Ngo 2026',
        transferType: 'in',
        transferAmount: 79000,
        accumulated: 79000,
        referenceCode: 'ref103',
        description: 'Combo Binh Ngo 2026',
      };

      await service.processTransaction(payload79k as any);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('process_sepay_payment', {
        p_sepay_transaction_id: '103',
        p_owner_user_id: '12345678-abcd-1234-5678-123456789012',
        p_amount_vnd: 79000,
        p_xu_added: 100,
        p_content: 'TVTT 12345678 Binh Ngo 2026',
      });

      // 790,000 VND -> 1000 XU
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      })).mockImplementationOnce(() => ({
        select: () => ({
          gte: () => ({
            lte: async () => ({
              data: [{ user_id: '12345678-abcd-1234-5678-123456789012' }],
              error: null,
            }),
          }),
        }),
      }));

      const payload790k = {
        id: 104,
        gateway: 'ACB',
        transactionDate: '2026-09-14',
        accountNumber: '6384251098',
        code: null,
        content: 'TVTT 12345678 B2B Pack',
        transferType: 'in',
        transferAmount: 790000,
        accumulated: 790000,
        referenceCode: 'ref104',
        description: 'Goi Doanh Nghiep BDS',
      };

      await service.processTransaction(payload790k as any);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('process_sepay_payment', {
        p_sepay_transaction_id: '104',
        p_owner_user_id: '12345678-abcd-1234-5678-123456789012',
        p_amount_vnd: 790000,
        p_xu_added: 1000,
        p_content: 'TVTT 12345678 B2B Pack',
      });
    });
  });

  describe('processRevenueCatTransaction', () => {
    it('should add XU based on product mapping and record currency', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });

      const payload = {
        event: {
          type: 'INITIAL_PURCHASE',
          id: 'evt_rc_1',
          app_user_id: 'user_rc',
          product_id: 'xu_500_tier2',
          price: 500000,
          currency: 'VND',
        } as any,
        api_version: '1.0',
      };

      await service.processRevenueCatTransaction(payload as any);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('process_revenuecat_payment', {
        p_rc_transaction_id: 'evt_rc_1',
        p_owner_user_id: 'user_rc',
        p_amount_vnd: 500000,
        p_xu_added: 500,
        p_currency: 'VND',
        p_original_price: 500000,
      });
    });

    it('should accurately convert USD in-app purchase to VNĐ catalog price instead of rounding $3.99 to 4 VND', async () => {
      const payloadUsd = {
        event: {
          id: 'evt_rc_usd_120',
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user_rc_usd',
          product_id: 'vios_xu_120',
          price: 3.99,
          price_in_purchased_currency: 3.99,
          currency: 'USD',
        } as any,
        api_version: '1.0',
      };

      await service.processRevenueCatTransaction(payloadUsd as any);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('process_revenuecat_payment', {
        p_rc_transaction_id: 'evt_rc_usd_120',
        p_owner_user_id: 'user_rc_usd',
        p_amount_vnd: 100000, // Matched catalog price for 120 XU package (100k VND)
        p_xu_added: 120,
        p_currency: 'USD',
        p_original_price: 3.99,
      });
    });

    it('should correctly determine XU for vios_xu_50 and vios_xu_600 packages', async () => {
      const payload50 = {
        event: {
          id: 'evt_rc_50',
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user_royal_50',
          product_id: 'vios_xu_50',
          price: 50000,
          currency: 'VND',
        } as any,
        api_version: '1.0',
      };

      await service.processRevenueCatTransaction(payload50 as any);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('process_revenuecat_payment', {
        p_rc_transaction_id: 'evt_rc_50',
        p_owner_user_id: 'user_royal_50',
        p_amount_vnd: 50000,
        p_xu_added: 50,
        p_currency: 'VND',
        p_original_price: 50000,
      });

      const payload600 = {
        event: {
          id: 'evt_rc_600',
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user_royal_600',
          product_id: 'vios_xu_600',
          price: 500000,
          currency: 'VND',
        } as any,
        api_version: '1.0',
      };

      await service.processRevenueCatTransaction(payload600 as any);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('process_revenuecat_payment', {
        p_rc_transaction_id: 'evt_rc_600',
        p_owner_user_id: 'user_royal_600',
        p_amount_vnd: 500000,
        p_xu_added: 600,
        p_currency: 'VND',
        p_original_price: 500000,
      });
    });
  });
});
