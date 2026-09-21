import { HttpStatus } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { B2bService } from './b2b.service';

describe('B2bService', () => {
  let service: B2bService;
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    service = new B2bService(mockSupabase as unknown as SupabaseClient);
  });

  it('rejects invalid payload (short name, bad phone) with 400 INVALID_INPUT', async () => {
    await expect(
      service.submitInquiry({ fullName: 'A', phone: '123' }),
    ).rejects.toThrow(ApiErrorHttpException);
    try {
      await service.submitInquiry({ fullName: 'A', phone: '123' });
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiErrorHttpException);
      if (err instanceof ApiErrorHttpException) {
        expect(err.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        const res = err.getResponse() as { code: string; message: string };
        expect(res.code).toBe('INVALID_INPUT');
      }
    }
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('inserts valid inquiry and returns response with uuid and createdAt', async () => {
    const mockRow = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      created_at: new Date().toISOString(),
    };
    mockSupabase.single.mockResolvedValueOnce({ data: mockRow, error: null });

    const res = await service.submitInquiry({
      fullName: 'Hoàng Minh Thắng',
      phone: '0988123456',
      email: 'thang@viettel.vn',
      company: 'Tập đoàn BĐS Đất Vàng',
      need: 'ho_so_hoang_gia',
      message: 'Cần đặt 20 cuốn in màu A4 sang trọng.',
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('b2b_inquiries');
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      full_name: 'Hoàng Minh Thắng',
      phone: '0988123456',
      email: 'thang@viettel.vn',
      company: 'Tập đoàn BĐS Đất Vàng',
      need: 'ho_so_hoang_gia',
      message: 'Cần đặt 20 cuốn in màu A4 sang trọng.',
    });
    expect(res.success).toBe(true);
    expect(res.id).toBe(mockRow.id);
    expect(res.createdAt).toBe(mockRow.created_at);
  });

  it('handles database error by throwing 500 INTERNAL_ERROR', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Connection timeout' },
    });

    await expect(
      service.submitInquiry({
        fullName: 'Lê Văn Tám',
        phone: '0912345678',
      }),
    ).rejects.toThrow(ApiErrorHttpException);
  });
});
