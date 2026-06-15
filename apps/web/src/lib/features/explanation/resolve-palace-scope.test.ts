// US-006: explanation-model.resolvePalaceScope map nameKey cung đang chọn sang PalaceScope
// hợp lệ. Key legacy / không thuộc enum scope KHÔNG được ép lên API (→ null = overview).
import { describe, expect, it } from 'vitest';
import { resolvePalaceScope } from './explanation-model.svelte';

describe('resolvePalaceScope', () => {
  it('trả null khi chưa chọn cung (overview)', () => {
    expect(resolvePalaceScope(null)).toBeNull();
  });

  it('giữ nguyên nameKey thuộc enum PalaceScope', () => {
    expect(resolvePalaceScope('soulPalace')).toBe('soulPalace');
    expect(resolvePalaceScope('wealthPalace')).toBe('wealthPalace');
    expect(resolvePalaceScope('careerPalace')).toBe('careerPalace');
  });

  it('trả null cho key legacy / không thuộc enum (không gửi key lạ lên API)', () => {
    expect(resolvePalaceScope('legacyPalace0')).toBeNull();
    expect(resolvePalaceScope('bodyPalace')).toBeNull(); // bodyPalace KHÔNG nằm trong palaceScope enum
    expect(resolvePalaceScope('không-phải-key')).toBeNull();
  });
});
