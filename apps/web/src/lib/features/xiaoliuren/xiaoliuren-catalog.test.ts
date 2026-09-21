import { describe, expect, it } from 'vitest';
import { XIAO_LIU_REN_PALACES } from '@ziweiai/contracts';

describe('Xiao Liu Ren web catalog consumption (Issue #69)', () => {
  it('consumes canonical catalog from @ziweiai/contracts with 6 palaces and zero drift', () => {
    expect(XIAO_LIU_REN_PALACES).toHaveLength(6);

    const expectedPalaces = [
      { key: 'dai_an', name: 'Đại An', auspice: 'dai_cat', auspiceLabel: 'Đại Cát', element: 'Mộc' },
      { key: 'luu_nien', name: 'Lưu Niên', auspice: 'binh', auspiceLabel: 'Bình (Thứ Hung)', element: 'Thủy' },
      { key: 'toc_hy', name: 'Tốc Hỷ', auspice: 'cat', auspiceLabel: 'Cát', element: 'Hỏa' },
      { key: 'xich_khau', name: 'Xích Khẩu', auspice: 'hung', auspiceLabel: 'Hung', element: 'Kim' },
      { key: 'tieu_cat', name: 'Tiểu Cát', auspice: 'tieu_cat', auspiceLabel: 'Tiểu Cát', element: 'Mộc' },
      { key: 'khong_vong', name: 'Không Vong', auspice: 'dai_hung', auspiceLabel: 'Đại Hung', element: 'Thổ' },
    ];

    expectedPalaces.forEach((exp, idx) => {
      const palace = XIAO_LIU_REN_PALACES[idx];
      expect(palace.key).toBe(exp.key);
      expect(palace.name).toBe(exp.name);
      expect(palace.auspice).toBe(exp.auspice);
      expect(palace.auspiceLabel).toBe(exp.auspiceLabel);
      expect(palace.element).toBe(exp.element);
      expect(palace.meaning.length).toBeGreaterThan(0);
    });
  });
});
