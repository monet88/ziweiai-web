import { describe, expect, it } from 'vitest';
import { CJK_TEXT_PATTERN, type ChartSnapshot } from '@ziweiai/core';
import { buildPalaceExplanationPrompt } from './build-palace-explanation-prompt';

function buildZiweiSnapshot(): ChartSnapshot {
  return {
    snapshotId: 'fixture',
    birth: {
      originalInput: {
        calendar: 'gregorian',
        date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
        time: { hour: 9, minute: 30, isUnknown: false },
        sexOrGenderForChart: 'female',
        place: { label: 'Ho Chi Minh City', manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' } },
        locale: 'vi-VN',
        source: 'user-entered',
      },
      resolvedDateTime: {
        date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
        time: { hour: 9, minute: 30, isUnknown: false },
        utcInstant: '1992-08-14T02:30:00.000Z',
      },
      resolvedLocation: { label: 'Ho Chi Minh City', latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh', resolver: 'manual' },
      lunarDate: null,
      ganZhi: { yearPillar: null, monthPillar: null, dayPillar: null, hourPillar: null },
      trueSolarTime: { status: 'deferred', offsetMinutes: null, provider: null, confidence: 'medium' },
      normalizationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
    },
    chartSystem: 'zi-wei-dou-shu',
    palaces: [
      {
        nameKey: 'soulPalace',
        index: 0,
        heavenlyStemKey: 'jiaHeavenly',
        earthlyBranchKey: 'ziEarthly',
        isBodyPalace: false,
        isOriginalPalace: false,
        majorStars: [{ nameKey: 'ziweiMaj', group: 'major', brightnessKey: 'miao', mutagen: 'lu' }],
        minorStars: [],
        adjectiveStars: [],
        ages: [],
      },
      { nameKey: 'careerPalace', index: 4, heavenlyStemKey: 'wuHeavenly', earthlyBranchKey: 'chenEarthly', isBodyPalace: false, isOriginalPalace: false, majorStars: [{ nameKey: 'wuquMaj', group: 'major' }], minorStars: [], adjectiveStars: [], ages: [] },
      { nameKey: 'surfacePalace', index: 6, heavenlyStemKey: 'gengHeavenly', earthlyBranchKey: 'wuEarthly', isBodyPalace: false, isOriginalPalace: false, majorStars: [{ nameKey: 'tianjiMaj', group: 'major' }], minorStars: [], adjectiveStars: [], ages: [] },
      { nameKey: 'wealthPalace', index: 8, heavenlyStemKey: 'renHeavenly', earthlyBranchKey: 'shenEarthly', isBodyPalace: false, isOriginalPalace: false, majorStars: [{ nameKey: 'wuquMaj', group: 'major' }], minorStars: [], adjectiveStars: [], ages: [] },
    ],
    pillars: [],
    summary: {},
    horoscope: {
      decadal: { index: 0, heavenlyStemKey: 'jiaHeavenly', earthlyBranchKey: 'ziEarthly', palaceNameKeys: ['soulPalace'], mutagenStarKeys: ['ziweiMaj'] },
      age: { index: 1, nominalAge: 33 },
      yearly: { index: 2, heavenlyStemKey: 'yiHeavenly', earthlyBranchKey: 'chouEarthly', palaceNameKeys: ['wealthPalace'], mutagenStarKeys: ['wuquMaj'] },
    },
    engineVersion: {
      enginePackage: '@ziweiai/astro-engine',
      engineSemver: '0.1.0',
      adapterVersions: [],
      fixtureSetVersion: 'phase-3-fixtures-v1',
      schemaVersion: 'phase-3-contracts-v1',
    },
    ruleSource: {
      system: 'zi-wei-dou-shu',
      canonicalLibrary: { name: 'iztro', version: '2.5.8' },
      ruleSet: 'phase-3-default',
      schoolNotes: null,
      sourcePriority: 'iztro-first',
    },
    inputHash: { algorithm: 'sha256', digest: '0123456789abcdef0123456789abcdef', saltPolicy: 'not-persisted' },
    calculationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
    provenance: {
      referenceRepos: ['.ref/iztro'],
      runtimeLibraries: [{ name: 'iztro', version: '2.5.8' }],
      adapterConfig: [{ key: 'configProfile', value: 'phase-3-default' }],
      fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
      calculationTimestamp: '2026-06-03T00:00:00.000Z',
      warnings: [],
    },
    createdAt: '2026-06-03T00:00:00.000Z',
  };
}

describe('buildPalaceExplanationPrompt', () => {
  it('builds a Vietnamese palace prompt with stars, brightness, mutagen and trine context, no Han', () => {
    const prompt = buildPalaceExplanationPrompt(buildZiweiSnapshot(), 'soulPalace');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('Mệnh');
    expect(prompt).toContain('Tử Vi (Miếu, Hóa Lộc)');
    expect(prompt).toContain('Tam phương tứ chính');
    expect(prompt).toContain('Đối cung');
    expect(prompt).toContain('Tam hợp');
  });

  it('builds a decadal (Đại Vận) prompt', () => {
    const prompt = buildPalaceExplanationPrompt(buildZiweiSnapshot(), 'decadal');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('Đại Vận');
  });

  it('builds a yearly (Lưu Niên) prompt that folds in the Tiểu Vận age', () => {
    const prompt = buildPalaceExplanationPrompt(buildZiweiSnapshot(), 'yearly');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('Lưu Niên');
    expect(prompt).toContain('Tiểu Vận: tuổi 33');
  });

  it('returns Vietnamese error message when palaceScope is valid but not present in snapshot', () => {
    const prompt = buildPalaceExplanationPrompt(buildZiweiSnapshot(), 'healthPalace');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('Không tìm thấy dữ liệu cung');
  });

  it('handles incomplete horoscope (missing age for yearly) without crash - defensive branch coverage', () => {
    const snapshot = buildZiweiSnapshot();
    // incomplete: no age for Tiểu Vận
    snapshot.horoscope = {
      ...snapshot.horoscope,
      age: undefined,
    };
    const prompt = buildPalaceExplanationPrompt(snapshot, 'yearly');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('Lưu Niên');
    expect(prompt).not.toContain('Tiểu Vận');
  });

  it('handles incomplete horoscope (missing decadal item) - defensive !item branch', () => {
    const snapshot = buildZiweiSnapshot();
    snapshot.horoscope = {
      ...snapshot.horoscope,
      decadal: undefined,
    };
    const prompt = buildPalaceExplanationPrompt(snapshot, 'decadal');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('Không có dữ liệu Đại Vận trong lá số này.');
  });

  it('includes explanationKind when provided for a palace scope (e.g. love for careerPalace)', () => {
    const prompt = buildPalaceExplanationPrompt(buildZiweiSnapshot(), 'careerPalace', 'love');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('Mục đích luận giải: love');
    expect(prompt).toContain('Cung cần luận giải:');
    expect(prompt).toContain('Đối cung');
  });

  it('includes explanationKind when provided for horoscope scope (e.g. career for decadal)', () => {
    const prompt = buildPalaceExplanationPrompt(buildZiweiSnapshot(), 'decadal', 'career');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('Mục đích luận giải: career');
    expect(prompt).toContain('Vận hạn cần luận giải: Đại Vận');
  });

  it('omits "Mục đích luận giải" line when explanationKind is not provided (backward compatibility)', () => {
    const prompt = buildPalaceExplanationPrompt(buildZiweiSnapshot(), 'soulPalace');

    expect(prompt).not.toContain('Mục đích luận giải');
    expect(prompt).toContain('Cung cần luận giải:');
  });
});
