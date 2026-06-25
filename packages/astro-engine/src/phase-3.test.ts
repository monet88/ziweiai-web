import { describe, expect, it } from 'vitest';
import type { LiuyaoLineStateKey } from '@ziweiai/contracts';
import { buildNumberBasedNumbers } from './adapters/meihua-maps';
import { IztroChartAdapter } from './adapters/iztro-chart-adapter';
import { DaliurenAdapter } from './adapters/daliuren-adapter';
import { LiuyaoAdapter } from './adapters/liuyao-adapter';
import { QimenAdapter } from './adapters/qimen-adapter';
import { LunarJavascriptBaziAdapter } from './adapters/lunar-javascript-bazi-adapter';
import { MeiHuaAdapter } from './adapters/meihua-adapter';
import { parseIztroLunarDate } from './adapters/iztro-key-maps';
import { phase3AdapterRegistry } from './adapters/astro-adapter';
import { phase3FixtureCatalog } from './fixtures/phase-3-fixture-catalog';
import { normalizeBirthInput } from './normalization/normalize-birth-input';

// Bộ phát hiện CJK mở rộng (Hán/Kana/Hangul/Bopomofo/dấu câu CJK/fullwidth).
// Định nghĩa cục bộ vì astro-engine không phụ thuộc @ziweiai/core; giữ đồng bộ với
// CJK_TEXT_PATTERN trong packages/core/src/text/cjk-guard.ts.
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

describe('normalizeBirthInput', () => {
  it('blocks unresolved or unknown inputs instead of inventing exact readings', () => {
    const normalized = normalizeBirthInput({
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
    });

    expect(normalized.normalizationConfidence.level).toBe('blocked');
    expect(normalized.normalizationConfidence.blocksExactReading).toBe(true);
    expect(normalized.trueSolarTime.status).toBe('deferred');
  });

  it('coi giới tính chưa rõ là lỗi chặn khi hệ cần giới tính (mặc định, Tử Vi)', () => {
    const normalized = normalizeBirthInput({
      calendar: 'gregorian',
      date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
      time: { hour: 9, minute: 30, isUnknown: false },
      sexOrGenderForChart: 'unknown',
      place: {
        label: 'Manual entry',
        manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
      },
      locale: 'vi-VN',
      source: 'test-fixture',
    });

    expect(normalized.normalizationConfidence.reasons).toContain('UNKNOWN_CHART_GENDER');
    expect(normalized.normalizationConfidence.blocksExactReading).toBe(true);
  });

  it('không chặn vì giới tính chưa rõ khi hệ không cần giới tính (hệ bói theo thời khắc)', () => {
    const normalized = normalizeBirthInput(
      {
        calendar: 'gregorian',
        date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
        time: { hour: 9, minute: 30, isUnknown: false },
        sexOrGenderForChart: 'unknown',
        place: {
          label: 'Manual entry',
          manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
        },
        locale: 'vi-VN',
        source: 'test-fixture',
      },
      { requiresGender: false },
    );

    expect(normalized.normalizationConfidence.reasons).not.toContain('UNKNOWN_CHART_GENDER');
    expect(normalized.normalizationConfidence.blocksExactReading).toBe(false);
    expect(normalized.normalizationConfidence.level).toBe('medium');
  });
});

describe('phase3AdapterRegistry', () => {
  it('freezes canonical adapter choices for Phase 3 defaults', () => {
    expect(phase3AdapterRegistry).toEqual([
      {
        system: 'zi-wei-dou-shu',
        canonicalLibrary: 'iztro@2.5.8',
        configProfile: 'phase-3-default',
      },
      {
        system: 'ba-zi',
        canonicalLibrary: 'lunar-javascript@1.7.7',
        configProfile: 'phase-3-default',
      },
      {
        system: 'mei-hua-yi-shu',
        canonicalLibrary: 'lunar-javascript@1.7.7 + time-port',
        configProfile: 'phase-3-default',
      },
      {
        system: 'liu-yao',
        canonicalLibrary: 'xuanshu@liuyao-reference',
        configProfile: 'phase-5-default',
      },
      {
        system: 'da-liu-ren',
        canonicalLibrary: 'xuanshu@daliuren-reference',
        configProfile: 'phase-6-default',
      },
      {
        system: 'qi-men-dun-jia',
        canonicalLibrary: 'xuanshu@qimen-reference',
        configProfile: 'phase-7-default',
      },
    ]);
  });
});
describe('parseIztroLunarDate', () => {
  it('isolates month and day tokens before parsing Chinese lunar dates', () => {
    expect(parseIztroLunarDate('一九九二年十一月初一')).toMatchObject({ year: 1992, month: 11, day: 1 });
    expect(parseIztroLunarDate('一九九二年十二月初一')).toMatchObject({ year: 1992, month: 12, day: 1 });
  });
});

describe('fixture inventory', () => {
  it('keeps the initial fixture inventory inside the accepted 16-20 range', () => {
    expect(phase3FixtureCatalog).toHaveLength(16);
  });
});

describe('runtime adapters', () => {
  it('returns a blocked Zi Wei snapshot when exact input requirements are not met', async () => {
    const adapter = new IztroChartAdapter();
    const snapshot = await adapter.calculateChart({
      calendar: 'gregorian',
      date: { year: 1992, month: 8, day: 14, isLeapMonth: null },
      time: { hour: null, minute: null, isUnknown: true },
      sexOrGenderForChart: 'unknown',
      place: { label: 'Ho Chi Minh City', manual: null },
      locale: 'vi-VN',
      source: 'test-fixture',
    });

    expect(snapshot.chartSystem).toBe('zi-wei-dou-shu');
    expect(snapshot.summary.status).toBe('blocked');
  });

  it('produces a stable Zi Wei snapshot shape for a known exact input', async () => {
    const adapter = new IztroChartAdapter();
    const snapshot = await adapter.calculateChart({
      calendar: 'gregorian',
      date: { year: 1990, month: 1, day: 27, isLeapMonth: null },
      time: { hour: 0, minute: 0, isUnknown: false },
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

    expect(snapshot.chartSystem).toBe('zi-wei-dou-shu');
    expect(snapshot.palaces).toHaveLength(12);
    expect(snapshot.palaces[0].nameKey).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.palaces[0].majorStars.map((star) => star.nameKey).join(',')).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.palaces[0].heavenlyStemKey).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.palaces[0].earthlyBranchKey).not.toMatch(CJK_TEXT_PATTERN);
    if ('status' in snapshot.summary) {
      throw new Error('expected exact chart summary instead of blocked summary');
    }
    expect(snapshot.summary.soulPalaceNameKey).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.summary.lifeMasterKey).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.summary.zodiacKey).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.summary.signKey).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.summary.timeEarthlyBranchKey).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.horoscope?.decadal.palaceNameKeys[0]).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('anchors the yearly horoscope inside the requested view year instead of the prior cycle', async () => {
    const adapter = new IztroChartAdapter();
    const snapshot = await adapter.calculateChart(
      {
        calendar: 'gregorian',
        date: { year: 1990, month: 1, day: 27, isLeapMonth: null },
        time: { hour: 0, minute: 0, isUnknown: false },
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
      { viewYear: 2026 },
    );

    // 2026 là năm Bính Ngọ; mốc 1/1 (trước Tết) sẽ cho Ất Tỵ của chu kỳ năm trước.
    expect(snapshot.horoscope?.yearly.heavenlyStemKey).toBe('bingHeavenly');
    expect(snapshot.horoscope?.yearly.earthlyBranchKey).toBe('wuEarthly');
  });

  it('produces Ba Zi pillars when manual coordinates and exact time are present', async () => {
    const adapter = new LunarJavascriptBaziAdapter();
    const snapshot = await adapter.calculateChart({
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
    });

    expect(snapshot.chartSystem).toBe('ba-zi');
    expect(snapshot.pillars).toHaveLength(4);
    expect(snapshot.summary.mingGong).toBeTruthy();
    expect(snapshot.bazi?.pillars).toHaveLength(4);
    expect(snapshot.bazi?.dayMasterHeavenlyStemKey).toBeTruthy();
    expect(snapshot.bazi?.pillars.map((pillar) => pillar.naYin).join(',')).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.bazi?.pillars.flatMap((pillar) => pillar.hiddenStems.map((item) => item.heavenlyStemKey)).join(',')).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('produces a structured Mai Hoa snapshot with quẻ chính, quẻ hỗ, quẻ biến và hào động', async () => {
    const adapter = new MeiHuaAdapter();
    const snapshot = await adapter.calculateChart({
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
    });

    expect(snapshot.chartSystem).toBe('mei-hua-yi-shu');
    expect(snapshot.palaces).toHaveLength(0);
    expect(snapshot.pillars).toHaveLength(0);
    expect(snapshot.meihua?.method).toBe('time-based');
    expect(snapshot.meihua?.mainHexagram.lines).toHaveLength(6);
    expect(snapshot.meihua?.changedHexagram.lines.filter((line) => line.isMoving)).toHaveLength(1);
    expect(snapshot.meihua?.nuclearHexagram.lines.every((line) => !line.isMoving)).toBe(true);
    expect(snapshot.meihua?.bodyTrigramKey).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.meihua?.relationKey).toBeTruthy();
    expect(snapshot.ruleSource.sourcePriority).toBe('lunar-javascript-first');
    if ('status' in snapshot.summary) {
      throw new Error('expected exact Mai Hoa summary instead of blocked summary');
    }
    expect(snapshot.summary.mainHexagram).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.summary.relation).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('builds number-based Mai Hoa numbers with mod-8 / mod-6 wrap (US-026)', () => {
    // Plain inputs: upper/lower < 8, sum < 6.
    expect(buildNumberBasedNumbers({ upperNumber: 7, lowerNumber: 3 })).toEqual({
      topNumber: 7,
      bottomNumber: 3,
      movingLine: 4, // (7 + 3) % 6
    });
    // Edge: multiples wrap to 8 (not 0) for the trigram, and a sum that is a
    // multiple of 6 wraps to 6 (not 0) for the moving line.
    expect(buildNumberBasedNumbers({ upperNumber: 8, lowerNumber: 16 })).toEqual({
      topNumber: 8, // 8 % 8 -> 0 -> 8
      bottomNumber: 8, // 16 % 8 -> 0 -> 8
      movingLine: 6, // (8 + 16) % 6 -> 0 -> 6
    });
    // Larger numbers fold into the 1-8 / 1-6 ranges.
    expect(buildNumberBasedNumbers({ upperNumber: 10, lowerNumber: 5 })).toEqual({
      topNumber: 2, // 10 % 8
      bottomNumber: 5,
      movingLine: 3, // (10 + 5) % 6
    });
  });

  it('casts a number-based Mai Hoa hexagram from two numbers (US-026)', async () => {
    const adapter = new MeiHuaAdapter();
    const snapshot = await adapter.calculateChart(
      {
        calendar: 'gregorian',
        date: { year: 2026, month: 6, day: 12, isLeapMonth: null },
        time: { hour: 9, minute: 15, isUnknown: false },
        sexOrGenderForChart: 'female',
        place: {
          label: 'Manual entry',
          manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
        },
        locale: 'vi-VN',
        source: 'test-fixture',
      },
      { meihuaManual: { upperNumber: 7, lowerNumber: 3 } },
    );

    expect(snapshot.chartSystem).toBe('mei-hua-yi-shu');
    expect(snapshot.meihua?.method).toBe('number-based');
    // moving line = (7 + 3) % 6 = 4 — independent of the cast-now date/time.
    expect(snapshot.meihua?.movingLine).toBe(4);
    const mainLines = snapshot.meihua?.mainHexagram.lines;
    expect(mainLines).toHaveLength(6);
    const movingMain = mainLines?.filter((line) => line.isMoving);
    expect(movingMain).toHaveLength(1);
    expect(movingMain?.[0]?.position).toBe(4);
    // The changed hexagram flips exactly the moving line at the same position.
    const movingChanged = snapshot.meihua?.changedHexagram.lines.filter((line) => line.isMoving);
    expect(movingChanged).toHaveLength(1);
    expect(movingChanged?.[0]?.position).toBe(4);
    expect(snapshot.meihua?.nuclearHexagram.lines.every((line) => !line.isMoving)).toBe(true);
  });

  it('produces a structured Liuyao snapshot with line-level metadata via xuanshu bridge', async () => {
    const adapter = new LiuyaoAdapter();
    const snapshot = await adapter.calculateChart({
      calendar: 'gregorian',
      date: { year: 2024, month: 1, day: 1, isLeapMonth: null },
      time: { hour: 8, minute: 0, isUnknown: false },
      sexOrGenderForChart: 'male',
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

    expect(snapshot.chartSystem).toBe('liu-yao');
    expect(snapshot.palaces).toHaveLength(0);
    expect(snapshot.pillars).toHaveLength(4);
    expect(snapshot.liuyao?.method).toBe('time-based');
    expect(snapshot.liuyao?.baseHexagram.lines).toHaveLength(6);
    expect(snapshot.liuyao?.changedHexagram.lines).toHaveLength(6);
    expect(snapshot.liuyao?.movingLinePositions.length).toBeGreaterThan(0);
    expect(snapshot.liuyao?.baseHexagram.lines.some((line) => line.roleKey === 'shi')).toBe(true);
    expect(snapshot.liuyao?.baseHexagram.lines.some((line) => line.roleKey === 'ying')).toBe(true);
    expect(snapshot.ruleSource.sourcePriority).toBe('xuanshu-first');
    expect(snapshot.liuyao?.baseHexagram.lines.map((line) => line.sixKinKey).join(',')).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.liuyao?.baseHexagram.lines.map((line) => line.sixSpiritKey).join(',')).not.toMatch(CJK_TEXT_PATTERN);
    if ('status' in snapshot.summary) {
      throw new Error('expected exact Liuyao summary instead of blocked summary');
    }
    expect(snapshot.summary.baseHexagram).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.summary.changedHexagram).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('casts a manual Liuyao hexagram from 6 line states bottom-to-top (US-026)', async () => {
    const adapter = new LiuyaoAdapter();
    // Line states bottom-to-top (position 1 = bottom). Moving lines (oldYang/oldYin)
    // sit at positions 1 and 5; the rest are stable. This pins BOTH the bottom-to-top
    // ordering and the old/young encoding of LIUYAO_STATE_TO_MANUAL_CODE: a reversed
    // order would surface moving lines at [2, 6], and an old/young inversion would move
    // them to the youngYang/youngYin positions instead.
    const lineStates: LiuyaoLineStateKey[] = [
      'oldYang', // pos 1 -> yang, moving
      'youngYin', // pos 2 -> yin
      'youngYang', // pos 3 -> yang
      'youngYin', // pos 4 -> yin
      'oldYin', // pos 5 -> yin, moving
      'youngYang', // pos 6 -> yang
    ];
    const snapshot = await adapter.calculateChart(
      {
        calendar: 'gregorian',
        date: { year: 2024, month: 1, day: 1, isLeapMonth: null },
        time: { hour: 8, minute: 0, isUnknown: false },
        sexOrGenderForChart: 'male',
        place: {
          label: 'Manual entry',
          manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
        },
        locale: 'vi-VN',
        source: 'test-fixture',
      },
      { liuyaoManual: { lineStates } },
    );

    expect(snapshot.chartSystem).toBe('liu-yao');
    expect(snapshot.liuyao?.method).toBe('manual');
    const baseLines = snapshot.liuyao?.baseHexagram.lines;
    expect(baseLines).toHaveLength(6);
    // Moving lines land exactly where oldYang/oldYin were placed (bottom-to-top).
    expect(snapshot.liuyao?.movingLinePositions).toEqual([1, 5]);
    // Value + isMoving per position match the requested states (proves the 0-3 map).
    const byPosition = new Map(baseLines?.map((line) => [line.position, line]));
    expect(byPosition.get(1)).toMatchObject({ value: 'yang', isMoving: true });
    expect(byPosition.get(2)).toMatchObject({ value: 'yin', isMoving: false });
    expect(byPosition.get(3)).toMatchObject({ value: 'yang', isMoving: false });
    expect(byPosition.get(4)).toMatchObject({ value: 'yin', isMoving: false });
    expect(byPosition.get(5)).toMatchObject({ value: 'yin', isMoving: true });
    expect(byPosition.get(6)).toMatchObject({ value: 'yang', isMoving: false });
  });

  it('produces a structured Daliuren snapshot with thiên địa bàn, tứ khóa và tam truyền via xuanshu bridge', async () => {
    const adapter = new DaliurenAdapter();
    const snapshot = await adapter.calculateChart({
      calendar: 'gregorian',
      date: { year: 2024, month: 1, day: 1, isLeapMonth: null },
      time: { hour: 8, minute: 0, isUnknown: false },
      sexOrGenderForChart: 'male',
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

    expect(snapshot.chartSystem).toBe('da-liu-ren');
    expect(snapshot.palaces).toHaveLength(0);
    expect(snapshot.pillars).toHaveLength(4);
    expect(snapshot.daliuren?.cells).toHaveLength(12);
    expect(snapshot.daliuren?.fourLessons).toHaveLength(4);
    expect(snapshot.daliuren?.threeTransmissions).toHaveLength(3);
    expect(snapshot.ruleSource.sourcePriority).toBe('xuanshu-first');

    // Khóa 1 luôn dùng nhật can (lowerStemKey != null), khóa 2-4 dùng địa chi (lowerBranchKey != null).
    const firstLesson = snapshot.daliuren?.fourLessons[0];
    expect(firstLesson?.lowerStemKey).not.toBeNull();
    expect(firstLesson?.lowerBranchKey).toBeNull();

    // Bất biến không CJK trên toàn bộ key snapshot.
    const allKeys = [
      ...(snapshot.daliuren?.cells.map((cell) => `${cell.positionBranchKey},${cell.heavenBranchKey},${cell.spiritKey}`) ?? []),
      ...(snapshot.daliuren?.fourLessons.map((lesson) => `${lesson.upperBranchKey},${lesson.spiritKey}`) ?? []),
      ...(snapshot.daliuren?.threeTransmissions.map((transmission) => `${transmission.branchKey},${transmission.spiritKey},${transmission.sixKinKey}`) ?? []),
    ].join(',');
    expect(allKeys).not.toMatch(CJK_TEXT_PATTERN);

    if ('status' in snapshot.summary) {
      throw new Error('expected exact Daliuren summary instead of blocked summary');
    }
    expect(snapshot.summary.boardType).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.summary.monthGeneral).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.summary.firstLesson).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.summary.initialTransmission).not.toMatch(CJK_TEXT_PATTERN);
  });

  it('produces a structured Qimen snapshot with cửu cung, cục độn và trực phù/sử via xuanshu bridge', async () => {
    const adapter = new QimenAdapter();
    const snapshot = await adapter.calculateChart({
      calendar: 'gregorian',
      date: { year: 2024, month: 1, day: 1, isLeapMonth: null },
      time: { hour: 8, minute: 0, isUnknown: false },
      sexOrGenderForChart: 'male',
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

    expect(snapshot.chartSystem).toBe('qi-men-dun-jia');
    expect(snapshot.palaces).toHaveLength(0);
    expect(snapshot.pillars).toHaveLength(4);
    expect(snapshot.qimen?.palaces).toHaveLength(9);
    expect(snapshot.qimen?.dutyChiefStarKey).toBeTruthy();
    expect(snapshot.qimen?.dutyGateKey).toBeTruthy();
    expect(snapshot.qimen?.juShu).toBeGreaterThanOrEqual(1);
    expect(snapshot.qimen?.juShu).toBeLessThanOrEqual(9);
    expect(snapshot.ruleSource.sourcePriority).toBe('xuanshu-first');

    // Bất biến không CJK trên toàn bộ key snapshot.
    const allKeys = snapshot.qimen?.palaces
      .map((palace) => `${palace.starKey ?? ''},${palace.gateKey ?? ''},${palace.spiritKey ?? ''}`)
      .join(',') ?? '';
    expect(allKeys).not.toMatch(CJK_TEXT_PATTERN);

    if ('status' in snapshot.summary) {
      throw new Error('expected exact Qimen summary instead of blocked summary');
    }
    expect(snapshot.summary.dun).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.summary.juShu).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.summary.dutyChief).not.toMatch(CJK_TEXT_PATTERN);
    expect(snapshot.summary.dutyGate).not.toMatch(CJK_TEXT_PATTERN);
  });
});
