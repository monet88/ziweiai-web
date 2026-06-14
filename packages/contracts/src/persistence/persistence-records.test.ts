import { describe, expect, it } from 'vitest';
import {
  birthProfileRecordSchema,
  chartSnapshotRecordSchema,
  explanationRequestRecordSchema,
} from './persistence-records';

describe('birthProfileRecordSchema', () => {
  it('requires immutable birth input plus normalized birth', () => {
    const result = birthProfileRecordSchema.safeParse({
      id: '85ca818f-5550-44bc-81dd-d5d633421f43',
      ownerUserId: 'dff0da0d-f89c-4485-8d11-4e58fc00b8cb',
      isActive: true,
      rawBirthInput: {
        calendar: 'gregorian',
        date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
        time: { hour: 9, minute: 30, isUnknown: false },
        sexOrGenderForChart: 'female',
        place: {
          label: 'Manual entry',
          manual: {
            latitude: 10.8231,
            longitude: 106.6297,
            timezone: 'Asia/Ho_Chi_Minh',
          },
        },
        locale: 'vi-VN',
        source: 'user-entered',
      },
      normalizedBirth: {
        originalInput: {
          calendar: 'gregorian',
          date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
          time: { hour: 9, minute: 30, isUnknown: false },
          sexOrGenderForChart: 'female',
          place: {
            label: 'Manual entry',
            manual: {
              latitude: 10.8231,
              longitude: 106.6297,
              timezone: 'Asia/Ho_Chi_Minh',
            },
          },
          locale: 'vi-VN',
          source: 'user-entered',
        },
        resolvedDateTime: {
          date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
          time: { hour: 9, minute: 30, isUnknown: false },
          utcInstant: '1992-08-14T02:30:00Z',
        },
        resolvedLocation: {
          label: 'Manual entry',
          latitude: 10.8231,
          longitude: 106.6297,
          timezone: 'Asia/Ho_Chi_Minh',
          resolver: 'manual',
        },
        lunarDate: null,
        ganZhi: {
          yearPillar: null,
          monthPillar: null,
          dayPillar: null,
          hourPillar: null,
        },
        trueSolarTime: {
          status: 'deferred',
          offsetMinutes: null,
          provider: null,
          confidence: 'medium',
        },
        normalizationConfidence: {
          level: 'medium',
          reasons: ['MANUAL_TIMEZONE'],
          visibleMessageKey: 'birth.time.verified',
          blocksExactReading: false,
        },
      },
      inputHashDigest: '0123456789abcdef0123456789abcdef',
      retentionMode: 'persistent',
      deletedAt: null,
    });

    expect(result.success).toBe(true);
  });
});

describe('chartSnapshotRecordSchema', () => {
  it('requires dedupe key and immutable snapshot payload', () => {
    const result = chartSnapshotRecordSchema.safeParse({
      id: 'a9ac741c-7423-4767-90d7-f8b6781ccf0a',
      ownerUserId: 'dff0da0d-f89c-4485-8d11-4e58fc00b8cb',
      birthProfileId: '85ca818f-5550-44bc-81dd-d5d633421f43',
      chartSystem: 'ba-zi',
      snapshotDedupeKey: 'user:chart:dedupe:key',
      snapshot: {
        snapshotId: 'fixture-001',
        birth: {
          originalInput: {
            calendar: 'gregorian',
            date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
            time: { hour: 9, minute: 30, isUnknown: false },
            sexOrGenderForChart: 'female',
            place: {
              label: 'Manual entry',
              manual: {
                latitude: 10.8231,
                longitude: 106.6297,
                timezone: 'Asia/Ho_Chi_Minh',
              },
            },
            locale: 'vi-VN',
            source: 'test-fixture',
          },
          resolvedDateTime: {
            date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
            time: { hour: 9, minute: 30, isUnknown: false },
            utcInstant: '1992-08-14T02:30:00Z',
          },
          resolvedLocation: {
            label: 'Manual entry',
            latitude: 10.8231,
            longitude: 106.6297,
            timezone: 'Asia/Ho_Chi_Minh',
            resolver: 'manual',
          },
          lunarDate: 'demo',
          ganZhi: {
            yearPillar: '壬申',
            monthPillar: '戊申',
            dayPillar: '甲子',
            hourPillar: '己巳',
          },
          trueSolarTime: {
            status: 'deferred',
            offsetMinutes: null,
            provider: null,
            confidence: 'medium',
          },
          normalizationConfidence: {
            level: 'medium',
            reasons: ['MANUAL_TIMEZONE'],
            visibleMessageKey: 'birth.time.verified',
            blocksExactReading: false,
          },
        },
        chartSystem: 'ba-zi',
        palaces: [],
        pillars: [
          { name: 'Year', heavenlyStemKey: 'renHeavenly', earthlyBranchKey: 'shenEarthly', hiddenStemKeys: ['xinHeavenly'], stemTenGodKey: 'pianCaiTenGod', branchTenGodKeys: ['biJianTenGod'] },
          { name: 'Month', heavenlyStemKey: 'wuHeavenly', earthlyBranchKey: 'shenEarthly', hiddenStemKeys: ['renHeavenly', 'gengHeavenly', 'wuHeavenly'], stemTenGodKey: 'qiShaTenGod', branchTenGodKeys: ['pianYinTenGod', 'biJianTenGod', 'qiShaTenGod'] },
          { name: 'Day', heavenlyStemKey: 'jiaHeavenly', earthlyBranchKey: 'ziEarthly', hiddenStemKeys: ['guiHeavenly'], stemTenGodKey: 'riZhuTenGod', branchTenGodKeys: ['zhengYinTenGod'] },
          { name: 'Hour', heavenlyStemKey: 'jiHeavenly', earthlyBranchKey: 'siEarthly', hiddenStemKeys: ['bingHeavenly', 'wuHeavenly', 'gengHeavenly'], stemTenGodKey: 'shangGuanTenGod', branchTenGodKeys: ['shiShenTenGod', 'qiShaTenGod', 'biJianTenGod'] },
        ],
        summary: {
          lunarDate: '1992-07-16',
          mingGong: { heavenlyStemKey: 'jiaHeavenly', earthlyBranchKey: 'ziEarthly' },
          shenGong: { heavenlyStemKey: 'yiHeavenly', earthlyBranchKey: 'chouEarthly' },
        },
        tenGods: {
          year: 'pianCaiTenGod',
          month: 'qiShaTenGod',
          day: 'riZhuTenGod',
          hour: 'shangGuanTenGod',
        },
        hiddenStems: {
          year: ['xinHeavenly'],
          month: ['renHeavenly', 'gengHeavenly', 'wuHeavenly'],
          day: ['guiHeavenly'],
          hour: ['bingHeavenly', 'wuHeavenly', 'gengHeavenly'],
        },
        hiddenStemTenGods: {
          year: ['biJianTenGod'],
          month: ['pianYinTenGod', 'biJianTenGod', 'qiShaTenGod'],
          day: ['zhengYinTenGod'],
          hour: ['shiShenTenGod', 'qiShaTenGod', 'biJianTenGod'],
        },
        engineVersion: {
          enginePackage: '@ziweiai/astro-engine',
          engineSemver: '0.1.0',
          adapterVersions: [{ name: 'lunar-javascript', version: '1.7.7', configProfile: 'phase-3-default' }],
          fixtureSetVersion: 'phase-3-fixtures-v1',
          schemaVersion: 'phase-3-contracts-v1',
        },
        ruleSource: {
          system: 'ba-zi',
          canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
          ruleSet: 'phase-3-default',
          schoolNotes: null,
          sourcePriority: 'lunar-javascript-first',
        },
        inputHash: {
          algorithm: 'sha256',
          digest: '0123456789abcdef0123456789abcdef',
          saltPolicy: 'not-persisted',
        },
        calculationConfidence: {
          level: 'medium',
          reasons: ['MANUAL_TIMEZONE'],
          visibleMessageKey: 'birth.time.verified',
          blocksExactReading: false,
        },
        provenance: {
          referenceRepos: ['.ref/lunar-javascript'],
          runtimeLibraries: [{ name: 'lunar-javascript', version: '1.7.7' }],
          adapterConfig: [{ key: 'configProfile', value: 'phase-3-default' }],
          fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
          calculationTimestamp: '2026-06-03T00:00:00.000Z',
          warnings: [],
        },
        createdAt: '2026-06-03T00:00:00.000Z',
      },
      inputHashDigest: '0123456789abcdef0123456789abcdef',
      confidenceLevel: 'medium',
      createdAt: '2026-06-03T00:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('normalizes legacy Zi Wei palace snapshots when reading saved records', () => {
    const result = chartSnapshotRecordSchema.safeParse({
      id: 'a9ac741c-7423-4767-90d7-f8b6781ccf0a',
      ownerUserId: 'dff0da0d-f89c-4485-8d11-4e58fc00b8cb',
      birthProfileId: '85ca818f-5550-44bc-81dd-d5d633421f43',
      chartSystem: 'zi-wei-dou-shu',
      snapshotDedupeKey: 'user:chart:legacy:dedupe:key',
      snapshot: {
        snapshotId: 'legacy-001',
        birth: {
          originalInput: {
            calendar: 'gregorian',
            date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
            time: { hour: 9, minute: 30, isUnknown: false },
            sexOrGenderForChart: 'female',
            place: {
              label: 'Manual entry',
              manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
            },
            locale: 'vi-VN',
            source: 'test-fixture',
          },
          resolvedDateTime: {
            date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
            time: { hour: 9, minute: 30, isUnknown: false },
            utcInstant: '1992-08-14T02:30:00Z',
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
          trueSolarTime: { status: 'deferred', offsetMinutes: null, provider: null, confidence: 'medium' },
          normalizationConfidence: {
            level: 'medium',
            reasons: ['MANUAL_TIMEZONE'],
            visibleMessageKey: 'birth.time.verified',
            blocksExactReading: false,
          },
        },
        chartSystem: 'zi-wei-dou-shu',
        palaces: [{ name: 'Mệnh', stars: ['Tử Vi'] }],
        pillars: [{ name: 'Soul', value: 'Tý' }],
        summary: { gender: 'Nữ', solarDate: '1992-08-14' },
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
          level: 'medium',
          reasons: ['MANUAL_TIMEZONE'],
          visibleMessageKey: 'birth.time.verified',
          blocksExactReading: false,
        },
        provenance: {
          referenceRepos: ['.ref/iztro'],
          runtimeLibraries: [{ name: 'iztro', version: '2.5.8' }],
          adapterConfig: [{ key: 'configProfile', value: 'phase-3-default' }],
          fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
          calculationTimestamp: '2026-06-03T00:00:00.000Z',
          warnings: [],
        },
        createdAt: '2026-06-03T00:00:00.000Z',
      },
      inputHashDigest: '0123456789abcdef0123456789abcdef',
      confidenceLevel: 'medium',
      createdAt: '2026-06-03T00:00:00.000Z',
    });

    expect(result.success).toBe(true);
    if (result.success && result.data.snapshot.chartSystem === 'zi-wei-dou-shu') {
      expect(result.data.snapshot.palaces[0]).toMatchObject({
        nameKey: 'legacyPalace0',
        displayName: 'Mệnh',
        majorStars: [{ nameKey: 'legacyStar0_0', group: 'major', displayName: 'Tử Vi' }],
      });
    }
  });
});

describe('explanationRequestRecordSchema', () => {
  it('defaults to promptless persistence-friendly request metadata', () => {
    const result = explanationRequestRecordSchema.safeParse({
      id: '8f1f5bfa-ffea-4bbf-863e-648fae4888bb',
      ownerUserId: 'dff0da0d-f89c-4485-8d11-4e58fc00b8cb',
      chartSnapshotId: 'a9ac741c-7423-4767-90d7-f8b6781ccf0a',
      idempotencyKey: 'user:explanation:dedupe:key',
      requestState: 'pending',
      providerName: 'deepseek',
      promptStorageMode: 'not_stored',
      failureRetainsUntil: null,
      createdAt: '2026-06-03T00:00:00.000Z',
      updatedAt: '2026-06-03T00:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });
});
