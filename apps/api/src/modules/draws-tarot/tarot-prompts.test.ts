import { describe, expect, it } from 'vitest';
import type { TarotCardDraw } from './tarot-deck';
import { buildTarotReadingPrompt } from './tarot-prompts';

const HAN_TEXT_PATTERN = /\p{Script=Han}/u;

function card(id: string, name: string, reversed: boolean, position: number): TarotCardDraw & { position: number } {
  return { id, name, reversed, position };
}

describe('buildTarotReadingPrompt', () => {
  const threeCard = [
    card('major_00', 'Kẻ Khờ (The Fool)', false, 0),
    card('cups_ace', 'Cốc Át', true, 1),
    card('swords_ten', 'Kiếm Mười', false, 2),
  ];

  it('là deterministic: cùng input cho cùng prompt', () => {
    const a = buildTarotReadingPrompt('Tôi nên tập trung điều gì?', 'three-card', threeCard);
    const b = buildTarotReadingPrompt('Tôi nên tập trung điều gì?', 'three-card', threeCard);
    expect(a).toBe(b);
  });

  it('không chứa chữ Hán', () => {
    const prompt = buildTarotReadingPrompt('Tình duyên năm nay thế nào?', 'three-card', threeCard);
    expect(HAN_TEXT_PATTERN.test(prompt)).toBe(false);
  });

  it('chèn câu hỏi, lá đã rút, nhãn vị trí và đánh dấu lá ngược', () => {
    const prompt = buildTarotReadingPrompt('Tôi nên tập trung điều gì?', 'three-card', threeCard);
    expect(prompt).toContain('Tôi nên tập trung điều gì?');
    expect(prompt).toContain('trải bài ba lá');
    expect(prompt).toContain('[Quá khứ] Kẻ Khờ (The Fool) — xuôi');
    expect(prompt).toContain('[Hiện tại] Cốc Át — ngược');
    expect(prompt).toContain('## Tóm lại');
  });

  it('three-card tính đúng tỉ lệ lá Ẩn Chính', () => {
    const prompt = buildTarotReadingPrompt('Câu hỏi', 'three-card', threeCard);
    // 1/3 major ≈ 33%
    expect(prompt).toContain('33% (1/3 lá)');
  });

  it('celtic-cross dùng nhãn 10 vị trí và yêu cầu quan hệ giữa các lá', () => {
    // Dùng id hợp lệ trong TAROT_DECK (10 lá đầu của chất Kiếm: ace..ten) để fixture phản ánh đúng
    // dạng id thật, tránh gây hiểu nhầm cho người đọc sau này.
    const swordRanks = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    const ten = swordRanks.map((rank, index) => card(`swords_${rank}`, `Kiếm ${rank}`, false, index));
    const prompt = buildTarotReadingPrompt('Tình huống phức tạp', 'celtic-cross', ten);
    expect(prompt).toContain('trải bài Celtic Cross (10 lá)');
    expect(prompt).toContain('[Cốt lõi vấn đề]');
    expect(prompt).toContain('[Kết quả có thể tới]');
    expect(prompt).toContain('Phân tích quan hệ GIỮA các lá');
  });
});
