import type { BirthInput, ChartKey, MeihuaChartSnapshot, Pillar } from '@ziweiai/contracts';
import { Lunar, Solar } from 'lunar-javascript';
import { normalizeBirthInput } from '../normalization/normalize-birth-input';
import { PHASE3_CONFIG_PROFILE } from './phase-3-config';
import { createBaseSnapshotFields, createBlockedChartSnapshot } from './runtime-support';
import type { AstrologyChartAdapter, ChartCalculationOptions } from './astro-adapter';
import { toGanZhiPair, toSolarSignKey, toYearZodiacKey } from './shared/gan-zhi-keys';
import { toFiveElementKey, toTrigramKey } from './shared/divination-keys';
import { resolveLunarMonthNumber } from './shared/resolve-lunar-month-number';

const MEIHUA_ADAPTER_VERSION = {
  name: 'lunar-javascript',
  version: '1.7.7',
  configProfile: PHASE3_CONFIG_PROFILE,
} as const;

type SolarSource = {
  toYmd(): string;
  getXingZuo(): string;
};

type LunarSource = {
  getSolar(): SolarSource;
  getYear(): number;
  getMonth(): number;
  getDay(): number;
  getYearShengXiao(): string;
  getYearInGanZhiExact(): string;
  getMonthInGanZhiExact(): string;
  getDayInGanZhiExact(): string;
  getTimeInGanZhi(): string;
};

type MeihuaSummary = {
  solarDate?: string;
  lunarDate: string | { year: number; month: number; day: number; isLeapMonth: boolean };
  zodiacKey?: ChartKey;
  signKey?: ChartKey;
  yearPillar: { heavenlyStemKey: ChartKey; earthlyBranchKey: ChartKey };
  monthPillar: { heavenlyStemKey: ChartKey; earthlyBranchKey: ChartKey };
  dayPillar: { heavenlyStemKey: ChartKey; earthlyBranchKey: ChartKey };
  hourPillar: { heavenlyStemKey: ChartKey; earthlyBranchKey: ChartKey };
  upperTrigramKey: ChartKey;
  lowerTrigramKey: ChartKey;
  bodyTrigramKey: ChartKey;
  applicationTrigramKey: ChartKey;
  upperElementKey: ChartKey;
  lowerElementKey: ChartKey;
  movingLine: number;
};

const EARTHLY_BRANCH_TO_NUMBER: Record<ChartKey, number> = {
  ziEarthly: 1,
  chouEarthly: 2,
  yinEarthly: 3,
  maoEarthly: 4,
  chenEarthly: 5,
  siEarthly: 6,
  wuEarthly: 7,
  weiEarthly: 8,
  shenEarthly: 9,
  youEarthly: 10,
  xuEarthly: 11,
  haiEarthly: 12,
};

const TRIGRAM_BY_NUMBER = {
  1: '乾',
  2: '兑',
  3: '离',
  4: '震',
  5: '巽',
  6: '坎',
  7: '艮',
  8: '坤',
} as const;

const TRIGRAM_ELEMENT = {
  '乾': '金',
  '兑': '金',
  '离': '火',
  '震': '木',
  '巽': '木',
  '坎': '水',
  '艮': '土',
  '坤': '土',
} as const;

function toLunarSource(input: BirthInput): LunarSource {
  const hour = input.time.hour ?? 0;
  const minute = input.time.minute ?? 0;

  if (input.calendar === 'gregorian') {
    return Solar.fromYmdHms(input.date.year, input.date.month, input.date.day, hour, minute, 0).getLunar() as unknown as LunarSource;
  }

  return Lunar.fromYmdHms(input.date.year, resolveLunarMonthNumber(input), input.date.day, hour, minute, 0) as unknown as LunarSource;
}

function normalizeBaguaNumber(value: number): number {
  const mod = value % 8;
  return mod === 0 ? 8 : mod;
}

function normalizeMovingLine(value: number): number {
  const mod = value % 6;
  return mod === 0 ? 6 : mod;
}

function buildPillars(lunar: ReturnType<typeof toLunarSource>): Pillar[] {
  const pillars = [
    { name: 'Year', value: lunar.getYearInGanZhiExact() },
    { name: 'Month', value: lunar.getMonthInGanZhiExact() },
    { name: 'Day', value: lunar.getDayInGanZhiExact() },
    { name: 'Hour', value: lunar.getTimeInGanZhi() },
  ];

  return pillars.map((pillar) => {
    const pair = toGanZhiPair(pillar.value);
    return {
      name: pillar.name,
      heavenlyStemKey: pair.heavenlyStemKey,
      earthlyBranchKey: pair.earthlyBranchKey,
    };
  });
}

function buildSummary(lunar: LunarSource): MeihuaSummary {
  const yearPair = toGanZhiPair(lunar.getYearInGanZhiExact());
  const monthPair = toGanZhiPair(lunar.getMonthInGanZhiExact());
  const dayPair = toGanZhiPair(lunar.getDayInGanZhiExact());
  const hourPair = toGanZhiPair(lunar.getTimeInGanZhi());
  const yearNumber = EARTHLY_BRANCH_TO_NUMBER[yearPair.earthlyBranchKey];
  const hourNumber = EARTHLY_BRANCH_TO_NUMBER[hourPair.earthlyBranchKey];
  const lunarMonth = Math.abs(lunar.getMonth());
  const lunarDay = lunar.getDay();
  const upperNumber = normalizeBaguaNumber(yearNumber + lunarMonth + lunarDay);
  const lowerNumber = normalizeBaguaNumber(yearNumber + lunarMonth + lunarDay + hourNumber);
  const movingLine = normalizeMovingLine(yearNumber + lunarMonth + lunarDay + hourNumber);
  const upperTrigram = TRIGRAM_BY_NUMBER[upperNumber as keyof typeof TRIGRAM_BY_NUMBER];
  const lowerTrigram = TRIGRAM_BY_NUMBER[lowerNumber as keyof typeof TRIGRAM_BY_NUMBER];
  const bodyTrigram = movingLine > 3 ? lowerTrigram : upperTrigram;
  const applicationTrigram = movingLine > 3 ? upperTrigram : lowerTrigram;

  return {
    solarDate: lunar.getSolar().toYmd(),
    lunarDate: {
      year: lunar.getYear(),
      month: Math.abs(lunar.getMonth()),
      day: lunar.getDay(),
      isLeapMonth: lunar.getMonth() < 0,
    },
    zodiacKey: toYearZodiacKey(lunar.getYearShengXiao()),
    signKey: toSolarSignKey(lunar.getSolar().getXingZuo()),
    yearPillar: yearPair,
    monthPillar: monthPair,
    dayPillar: dayPair,
    hourPillar: hourPair,
    upperTrigramKey: toTrigramKey(upperTrigram),
    lowerTrigramKey: toTrigramKey(lowerTrigram),
    bodyTrigramKey: toTrigramKey(bodyTrigram),
    applicationTrigramKey: toTrigramKey(applicationTrigram),
    upperElementKey: toFiveElementKey(TRIGRAM_ELEMENT[upperTrigram]),
    lowerElementKey: toFiveElementKey(TRIGRAM_ELEMENT[lowerTrigram]),
    movingLine,
  };
}

export class LunarJavascriptMeihuaAdapter implements AstrologyChartAdapter {
  readonly system = 'mei-hua-yi-shu' as const;
  readonly adapterName = 'lunar-javascript';
  readonly adapterVersion = '1.7.7';
  readonly usesViewYear = false;

  async calculateChart(input: BirthInput, _options?: ChartCalculationOptions): Promise<MeihuaChartSnapshot> {
    const normalizedBirth = normalizeBirthInput(input);
    const warnings = [...normalizedBirth.normalizationConfidence.reasons];

    if (normalizedBirth.normalizationConfidence.blocksExactReading) {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'mei-hua-yi-shu',
        canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
        adapterVersion: MEIHUA_ADAPTER_VERSION,
        confidence: normalizedBirth.normalizationConfidence,
        warnings,
      }) as MeihuaChartSnapshot;
    }

    const lunar = toLunarSource(input);
    const base = createBaseSnapshotFields({
      input,
      chartSystem: 'mei-hua-yi-shu',
      canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
      adapterVersion: MEIHUA_ADAPTER_VERSION,
      normalizedBirth: {
        ...normalizedBirth,
        lunarDate: `${lunar.getYear()}-${Math.abs(lunar.getMonth())}-${lunar.getDay()}`,
        ganZhi: {
          yearPillar: lunar.getYearInGanZhiExact(),
          monthPillar: lunar.getMonthInGanZhiExact(),
          dayPillar: lunar.getDayInGanZhiExact(),
          hourPillar: lunar.getTimeInGanZhi(),
        },
      },
      calculationConfidence: normalizedBirth.normalizationConfidence,
      warnings,
    });

    return {
      ...base,
      birth: {
        ...normalizedBirth,
        lunarDate: `${lunar.getYear()}-${Math.abs(lunar.getMonth())}-${lunar.getDay()}`,
        ganZhi: {
          yearPillar: lunar.getYearInGanZhiExact(),
          monthPillar: lunar.getMonthInGanZhiExact(),
          dayPillar: lunar.getDayInGanZhiExact(),
          hourPillar: lunar.getTimeInGanZhi(),
        },
      },
      chartSystem: 'mei-hua-yi-shu',
      palaces: [],
      pillars: buildPillars(lunar),
      summary: buildSummary(lunar),
    };
  }
}
