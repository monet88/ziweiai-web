import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN } from '@ziweiai/core';
import { MangpaiAdapter } from '@ziweiai/astro-engine';
import type { BirthInput, ChartSnapshot } from '@ziweiai/contracts';
import { buildMangpaiExplanationPrompt } from './build-mangpai-explanation-prompt';

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

const adapter = new MangpaiAdapter();

describe('buildMangpaiExplanationPrompt', () => {
  it('đưa khối luận Mạnh Phái vào prompt, tiếng Việt, không CJK', async () => {
    const snapshot = await adapter.calculateChart(birth());
    const prompt = buildMangpaiExplanationPrompt(snapshot, 'overview');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('Mạnh Phái');
    // Khối mangpai (title/narrative/insights) phải có mặt — đây là điểm cốt lõi P2 review PR #27.
    expect(prompt).toContain(snapshot.mangpai!.title);
    expect(prompt).toContain(snapshot.mangpai!.narrative);
    expect(prompt).toContain(snapshot.mangpai!.insights[0].heading);
    // Tứ trụ vẫn là bối cảnh.
    expect(prompt).toContain('Tứ trụ chi tiết');
  });

  it('fallback gọn khi thiếu dữ liệu (snapshot blocked) — vẫn tiếng Việt không CJK', async () => {
    // Giờ sinh không xác định → snapshot blocked, không có bazi/mangpai.
    const snapshot = await adapter.calculateChart(birth(true));
    expect(snapshot.mangpai).toBeUndefined();
    const prompt = buildMangpaiExplanationPrompt(snapshot, 'overview');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('Mạnh Phái');
    expect(prompt).toContain('tổng quan ngắn');
  });

  it('không dùng khối mangpai khi snapshot.mangpai thiếu dù có bazi (an toàn type)', () => {
    const fake = { chartSystem: 'mangpai', summary: { lunarDate: 'x' }, bazi: undefined, mangpai: undefined } as unknown as ChartSnapshot;
    const prompt = buildMangpaiExplanationPrompt(fake, 'overview');
    expect(prompt).toContain('tổng quan ngắn');
  });
});
