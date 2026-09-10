import { describe, it, expect } from 'vitest';
import {
  divinationChatRequestSchema,
  divinationChatResponseSchema,
  compatibilityExplainRequestSchema,
  compatibilityExplainResponseSchema,
} from './divination-chat';

describe('Divination Chat & Compatibility Schemas', () => {
  it('validates valid DivinationChatRequest', () => {
    const valid = { question: 'Vận tài lộc năm nay thế nào?', topic: 'Tài Lộc' };
    const res = divinationChatRequestSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects empty question in DivinationChatRequest', () => {
    const invalid = { question: '   ' };
    const res = divinationChatRequestSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates valid DivinationChatResponse', () => {
    const res = divinationChatResponseSchema.safeParse({ answer: 'Lời ngự phê cát tường...', costXu: 1 });
    expect(res.success).toBe(true);
  });

  it('validates CompatibilityExplainRequest', () => {
    const valid = {
      person1: { name: 'Nguyễn Văn A', birthYear: 1995, gender: 'male', lunarYearCanChi: 'Ất Hợi', element: 'Hỏa' },
      person2: { name: 'Trần Thị B', birthYear: 1998, gender: 'female', lunarYearCanChi: 'Mậu Dần', element: 'Thổ' },
      overallScore: 88,
      verdictTitle: 'Thiên Duyên Tiền Định',
    };
    const res = compatibilityExplainRequestSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('validates CompatibilityExplainResponse with default costXu 15', () => {
    const res = compatibilityExplainResponseSchema.safeParse({ explanation: 'Bản luận giải đôi lứa...' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.costXu).toBe(15);
    }
  });
});
