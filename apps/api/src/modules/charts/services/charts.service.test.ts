import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CreateChartRequest, CreateChartResponse } from '@ziweiai/contracts';
import { buildChartSnapshotDedupeKey } from '../../../database/idempotency';
import { ChartsService } from './charts.service';

afterEach(() => {
  vi.useRealTimers();
});

function buildSnapshot(overrides?: Partial<CreateChartResponse['snapshot']>): CreateChartResponse['snapshot'] {
  const digest = '0123456789abcdef0123456789abcdef';
  return {
    snapshotId: 'snapshot-1',
    birth: {
      originalInput: {
        calendar: 'gregorian',
        date: { year: 1990, month: 1, day: 27, isLeapMonth: null },
        time: { hour: 0, minute: 0, isUnknown: false },
        sexOrGenderForChart: 'female',
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
      system: 'zi-wei-dou-shu',
      canonicalLibrary: { name: 'iztro', version: '2.5.8' },
      ruleSet: 'phase-3-default',
      schoolNotes: null,
      sourcePriority: 'iztro-first',
    },
    inputHash: { algorithm: 'sha256', digest, saltPolicy: 'not-persisted' },
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
      calculationTimestamp: '2026-06-08T00:00:00.000Z',
      warnings: [],
    },
    createdAt: '2026-06-08T00:00:00.000Z',
    ...overrides,
  };
}

describe('ChartsService', () => {
  it('passes viewYear to the adapter and returns the stored snapshot without display fallback recalculation', async () => {
    const snapshot = buildSnapshot();
    const adapterCalculateChart = vi.fn(async () => snapshot);
    const persistenceGateway = {
      findLatestBirthProfileByInputHash: vi.fn(async () => null),
      createBirthProfile: vi.fn(async () => ({
        id: '11111111-1111-1111-8111-111111111111',
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        isActive: true,
        rawBirthInput: snapshot.birth.originalInput,
        normalizedBirth: snapshot.birth,
        inputHashDigest: snapshot.inputHash.digest,
        retentionMode: 'persistent',
        deletedAt: null,
      })),
      findChartSnapshotByDedupeKey: vi.fn(async () => null),
      createChartSnapshot: vi.fn(async () => ({
        id: '33333333-3333-3333-8333-333333333333',
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        birthProfileId: '11111111-1111-1111-8111-111111111111',
        chartSystem: snapshot.chartSystem,
        snapshotDedupeKey: '0123456789abcdef',
        snapshot,
        inputHashDigest: snapshot.inputHash.digest,
        confidenceLevel: snapshot.calculationConfidence.level,
        createdAt: snapshot.createdAt,
      })),
      findChartSnapshotById: vi.fn(async () => ({
        id: '33333333-3333-3333-8333-333333333333',
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        birthProfileId: '11111111-1111-1111-8111-111111111111',
        chartSystem: snapshot.chartSystem,
        snapshotDedupeKey: '0123456789abcdef',
        snapshot,
        inputHashDigest: snapshot.inputHash.digest,
        confidenceLevel: snapshot.calculationConfidence.level,
        createdAt: snapshot.createdAt,
      })),
      createHistoryView: vi.fn(async () => ({
        id: '44444444-4444-4444-8444-444444444444',
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        chartSnapshotId: '33333333-3333-3333-8333-333333333333',
        explanationResultId: null,
        viewedAt: snapshot.createdAt,
      })),
      listExplanationResultsForChart: vi.fn(async () => []),
    };
    const quotasService = {
      assertCanCreateChart: vi.fn(async () => undefined),
    };

    const service = new ChartsService(persistenceGateway as never, quotasService as never);
    (service as unknown as { adapters: Record<string, { calculateChart: typeof adapterCalculateChart; usesViewYear: boolean }> }).adapters['zi-wei-dou-shu'] = {
      calculateChart: adapterCalculateChart,
      usesViewYear: true,
    };

    const input: CreateChartRequest = {
      birthInput: snapshot.birth.originalInput,
      chartSystem: 'zi-wei-dou-shu',
      makeActiveBirthProfile: true,
      viewYear: 2035,
    };

    const userId = '22222222-2222-2222-8222-222222222222';
    const chartSnapshotId = '33333333-3333-3333-8333-333333333333';
    const result = await service.createChart(userId, '127.0.0.1', input);
    const detail = await service.getChartDetail(userId, chartSnapshotId);

    expect(adapterCalculateChart).toHaveBeenCalledTimes(1);
    expect(adapterCalculateChart).toHaveBeenCalledWith(input.birthInput, { viewYear: 2035 });
    expect(persistenceGateway.findChartSnapshotByDedupeKey).toHaveBeenCalledWith(userId, expect.any(String));
    expect(result.snapshot).toStrictEqual(snapshot);
    expect(detail.snapshot).toStrictEqual(snapshot);
  });

  it('uses the current UTC year for omitted viewYear in both calculation and dedupe', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-01-01T00:00:00.000Z'));
    const snapshot = buildSnapshot();
    const adapterCalculateChart = vi.fn(async () => snapshot);
    const persistenceGateway = {
      findLatestBirthProfileByInputHash: vi.fn(async () => null),
      createBirthProfile: vi.fn(async () => ({
        id: '11111111-1111-1111-8111-111111111111',
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        isActive: true,
        rawBirthInput: snapshot.birth.originalInput,
        normalizedBirth: snapshot.birth,
        inputHashDigest: snapshot.inputHash.digest,
        retentionMode: 'persistent',
        deletedAt: null,
      })),
      findChartSnapshotByDedupeKey: vi.fn(async () => null),
      createChartSnapshot: vi.fn(async () => ({
        id: '33333333-3333-3333-8333-333333333333',
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        birthProfileId: '11111111-1111-1111-8111-111111111111',
        chartSystem: snapshot.chartSystem,
        snapshotDedupeKey: '0123456789abcdef',
        snapshot,
        inputHashDigest: snapshot.inputHash.digest,
        confidenceLevel: snapshot.calculationConfidence.level,
        createdAt: snapshot.createdAt,
      })),
    };
    const quotasService = {
      assertCanCreateChart: vi.fn(async () => undefined),
    };
    const service = new ChartsService(persistenceGateway as never, quotasService as never);
    (service as unknown as { adapters: Record<string, { calculateChart: typeof adapterCalculateChart; usesViewYear: boolean }> }).adapters['zi-wei-dou-shu'] = {
      calculateChart: adapterCalculateChart,
      usesViewYear: true,
    };

    await service.createChart('22222222-2222-2222-8222-222222222222', '127.0.0.1', {
      birthInput: snapshot.birth.originalInput,
      chartSystem: 'zi-wei-dou-shu',
      makeActiveBirthProfile: true,
    });

    expect(adapterCalculateChart).toHaveBeenCalledWith(snapshot.birth.originalInput, { viewYear: 2027 });
    expect(persistenceGateway.findChartSnapshotByDedupeKey).toHaveBeenCalledWith(
      '22222222-2222-2222-8222-222222222222',
      buildChartSnapshotDedupeKey({
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        chartSystem: 'zi-wei-dou-shu',
        inputHashDigest: snapshot.inputHash.digest,
        engineSemver: snapshot.engineVersion.engineSemver,
        ruleSourceVersion: snapshot.ruleSource.canonicalLibrary.version,
        schemaVersion: snapshot.engineVersion.schemaVersion,
        viewYear: 2027,
      }),
    );
  });
  it('omits viewYear for ba-zi so identical inputs reuse the snapshot across years', async () => {
    const snapshot = buildSnapshot({
      chartSystem: 'ba-zi',
      pillars: [
        { name: 'yearPillar', value: 'Canh Ngọ' },
        { name: 'monthPillar', value: 'Quý Mùi' },
        { name: 'dayPillar', value: 'Giáp Thân' },
        { name: 'hourPillar', value: 'Ất Dậu' },
      ],
      summary: {
        lunarDate: '1990-01-27',
        mingGong: 'Giáp Tý',
        shenGong: 'Ất Sửu',
      },
      ruleSource: {
        system: 'ba-zi',
        canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
        ruleSet: 'phase-3-default',
        schoolNotes: null,
        sourcePriority: 'lunar-javascript-first',
      },
    });
    const adapterCalculateChart = vi.fn(async () => snapshot);
    const persistenceGateway = {
      findLatestBirthProfileByInputHash: vi.fn(async () => null),
      createBirthProfile: vi.fn(async () => ({
        id: '11111111-1111-1111-8111-111111111111',
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        isActive: true,
        rawBirthInput: snapshot.birth.originalInput,
        normalizedBirth: snapshot.birth,
        inputHashDigest: snapshot.inputHash.digest,
        retentionMode: 'persistent',
        deletedAt: null,
      })),
      findChartSnapshotByDedupeKey: vi.fn(async () => null),
      createChartSnapshot: vi.fn(async () => ({
        id: '33333333-3333-3333-8333-333333333333',
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        birthProfileId: '11111111-1111-1111-8111-111111111111',
        chartSystem: snapshot.chartSystem,
        snapshotDedupeKey: '0123456789abcdef',
        snapshot,
        inputHashDigest: snapshot.inputHash.digest,
        confidenceLevel: snapshot.calculationConfidence.level,
        createdAt: snapshot.createdAt,
      })),
    };
    const quotasService = {
      assertCanCreateChart: vi.fn(async () => undefined),
    };
    const service = new ChartsService(persistenceGateway as never, quotasService as never);
    (service as unknown as { adapters: Record<string, { calculateChart: typeof adapterCalculateChart; usesViewYear: boolean }> }).adapters['ba-zi'] = {
      calculateChart: adapterCalculateChart,
      usesViewYear: false,
    };

    await service.createChart('22222222-2222-2222-8222-222222222222', '127.0.0.1', {
      birthInput: snapshot.birth.originalInput,
      chartSystem: 'ba-zi',
      makeActiveBirthProfile: true,
      viewYear: 2035,
    });

    expect(adapterCalculateChart).toHaveBeenCalledWith(snapshot.birth.originalInput, { viewYear: undefined });
    expect(persistenceGateway.findChartSnapshotByDedupeKey).toHaveBeenCalledWith(
      '22222222-2222-2222-8222-222222222222',
      buildChartSnapshotDedupeKey({
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        chartSystem: 'ba-zi',
        inputHashDigest: snapshot.inputHash.digest,
        engineSemver: snapshot.engineVersion.engineSemver,
        ruleSourceVersion: snapshot.ruleSource.canonicalLibrary.version,
        schemaVersion: snapshot.engineVersion.schemaVersion,
      }),
    );
  });

  it('omits viewYear for mei-hua-yi-shu so quẻ theo thời gian không bị tách dedupe theo năm xem', async () => {
    const snapshot = buildSnapshot({
      chartSystem: 'mei-hua-yi-shu',
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
      ruleSource: {
        system: 'mei-hua-yi-shu',
        canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
        ruleSet: 'phase-4-default',
        schoolNotes: null,
        sourcePriority: 'lunar-javascript-first',
      },
    });
    const adapterCalculateChart = vi.fn(async () => snapshot);
    const persistenceGateway = {
      findLatestBirthProfileByInputHash: vi.fn(async () => null),
      createBirthProfile: vi.fn(async () => ({
        id: '11111111-1111-1111-8111-111111111111',
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        isActive: true,
        rawBirthInput: snapshot.birth.originalInput,
        normalizedBirth: snapshot.birth,
        inputHashDigest: snapshot.inputHash.digest,
        retentionMode: 'persistent',
        deletedAt: null,
      })),
      findChartSnapshotByDedupeKey: vi.fn(async () => null),
      createChartSnapshot: vi.fn(async () => ({
        id: '33333333-3333-3333-8333-333333333333',
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        birthProfileId: '11111111-1111-1111-8111-111111111111',
        chartSystem: snapshot.chartSystem,
        snapshotDedupeKey: '0123456789abcdef',
        snapshot,
        inputHashDigest: snapshot.inputHash.digest,
        confidenceLevel: snapshot.calculationConfidence.level,
        createdAt: snapshot.createdAt,
      })),
    };
    const quotasService = {
      assertCanCreateChart: vi.fn(async () => undefined),
    };
    const service = new ChartsService(persistenceGateway as never, quotasService as never);
    (service as unknown as { adapters: Record<string, { calculateChart: typeof adapterCalculateChart; usesViewYear: boolean }> }).adapters['mei-hua-yi-shu'] = {
      calculateChart: adapterCalculateChart,
      usesViewYear: false,
    };

    await service.createChart('22222222-2222-2222-8222-222222222222', '127.0.0.1', {
      birthInput: snapshot.birth.originalInput,
      chartSystem: 'mei-hua-yi-shu',
      makeActiveBirthProfile: true,
      viewYear: 2035,
    });

    expect(adapterCalculateChart).toHaveBeenCalledWith(snapshot.birth.originalInput, { viewYear: undefined });
    expect(persistenceGateway.findChartSnapshotByDedupeKey).toHaveBeenCalledWith(
      '22222222-2222-2222-8222-222222222222',
      buildChartSnapshotDedupeKey({
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        chartSystem: 'mei-hua-yi-shu',
        inputHashDigest: snapshot.inputHash.digest,
        engineSemver: snapshot.engineVersion.engineSemver,
        ruleSourceVersion: snapshot.ruleSource.canonicalLibrary.version,
        schemaVersion: snapshot.engineVersion.schemaVersion,
      }),
    );
  });

  it('omits viewYear for liu-yao so cùng dữ liệu không bị tách snapshot theo năm xem', async () => {
    const snapshot = buildSnapshot({
      chartSystem: 'liu-yao',
      summary: {
        method: 'Theo thời gian',
        baseHexagram: 'Ly trên Khôn',
        changedHexagram: 'Cấn trên Khôn',
        movingLines: 'Hào 4',
        shiLine: 'Hào 4',
        yingLine: 'Hào 1',
      },
      liuyao: {
        method: 'time-based',
        movingLinePositions: [4],
        baseHexagram: {
          key: 'liTrigram_over_kunTrigram',
          topTrigramKey: 'liTrigram',
          bottomTrigramKey: 'kunTrigram',
          name: 'Ly trên Khôn',
          symbol: '000101',
          lines: [
            { position: 1, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'ying', sixKinKey: 'parent', earthlyBranchKey: 'weiEarthly', fiveElementKey: 'earth', naYin: 'Sa Trung Kim', sixSpiritKey: 'azureDragon', hiddenSpirit: 'Tử tôn' },
            { position: 2, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'officerGhost', earthlyBranchKey: 'siEarthly', fiveElementKey: 'fire', naYin: 'Phú Đăng Hỏa', sixSpiritKey: 'vermilionBird', hiddenSpirit: null },
            { position: 3, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'wifeWealth', earthlyBranchKey: 'maoEarthly', fiveElementKey: 'wood', naYin: 'Đại Khê Thủy', sixSpiritKey: 'hookSnake', hiddenSpirit: null },
            { position: 4, value: 'yang', stateKey: 'oldYang', isMoving: true, roleKey: 'shi', sixKinKey: 'sibling', earthlyBranchKey: 'youEarthly', fiveElementKey: 'metal', naYin: 'Đại Dịch Thổ', sixSpiritKey: 'soaringSerpent', hiddenSpirit: null },
            { position: 5, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'parent', earthlyBranchKey: 'weiEarthly', fiveElementKey: 'earth', naYin: 'Thiên Thượng Hỏa', sixSpiritKey: 'whiteTiger', hiddenSpirit: null },
            { position: 6, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'officerGhost', earthlyBranchKey: 'siEarthly', fiveElementKey: 'fire', naYin: 'Đại Lâm Mộc', sixSpiritKey: 'blackTortoise', hiddenSpirit: null },
          ],
        },
        changedHexagram: {
          key: 'genTrigram_over_kunTrigram',
          topTrigramKey: 'genTrigram',
          bottomTrigramKey: 'kunTrigram',
          name: 'Cấn trên Khôn',
          symbol: '000001',
          lines: [
            { position: 1, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'parent', earthlyBranchKey: 'weiEarthly', fiveElementKey: 'earth', naYin: 'Sa Trung Kim', sixSpiritKey: 'azureDragon', hiddenSpirit: null },
            { position: 2, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'ying', sixKinKey: 'officerGhost', earthlyBranchKey: 'siEarthly', fiveElementKey: 'fire', naYin: 'Phú Đăng Hỏa', sixSpiritKey: 'vermilionBird', hiddenSpirit: null },
            { position: 3, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'wifeWealth', earthlyBranchKey: 'maoEarthly', fiveElementKey: 'wood', naYin: 'Đại Khê Thủy', sixSpiritKey: 'hookSnake', hiddenSpirit: null },
            { position: 4, value: 'yin', stateKey: 'oldYang', isMoving: true, roleKey: 'none', sixKinKey: 'parent', earthlyBranchKey: 'xuEarthly', fiveElementKey: 'earth', naYin: 'Ốc Thượng Thổ', sixSpiritKey: 'soaringSerpent', hiddenSpirit: null },
            { position: 5, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'shi', sixKinKey: 'childDescendant', earthlyBranchKey: 'ziEarthly', fiveElementKey: 'water', naYin: 'Giản Hạ Thủy', sixSpiritKey: 'whiteTiger', hiddenSpirit: null },
            { position: 6, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'wifeWealth', earthlyBranchKey: 'yinEarthly', fiveElementKey: 'wood', naYin: 'Lô Trung Hỏa', sixSpiritKey: 'blackTortoise', hiddenSpirit: null },
          ],
        },
        nuclearHexagram: {
          key: 'kanTrigram_overgenTrigram',
          topTrigramKey: 'kanTrigram',
          bottomTrigramKey: 'genTrigram',
          name: 'Khảm trên Cấn',
          symbol: '001010',
          lines: [
            { position: 1, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'ying', sixKinKey: 'parent', earthlyBranchKey: 'weiEarthly', fiveElementKey: 'earth', naYin: 'Sa Trung Kim', sixSpiritKey: 'azureDragon', hiddenSpirit: null },
            { position: 2, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'officerGhost', earthlyBranchKey: 'siEarthly', fiveElementKey: 'fire', naYin: 'Phú Đăng Hỏa', sixSpiritKey: 'vermilionBird', hiddenSpirit: null },
            { position: 3, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'wifeWealth', earthlyBranchKey: 'maoEarthly', fiveElementKey: 'wood', naYin: 'Đại Khê Thủy', sixSpiritKey: 'hookSnake', hiddenSpirit: null },
            { position: 4, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'shi', sixKinKey: 'sibling', earthlyBranchKey: 'youEarthly', fiveElementKey: 'metal', naYin: 'Đại Dịch Thổ', sixSpiritKey: 'soaringSerpent', hiddenSpirit: null },
            { position: 5, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'parent', earthlyBranchKey: 'weiEarthly', fiveElementKey: 'earth', naYin: 'Thiên Thượng Hỏa', sixSpiritKey: 'whiteTiger', hiddenSpirit: null },
            { position: 6, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'officerGhost', earthlyBranchKey: 'siEarthly', fiveElementKey: 'fire', naYin: 'Đại Lâm Mộc', sixSpiritKey: 'blackTortoise', hiddenSpirit: null },
          ],
        },
      },
      ruleSource: {
        system: 'liu-yao',
        canonicalLibrary: { name: 'xuanshu', version: 'liuyao-reference' },
        ruleSet: 'phase-5-default',
        schoolNotes: null,
        sourcePriority: 'manual-canonical-fixture',
      },
    });
    const adapterCalculateChart = vi.fn(async () => snapshot);
    const persistenceGateway = {
      findLatestBirthProfileByInputHash: vi.fn(async () => null),
      createBirthProfile: vi.fn(async () => ({
        id: '11111111-1111-1111-8111-111111111111',
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        isActive: true,
        rawBirthInput: snapshot.birth.originalInput,
        normalizedBirth: snapshot.birth,
        inputHashDigest: snapshot.inputHash.digest,
        retentionMode: 'persistent',
        deletedAt: null,
      })),
      findChartSnapshotByDedupeKey: vi.fn(async () => null),
      createChartSnapshot: vi.fn(async () => ({
        id: '33333333-3333-3333-8333-333333333333',
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        birthProfileId: '11111111-1111-1111-8111-111111111111',
        chartSystem: snapshot.chartSystem,
        snapshotDedupeKey: '0123456789abcdef',
        snapshot,
        inputHashDigest: snapshot.inputHash.digest,
        confidenceLevel: snapshot.calculationConfidence.level,
        createdAt: snapshot.createdAt,
      })),
    };
    const quotasService = {
      assertCanCreateChart: vi.fn(async () => undefined),
    };
    const service = new ChartsService(persistenceGateway as never, quotasService as never);
    (service as unknown as { adapters: Record<string, { calculateChart: typeof adapterCalculateChart; usesViewYear: boolean }> }).adapters['liu-yao'] = {
      calculateChart: adapterCalculateChart,
      usesViewYear: false,
    };

    await service.createChart('22222222-2222-2222-8222-222222222222', '127.0.0.1', {
      birthInput: snapshot.birth.originalInput,
      chartSystem: 'liu-yao',
      makeActiveBirthProfile: true,
      viewYear: 2035,
    });

    expect(adapterCalculateChart).toHaveBeenCalledWith(snapshot.birth.originalInput, { viewYear: undefined });
    expect(persistenceGateway.findChartSnapshotByDedupeKey).toHaveBeenCalledWith(
      '22222222-2222-2222-8222-222222222222',
      buildChartSnapshotDedupeKey({
        ownerUserId: '22222222-2222-2222-8222-222222222222',
        chartSystem: 'liu-yao',
        inputHashDigest: snapshot.inputHash.digest,
        engineSemver: snapshot.engineVersion.engineSemver,
        ruleSourceVersion: snapshot.ruleSource.canonicalLibrary.version,
        schemaVersion: snapshot.engineVersion.schemaVersion,
      }),
    );
  });

  it('fails clearly when the contract accepts a system but backend has no adapter yet', async () => {
    const snapshot = buildSnapshot();
    const persistenceGateway = {
      findLatestBirthProfileByInputHash: vi.fn(async () => null),
      createBirthProfile: vi.fn(),
      findChartSnapshotByDedupeKey: vi.fn(),
      createChartSnapshot: vi.fn(),
    };
    const quotasService = {
      assertCanCreateChart: vi.fn(async () => undefined),
    };
    const service = new ChartsService(persistenceGateway as never, quotasService as never);

    await expect(
      service.createChart('22222222-2222-2222-8222-222222222222', '127.0.0.1', {
        birthInput: snapshot.birth.originalInput,
        chartSystem: 'unsupported-system' as unknown as ChartSystem,
        makeActiveBirthProfile: true,
      } as CreateChartRequest),
    ).rejects.toThrow(/chưa được bật ở backend/);

    expect(persistenceGateway.createChartSnapshot).not.toHaveBeenCalled();
  });
});

describe('buildChartSnapshotDedupeKey', () => {
  it('separates identical birth inputs by view year', () => {
    const baseParams = {
      ownerUserId: '22222222-2222-2222-8222-222222222222',
      chartSystem: 'zi-wei-dou-shu',
      inputHashDigest: '0123456789abcdef0123456789abcdef',
      engineSemver: '0.1.0',
      ruleSourceVersion: '2.5.8',
      schemaVersion: 'phase-3-contracts-v2',
    };

    expect(buildChartSnapshotDedupeKey({ ...baseParams, viewYear: 2026 })).not.toBe(
      buildChartSnapshotDedupeKey({ ...baseParams, viewYear: 2035 }),
    );
  });
});
