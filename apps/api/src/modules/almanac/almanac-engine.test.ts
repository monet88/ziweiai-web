import { describe, expect, it } from 'vitest';
import { generateAlmanacSelection, AlmanacEngineError, AlmanacVocabError } from './almanac-engine';
import { ALMANAC_VOCAB } from './data/almanac-vocab-data';

// Pattern Han/CJK đồng bộ scripts/translate/core.ts: chốt bất biến "0 chữ Hán lọt ra ngoài engine".
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

function collectStrings(value: unknown, sink: string[]): void {
  if (typeof value === 'string') {
    sink.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, sink));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, sink));
  }
}

describe('generateAlmanacSelection (US-040)', () => {
  it('sinh đúng số ngày trong khoảng + sort điểm giảm dần', () => {
    const { days } = generateAlmanacSelection({
      topic: 'marriage',
      topicLabel: 'Cưới hỏi',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
    });
    expect(days).toHaveLength(10);
    for (let i = 1; i < days.length; i += 1) {
      expect(days[i - 1].score).toBeGreaterThanOrEqual(days[i].score);
    }
  });

  it('mọi chuỗi hiển thị KHÔNG còn chữ Hán (Han-gate qua bảng overlay)', () => {
    const { days } = generateAlmanacSelection({
      topic: 'opening',
      topicLabel: 'Khai trương',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    });
    const strings: string[] = [];
    collectStrings(days, strings);
    const dirty = strings.filter((value) => CJK_TEXT_PATTERN.test(value));
    expect(dirty).toEqual([]);
  });

  it('điểm nằm trong [0, 100] và mọi field bắt buộc có mặt', () => {
    const { days } = generateAlmanacSelection({
      topic: 'travel',
      topicLabel: 'Xuất hành',
      startDate: '2026-06-01',
      endDate: '2026-06-07',
    });
    for (const day of days) {
      expect(day.score).toBeGreaterThanOrEqual(0);
      expect(day.score).toBeLessThanOrEqual(100);
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(day.weekday.length).toBeGreaterThan(0);
      expect(day.lunarDate.length).toBeGreaterThan(0);
      expect(day.dayOfficer.length).toBeGreaterThan(0);
      expect(day.ganzhi.day.length).toBeGreaterThan(0);
    }
  });

  it('ném khi khoảng ngày đảo ngược', () => {
    expect(() =>
      generateAlmanacSelection({
        topic: 'custom',
        topicLabel: 'Việc tùy chọn',
        startDate: '2026-02-10',
        endDate: '2026-02-01',
      }),
    ).toThrow(AlmanacEngineError);
  });

  it('ném khi khoảng ngày vượt 31 ngày', () => {
    expect(() =>
      generateAlmanacSelection({
        topic: 'custom',
        topicLabel: 'Việc tùy chọn',
        startDate: '2026-01-01',
        endDate: '2026-03-01',
      }),
    ).toThrow(AlmanacEngineError);
  });

  it('ném khi định dạng ngày sai', () => {
    expect(() =>
      generateAlmanacSelection({
        topic: 'custom',
        topicLabel: 'Việc tùy chọn',
        startDate: '2026/01/01',
        endDate: '2026-01-05',
      }),
    ).toThrow(AlmanacEngineError);
  });

  it('bảng overlay có giá trị tiếng Việt sạch Hán', () => {
    const values = Object.values(ALMANAC_VOCAB);
    expect(values.length).toBeGreaterThan(0);
    const dirty = values.filter((value) => CJK_TEXT_PATTERN.test(value));
    expect(dirty).toEqual([]);
  });

  it('28 tú dịch qua bảng riêng: tên sao thuộc tập 28 phiên Hán-Việt, KHÔNG lẫn con giáp', () => {
    // Khử nhập nhằng collision key bảng phẳng: "牛" là sao "Ngưu" (không phải con giáp "Trâu").
    const STAR_NAMES_VI = new Set([
      'Giác', 'Cang', 'Đê', 'Phòng', 'Tâm', 'Vĩ', 'Cơ',
      'Đẩu', 'Ngưu', 'Nữ', 'Hư', 'Nguy', 'Thất', 'Bích',
      'Khuê', 'Lâu', 'Vị', 'Mão', 'Tất', 'Chủy', 'Sâm',
      'Tỉnh', 'Quỷ', 'Liễu', 'Tinh', 'Trương', 'Dực', 'Chẩn',
    ]);
    const ZODIAC_VI = new Set(['Chuột', 'Trâu', 'Hổ', 'Mèo', 'Rồng', 'Rắn', 'Ngựa', 'Dê', 'Khỉ', 'Gà', 'Chó', 'Lợn']);
    const { days } = generateAlmanacSelection({
      topic: 'custom',
      topicLabel: 'Việc tùy chọn',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    for (const day of days) {
      expect(STAR_NAMES_VI.has(day.twentyEightStar)).toBe(true);
      // Tên sao không được rơi vào nhãn con giáp (trừ "Ngưu" vốn không trùng tên con giáp nào).
      expect(ZODIAC_VI.has(day.twentyEightStar)).toBe(false);
    }
  });

  it('AlmanacVocabError tách hẳn khỏi AlmanacEngineError (không bị gộp vào nhánh 400)', () => {
    // Bất biến phân loại lỗi: Han-gate thiếu mục từ điển là defect dữ liệu nội bộ (→ 500), KHÔNG
    // phải lỗi input (→ 400). Service chỉ bắt AlmanacEngineError; nếu AlmanacVocabError vô tình kế
    // thừa AlmanacEngineError thì sẽ bị map nhầm thành 400. Khóa lại quan hệ kế thừa ở đây.
    const vocabError = new AlmanacVocabError('thiếu mục');
    expect(vocabError).toBeInstanceOf(AlmanacVocabError);
    expect(vocabError).not.toBeInstanceOf(AlmanacEngineError);
  });
});
