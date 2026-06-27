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

  // Backlog #24: bốn kiểu trải bài mới (single/diamond/moon/horseshoe) thêm vào SPREAD_POSITIONS +
  // SPREAD_LABELS_VI nhưng chưa có test riêng. Một vòng parameterized chốt: prompt gắn đúng nhãn kiểu
  // trải, dùng đúng nhãn vị trí đầu/cuối theo số lá, không lẫn chữ Hán, và bật quy tắc quan hệ giữa
  // các lá cho mọi trải nhiều lá — bắt lỗi lệch nhãn vị trí + thiếu quy tắc đa lá khi thêm spread.
  const swordRanks = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const buildCards = (count: number): (TarotCardDraw & { position: number })[] =>
    swordRanks.slice(0, count).map((rank, index) => card(`swords_${rank}`, `Kiếm ${rank}`, false, index));

  const spreadCases = [
    { spread: 'single' as const, count: 1, label: 'trải bài một lá', first: 'Thông điệp cốt lõi', last: 'Thông điệp cốt lõi' },
    { spread: 'three-card' as const, count: 3, label: 'trải bài ba lá', first: 'Quá khứ', last: 'Tương lai' },
    { spread: 'diamond' as const, count: 4, label: 'trải bài kim cương (4 lá)', first: 'Tình hình hiện tại', last: 'Kết quả hướng tới' },
    { spread: 'moon' as const, count: 4, label: 'trải bài tuần trăng (4 lá)', first: 'Trăng non - khởi đầu', last: 'Trăng tối - chuyển hóa' },
    { spread: 'horseshoe' as const, count: 7, label: 'trải bài móng ngựa (7 lá)', first: 'Quá khứ', last: 'Kết quả có thể tới' },
    { spread: 'celtic-cross' as const, count: 10, label: 'trải bài Celtic Cross (10 lá)', first: 'Cốt lõi vấn đề', last: 'Kết quả có thể tới' },
  ];

  it.each(spreadCases)('$spread: nhãn kiểu trải + nhãn vị trí đầu/cuối + không chữ Hán', ({ spread, count, label, first, last }) => {
    const prompt = buildTarotReadingPrompt('Câu hỏi mẫu', spread, buildCards(count));
    expect(prompt).toContain(label);
    expect(prompt).toContain(`[${first}]`);
    expect(prompt).toContain(`[${last}]`);
    expect(HAN_TEXT_PATTERN.test(prompt)).toBe(false);
    // Quy tắc luận quan hệ giữa các lá chỉ áp cho trải nhiều lá; trải một lá không kích hoạt.
    if (count > 1) {
      expect(prompt).toContain('Phân tích quan hệ GIỮA các lá');
    }
  });
});
