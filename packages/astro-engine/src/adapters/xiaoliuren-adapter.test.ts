import { describe, expect, it } from 'vitest';
import { XIAO_LIU_REN_PALACES } from '@ziweiai/contracts';
import { calculateXiaoLiuRen, hourToShichenIndex } from './xiaoliuren-adapter';

const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

describe('xiaoliuren-adapter', () => {
  it('định nghĩa đủ 6 cung chuẩn Tiểu Lục Nhâm, không rò rỉ CJK', () => {
    expect(XIAO_LIU_REN_PALACES).toHaveLength(6);
    const keys = XIAO_LIU_REN_PALACES.map((p) => p.key);
    expect(keys).toEqual([
      'dai_an',
      'luu_nien',
      'toc_hy',
      'xich_khau',
      'tieu_cat',
      'khong_vong',
    ]);
    expect(CJK_TEXT_PATTERN.test(JSON.stringify(XIAO_LIU_REN_PALACES))).toBe(false);
  });

  describe('hourToShichenIndex', () => {
    it('ánh xạ chính xác 24 giờ sang 12 canh giờ (Tý=1..Hợi=12)', () => {
      expect(hourToShichenIndex(23)).toBe(1); // Tý
      expect(hourToShichenIndex(0)).toBe(1);  // Tý
      expect(hourToShichenIndex(1)).toBe(2);  // Sửu
      expect(hourToShichenIndex(2)).toBe(2);  // Sửu
      expect(hourToShichenIndex(11)).toBe(7); // Ngọ
      expect(hourToShichenIndex(12)).toBe(7); // Ngọ
      expect(hourToShichenIndex(21)).toBe(12); // Hợi
      expect(hourToShichenIndex(22)).toBe(12); // Hợi
    });
  });

  describe('calculateXiaoLiuRen (bấm độn số)', () => {
    it('tính chính xác trường hợp cơ bản [1, 1, 1] ra Đại An', () => {
      const result = calculateXiaoLiuRen({
        question: 'Việc này có an lành không?',
        method: 'numbers',
        numbers: [1, 1, 1],
      });

      expect(result.firstPalace.key).toBe('dai_an');
      expect(result.secondPalace.key).toBe('dai_an');
      expect(result.targetPalace.key).toBe('dai_an');
      expect(result.targetPalace.name).toBe('Đại An');
      expect(result.targetPalace.auspice).toBe('dai_cat');
      expect(CJK_TEXT_PATTERN.test(JSON.stringify(result))).toBe(false);
    });

    it('tính chính xác trường hợp [1, 2, 3] qua các cung Đại An -> Lưu Niên -> Xích Khẩu', () => {
      const result = calculateXiaoLiuRen({
        question: 'Có tin tức gì mới không?',
        method: 'numbers',
        numbers: [1, 2, 3],
      });

      expect(result.firstPalace.key).toBe('dai_an');
      expect(result.secondPalace.key).toBe('luu_nien');
      expect(result.targetPalace.key).toBe('xich_khau');
      expect(result.targetPalace.name).toBe('Xích Khẩu');
      expect(result.targetPalace.element).toBe('Kim');
    });

    it('tính chính xác trường hợp [5, 15, 7] qua Tiểu Cát -> Đại An -> Đại An', () => {
      const result = calculateXiaoLiuRen({
        question: 'Dự án hợp tác thế nào?',
        method: 'numbers',
        numbers: [5, 15, 7],
      });

      expect(result.firstPalace.key).toBe('tieu_cat');
      expect(result.secondPalace.key).toBe('dai_an');
      expect(result.targetPalace.key).toBe('dai_an');
    });

    it('xử lý chu kỳ wrap-around số lớn chính xác', () => {
      const result = calculateXiaoLiuRen({
        question: 'Hỏi việc',
        method: 'numbers',
        numbers: [13, 25, 37],
      });

      // 13 -> idx 0 (Đại An), 25 -> idx 0, 37 -> idx 0
      expect(result.firstPalace.key).toBe('dai_an');
      expect(result.secondPalace.key).toBe('dai_an');
      expect(result.targetPalace.key).toBe('dai_an');
    });
  });

  describe('calculateXiaoLiuRen (bấm độn theo thời gian)', () => {
    it('tính theo mốc thời gian mùng 1 Tết âm lịch', () => {
      // 2026-02-17 là mùng 1 tháng 1 âm lịch (Bính Ngọ), 12:00 là giờ Ngọ (shichenIdx = 7)
      const date = new Date(2026, 1, 17, 12, 0, 0);
      const result = calculateXiaoLiuRen({
        question: 'Đầu năm xuất hành hướng nào?',
        method: 'time',
        date,
      });

      expect(result.method).toBe('time');
      expect(result.numbers[0]).toBe(1); // Tháng 1
      expect(result.numbers[1]).toBe(1); // Ngày 1
      expect(result.numbers[2]).toBe(7); // Giờ Ngọ
      expect(result.firstPalace.key).toBe('dai_an');
      expect(result.secondPalace.key).toBe('dai_an');
      expect(result.targetPalace.key).toBe('dai_an');
      expect(result.lunarDateSummary).toContain('Tháng 1 ngày 1');
      expect(result.deterministicNarrative).toContain('Đại An');
      expect(CJK_TEXT_PATTERN.test(JSON.stringify(result))).toBe(false);
    });
  });
});
