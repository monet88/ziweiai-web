import { describe, expect, it } from 'vitest';
import {
  calculateChuVanVuong,
  getHexagramIdFromTrigrams,
  KING_WEN_HEXAGRAM_MATRIX,
} from './chuvanvuong-adapter';

describe('calculateChuVanVuong adapter', () => {
  it('covers all 64 hexagrams in 8x8 King Wen matrix', () => {
    const ids = new Set<number>();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const id = KING_WEN_HEXAGRAM_MATRIX[r][c];
        expect(id).toBeGreaterThanOrEqual(1);
        expect(id).toBeLessThanOrEqual(64);
        ids.add(id);
      }
    }
    expect(ids.size).toBe(64);
  });

  it('correctly derives hexagram by manual hexagramId', () => {
    const result = calculateChuVanVuong({
      question: 'Thi cử có đỗ đạt không?',
      hexagramId: 1,
      method: 'manual',
    });

    expect(result.hexagram.id).toBe(1);
    expect(result.hexagram.name).toBe('Thuần Càn');
    expect(result.hexagram.omen).toBe('dai_cat');
    expect(result.deterministicNarrative).toContain('Thuần Càn');
    expect(result.deterministicNarrative).toContain('Tài Lộc & Kinh Doanh');
  });

  it('correctly derives hexagram by numbers (upper, lower)', () => {
    // 1 Càn, 1 Càn -> Hexagram 1
    expect(getHexagramIdFromTrigrams(0, 0)).toBe(1);
    // 7 Khôn, 7 Khôn -> Hexagram 2
    expect(getHexagramIdFromTrigrams(7, 7)).toBe(2);

    const result = calculateChuVanVuong({
      question: 'Khai trương có lộc không?',
      method: 'numbers',
      numbers: [1, 1],
    });

    expect(result.hexagram.id).toBe(1);
    expect(result.hexagram.name).toBe('Thuần Càn');
  });

  it('correctly derives hexagram by coins array', () => {
    const coins = [2, 3, 2, 3, 2, 3];
    const result = calculateChuVanVuong({
      question: 'Mua nhà mới có thuận không?',
      method: 'coins',
      coins,
    });

    expect(result.hexagram.id).toBeGreaterThanOrEqual(1);
    expect(result.hexagram.id).toBeLessThanOrEqual(64);
    expect(result.coins).toEqual(coins);
  });

  it('generates a deterministic result when no manual input is provided', () => {
    const fixedDate = new Date('2026-09-21T12:00:00Z');
    const res1 = calculateChuVanVuong({
      question: 'Dự án có hoàn thành đúng hạn không?',
      date: fixedDate,
    });
    const res2 = calculateChuVanVuong({
      question: 'Dự án có hoàn thành đúng hạn không?',
      date: fixedDate,
    });

    expect(res1.hexagram.id).toBe(res2.hexagram.id);
    expect(res1.deterministicNarrative).toBe(res2.deterministicNarrative);
  });
});
