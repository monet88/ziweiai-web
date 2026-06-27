import { describe, expect, it } from 'vitest';
import { divinationStickSchema, stickDrawSchema, stickLevelSchema } from './stick-draw';

const validStick = {
  id: 1,
  level: 'Thượng thượng' as const,
  title: 'Đại cát đại lợi',
  poem: 'Trời mở đất khai kết lương duyên.',
  interpretation: 'Quẻ thượng thượng, vạn sự hanh thông.',
  advice: 'Giữ chính trực, nắm bắt cơ hội.',
  categories: { career: 'Sự nghiệp thuận lợi.' },
};

describe('stickDrawSchema (US-039)', () => {
  it('parse tất cả 7 mức xếp hạng', () => {
    for (const level of ['Thượng thượng', 'Thượng', 'Trung thượng', 'Trung', 'Trung hạ', 'Hạ', 'Hạ hạ']) {
      expect(stickLevelSchema.safeParse(level).success).toBe(true);
    }
  });

  it('từ chối mức xếp hạng lạ', () => {
    expect(stickLevelSchema.safeParse('Siêu cấp').success).toBe(false);
  });

  it('parse một quẻ hợp lệ (story/dailyPoem/detailed optional)', () => {
    expect(divinationStickSchema.safeParse(validStick).success).toBe(true);
  });

  it('từ chối id ngoài 1..100', () => {
    expect(divinationStickSchema.safeParse({ ...validStick, id: 0 }).success).toBe(false);
    expect(divinationStickSchema.safeParse({ ...validStick, id: 101 }).success).toBe(false);
  });

  it('parse payload rút quẻ đầy đủ', () => {
    const result = stickDrawSchema.safeParse({
      question: 'Công việc sắp tới ra sao?',
      stick: validStick,
      narrative: 'Luận giải dẫn dắt theo câu hỏi.',
      seed: 'seed-1',
    });
    expect(result.success).toBe(true);
  });

  it('từ chối khi thiếu narrative', () => {
    expect(stickDrawSchema.safeParse({ question: 'x', stick: validStick }).success).toBe(false);
  });
});
