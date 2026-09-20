import { describe, expect, it } from 'vitest';
import {
  xiaoLiuRenDrawRequestSchema,
  xiaoLiuRenDrawSchema,
  xiaoLiuRenPalaceSchema,
  XIAO_LIU_REN_PALACES,
  type XiaoLiuRenDraw,
} from './xiaoliuren-draw';

const sampleDraw: XiaoLiuRenDraw = {
  question: 'Dự án này có thuận lợi không?',
  method: 'time',
  numbers: [5, 15, 7],
  firstPalace: {
    key: 'tieu_cat',
    index: 4,
    name: 'Tiểu Cát',
    element: 'Mộc',
    direction: 'Tây Nam',
    auspice: 'cat',
    auspiceLabel: 'Cát',
    deity: 'Lục Hợp',
    meaning: 'Hòa hợp, quý nhân phù trợ, mưu sự tốt lành.',
    poem: 'Tiểu Cát tối cát xương, lộ thượng hảo thương lượng.',
    advice: 'Nên chủ động hợp tác, giữ thái độ hòa nhã.',
  },
  secondPalace: {
    key: 'khong_vong',
    index: 5,
    name: 'Không Vong',
    element: 'Thổ',
    direction: 'Trung ương',
    auspice: 'hung',
    auspiceLabel: 'Hung',
    deity: 'Câu Trần',
    meaning: 'Trì trệ, hư hao, cần đề phòng biến cố.',
    poem: 'Không Vong sự bất tường, âm nhân đa quái trương.',
    advice: 'Tạm hoãn quyết định lớn, kiểm tra kỹ nguồn lực.',
  },
  targetPalace: {
    key: 'dai_an',
    index: 0,
    name: 'Đại An',
    element: 'Mộc',
    direction: 'Đông',
    auspice: 'dai_cat',
    auspiceLabel: 'Đại Cát',
    deity: 'Thanh Long',
    meaning: 'Thân tâm an định, mưu sự vững bền, cầu tài ở phương Đông.',
    poem: 'Đại An sự sự xương, cầu mưu tại đông phương.',
    advice: 'Giữ vững tâm thế, kiên định mục tiêu.',
  },
  flowDescription: 'Tháng Tiểu Cát (Mộc) khắc Ngày Không Vong (Thổ); Giờ quy về Đại An (Mộc) bình hòa vững vàng.',
  lunarDateSummary: 'Tháng 5 ngày 15, giờ Ngọ',
  narrative: 'Quẻ chủ được Đại An là điềm lành vững chắc...',
};

describe('xiaoliuren-draw schemas', () => {
  it('parses a valid XiaoLiuRenDraw successfully', () => {
    const parsed = xiaoLiuRenDrawSchema.safeParse(sampleDraw);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid numbers or missing required palace fields', () => {
    const invalid = {
      ...sampleDraw,
      numbers: [0, -1, 2],
    };
    const parsed = xiaoLiuRenDrawSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates xiaoLiuRenDrawRequestSchema with defaults', () => {
    const req = xiaoLiuRenDrawRequestSchema.parse({
      question: 'Hôm nay đi đàm phán hợp đồng được không?',
    });
    expect(req.method).toBe('time');
    expect(req.question).toBe('Hôm nay đi đàm phán hợp đồng được không?');
  });

  it('accepts numbers method in xiaoLiuRenDrawRequestSchema', () => {
    const req = xiaoLiuRenDrawRequestSchema.parse({
      question: 'Hỏi về tài lộc',
      method: 'numbers',
      numbers: [3, 8, 9],
    });
    expect(req.method).toBe('numbers');
    expect(req.numbers).toEqual([3, 8, 9]);
  });

  describe('canonical XIAO_LIU_REN_PALACES catalog', () => {
    const CJK_TEXT_PATTERN =
      /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

    it('defines exactly 6 palaces matching xiaoLiuRenPalaceSchema with no CJK', () => {
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

      XIAO_LIU_REN_PALACES.forEach((palace, idx) => {
        expect(palace.index).toBe(idx);
        const parsed = xiaoLiuRenPalaceSchema.safeParse(palace);
        expect(parsed.success).toBe(true);
      });

      expect(CJK_TEXT_PATTERN.test(JSON.stringify(XIAO_LIU_REN_PALACES))).toBe(false);
    });

    it('contains valid elements, directions, auspices, deities and meanings', () => {
      for (const palace of XIAO_LIU_REN_PALACES) {
        expect(palace.name.length).toBeGreaterThan(0);
        expect(palace.element.length).toBeGreaterThan(0);
        expect(palace.direction.length).toBeGreaterThan(0);
        expect(palace.auspiceLabel.length).toBeGreaterThan(0);
        expect(palace.deity.length).toBeGreaterThan(0);
        expect(palace.meaning.length).toBeGreaterThan(0);
        expect(palace.poem.length).toBeGreaterThan(0);
        expect(palace.advice.length).toBeGreaterThan(0);
      }
    });
  });
});
