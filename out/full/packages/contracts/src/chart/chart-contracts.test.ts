import { describe, expect, it } from 'vitest';
import { birthInputSchema } from './birth-input';
import { chartSnapshotSchema } from './chart-snapshot';

describe('birthInputSchema', () => {
  it('parses manual coordinates with explicit timezone', () => {
    const result = birthInputSchema.safeParse({
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
    });

    expect(result.success).toBe(true);
  });

  it('rejects known time without both hour and minute', () => {
    const result = birthInputSchema.safeParse({
      calendar: 'gregorian',
      date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
      time: { hour: 9, minute: null, isUnknown: false },
      sexOrGenderForChart: 'female',
      place: { label: 'Ho Chi Minh City', manual: null },
      locale: 'vi-VN',
      source: 'user-entered',
    });

    expect(result.success).toBe(false);
  });
});

describe('chartSnapshotSchema', () => {
  it('parses a key-based Zi Wei snapshot with horoscope metadata', () => {
    const result = chartSnapshotSchema.safeParse({
      snapshotId: 'fixture-001',
      birth: {
        originalInput: {
          calendar: 'gregorian',
          date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
          time: { hour: null, minute: null, isUnknown: true },
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
          confidence: 'low',
        },
        normalizationConfidence: {
          level: 'low',
          reasons: ['UNKNOWN_BIRTH_TIME', 'MANUAL_TIMEZONE'],
          visibleMessageKey: 'birth.time.unknown',
          blocksExactReading: true,
        },
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
          minorStars: [{ nameKey: 'zuofuMin', group: 'minor' }],
          adjectiveStars: [{ nameKey: 'changsheng', group: 'adjective' }],
          changsheng12Key: 'changsheng',
          decadalRange: [3, 12],
          ages: [3, 15, 27],
        },
      ],
      pillars: [{ name: 'Year', value: 'Nhâm Thân' }],
      summary: {
        genderKey: 'female',
        solarDate: '1992-08-14',
        lunarDate: {
          year: 1992,
          month: 7,
          day: 16,
          isLeapMonth: false,
          sexagenaryYearKey: 'renShen',
        },
        zodiacKey: 'monkey',
        signKey: 'leo',
        timeEarthlyBranchKey: 'siEarthly',
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
          heavenlyStemKey: 'yiHeavenly',
          earthlyBranchKey: 'chouEarthly',
          palaceNameKeys: ['careerPalace'],
          mutagenStarKeys: ['wuquMaj'],
          nominalAge: 33,
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
        referenceRepos: ['.ref/iztro', '.ref/lunar-javascript'],
        runtimeLibraries: [{ name: 'iztro', version: '2.5.8' }],
        adapterConfig: [{ key: 'profile', value: 'phase-3-default' }],
        fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
        calculationTimestamp: '2026-06-03T00:00:00.000Z',
        warnings: ['unknown birth time'],
      },
      createdAt: '2026-06-03T00:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects Han text in Zi Wei key fields', () => {
    const result = chartSnapshotSchema.safeParse({
      snapshotId: 'fixture-001',
      birth: {
        originalInput: {
          calendar: 'gregorian',
          date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
          time: { hour: null, minute: null, isUnknown: true },
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
          confidence: 'low',
        },
        normalizationConfidence: {
          level: 'low',
          reasons: ['UNKNOWN_BIRTH_TIME', 'MANUAL_TIMEZONE'],
          visibleMessageKey: 'birth.time.unknown',
          blocksExactReading: true,
        },
      },
      chartSystem: 'zi-wei-dou-shu',
      palaces: [
        {
          nameKey: '命宫',
          index: 0,
          heavenlyStemKey: 'jiaHeavenly',
          earthlyBranchKey: 'ziEarthly',
          isBodyPalace: false,
          isOriginalPalace: false,
          majorStars: [],
          minorStars: [],
          adjectiveStars: [],
          ages: [],
        },
      ],
      pillars: [],
      summary: {
        soulPalaceNameKey: '命宫',
      },
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
        referenceRepos: ['.ref/iztro', '.ref/lunar-javascript'],
        runtimeLibraries: [{ name: 'iztro', version: '2.5.8' }],
        adapterConfig: [{ key: 'profile', value: 'phase-3-default' }],
        fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
        calculationTimestamp: '2026-06-03T00:00:00.000Z',
        warnings: ['unknown birth time'],
      },
      createdAt: '2026-06-03T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a future multi-system snapshot when it stays inside the shared contract envelope', () => {
    const result = chartSnapshotSchema.safeParse({
      snapshotId: 'fixture-qimen-001',
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
          utcInstant: '1992-08-14T02:30:00.000Z',
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
      chartSystem: 'qi-men-dun-jia',
      palaces: [],
      pillars: [],
      summary: {
        systemStage: 'foundation-only',
        note: 'future-phase',
      },
      engineVersion: {
        enginePackage: '@ziweiai/astro-engine',
        engineSemver: '0.1.0',
        adapterVersions: [{ name: 'foundation-stub', version: '0.0.0', configProfile: 'phase-2-foundation' }],
        fixtureSetVersion: 'phase-2-fixtures-v1',
        schemaVersion: 'phase-2-contracts-v1',
      },
      ruleSource: {
        system: 'qi-men-dun-jia',
        canonicalLibrary: { name: 'xuanshu', version: 'workspace-ref' },
        ruleSet: 'phase-2-foundation',
        schoolNotes: null,
        sourcePriority: 'manual-canonical-fixture',
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
        referenceRepos: ['.ref/xuanshu'],
        runtimeLibraries: [{ name: 'xuanshu', version: 'workspace-ref' }],
        adapterConfig: [{ key: 'phase', value: 'foundation-only' }],
        fixtureEvidence: { fixtureSetId: 'phase-2-fixtures-v1', passed: true },
        calculationTimestamp: '2026-06-11T16:40:00.000Z',
        warnings: [],
      },
      createdAt: '2026-06-11T16:40:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('parses a structured Bát Tự payload with key-based pillars and no CJK key leakage', () => {
    const result = chartSnapshotSchema.safeParse({
      snapshotId: 'fixture-bazi-001',
      birth: {
        originalInput: {
          calendar: 'gregorian',
          date: { year: 2005, month: 12, day: 23, isLeapMonth: null },
          time: { hour: 8, minute: 37, isUnknown: false },
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
          date: { year: 2005, month: 12, day: 23, isLeapMonth: null },
          time: { hour: 8, minute: 37, isUnknown: false },
          utcInstant: '2005-12-23T01:37:00.000Z',
        },
        resolvedLocation: {
          label: 'Manual entry',
          latitude: 10.8231,
          longitude: 106.6297,
          timezone: 'Asia/Ho_Chi_Minh',
          resolver: 'manual',
        },
        lunarDate: '二〇〇五年十一月廿三',
        ganZhi: {
          yearPillar: '乙酉',
          monthPillar: '戊子',
          dayPillar: '庚午',
          hourPillar: '庚辰',
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
        { name: 'year', value: 'Ất Dậu' },
        { name: 'month', value: 'Mậu Tý' },
        { name: 'day', value: 'Canh Ngọ' },
        { name: 'hour', value: 'Canh Thìn' },
      ],
      summary: {
        lunarDate: '二〇〇五年十一月廿三',
        mingGong: 'Kỷ Sửu',
        shenGong: 'Nhâm Ngọ',
        dayMaster: 'Canh Ngọ',
        taiYuan: 'Kỷ Mão',
        taiXi: 'Ất Mùi',
      },
      bazi: {
        dayMasterHeavenlyStemKey: 'gengHeavenly',
        pillars: [
          {
            slot: 'year',
            heavenlyStemKey: 'yiHeavenly',
            earthlyBranchKey: 'youEarthly',
            heavenlyStemElementKey: 'wood',
            earthlyBranchElementKey: 'metal',
            heavenlyStemTenGodKey: 'zhengCai',
            earthlyBranchTenGodKeys: ['jieCai'],
            hiddenStems: [{ heavenlyStemKey: 'xinHeavenly', elementKey: 'metal', tenGodKey: 'jieCai' }],
            naYin: 'Tuyền Trung Thủy',
          },
          {
            slot: 'month',
            heavenlyStemKey: 'wuHeavenly',
            earthlyBranchKey: 'ziEarthly',
            heavenlyStemElementKey: 'earth',
            earthlyBranchElementKey: 'water',
            heavenlyStemTenGodKey: 'pianYin',
            earthlyBranchTenGodKeys: ['shangGuan'],
            hiddenStems: [{ heavenlyStemKey: 'guiHeavenly', elementKey: 'water', tenGodKey: 'shangGuan' }],
            naYin: 'Tích Lịch Hỏa',
          },
          {
            slot: 'day',
            heavenlyStemKey: 'gengHeavenly',
            earthlyBranchKey: 'wuEarthly',
            heavenlyStemElementKey: 'metal',
            earthlyBranchElementKey: 'fire',
            heavenlyStemTenGodKey: 'riZhu',
            earthlyBranchTenGodKeys: ['zhengGuan', 'zhengYin'],
            hiddenStems: [
              { heavenlyStemKey: 'dingHeavenly', elementKey: 'fire', tenGodKey: 'zhengGuan' },
              { heavenlyStemKey: 'jiHeavenly', elementKey: 'earth', tenGodKey: 'zhengYin' },
            ],
            naYin: 'Lộ Bàng Thổ',
          },
          {
            slot: 'hour',
            heavenlyStemKey: 'gengHeavenly',
            earthlyBranchKey: 'chenEarthly',
            heavenlyStemElementKey: 'metal',
            earthlyBranchElementKey: 'earth',
            heavenlyStemTenGodKey: 'biJian',
            earthlyBranchTenGodKeys: ['pianYin', 'zhengCai', 'shangGuan'],
            hiddenStems: [
              { heavenlyStemKey: 'wuHeavenly', elementKey: 'earth', tenGodKey: 'pianYin' },
              { heavenlyStemKey: 'yiHeavenly', elementKey: 'wood', tenGodKey: 'zhengCai' },
              { heavenlyStemKey: 'guiHeavenly', elementKey: 'water', tenGodKey: 'shangGuan' },
            ],
            naYin: 'Bạch Lạp Kim',
          },
        ],
        taiYuan: { heavenlyStemKey: 'jiHeavenly', earthlyBranchKey: 'maoEarthly', naYin: 'Thành Đầu Thổ' },
        taiXi: { heavenlyStemKey: 'yiHeavenly', earthlyBranchKey: 'weiEarthly', naYin: 'Sa Trung Kim' },
        mingGong: { heavenlyStemKey: 'jiHeavenly', earthlyBranchKey: 'chouEarthly', naYin: 'Tích Lịch Hỏa' },
        shenGong: { heavenlyStemKey: 'renHeavenly', earthlyBranchKey: 'wuEarthly', naYin: 'Dương Liễu Mộc' },
      },
      engineVersion: {
        enginePackage: '@ziweiai/astro-engine',
        engineSemver: '0.1.0',
        adapterVersions: [{ name: 'lunar-javascript', version: '1.7.7', configProfile: 'phase-3-default' }],
        fixtureSetVersion: 'phase-3-fixtures-v1',
        schemaVersion: 'phase-3-contracts-v3',
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
        referenceRepos: ['.ref/lunar-javascript', '.ref/xuanshu'],
        runtimeLibraries: [{ name: 'lunar-javascript', version: '1.7.7' }],
        adapterConfig: [{ key: 'profile', value: 'phase-3-default' }],
        fixtureEvidence: { fixtureSetId: 'phase-3-fixtures-v1', passed: true },
        calculationTimestamp: '2026-06-11T17:30:00.000Z',
        warnings: [],
      },
      createdAt: '2026-06-11T17:30:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('parses a structured Mai Hoa payload with key-based quẻ dữ liệu', () => {
    const result = chartSnapshotSchema.safeParse({
      snapshotId: 'fixture-meihua-001',
      birth: {
        originalInput: {
          calendar: 'gregorian',
          date: { year: 2026, month: 6, day: 12, isLeapMonth: null },
          time: { hour: 9, minute: 15, isUnknown: false },
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
          date: { year: 2026, month: 6, day: 12, isLeapMonth: null },
          time: { hour: 9, minute: 15, isUnknown: false },
          utcInstant: '2026-06-12T02:15:00.000Z',
        },
        resolvedLocation: {
          label: 'Manual entry',
          latitude: 10.8231,
          longitude: 106.6297,
          timezone: 'Asia/Ho_Chi_Minh',
          resolver: 'manual',
        },
        lunarDate: '二〇二六年四月廿七',
        ganZhi: {
          yearPillar: '丙午',
          monthPillar: '甲午',
          dayPillar: '辛亥',
          hourPillar: '癸巳',
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
      chartSystem: 'mei-hua-yi-shu',
      palaces: [],
      pillars: [],
      summary: {
        method: 'Theo thời gian',
        mainHexagram: 'Ly trên Càn',
        changedHexagram: 'Khảm trên Càn',
        nuclearHexagram: 'Tốn trên Đoài',
        movingLine: 'Hào 3',
        bodyTrigram: 'Ly',
        useTrigram: 'Càn',
        relation: 'Thể khắc dụng, bạn nắm quyền chủ động nhưng cần trả giá bằng công sức.',
      },
      meihua: {
        method: 'time-based',
        guaCode: 331,
        movingLine: 3,
        mainHexagram: {
          key: 'li-over-qian',
          topTrigramKey: 'liTrigram',
          bottomTrigramKey: 'qianTrigram',
          lines: [
            { position: 1, value: 'yang', isMoving: false },
            { position: 2, value: 'yang', isMoving: false },
            { position: 3, value: 'yang', isMoving: true },
            { position: 4, value: 'yang', isMoving: false },
            { position: 5, value: 'yin', isMoving: false },
            { position: 6, value: 'yang', isMoving: false },
          ],
        },
        changedHexagram: {
          key: 'kan-over-qian',
          topTrigramKey: 'kanTrigram',
          bottomTrigramKey: 'qianTrigram',
          lines: [
            { position: 1, value: 'yang', isMoving: false },
            { position: 2, value: 'yang', isMoving: false },
            { position: 3, value: 'yin', isMoving: true },
            { position: 4, value: 'yin', isMoving: false },
            { position: 5, value: 'yang', isMoving: false },
            { position: 6, value: 'yin', isMoving: false },
          ],
        },
        nuclearHexagram: {
          key: 'xun-over-dui',
          topTrigramKey: 'xunTrigram',
          bottomTrigramKey: 'duiTrigram',
          lines: [
            { position: 1, value: 'yang', isMoving: false },
            { position: 2, value: 'yang', isMoving: false },
            { position: 3, value: 'yang', isMoving: false },
            { position: 4, value: 'yin', isMoving: false },
            { position: 5, value: 'yang', isMoving: false },
            { position: 6, value: 'yang', isMoving: false },
          ],
        },
        bodyTrigramKey: 'liTrigram',
        useTrigramKey: 'qianTrigram',
        bodyElementKey: 'fire',
        useElementKey: 'metal',
        relationKey: 'bodyControlsUse',
      },
      engineVersion: {
        enginePackage: '@ziweiai/astro-engine',
        engineSemver: '0.1.0',
        adapterVersions: [{ name: 'lunar-javascript-meihua', version: '1.7.7-time-port', configProfile: 'phase-3-default' }],
        fixtureSetVersion: 'phase-4-fixtures-v1',
        schemaVersion: 'phase-4-contracts-v1',
      },
      ruleSource: {
        system: 'mei-hua-yi-shu',
        canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
        ruleSet: 'phase-4-default',
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
        referenceRepos: ['.ref/xuanshu', '.ref/lunar-javascript'],
        runtimeLibraries: [{ name: 'lunar-javascript', version: '1.7.7' }],
        adapterConfig: [{ key: 'profile', value: 'phase-4-default' }],
        fixtureEvidence: { fixtureSetId: 'phase-4-fixtures-v1', passed: true },
        calculationTimestamp: '2026-06-12T02:15:00.000Z',
        warnings: [],
      },
      createdAt: '2026-06-12T02:15:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('parses a structured Liuyao payload with line-level dữ liệu key hóa', () => {
    const result = chartSnapshotSchema.safeParse({
      snapshotId: 'fixture-liuyao-001',
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
          utcInstant: '1992-08-14T02:30:00.000Z',
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
      chartSystem: 'liu-yao',
      palaces: [],
      pillars: [],
      summary: {
        method: 'Theo thời gian',
        baseHexagram: 'Thiên Lôi Vô Vọng',
        changedHexagram: 'Thiên Hỏa Đồng Nhân',
        movingLines: 'Hào 2, Hào 5',
        shiLine: 'Hào 3',
        yingLine: 'Hào 6',
      },
      liuyao: {
        method: 'time-based',
        movingLinePositions: [2, 5],
        baseHexagram: {
          key: 'qianTrigram_over_zhenTrigram',
          topTrigramKey: 'qianTrigram',
          bottomTrigramKey: 'zhenTrigram',
          name: 'Thiên Lôi Vô Vọng',
          symbol: '䷘',
          lines: [
            { position: 1, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'sibling', earthlyBranchKey: 'ziEarthly', fiveElementKey: 'water', naYin: 'Hải Trung Kim', sixSpiritKey: 'azureDragon', hiddenSpirit: null },
            { position: 2, value: 'yin', stateKey: 'oldYin', isMoving: true, roleKey: 'none', sixKinKey: 'childDescendant', earthlyBranchKey: 'yinEarthly', fiveElementKey: 'wood', naYin: 'Lô Trung Hỏa', sixSpiritKey: 'vermilionBird', hiddenSpirit: null },
            { position: 3, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'shi', sixKinKey: 'wifeWealth', earthlyBranchKey: 'chenEarthly', fiveElementKey: 'earth', naYin: 'Đại Lâm Mộc', sixSpiritKey: 'hookSnake', hiddenSpirit: null },
            { position: 4, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'officerGhost', earthlyBranchKey: 'wuEarthly', fiveElementKey: 'fire', naYin: 'Sa Trung Kim', sixSpiritKey: 'soaringSerpent', hiddenSpirit: 'Phụ mẫu' },
            { position: 5, value: 'yang', stateKey: 'oldYang', isMoving: true, roleKey: 'none', sixKinKey: 'parent', earthlyBranchKey: 'shenEarthly', fiveElementKey: 'metal', naYin: 'Kiếm Phong Kim', sixSpiritKey: 'whiteTiger', hiddenSpirit: null },
            { position: 6, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'ying', sixKinKey: 'sibling', earthlyBranchKey: 'xuEarthly', fiveElementKey: 'earth', naYin: 'Ốc Thượng Thổ', sixSpiritKey: 'blackTortoise', hiddenSpirit: null },
          ],
        },
        changedHexagram: {
          key: 'qianTrigram_over_liTrigram',
          topTrigramKey: 'qianTrigram',
          bottomTrigramKey: 'liTrigram',
          name: 'Thiên Hỏa Đồng Nhân',
          symbol: '䷌',
          lines: [
            { position: 1, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'sibling', earthlyBranchKey: 'ziEarthly', fiveElementKey: 'water', naYin: 'Hải Trung Kim', sixSpiritKey: 'azureDragon', hiddenSpirit: null },
            { position: 2, value: 'yang', stateKey: 'oldYin', isMoving: true, roleKey: 'none', sixKinKey: 'childDescendant', earthlyBranchKey: 'yinEarthly', fiveElementKey: 'wood', naYin: 'Lô Trung Hỏa', sixSpiritKey: 'vermilionBird', hiddenSpirit: null },
            { position: 3, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'shi', sixKinKey: 'wifeWealth', earthlyBranchKey: 'chenEarthly', fiveElementKey: 'earth', naYin: 'Đại Lâm Mộc', sixSpiritKey: 'hookSnake', hiddenSpirit: null },
            { position: 4, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'officerGhost', earthlyBranchKey: 'wuEarthly', fiveElementKey: 'fire', naYin: 'Sa Trung Kim', sixSpiritKey: 'soaringSerpent', hiddenSpirit: 'Phụ mẫu' },
            { position: 5, value: 'yin', stateKey: 'oldYang', isMoving: true, roleKey: 'none', sixKinKey: 'parent', earthlyBranchKey: 'shenEarthly', fiveElementKey: 'metal', naYin: 'Kiếm Phong Kim', sixSpiritKey: 'whiteTiger', hiddenSpirit: null },
            { position: 6, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'ying', sixKinKey: 'sibling', earthlyBranchKey: 'xuEarthly', fiveElementKey: 'earth', naYin: 'Ốc Thượng Thổ', sixSpiritKey: 'blackTortoise', hiddenSpirit: null },
          ],
        },
        nuclearHexagram: {
          key: 'xunTrigram_over_genTrigram',
          topTrigramKey: 'xunTrigram',
          bottomTrigramKey: 'genTrigram',
          name: 'Phong Sơn Tiệm',
          symbol: '䷴',
          lines: [
            { position: 1, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'sibling', earthlyBranchKey: 'chouEarthly', fiveElementKey: 'earth', naYin: 'Bích Thượng Thổ', sixSpiritKey: 'azureDragon', hiddenSpirit: null },
            { position: 2, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'childDescendant', earthlyBranchKey: 'maoEarthly', fiveElementKey: 'wood', naYin: 'Đại Khê Thủy', sixSpiritKey: 'vermilionBird', hiddenSpirit: null },
            { position: 3, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'shi', sixKinKey: 'wifeWealth', earthlyBranchKey: 'siEarthly', fiveElementKey: 'fire', naYin: 'Sa Trung Thổ', sixSpiritKey: 'hookSnake', hiddenSpirit: null },
            { position: 4, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'officerGhost', earthlyBranchKey: 'weiEarthly', fiveElementKey: 'earth', naYin: 'Thiên Thượng Hỏa', sixSpiritKey: 'soaringSerpent', hiddenSpirit: null },
            { position: 5, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'parent', earthlyBranchKey: 'youEarthly', fiveElementKey: 'metal', naYin: 'Thạch Lựu Mộc', sixSpiritKey: 'whiteTiger', hiddenSpirit: null },
            { position: 6, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'ying', sixKinKey: 'sibling', earthlyBranchKey: 'haiEarthly', fiveElementKey: 'water', naYin: 'Đại Hải Thủy', sixSpiritKey: 'blackTortoise', hiddenSpirit: null },
          ],
        },
      },
      horoscope: {
        decadal: {
          index: 0,
          heavenlyStemKey: 'jiaHeavenly',
          earthlyBranchKey: 'ziEarthly',
          palaceNameKeys: [],
          mutagenStarKeys: [],
        },
        age: {
          index: 0,
          nominalAge: 33,
        },
        yearly: {
          index: 0,
          heavenlyStemKey: 'jiaHeavenly',
          earthlyBranchKey: 'ziEarthly',
          palaceNameKeys: [],
          mutagenStarKeys: [],
        },
      },
      engineVersion: {
        enginePackage: '@ziweiai/astro-engine',
        engineSemver: '0.1.0',
        adapterVersions: [{ name: 'xuanshu-liuyao', version: 'phase-5-prototype', configProfile: 'phase-5-default' }],
        fixtureSetVersion: 'phase-5-fixtures-v1',
        schemaVersion: 'phase-5-contracts-v1',
      },
      ruleSource: {
        system: 'liu-yao',
        canonicalLibrary: { name: 'xuanshu', version: 'liuyao-reference' },
        ruleSet: 'phase-5-default',
        schoolNotes: null,
        sourcePriority: 'manual-canonical-fixture',
      },
      inputHash: {
        algorithm: 'sha256',
        digest: 'fedcba9876543210fedcba9876543210',
        saltPolicy: 'not-persisted',
      },
      calculationConfidence: {
        level: 'medium',
        reasons: ['MANUAL_TIMEZONE'],
        visibleMessageKey: 'birth.time.verified',
        blocksExactReading: false,
      },
      provenance: {
        referenceRepos: ['.ref/xuanshu'],
        runtimeLibraries: [{ name: 'xuanshu', version: 'liuyao-reference' }],
        adapterConfig: [{ key: 'configProfile', value: 'phase-5-default' }],
        fixtureEvidence: { fixtureSetId: 'phase-5-fixtures-v1', passed: true },
        calculationTimestamp: '2026-06-12T00:00:00.000Z',
        warnings: [],
      },
      createdAt: '2026-06-12T00:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });
}
);
