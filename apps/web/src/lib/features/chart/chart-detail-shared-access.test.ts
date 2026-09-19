import { describe, expect, it } from 'vitest';
import { chartDetailResponseSchema } from '@ziweiai/contracts';

describe('ChartDetailResponse contract schema and isOwner invariant', () => {
  const snapshotObj = {
    snapshotId: 'snapshot-1',
    birth: {
      originalInput: {
        calendar: 'gregorian' as const,
        date: { year: 1990, month: 1, day: 27, isLeapMonth: null },
        time: { hour: 0, minute: 0, isUnknown: false },
        sexOrGenderForChart: 'female' as const,
        place: {
          label: 'Manual entry',
          manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
        },
        locale: 'vi-VN',
        source: 'test-fixture',
      },
      resolvedDateTime: {
        date: { year: 1990, month: 1, day: 27, isLeapMonth: null },
        time: { hour: 0, minute: 0, isUnknown: false },
        utcInstant: '1990-01-26T17:00:00.000Z',
      },
      resolvedLocation: {
        label: 'Manual entry',
        latitude: 10.8231,
        longitude: 106.6297,
        timezone: 'Asia/Ho_Chi_Minh',
        resolver: 'manual' as const,
      },
      lunarDate: null,
      ganZhi: { yearPillar: null, monthPillar: null, dayPillar: null, hourPillar: null },
      trueSolarTime: { status: 'deferred' as const, offsetMinutes: null, provider: null, confidence: 'medium' as const },
      normalizationConfidence: {
        level: 'medium' as const,
        reasons: ['MANUAL_TIMEZONE'],
        visibleMessageKey: 'birth.time.verified',
        blocksExactReading: false,
      },
    },
    chartSystem: 'zi-wei-dou-shu' as const,
    palaces: [],
    pillars: [],
    summary: {
      genderKey: 'female',
      solarDate: '1990-01-27',
      zodiacKey: 'horse',
      signKey: 'aquarius',
      timeEarthlyBranchKey: 'ziEarthly',
      soulPalaceNameKey: 'soulPalace',
      bodyPalaceNameKey: 'bodyPalace',
      lifeMasterKey: 'ziweiMaj',
      bodyMasterKey: 'wenchangMin',
      fiveElementsClassKey: 'metal4th',
    },
    horoscope: {
      decadal: {
        index: 0,
        heavenlyStemKey: 'jiaHeavenly',
        earthlyBranchKey: 'ziEarthly',
        palaceNameKeys: ['soulPalace'],
        mutagenStarKeys: ['ziweiMaj'],
      },
      age: {
        index: 1,
        nominalAge: 35,
      },
      yearly: {
        index: 2,
        heavenlyStemKey: 'bingHeavenly',
        earthlyBranchKey: 'yinEarthly',
        palaceNameKeys: ['wealthPalace'],
        mutagenStarKeys: ['tanlangMaj'],
      },
    },
    engineVersion: {
      enginePackage: '@ziweiai/astro-engine',
      engineSemver: '0.1.0',
      adapterVersions: [{ name: 'iztro', version: '2.5.8', configProfile: 'phase-3-default' }],
      fixtureSetVersion: 'phase-3-fixtures-v1',
      schemaVersion: 'phase-3-contracts-v2',
    },
    ruleSource: {
      system: 'zi-wei-dou-shu' as const,
      canonicalLibrary: { name: 'iztro', version: '2.5.8' },
      ruleSet: 'phase-3-default',
      schoolNotes: null,
      sourcePriority: 'iztro-first' as const,
    },
    inputHash: { algorithm: 'sha256' as const, digest: '0123456789abcdef0123456789abcdef', saltPolicy: 'not-persisted' as const },
    calculationConfidence: {
      level: 'medium' as const,
      reasons: ['MANUAL_TIMEZONE'],
      visibleMessageKey: 'birth.time.verified',
      blocksExactReading: false,
    },
    provenance: {
      referenceRepos: ['.ref/iztro'],
      runtimeLibraries: [{ name: 'iztro', version: '2.5.8' }],
      adapterConfig: [{ key: 'configProfile', value: 'phase-3-default' }],
      fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
      calculationTimestamp: '2026-06-08T00:00:00.000Z',
      warnings: [],
    },
    createdAt: '2026-06-08T00:00:00.000Z',
  };

  const minimalValidPayload = {
    chartRecord: {
      id: '33333333-3333-4333-8333-333333333333',
      ownerUserId: '11111111-1111-4111-8111-111111111111',
      birthProfileId: '22222222-2222-4222-8222-222222222222',
      chartSystem: 'zi-wei-dou-shu' as const,
      snapshotDedupeKey: '0123456789abcdef0123',
      snapshot: snapshotObj,
      inputHashDigest: '0123456789abcdef0123456789abcdef',
      confidenceLevel: 'high' as const,
      createdAt: '2026-06-08T00:00:00.000Z',
    },
    snapshot: snapshotObj,
    explanationResults: [],
  };

  it('defaults isOwner to true when backend payload omits it for backward compatibility', () => {
    const parsed = chartDetailResponseSchema.parse(minimalValidPayload);
    expect(parsed.isOwner).toBe(true);
  });

  it('parses isOwner=false when payload explicitly indicates guest access', () => {
    const parsed = chartDetailResponseSchema.parse({
      ...minimalValidPayload,
      isOwner: false,
    });
    expect(parsed.isOwner).toBe(false);
  });

  it('parses isOwner=true when payload explicitly indicates owner access', () => {
    const parsed = chartDetailResponseSchema.parse({
      ...minimalValidPayload,
      isOwner: true,
    });
    expect(parsed.isOwner).toBe(true);
  });
});
