import { describe, expect, it } from 'vitest';
import type { HoroscopeFrame, HoroscopeItem } from '@ziweiai/contracts';
import { renderDailyCanonicalText, renderMonthlyCanonicalText } from './fortune-summary';

const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303f\uff00-\uffef]/u;

const item = (overrides: Partial<HoroscopeItem> = {}): HoroscopeItem => ({
  index: 3,
  heavenlyStemKey: 'jiaHeavenly',
  earthlyBranchKey: 'ziEarthly',
  palaceNameKeys: ['soulPalace', 'careerPalace'],
  mutagenStarKeys: ['tuwei', 'tianji'],
  ...overrides,
});

const baseFrame: HoroscopeFrame = {
  decadal: item(),
  age: { index: 3, nominalAge: 37 },
  yearly: item(),
};

describe('renderDailyCanonicalText', () => {
  it('render đoạn văn vận ngày tiếng Việt, KHÔNG chứa ký tự CJK', () => {
    const summary = renderDailyCanonicalText({ ...baseFrame, daily: item() });
    expect(summary.length).toBeGreaterThan(0);
    expect(CJK_TEXT_PATTERN.test(summary)).toBe(false);
    expect(summary).toContain('Vận ngày');
  });

  it('trả thông điệp trống hợp lệ (không ném) khi frame thiếu daily', () => {
    const summary = renderDailyCanonicalText(baseFrame);
    expect(summary).toContain('Chưa có dữ liệu vận ngày');
    expect(CJK_TEXT_PATTERN.test(summary)).toBe(false);
  });
});

describe('renderMonthlyCanonicalText', () => {
  it('render đoạn văn vận tháng tiếng Việt, KHÔNG chứa ký tự CJK', () => {
    const summary = renderMonthlyCanonicalText({ ...baseFrame, monthly: item() });
    expect(summary.length).toBeGreaterThan(0);
    expect(CJK_TEXT_PATTERN.test(summary)).toBe(false);
    expect(summary).toContain('Vận tháng');
  });

  it('trả thông điệp trống hợp lệ khi frame thiếu monthly', () => {
    const summary = renderMonthlyCanonicalText(baseFrame);
    expect(summary).toContain('Chưa có dữ liệu vận tháng');
  });

  it('không rò chữ Hán ngay cả khi mutagen/palace rỗng', () => {
    const summary = renderMonthlyCanonicalText({
      ...baseFrame,
      monthly: item({ palaceNameKeys: [], mutagenStarKeys: [] }),
    });
    expect(CJK_TEXT_PATTERN.test(summary)).toBe(false);
    expect(summary).toContain('không có sao Tứ Hóa');
  });
});
