import { describe, expect, it } from 'vitest';
import { chartSystemSchema, chartSystems, implementedChartSystems } from './chart-system';

const legacyImplemented = [
  'zi-wei-dou-shu',
  'ba-zi',
  'mei-hua-yi-shu',
  'liu-yao',
  'da-liu-ren',
  'qi-men-dun-jia',
] as const;

// US-017d: Mạnh Phái đã có adapter (dùng chung POST /charts) → rời nhóm framework-only,
// vào implementedChartSystems. 5 hệ còn lại vẫn framework-only cho tới khi epic con merge.
const extendedFrameworkOnly = ['hepan', 'tarot', 'mbti', 'face', 'palm'] as const;
const implementedAfterMangpai = [...legacyImplemented, 'mangpai'] as const;

describe('chartSystemSchema (US-017)', () => {
  it('parses all 12 values', () => {
    for (const v of chartSystems) {
      const r = chartSystemSchema.safeParse(v);
      expect(r.success, `should parse ${v}`).toBe(true);
    }
  });

  it('rejects unknown value', () => {
    const r = chartSystemSchema.safeParse('unknown-system');
    expect(r.success).toBe(false);
  });

  it('legacy 6 values still parse (backward compat)', () => {
    for (const v of legacyImplemented) {
      expect(chartSystemSchema.safeParse(v).success).toBe(true);
    }
  });

  it('keeps create-chart implemented list limited to systems with adapters', () => {
    expect(implementedChartSystems).toEqual(implementedAfterMangpai);
    for (const system of extendedFrameworkOnly) {
      expect(implementedChartSystems).not.toContain(system);
    }
  });
});
