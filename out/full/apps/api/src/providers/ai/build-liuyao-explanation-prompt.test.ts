import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { CJK_TEXT_PATTERN } from '@ziweiai/core';
import { buildLiuyaoExplanationPrompt } from './build-liuyao-explanation-prompt';
import type { ChartSnapshot } from '@ziweiai/contracts';

function buildMinimalLiuyaoSnapshot(): ChartSnapshot {
  return {
    snapshotId: 'fixture-liuyao',
    birth: {
      originalInput: {
        calendar: 'gregorian',
        date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
        time: { hour: 0, minute: 0, isUnknown: false },
        sexOrGenderForChart: 'female',
        place: { label: 'Manual', manual: { latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh' } },
        locale: 'vi-VN',
        source: 'test-fixture',
      },
      resolvedDateTime: {
        date: { year: 1990, month: 1, day: 1, isLeapMonth: null },
        time: { hour: 0, minute: 0, isUnknown: false },
        utcInstant: '1990-01-01T00:00:00.000Z',
      },
      resolvedLocation: { label: 'Manual', latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh', resolver: 'manual' },
      lunarDate: null,
      ganZhi: { yearPillar: null, monthPillar: null, dayPillar: null, hourPillar: null },
      trueSolarTime: { status: 'deferred', offsetMinutes: null, provider: null, confidence: 'medium' },
      normalizationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
    },
    chartSystem: 'liu-yao',
    palaces: [],
    pillars: [],
    summary: {
      method: 'Theo thời gian',
      baseHexagram: 'Khôn trên Chấn',
      changedHexagram: 'Cấn trên Chấn',
      movingLines: 'Hào 4',
      shiLine: 'Hào Thế',
      yingLine: 'Hào Ứng',
    },
    liuyao: {
      method: 'time-based',
      movingLinePositions: [4],
      baseHexagram: {
        key: 'kun_over_zhen',
        topTrigramKey: 'kunTrigram',
        bottomTrigramKey: 'zhenTrigram',
        name: 'Khôn trên Chấn',
        symbol: 'Phục',
        lines: [
          { position: 1, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'parent', earthlyBranchKey: 'ziEarthly', fiveElementKey: 'water', naYin: 'Hải Trung Kim', sixSpiritKey: 'azureDragon', hiddenSpirit: null },
          { position: 2, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'sibling', earthlyBranchKey: 'chouEarthly', fiveElementKey: 'earth', naYin: 'Bích Thượng Thổ', sixSpiritKey: 'vermilionBird', hiddenSpirit: null },
          { position: 3, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'childDescendant', earthlyBranchKey: 'yinEarthly', fiveElementKey: 'fire', naYin: 'Lô Trung Hỏa', sixSpiritKey: 'hookSnake', hiddenSpirit: null },
          { position: 4, value: 'yin', stateKey: 'oldYin', isMoving: true, roleKey: 'shi', sixKinKey: 'wifeWealth', earthlyBranchKey: 'maoEarthly', fiveElementKey: 'wood', naYin: 'Đại Lâm Mộc', sixSpiritKey: 'soaringSerpent', hiddenSpirit: 'Phục Đăng Hỏa' },
          { position: 5, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'officerGhost', earthlyBranchKey: 'chenEarthly', fiveElementKey: 'earth', naYin: 'Sa Trung Thổ', sixSpiritKey: 'whiteTiger', hiddenSpirit: null },
          { position: 6, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'ying', sixKinKey: 'parent', earthlyBranchKey: 'siEarthly', fiveElementKey: 'fire', naYin: 'Lô Trung Hỏa', sixSpiritKey: 'blackTortoise', hiddenSpirit: null },
        ],
      },
      changedHexagram: {
        key: 'gen_over_kun',
        topTrigramKey: 'genTrigram',
        bottomTrigramKey: 'kunTrigram',
        name: 'Cấn trên Khôn',
        symbol: 'Bác',
        lines: [
          { position: 1, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'parent', earthlyBranchKey: 'ziEarthly', fiveElementKey: 'water', naYin: 'Hải Trung Kim', sixSpiritKey: 'azureDragon', hiddenSpirit: null },
          { position: 2, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'sibling', earthlyBranchKey: 'chouEarthly', fiveElementKey: 'earth', naYin: 'Bích Thượng Thổ', sixSpiritKey: 'vermilionBird', hiddenSpirit: null },
          { position: 3, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'childDescendant', earthlyBranchKey: 'yinEarthly', fiveElementKey: 'fire', naYin: 'Lô Trung Hỏa', sixSpiritKey: 'hookSnake', hiddenSpirit: null },
          { position: 4, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'shi', sixKinKey: 'wifeWealth', earthlyBranchKey: 'maoEarthly', fiveElementKey: 'wood', naYin: 'Đại Lâm Mộc', sixSpiritKey: 'soaringSerpent', hiddenSpirit: null },
          { position: 5, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'officerGhost', earthlyBranchKey: 'chenEarthly', fiveElementKey: 'earth', naYin: 'Sa Trung Thổ', sixSpiritKey: 'whiteTiger', hiddenSpirit: null },
          { position: 6, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'ying', sixKinKey: 'parent', earthlyBranchKey: 'siEarthly', fiveElementKey: 'fire', naYin: 'Lô Trung Hỏa', sixSpiritKey: 'blackTortoise', hiddenSpirit: null },
        ],
      },
      nuclearHexagram: undefined,
      oppositeHexagram: undefined,
      inverseHexagram: undefined,
    },
    engineVersion: {
      enginePackage: '@ziweiai/astro-engine',
      engineSemver: '0.1.0',
      adapterVersions: [],
      fixtureSetVersion: 'phase-3-fixtures-v1',
      schemaVersion: 'phase-3-contracts-v1',
    },
    ruleSource: {
      system: 'liu-yao',
      canonicalLibrary: { name: 'xuanshu', version: 'ref' },
      ruleSet: 'phase-3-default',
      schoolNotes: null,
      sourcePriority: 'xuanshu-first',
    },
    inputHash: { algorithm: 'sha256', digest: '0123456789abcdef0123456789abcdef', saltPolicy: 'not-persisted' },
    calculationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
    provenance: {
      referenceRepos: ['.ref/xuanshu'],
      runtimeLibraries: [],
      adapterConfig: [{ key: 'configProfile', value: 'phase-3-default' }],
      fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
      calculationTimestamp: '2026-06-12T00:00:00.000Z',
      warnings: [],
    },
    createdAt: '2026-06-12T00:00:00.000Z',
  };
}

describe('buildLiuyaoExplanationPrompt', () => {
  it('returns Vietnamese prompt with no CJK characters when liuyao payload is present', () => {
    const snapshot = buildMinimalLiuyaoSnapshot();
    const prompt = buildLiuyaoExplanationPrompt(snapshot, 'overview');

    // Evidence capture for Phase 5 / TODOS: write the exact prompt that would be sent to the AI provider.
    // This is the "chụp output" for the structured LiuYao prompt (input to model) while waiting for stable provider key.
    const evidenceDir = path.resolve(__dirname, '../../../../../plans/reports');
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }
    const evidencePath = path.join(evidenceDir, '260612-liuyao-explanation-prompt-evidence.txt');
    fs.writeFileSync(evidencePath, prompt, 'utf8');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('Lục Hào');
    expect(prompt).toContain('Quẻ gốc');
    expect(prompt).toContain('Quẻ biến');
    expect(prompt).toContain('Hào động');
    expect(prompt).toContain('Thế');
    expect(prompt).toContain('Ứng');
    expect(prompt).toContain('Thê tài');
    expect(prompt).toContain('Đằng Xà');
  });

  it('falls back gracefully when liuyao payload is missing and still produces Vietnamese output without CJK', () => {
    const snapshot = {
      ...buildMinimalLiuyaoSnapshot(),
      liuyao: undefined,
      summary: { method: 'Theo thời gian', baseHexagram: 'Khôn trên Chấn' },
    } as ChartSnapshot;

    const prompt = buildLiuyaoExplanationPrompt(snapshot, 'overview');

    expect(prompt).not.toMatch(CJK_TEXT_PATTERN);
    expect(prompt).toContain('Lục Hào');
    expect(prompt).toContain('tổng quan ngắn');
  });
});
