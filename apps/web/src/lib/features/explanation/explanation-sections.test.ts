import { describe, expect, it } from 'vitest';
import { buildExplanationSections, buildHydrationResultByScope } from './explanation-sections';

describe('buildExplanationSections', () => {
  const defaultLabels = { decadal: 'Đại Vận', yearly: 'Lưu Niên' };

  it('returns 15 sections in expected order (overview + 12 palaces + decadal + yearly)', () => {
    const sections = buildExplanationSections(defaultLabels);

    expect(sections).toHaveLength(15);
    const scopes = sections.map((s) => s.scope);
    expect(scopes).toEqual([
      null, // Tổng quan (overview, palaceScope không gửi)
      'soulPalace',
      'careerPalace',
      'wealthPalace',
      'spousePalace',
      'parentsPalace',
      'siblingsPalace',
      'childrenPalace',
      'healthPalace',
      'propertyPalace',
      'friendsPalace',
      'spiritPalace',
      'surfacePalace',
      'decadal',
      'yearly',
    ]);
  });

  it('translates all palace scopes to Vietnamese labels via ziwei-terms-vi', () => {
    const sections = buildExplanationSections(defaultLabels);
    const palaceSections = sections.slice(1, 13); // bỏ overview null, lấy 12 cung

    palaceSections.forEach((section) => {
      expect(section.label).not.toMatch(/[一-鿿]/u);
      expect(section.label.length).toBeGreaterThan(0);
    });
  });

  it('uses provided horoscope labels for decadal and yearly', () => {
    const sections = buildExplanationSections({ decadal: 'Đại Vận Tùy Chỉnh', yearly: 'Lưu Niên Tùy Chỉnh' });
    const decadal = sections.find((s) => s.scope === 'decadal');
    const yearly = sections.find((s) => s.scope === 'yearly');

    expect(decadal?.label).toBe('Đại Vận Tùy Chỉnh');
    expect(yearly?.label).toBe('Lưu Niên Tùy Chỉnh');
  });

  it('returns stable structure for each section', () => {
    const sections = buildExplanationSections(defaultLabels);
    sections.forEach((section) => {
      expect(section).toHaveProperty('scope');
      expect(section).toHaveProperty('label');
      // scope có thể null (overview) hoặc string (PalaceScope)
      expect(section.scope === null || typeof section.scope === 'string').toBe(true);
      expect(typeof section.label).toBe('string');
    });
  });

  it('supports full 15-section (overview + 14) expansion flow simulation (unit level for E2E consideration)', () => {
    const sections = buildExplanationSections(defaultLabels);
    expect(sections).toHaveLength(15);
    const scopes = sections.map((s) => s.scope);
    expect(scopes.filter((s) => s !== null)).toHaveLength(14);
    expect(scopes[0]).toBe(null); // overview first
  });

  it('produces stable non-null keys for all 15 sections (including overview with scope=null)', () => {
    const sections = buildExplanationSections(defaultLabels);
    const keys = sections.map((section) => section.scope ?? 'overview');
    expect(keys[0]).toBe('overview');
    expect(keys.every((k) => typeof k === 'string' && k.length > 0)).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('buildHydrationResultByScope', () => {
  it('maps results by scope (null scope keyed as overview)', () => {
    const map = buildHydrationResultByScope(
      [
        { renderedMarkdown: 'Tổng quan markdown', providerMetadata: { explanationKind: 'overview' } },
        { renderedMarkdown: 'Cung Mệnh markdown', providerMetadata: { explanationKind: 'overview', palaceScope: 'soulPalace' } },
      ],
      'overview',
    );

    expect(map.get('overview')?.renderedMarkdown).toBe('Tổng quan markdown');
    expect(map.get('soulPalace')?.renderedMarkdown).toBe('Cung Mệnh markdown');
  });

  it('does NOT seed overview card with a different kind for the same scope (repro for P2 hydration bug)', () => {
    const map = buildHydrationResultByScope(
      [
        { renderedMarkdown: 'Luận giải tình duyên', providerMetadata: { explanationKind: 'love' } },
        { renderedMarkdown: 'Luận giải tổng quan', providerMetadata: { explanationKind: 'overview' } },
      ],
      'overview',
    );

    expect(map.get('overview')?.renderedMarkdown).toBe('Luận giải tổng quan');
  });

  it('treats legacy records without explanationKind as matching (backward compatible)', () => {
    const map = buildHydrationResultByScope(
      [{ renderedMarkdown: 'Record cũ không có kind', providerMetadata: { palaceScope: 'careerPalace' } }],
      'overview',
    );

    expect(map.get('careerPalace')?.renderedMarkdown).toBe('Record cũ không có kind');
  });

  it('prefers a kind-matched record over an ambiguous legacy record for the same scope (mixed history)', () => {
    const map = buildHydrationResultByScope(
      [
        { renderedMarkdown: 'Tình duyên legacy thiếu kind' },
        { renderedMarkdown: 'Tổng quan thật', providerMetadata: { explanationKind: 'overview' } },
      ],
      'overview',
    );

    expect(map.get('overview')?.renderedMarkdown).toBe('Tổng quan thật');
  });

  it('keeps newest (first) match when multiple same-scope same-kind results exist', () => {
    const map = buildHydrationResultByScope(
      [
        { renderedMarkdown: 'Mới nhất', providerMetadata: { explanationKind: 'overview' } },
        { renderedMarkdown: 'Cũ hơn', providerMetadata: { explanationKind: 'overview' } },
      ],
      'overview',
    );

    expect(map.get('overview')?.renderedMarkdown).toBe('Mới nhất');
  });

  it('returns empty map for undefined results', () => {
    expect(buildHydrationResultByScope(undefined, 'overview').size).toBe(0);
  });
});
