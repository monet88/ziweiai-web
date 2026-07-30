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


});
