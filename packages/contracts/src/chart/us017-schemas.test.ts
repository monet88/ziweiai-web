import { describe, expect, it } from 'vitest';
import { pairingSnapshotSchema } from './pairing-snapshot';
import { tarotDrawSchema } from './tarot-draw';
import { visionAnalysisSchema } from './vision-analysis';
import { mbtiResultSchema, mbtiAnswerSchema } from '../quizzes/mbti-result';

describe('US-017 new schemas parse/reject', () => {
  it('pairingSnapshotSchema basic parse', () => {
    // Reuse a minimal valid snapshot structure that is known to parse
    // (taken from chart-contracts.test.ts "parses a key-based Zi Wei snapshot")
    const base = {
      snapshotId: 'pair-001',
      birth: {
        originalInput: {
          calendar: 'gregorian',
          date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
          time: { hour: null, minute: null, isUnknown: true },
          sexOrGenderForChart: 'female',
          place: { label: 'Manual entry', manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' } },
          locale: 'vi-VN',
          source: 'test-fixture',
        },
        resolvedDateTime: {
          date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
          time: { hour: null, minute: null, isUnknown: true },
          utcInstant: null,
        },
        resolvedLocation: {
          label: 'Manual entry',
          latitude: 10.8231,
          longitude: 106.6297,
          timezone: 'Asia/Ho_Chi_Minh',
          resolver: 'manual',
        },
        lunarDate: null,
        ganZhi: { yearPillar: null, monthPillar: null, dayPillar: null, hourPillar: null },
        trueSolarTime: { status: 'deferred', offsetMinutes: null, provider: null, confidence: 'low' },
        normalizationConfidence: {
          level: 'low',
          reasons: ['UNKNOWN_BIRTH_TIME', 'MANUAL_TIMEZONE'],
          visibleMessageKey: 'birth.time.unknown',
          blocksExactReading: true,
        },
      },
      chartSystem: 'zi-wei-dou-shu',
      palaces: [],
      pillars: [],
      summary: { status: 'blocked', reason: 'test' },
      engineVersion: {
        enginePackage: '@ziweiai/astro-engine',
        engineSemver: '0.1.0',
        adapterVersions: [{ name: 'iztro', version: '2.5.8', configProfile: 'phase-3-default' }],
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
      inputHash: {
        algorithm: 'sha256',
        digest: '0123456789abcdef0123456789abcdef',
        saltPolicy: 'not-persisted',
      },
      calculationConfidence: {
        level: 'low',
        reasons: ['UNKNOWN_BIRTH_TIME', 'MANUAL_TIMEZONE'],
        visibleMessageKey: 'birth.time.unknown',
        blocksExactReading: true,
      },
      provenance: {
        referenceRepos: ['.ref/iztro'],
        runtimeLibraries: [{ name: 'iztro', version: '2.5.8' }],
        adapterConfig: [{ key: 'profile', value: 'phase-3-default' }],
        fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
        calculationTimestamp: '2026-06-03T00:00:00.000Z',
        warnings: ['unknown birth time'],
      },
      createdAt: '2026-06-03T00:00:00.000Z',
    };

    const minimal = {
      primary: base,
      partner: base,
      relationType: 'love',
      compatibility: {
        overallScore: 72,
        level: 'Khá hợp',
        dimensions: [{ name: 'Ngũ hành phối hợp', score: 80, description: 'Quan hệ tương sinh, hỗ trợ nhau.' }],
        narrative: 'Hai người có nền tảng tương hợp tốt.',
      },
    };
    const r = pairingSnapshotSchema.safeParse(minimal);
    expect(r.success).toBe(true);
  });

  it('tarotDrawSchema rejects empty question', () => {
    const bad = { question: '', spread: 'three-card', cards: [{ id: 'c1', name: 'Card', reversed: false, position: 0 }], narrative: 'ok' };
    expect(tarotDrawSchema.safeParse(bad).success).toBe(false);
  });

  it('visionAnalysisSchema accepts face + traits', () => {
    const ok = { kind: 'face', imagePath: 'vision-uploads/u1/s1.jpg', narrative: 'desc', traits: [{ label: 'Eye' }] };
    expect(visionAnalysisSchema.safeParse(ok).success).toBe(true);
  });

  it('mbtiResultSchema + mbtiAnswerSchema roundtrip', () => {
    const res = { type: 'ENTP', axes: [{ key: 'EI', score: 65, label: 'E' }, { key: 'SN', score: 40, label: 'S' }, { key: 'TF', score: 55, label: 'T' }, { key: 'JP', score: 70, label: 'J' }], narrative: 'desc' };
    expect(mbtiResultSchema.safeParse(res).success).toBe(true);

    const ans = { questionId: 'q1', choice: 4 };
    expect(mbtiAnswerSchema.safeParse(ans).success).toBe(true);
  });
});
