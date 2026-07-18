import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN } from '@ziweiai/core';
import { LunarJavascriptBaziAdapter } from '@ziweiai/astro-engine';
import type { BirthInput, ChartSnapshot } from '@ziweiai/contracts';
import { buildBaziExplanationPrompt } from './build-bazi-explanation-prompt';

function birth(isUnknown = false): BirthInput {
  return {
    calendar: 'gregorian',
    date: { year: 1990, month: 6, day: 15, isLeapMonth: null },
    time: { hour: isUnknown ? null : 12, minute: isUnknown ? null : 0, isUnknown },
    sexOrGenderForChart: 'male',
    place: { label: 'Manual', manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' } },
    locale: 'vi-VN',
    source: 'test-fixture',
  };
}

const adapter = new LunarJavascriptBaziAdapter();

describe('buildBaziExplanationPrompt', () => {
  it('dựng prompt giàu cấu trúc (trình tự suy luận + đề mục), tiếng Việt, không CJK', async () => {
    const snapshot = await adapter.calculateChart(birth());
    expect(snapshot.bazi).toBeDefined();
    const prompt = buildBaziExplanationPrompt(snapshot, 'overview');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    // #22: trình tự suy luận + đề mục Markdown cố định.
    expect(prompt).toContain('Trình tự suy luận');
    expect(prompt).toContain('## Tổng quan');
    expect(prompt).toContain('## Gợi ý hành động');
    // Dữ kiện Bát Tự vẫn là bối cảnh.
    expect(prompt).toContain('Tứ trụ chi tiết');
    expect(prompt).toContain('Ngày chủ');
  });

  it('#23: nhồi khung enrichment (dụng thần / cách cục / điều hậu / thần sát) bằng nhãn tiếng Việt', async () => {
    const snapshot = await adapter.calculateChart(birth());
    const prompt = buildBaziExplanationPrompt(snapshot, 'overview');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('dụng thần');
    expect(prompt).toContain('cách cục');
    expect(prompt).toContain('điều hậu');
    expect(prompt).toContain('thần sát');
  });

  it('fallback gọn khi thiếu dữ liệu Bát Tự — vẫn tiếng Việt không CJK', () => {
    const fake = {
      chartSystem: 'ba-zi',
      summary: { lunarDate: 'x' },
      bazi: undefined,
    } as unknown as ChartSnapshot;
    const prompt = buildBaziExplanationPrompt(fake, 'overview');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('tổng quan ngắn');
  });
});
