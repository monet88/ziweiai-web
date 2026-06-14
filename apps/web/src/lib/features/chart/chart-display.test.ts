import { describe, expect, it } from 'vitest';
import type { ChartDetailResponse } from '@ziweiai/contracts';
import { CJK_TEXT_PATTERN } from '../../text/cjk';
import {
  buildPalaceViews,
  formatBaziMetaItems,
  formatBaziPillarRows,
  formatCenterSummaryItems,
  formatChartSummaryItems,
  formatChartSystemLabel,
  formatDaliurenLessonItems,
  formatDaliurenMetaItems,
  formatDaliurenTransmissionItems,
  formatLiuyaoHexagramItems,
  formatLiuyaoLineDescription,
  formatLiuyaoMetaItems,
  formatMeihuaHexagramItems,
  formatMeihuaMetaItems,
  formatPillarItems,
  formatQimenMetaItems,
  getQimenPalaceByIndex,
} from './chart-display';

type Snapshot = ChartDetailResponse['snapshot'];

const BRANCH_KEYS = [
  'ziEarthly',
  'chouEarthly',
  'yinEarthly',
  'maoEarthly',
  'chenEarthly',
  'siEarthly',
  'wuEarthly',
  'weiEarthly',
  'shenEarthly',
  'youEarthly',
  'xuEarthly',
  'haiEarthly',
] as const;

const PALACE_KEYS = [
  'soulPalace',
  'siblingsPalace',
  'spousePalace',
  'childrenPalace',
  'wealthPalace',
  'healthPalace',
  'surfacePalace',
  'friendsPalace',
  'careerPalace',
  'propertyPalace',
  'spiritPalace',
  'parentsPalace',
] as const;

function buildSnapshotFixture(): Snapshot {
  return {
    snapshotId: 'fixture',
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
    chartSystem: 'zi-wei-dou-shu',
    palaces: Array.from({ length: 12 }, (_, index) => ({
      nameKey: PALACE_KEYS[index],
      index,
      heavenlyStemKey: 'jiaHeavenly',
      earthlyBranchKey: BRANCH_KEYS[index],
      isBodyPalace: index === 6,
      isOriginalPalace: index === 0,
      changsheng12Key: 'changsheng',
      majorStars: index === 0 ? [{ nameKey: 'ziweiMaj', group: 'major' as const, brightnessKey: 'miao' as const, mutagen: 'lu' as const }] : [],
      minorStars: index === 0 ? [{ nameKey: 'wenchangMin', group: 'minor' as const }] : [],
      adjectiveStars: index === 0 ? [{ nameKey: 'hongluan', group: 'adjective' as const }] : [],
      ages: [index + 1],
    })),
    pillars: [],
    summary: {
      genderKey: 'female',
      solarDate: '1990-1-27',
      lunarDate: { year: 1990, month: 1, day: 1, isLeapMonth: false },
      zodiacKey: 'horse',
      signKey: 'aquarius',
      soulPalaceNameKey: 'soulPalace',
      bodyPalaceNameKey: 'bodyPalace',
      lifeMasterKey: 'ziweiMaj',
      bodyMasterKey: 'wenchangMin',
      fiveElementsClassKey: 'water2nd',
    },
    engineVersion: {
      enginePackage: '@ziweiai/astro-engine',
      engineSemver: '0.1.0',
      adapterVersions: [],
      fixtureSetVersion: 'phase-4-fixtures-v1',
      schemaVersion: 'phase-4-contracts-v1',
    },
    ruleSource: {
      system: 'zi-wei-dou-shu',
      canonicalLibrary: { name: 'iztro', version: '2.5.8' },
      ruleSet: 'phase-4-default',
      schoolNotes: null,
      sourcePriority: 'iztro-first',
    },
    inputHash: { algorithm: 'sha256', digest: '0123456789abcdef0123456789abcdef', saltPolicy: 'not-persisted' },
    calculationConfidence: { level: 'medium', reasons: ['MANUAL_TIMEZONE'], visibleMessageKey: 'birth.time.verified', blocksExactReading: false },
    provenance: {
      referenceRepos: ['.ref/iztro'],
      runtimeLibraries: [{ name: 'iztro', version: '2.5.8' }],
      adapterConfig: [{ key: 'configProfile', value: 'phase-4-default' }],
      fixtureEvidence: { fixtureSetId: 'phase-4-fixtures-v1', passed: true },
      calculationTimestamp: '2026-06-03T00:00:00.000Z',
      warnings: [],
    },
    createdAt: '2026-06-03T00:00:00.000Z',
  };
}

describe('formatChartSummaryItems', () => {
  it('formats structured lunar date and keeps the raw solar date string', () => {
    const items = formatChartSummaryItems(buildSnapshotFixture().summary);

    expect(items.find((item) => item.label === 'Âm lịch')?.value).toBe('01/01/1990');
    expect(items.find((item) => item.label === 'Dương lịch')?.value).toBe('1990-1-27');
    expect(items.map((item) => item.value).join(',')).not.toMatch(CJK_TEXT_PATTERN);
  });
});

describe('buildPalaceViews', () => {
  it('translates every palace, stem, branch and star key into Vietnamese', () => {
    const views = buildPalaceViews(buildSnapshotFixture());

    expect(views).toHaveLength(12);
    const soul = views[0];
    expect(soul.name).toBe('Mệnh');
    expect(soul.stemBranch).toBe('Giáp Tý');
    expect(soul.changsheng).toBe('Trường Sinh');
    expect(soul.majorStars[0]).toMatchObject({ name: 'Tử Vi', brightness: 'Miếu', mutagen: 'Lộc' });
    expect(soul.minorStars[0]?.name).toBe('Văn Xương');
    expect(soul.adjectiveStars[0]?.name).toBe('Hồng Loan');
  });

  it('falls back to preserved display names for legacy palaces and stars instead of throwing on synthetic keys', () => {
    const snapshot = buildSnapshotFixture();
    snapshot.palaces = [
      {
        nameKey: 'legacyPalace0',
        displayName: 'Mệnh',
        index: 0,
        heavenlyStemKey: 'legacyHeavenlyStem0',
        earthlyBranchKey: 'legacyEarthlyBranch0',
        isBodyPalace: false,
        isOriginalPalace: false,
        majorStars: [{ nameKey: 'legacyStar0_0', group: 'major', displayName: 'Tử Vi' }],
        minorStars: [],
        adjectiveStars: [],
        ages: [],
      },
    ] as Snapshot['palaces'];

    const views = buildPalaceViews(snapshot);

    expect(views[0]).toMatchObject({
      name: 'Mệnh',
      stemBranch: '',
      earthlyBranchKey: 'legacyEarthlyBranch0',
    });
    expect(views[0]?.majorStars[0]?.name).toBe('Tử Vi');
  });
});

describe('Han-character guard', () => {
  it('produces no Han characters across the full rendered fixture output', () => {
    const snapshot = buildSnapshotFixture();
    const views = buildPalaceViews(snapshot);

    const rendered = [
      ...formatChartSummaryItems(snapshot.summary).flatMap((item) => [item.label, item.value]),
      ...formatCenterSummaryItems(snapshot.summary).flatMap((item) => [item.label, item.value]),
      ...views.flatMap((palace) => [
        palace.name,
        palace.stemBranch,
        palace.changsheng ?? '',
        ...palace.majorStars.flatMap((star) => [star.name, star.brightness ?? '', star.mutagen ?? '']),
        ...palace.minorStars.map((star) => star.name),
        ...palace.adjectiveStars.map((star) => star.name),
      ]),
    ].join('|');

    expect(rendered).not.toMatch(CJK_TEXT_PATTERN);
  });
});

describe('formatChartSummaryItems edge cases', () => {
  it('translates the blocked-summary status into Vietnamese', () => {
    const items = formatChartSummaryItems({ status: 'blocked', reason: 'thiếu giờ sinh' });

    expect(items.find((item) => item.label === 'Trạng thái')?.value).toBe('Bị chặn');
    expect(items.find((item) => item.label === 'Lý do')?.value).toBe('thiếu giờ sinh');
  });

  it('does not throw on a legacy-summary label that ends with "Key" but is not a known field', () => {
    const items = formatChartSummaryItems({ someCustomKey: 'unmappedValue' } as never);

    expect(items[0]?.value).toBe('unmapped Value');
    expect(items.map((item) => item.value).join(',')).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('translates legacy summary strings instead of leaking raw CJK values', () => {
    const items = formatChartSummaryItems({ gender: '女', sign: '狮子座', time: '巳时', zodiac: '猴' } as never);

    expect(items).toEqual(
      expect.arrayContaining([
        { label: 'Giới tính', value: 'Nữ' },
        { label: 'Cung hoàng đạo', value: 'Sư Tử' },
        { label: 'Giờ sinh', value: 'Giờ Tỵ' },
        { label: 'Con giáp', value: 'Khỉ' },
      ]),
    );
    expect(items.flatMap((item) => [item.label, item.value]).join('|')).not.toMatch(CJK_TEXT_PATTERN);
  });
});

describe('formatPillarItems (non-ziwei systems)', () => {
  it('renders pillars with localized known labels for ba-zi-style snapshots', () => {
    const snapshot = buildSnapshotFixture();
    snapshot.chartSystem = 'ba-zi';
    snapshot.pillars = [
      { name: 'year', value: 'Giáp Tý' },
      { name: 'hour', value: 'Canh Ngọ' },
    ];

    const items = formatPillarItems(snapshot);

    expect(items[0]).toMatchObject({ label: 'Năm', value: 'Giáp Tý' });
    expect(items[1]).toMatchObject({ label: 'Giờ', value: 'Canh Ngọ' });
  });

  it('keeps Vietnamese labels for ba-zi summary fields rendered via formatChartSummaryItems', () => {
    const items = formatChartSummaryItems({
      lunarDate: '1990-01-01',
      mingGong: 'Giáp Tý',
      shenGong: 'Ất Sửu',
      dayMaster: 'Canh Ngọ',
      taiYuan: 'Kỷ Hợi',
      taiXi: 'Đinh Mão',
    } as never);

    expect(items).toEqual(
      expect.arrayContaining([
        { label: 'Âm lịch', value: '1990-01-01' },
        { label: 'Mệnh cung', value: 'Giáp Tý' },
        { label: 'Thân cung', value: 'Ất Sửu' },
        { label: 'Ngày chủ', value: 'Canh Ngọ' },
        { label: 'Thai nguyên', value: 'Kỷ Hợi' },
        { label: 'Thai tức', value: 'Đinh Mão' },
      ]),
    );
  });

  it('renders Vietnamese labels for future chart systems declared in the registry', () => {
    expect(formatChartSystemLabel('qi-men-dun-jia')).toBe('Kỳ Môn Độn Giáp');
    expect(formatChartSystemLabel('da-liu-ren')).toBe('Đại Lục Nhâm');
  });

  it('formats structured Bát Tự pillars and meta blocks without CJK text', () => {
    const snapshot = buildSnapshotFixture();
    snapshot.chartSystem = 'ba-zi';
    snapshot.bazi = {
      dayMasterHeavenlyStemKey: 'gengHeavenly',
      pillars: [
        {
          slot: 'year',
          heavenlyStemKey: 'jiaHeavenly',
          earthlyBranchKey: 'ziEarthly',
          heavenlyStemElementKey: 'wood',
          earthlyBranchElementKey: 'water',
          heavenlyStemTenGodKey: 'pianCai',
          earthlyBranchTenGodKeys: ['shangGuan'],
          hiddenStems: [{ heavenlyStemKey: 'guiHeavenly', elementKey: 'water', tenGodKey: 'shangGuan' }],
          naYin: 'Hải Trung Kim',
        },
        {
          slot: 'month',
          heavenlyStemKey: 'bingHeavenly',
          earthlyBranchKey: 'yinEarthly',
          heavenlyStemElementKey: 'fire',
          earthlyBranchElementKey: 'wood',
          heavenlyStemTenGodKey: 'qiSha',
          earthlyBranchTenGodKeys: ['pianCai', 'qiSha', 'pianYin'],
          hiddenStems: [
            { heavenlyStemKey: 'jiaHeavenly', elementKey: 'wood', tenGodKey: 'pianCai' },
            { heavenlyStemKey: 'bingHeavenly', elementKey: 'fire', tenGodKey: 'qiSha' },
            { heavenlyStemKey: 'wuHeavenly', elementKey: 'earth', tenGodKey: 'pianYin' },
          ],
          naYin: 'Lô Trung Hỏa',
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
          heavenlyStemKey: 'xinHeavenly',
          earthlyBranchKey: 'siEarthly',
          heavenlyStemElementKey: 'metal',
          earthlyBranchElementKey: 'fire',
          heavenlyStemTenGodKey: 'jieCai',
          earthlyBranchTenGodKeys: ['qiSha', 'pianYin', 'biJian'],
          hiddenStems: [
            { heavenlyStemKey: 'bingHeavenly', elementKey: 'fire', tenGodKey: 'qiSha' },
            { heavenlyStemKey: 'wuHeavenly', elementKey: 'earth', tenGodKey: 'pianYin' },
            { heavenlyStemKey: 'gengHeavenly', elementKey: 'metal', tenGodKey: 'biJian' },
          ],
          naYin: 'Bạch Lạp Kim',
        },
      ],
      taiYuan: { heavenlyStemKey: 'dingHeavenly', earthlyBranchKey: 'maoEarthly', naYin: 'Lô Trung Hỏa' },
      taiXi: { heavenlyStemKey: 'yiHeavenly', earthlyBranchKey: 'weiEarthly', naYin: 'Sa Trung Kim' },
      mingGong: { heavenlyStemKey: 'jiHeavenly', earthlyBranchKey: 'chouEarthly', naYin: 'Tích Lịch Hỏa' },
      shenGong: { heavenlyStemKey: 'renHeavenly', earthlyBranchKey: 'wuEarthly', naYin: 'Dương Liễu Mộc' },
    };

    const rows = formatBaziPillarRows(snapshot);
    const metaItems = formatBaziMetaItems(snapshot);

    expect(rows[0]?.label).toBe('Năm');
    expect(rows[0]?.value).toContain('Giáp Tý');
    expect(rows[0]?.value).toContain('Tàng can');
    expect(metaItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Ngày chủ', value: 'Canh' }),
        expect.objectContaining({ label: 'Mệnh cung', value: expect.stringContaining('Kỷ Sửu') }),
      ]),
    );
    expect(rows.map((item) => item.value).join(' ')).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('formats structured Mai Hoa meta và quẻ blocks không rò CJK', () => {
    const snapshot = buildSnapshotFixture();
    snapshot.chartSystem = 'mei-hua-yi-shu';
    snapshot.meihua = {
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
    };

    const metaItems = formatMeihuaMetaItems(snapshot);
    const hexagramItems = formatMeihuaHexagramItems(snapshot);

    expect(formatChartSystemLabel('mei-hua-yi-shu')).toBe('Mai Hoa Dịch Số');
    expect(metaItems).toEqual(
      expect.arrayContaining([
        { label: 'Phương pháp', value: 'Theo thời gian' },
        { label: 'Hào động', value: 'Hào 3' },
        { label: 'Quan hệ thể dụng', value: 'Thể khắc dụng, bạn nắm quyền chủ động nhưng cần trả giá bằng công sức.' },
      ]),
    );
    expect(hexagramItems).toEqual(
      expect.arrayContaining([
        { label: 'Quẻ chính', value: 'Ly trên Càn' },
        { label: 'Quẻ hỗ', value: 'Tốn trên Đoài' },
        { label: 'Quẻ biến', value: 'Khảm trên Càn' },
      ]),
    );
    expect([...metaItems, ...hexagramItems].flatMap((item) => [item.label, item.value]).join('|')).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('formats structured Lục Hào meta, quẻ, và line-level description bằng tiếng Việt', () => {
    const snapshot = buildSnapshotFixture();
    snapshot.chartSystem = 'liu-yao';
    snapshot.liuyao = {
      method: 'time-based',
      movingLinePositions: [2, 5],
      baseHexagram: {
        key: 'qianTrigram_over_zhenTrigram',
        topTrigramKey: 'qianTrigram',
        bottomTrigramKey: 'zhenTrigram',
        name: 'Thiên Lôi Vô Vọng',
        symbol: 'Vo Vong',
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
        symbol: 'Dong Nhan',
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
        symbol: 'Tiem',
        lines: [
          { position: 1, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'sibling', earthlyBranchKey: 'chouEarthly', fiveElementKey: 'earth', naYin: 'Bích Thượng Thổ', sixSpiritKey: 'azureDragon', hiddenSpirit: null },
          { position: 2, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'childDescendant', earthlyBranchKey: 'maoEarthly', fiveElementKey: 'wood', naYin: 'Đại Khê Thủy', sixSpiritKey: 'vermilionBird', hiddenSpirit: null },
          { position: 3, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'shi', sixKinKey: 'wifeWealth', earthlyBranchKey: 'siEarthly', fiveElementKey: 'fire', naYin: 'Sa Trung Thổ', sixSpiritKey: 'hookSnake', hiddenSpirit: null },
          { position: 4, value: 'yin', stateKey: 'youngYin', isMoving: false, roleKey: 'none', sixKinKey: 'officerGhost', earthlyBranchKey: 'weiEarthly', fiveElementKey: 'earth', naYin: 'Thiên Thượng Hỏa', sixSpiritKey: 'soaringSerpent', hiddenSpirit: null },
          { position: 5, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'none', sixKinKey: 'parent', earthlyBranchKey: 'youEarthly', fiveElementKey: 'metal', naYin: 'Thạch Lựu Mộc', sixSpiritKey: 'whiteTiger', hiddenSpirit: null },
          { position: 6, value: 'yang', stateKey: 'youngYang', isMoving: false, roleKey: 'ying', sixKinKey: 'sibling', earthlyBranchKey: 'haiEarthly', fiveElementKey: 'water', naYin: 'Đại Hải Thủy', sixSpiritKey: 'blackTortoise', hiddenSpirit: null },
        ],
      },
    };

    const metaItems = formatLiuyaoMetaItems(snapshot);
    const hexagramItems = formatLiuyaoHexagramItems(snapshot);
    const lineDescription = formatLiuyaoLineDescription(snapshot.liuyao.baseHexagram.lines[3]!);

    expect(formatChartSystemLabel('liu-yao')).toBe('Lục Hào');
    expect(metaItems).toEqual(
      expect.arrayContaining([
        { label: 'Phương pháp', value: 'Theo thời gian' },
        { label: 'Hào động', value: 'Hào 2, Hào 5' },
        { label: 'Hào Thế', value: 'Hào 3' },
        { label: 'Hào Ứng', value: 'Hào 6' },
      ]),
    );
    expect(hexagramItems).toEqual(
      expect.arrayContaining([
        { label: 'Quẻ gốc', value: 'Thiên Lôi Vô Vọng' },
        { label: 'Quẻ biến', value: 'Thiên Hỏa Đồng Nhân' },
        { label: 'Quẻ hỗ', value: 'Phong Sơn Tiệm' },
      ]),
    );
    expect(lineDescription).toContain('Lục thân: Quan quỷ');
    expect(lineDescription).toContain('Vai trò: Không đánh dấu');
    expect(lineDescription).toContain('Lục thần: Đằng Xà');
    expect(lineDescription).toContain('Phục thần: Phụ mẫu');
    expect([...metaItems, ...hexagramItems].flatMap((item) => [item.label, item.value]).join('|')).not.toMatch(CJK_TEXT_PATTERN);
  });
});

function buildDaliurenSnapshot(): Snapshot {
  const snapshot = buildSnapshotFixture();
  snapshot.chartSystem = 'da-liu-ren';
  snapshot.daliuren = {
    boardTypeKey: 'fuYin',
    monthGeneralBranchKey: 'haiEarthly',
    monthGeneralKey: 'dengMing',
    cells: BRANCH_KEYS.map((branch, index) => ({
      positionBranchKey: branch,
      heavenBranchKey: branch,
      spiritKey: 'noblePerson',
      stemKey: index % 2 === 0 ? 'jiaHeavenly' : null,
    })),
    fourLessons: [
      { position: 1, upperBranchKey: 'ziEarthly', lowerStemKey: 'jiaHeavenly', lowerBranchKey: null, dunGanKey: null, spiritKey: 'azureDragon' },
      { position: 2, upperBranchKey: 'chouEarthly', lowerStemKey: null, lowerBranchKey: 'ziEarthly', dunGanKey: 'yiHeavenly', spiritKey: 'sixHarmony' },
      { position: 3, upperBranchKey: 'yinEarthly', lowerStemKey: null, lowerBranchKey: 'chouEarthly', dunGanKey: null, spiritKey: 'whiteTiger' },
      { position: 4, upperBranchKey: 'maoEarthly', lowerStemKey: null, lowerBranchKey: 'yinEarthly', dunGanKey: null, spiritKey: 'greatYin' },
    ],
    threeTransmissions: [
      { slot: 'initial', branchKey: 'ziEarthly', dunGanKey: 'jiaHeavenly', spiritKey: 'azureDragon', sixKinKey: 'parent' },
      { slot: 'middle', branchKey: 'chenEarthly', dunGanKey: null, spiritKey: 'hookSnake', sixKinKey: 'wifeWealth' },
      { slot: 'final', branchKey: 'shenEarthly', dunGanKey: null, spiritKey: 'whiteTiger', sixKinKey: 'officerGhost' },
    ],
  };
  return snapshot;
}

describe('Đại Lục Nhâm formatters', () => {
  it('formats meta, tứ khóa, tam truyền bằng tiếng Việt không rò CJK', () => {
    const snapshot = buildDaliurenSnapshot();
    const metaItems = formatDaliurenMetaItems(snapshot);
    const lessonItems = formatDaliurenLessonItems(snapshot);
    const transmissionItems = formatDaliurenTransmissionItems(snapshot);

    expect(metaItems).toEqual(
      expect.arrayContaining([
        { label: 'Kiểu thiên địa bàn', value: 'Phục Ngâm' },
        { label: 'Nguyệt tướng', value: 'Hợi Đăng Minh' },
        { label: 'Số khóa', value: '4' },
        { label: 'Số truyền', value: '3' },
      ]),
    );
    expect(lessonItems).toHaveLength(4);
    expect(lessonItems[0]).toMatchObject({ label: 'Khóa 1', value: 'Tý/Giáp (Thanh Long)' });
    expect(lessonItems[1]?.value).toContain('độn Ất');
    expect(transmissionItems).toHaveLength(3);
    expect(transmissionItems[0]).toMatchObject({ label: 'Sơ truyền' });
    expect(transmissionItems[0]?.value).toContain('Thanh Long');
    expect(transmissionItems[0]?.value).toContain('độn Giáp');

    const rendered = [...metaItems, ...lessonItems, ...transmissionItems].flatMap((item) => [item.label, item.value]).join('|');
    expect(rendered).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('trả mảng rỗng khi snapshot không có dữ liệu Đại Lục Nhâm', () => {
    const snapshot = buildSnapshotFixture();
    expect(formatDaliurenMetaItems(snapshot)).toEqual([]);
    expect(formatDaliurenLessonItems(snapshot)).toEqual([]);
    expect(formatDaliurenTransmissionItems(snapshot)).toEqual([]);
  });
});

function buildQimenSnapshot(): Snapshot {
  const snapshot = buildSnapshotFixture();
  snapshot.chartSystem = 'qi-men-dun-jia';
  snapshot.qimen = {
    dunKey: 'yangDun',
    yuanKey: 'upperYuan',
    juShu: 1,
    dutyChiefStarKey: 'tianPeng',
    dutyGateKey: 'restGate',
    palaces: Array.from({ length: 9 }, (_, index) => {
      const palaceIndex = index + 1;
      const isCenter = palaceIndex === 5;
      return {
        palaceIndex,
        diPanStemKey: 'jiaHeavenly' as const,
        tianPanStemKey: 'yiHeavenly' as const,
        starKey: isCenter ? null : qimenStarForIndex(palaceIndex),
        companionStarKey: null,
        gateKey: isCenter ? null : qimenGateForIndex(palaceIndex),
        spiritKey: isCenter ? null : 'dutyChief' as const,
      };
    }),
  };
  return snapshot;
}

function qimenStarForIndex(palaceIndex: number) {
  const stars = ['tianPeng', 'tianRui', 'tianChong', 'tianFu', 'tianXin', 'tianZhu', 'tianRen', 'tianYing'] as const;
  return stars[palaceIndex % stars.length];
}

function qimenGateForIndex(palaceIndex: number) {
  const gates = ['restGate', 'lifeGate', 'hurtGate', 'blockGate', 'viewGate', 'deathGate', 'fearGate', 'openGate'] as const;
  return gates[palaceIndex % gates.length];
}

describe('Kỳ Môn Độn Giáp formatters', () => {
  it('formats meta cục độn/tam nguyên/trực phù/trực sử bằng tiếng Việt không rò CJK', () => {
    const snapshot = buildQimenSnapshot();
    const metaItems = formatQimenMetaItems(snapshot);

    expect(metaItems).toEqual(
      expect.arrayContaining([
        { label: 'Cục độn', value: 'Dương Độn' },
        { label: 'Tam nguyên', value: 'Thượng Nguyên' },
        { label: 'Số cục', value: 'Dương Độn 1 cục' },
        { label: 'Trực phù', value: 'Thiên Bồng' },
        { label: 'Trực sử', value: 'Hưu Môn' },
      ]),
    );
    expect(metaItems.flatMap((item) => [item.label, item.value]).join('|')).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('tra cứu palace theo palaceIndex và trả null cho cung không tồn tại', () => {
    const snapshot = buildQimenSnapshot();
    expect(getQimenPalaceByIndex(snapshot, 5)?.palaceIndex).toBe(5);
    expect(getQimenPalaceByIndex(snapshot, 5)?.gateKey).toBeNull();
    expect(getQimenPalaceByIndex(snapshot, 99)).toBeNull();
  });

  it('trả mảng rỗng khi snapshot không có dữ liệu Kỳ Môn', () => {
    const snapshot = buildSnapshotFixture();
    expect(formatQimenMetaItems(snapshot)).toEqual([]);
    expect(getQimenPalaceByIndex(snapshot, 1)).toBeNull();
  });
});
