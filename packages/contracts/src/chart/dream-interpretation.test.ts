import { describe, expect, it } from 'vitest';
import { dreamInterpretationSchema, dreamSymbolSchema } from './dream-interpretation';

describe('dreamInterpretationSchema (US-038)', () => {
  const symbol = {
    keywords: ['Rắn', 'Trăn'],
    meaning: 'Rắn đại diện cho thay đổi.',
    category: 'Động vật',
    positive: 'Trí tuệ.',
    negative: 'Cảnh giác.',
    advice: 'Quan sát thay đổi.',
  };

  it('parses a full interpretation', () => {
    const result = dreamInterpretationSchema.safeParse({
      dream: 'Tôi mơ thấy một con rắn lớn.',
      symbols: [symbol],
      narrative: 'Giấc mơ gợi ý một chuyển biến sắp tới.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty symbols array (LLM luận tự do)', () => {
    const result = dreamInterpretationSchema.safeParse({
      dream: 'Một giấc mơ rất lạ.',
      symbols: [],
      narrative: 'Luận giải tự do.',
    });
    expect(result.success).toBe(true);
  });

  it('allows optional positive/negative/advice to be absent', () => {
    const result = dreamSymbolSchema.safeParse({
      keywords: ['Nước'],
      meaning: 'Cảm xúc.',
      category: 'Tự nhiên',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty dream string', () => {
    const result = dreamInterpretationSchema.safeParse({ dream: '', symbols: [], narrative: 'x' });
    expect(result.success).toBe(false);
  });

  it('rejects a symbol with no keywords', () => {
    const result = dreamSymbolSchema.safeParse({ keywords: [], meaning: 'x', category: 'y' });
    expect(result.success).toBe(false);
  });
});
