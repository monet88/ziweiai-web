import { describe, expect, it } from 'vitest';
import {
  CHU_VAN_VUONG_HEXAGRAMS,
  chuVanVuongDrawRequestSchema,
  chuVanVuongDrawSchema,
  chuVanVuongHexagramSchema,
  type ChuVanVuongHexagram,
} from './chuvanvuong-draw';

describe('CHU_VAN_VUONG_HEXAGRAMS catalog', () => {
  it('contains exactly 64 King Wen hexagrams indexed 1 to 64', () => {
    expect(CHU_VAN_VUONG_HEXAGRAMS.length).toBe(64);
    CHU_VAN_VUONG_HEXAGRAMS.forEach((hex, index) => {
      expect(hex.id).toBe(index + 1);
      expect(hex.name).toBeTruthy();
      expect(hex.meaning).toBeTruthy();
      expect(hex.poem).toBeTruthy();
      expect(hex.advice).toBeTruthy();
      expect(hex.domains.taiLoc).toBeTruthy();
      expect(hex.domains.congDanh).toBeTruthy();
      expect(hex.domains.giaDao).toBeTruthy();
      expect(hex.domains.sucKhoe).toBeTruthy();
      expect(chuVanVuongHexagramSchema.safeParse(hex).success).toBe(true);
    });
  });

  it('contains no Hanzi characters (pure Vietnamese invariant)', () => {
    const CJK_REGEX = /\p{Script=Han}/u;
    const catalogString = JSON.stringify(CHU_VAN_VUONG_HEXAGRAMS);
    expect(CJK_REGEX.test(catalogString)).toBe(false);
  });

  it('validates a valid Chu Van Vuong draw object', () => {
    const hex: ChuVanVuongHexagram = CHU_VAN_VUONG_HEXAGRAMS[0];
    const draw = {
      question: 'Hôm nay công việc hanh thông không?',
      method: 'coins' as const,
      hexagram: hex,
      narrative: 'Luận giải quẻ Thuần Càn: Thời vận hanh thông rực rỡ.',
      coins: [3, 2, 3, 2, 3, 3],
      timestamp: new Date().toISOString(),
    };

    const parsed = chuVanVuongDrawSchema.safeParse(draw);
    expect(parsed.success).toBe(true);
  });

  it('validates a draw request', () => {
    const req = {
      question: 'Cầu tài lộc tháng này',
      method: 'numbers',
      numbers: [8, 9],
    };

    const parsed = chuVanVuongDrawRequestSchema.safeParse(req);
    expect(parsed.success).toBe(true);
  });
});
