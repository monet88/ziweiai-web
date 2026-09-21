import { describe, expect, it } from 'vitest';
import { b2bInquiryRequestSchema, b2bInquiryResponseSchema } from './inquiry';

describe('b2b inquiry contracts', () => {
  it('validates a valid B2B inquiry request', () => {
    const valid = {
      fullName: 'Nguyễn Văn A',
      phone: '0988123456',
      email: 'a.nguyen@example.com',
      company: 'Tập đoàn Bất Động Sản Hoàng Kim',
      need: 'phong_thuy',
      message: 'Tôi muốn tư vấn hướng đất cho khu biệt thự cao cấp.',
    };
    const parsed = b2bInquiryRequestSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('accepts minimal required fields (fullName, phone)', () => {
    const minimal = {
      fullName: 'Trần Thị B',
      phone: '+84912345678',
    };
    const parsed = b2bInquiryRequestSchema.safeParse(minimal);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.need).toBe('phong_thuy'); // Default
    }
  });

  it('rejects invalid phone format', () => {
    const invalidPhone = {
      fullName: 'Lê Văn C',
      phone: '123456',
    };
    const parsed = b2bInquiryRequestSchema.safeParse(invalidPhone);
    expect(parsed.success).toBe(false);
  });

  it('rejects too short fullName', () => {
    const invalidName = {
      fullName: 'A',
      phone: '0988123456',
    };
    const parsed = b2bInquiryRequestSchema.safeParse(invalidName);
    expect(parsed.success).toBe(false);
  });

  it('validates response schema', () => {
    const res = {
      success: true,
      id: '123e4567-e89b-12d3-a456-426614174000',
      createdAt: new Date().toISOString(),
      message: 'Tiếp nhận yêu cầu thành công',
    };
    const parsed = b2bInquiryResponseSchema.safeParse(res);
    expect(parsed.success).toBe(true);
  });
});
