import { Test, TestingModule } from '@nestjs/testing';
import { WalletEngineService } from './wallet-engine.service';
import { SUPABASE_CLIENT } from '../../database/supabase-client';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('WalletEngineService', () => {
  let service: WalletEngineService;
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
        WalletEngineService,
        {
          provide: SUPABASE_CLIENT,
          useValue: mockSupabaseClient,
        },
      ],
    }).compile();

    service = module.get<WalletEngineService>(WalletEngineService);
  });

  describe('getBalance', () => {
    it('should return user xu_balance', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { xu_balance: 150 },
        error: null,
      });

      const balance = await service.getBalance('user-uuid-1');
      expect(balance).toBe(150);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-uuid-1');
    });

    it('should throw error if profile not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.getBalance('non-existent')).rejects.toThrow('Profile not found');
    });
  });

  describe('deductXU', () => {
    it('should return true on successful deduction via log_xu_transaction RPC', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: true, error: null });

      const result = await service.deductXU('user-uuid-1', 10, 'ai_usage');
      expect(result).toBe(true);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('log_xu_transaction', {
        p_user_id: 'user-uuid-1',
        p_amount: -10,
        p_transaction_type: 'ai_usage',
      });
    });

    it('should return false if RPC returns error (e.g. insufficient balance)', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Insufficient balance' } });

      const result = await service.deductXU('user-uuid-1', 50);
      expect(result).toBe(false);
    });

    it('should return true immediately if amount <= 0', async () => {
      const result = await service.deductXU('user-uuid-1', 0);
      expect(result).toBe(true);
      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
    });
  });

  describe('addXU', () => {
    it('should add XU via log_xu_transaction RPC', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: true, error: null });

      const result = await service.addXU('user-uuid-1', 20, 'sepay_topup');
      expect(result).toBe(true);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('log_xu_transaction', {
        p_user_id: 'user-uuid-1',
        p_amount: 20,
        p_transaction_type: 'sepay_topup',
        p_actor_email: null,
      });
    });

    it('should fallback to add_xu RPC if log_xu_transaction errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC missing' } });
      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.addXU('user-uuid-1', 20, 'sepay_topup');
      expect(result).toBe(true);
      expect(mockSupabaseClient.rpc).toHaveBeenLastCalledWith('add_xu', {
        user_id: 'user-uuid-1',
        amount: 20,
      });
    });
  });

  describe('processSePayDeposit', () => {
    it('should skip if content has no TVTT code', async () => {
      await service.processSePayDeposit({
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
      });

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should process deposit, insert transaction, and credit XU', async () => {
      // 1. Existing tx check -> null
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      // 2. User lookup -> found user list
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      })).mockImplementationOnce(() => ({
        select: async () => ({
          data: [{ user_id: '12345678-abcd-1234-5678-123456789012' }],
          error: null,
        }),
      }));
      // 3. Insert transaction -> ok
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null });
      // 4. add_xu RPC -> ok
      mockSupabaseClient.rpc.mockResolvedValueOnce({ error: null });

      await service.processSePayDeposit({
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
      });

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        owner_user_id: '12345678-abcd-1234-5678-123456789012',
        amount_vnd: 50000,
        xu_added: 50,
        sepay_transaction_id: '101',
      });
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('add_xu', {
        user_id: '12345678-abcd-1234-5678-123456789012',
        amount: 50,
      });
    });
  });

  describe('processRevenueCatDeposit', () => {
    it('should add XU based on product mapping', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null });
      mockSupabaseClient.rpc.mockResolvedValueOnce({ error: null });

      await service.processRevenueCatDeposit({
        event: {
          type: 'INITIAL_PURCHASE',
          id: 'evt_rc_1',
          app_user_id: 'user_rc',
          product_id: 'xu_500_tier2',
          price: 500000,
        } as any,
        api_version: '1.0',
      });

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        owner_user_id: 'user_rc',
        amount_vnd: 500000,
        xu_added: 500,
        revenuecat_transaction_id: 'evt_rc_1',
      });
    });
  });
});
