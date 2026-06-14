import type { BirthInput, ChartKey, Pillar, QimenChartSnapshot } from '@ziweiai/contracts';
import { Lunar, Solar } from 'lunar-javascript';
import { normalizeBirthInput } from '../normalization/normalize-birth-input';
import { PHASE3_CONFIG_PROFILE } from './phase-3-config';
import { createBaseSnapshotFields, createBlockedChartSnapshot } from './runtime-support';
import type { AstrologyChartAdapter, ChartCalculationOptions } from './astro-adapter';
import { toGanZhiPair, toSolarSignKey, toYearZodiacKey } from './shared/gan-zhi-keys';
import { toJieQiKey, toSanYuanKey, toYinYangDunKey } from './shared/divination-keys';
import { resolveLunarMonthNumber } from './shared/resolve-lunar-month-number';
import { toHeavenlyStemKey } from './iztro-key-maps';

const QIMEN_ADAPTER_VERSION = {
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
  getJieQi?(): string;
  getPrevJie?(byDay?: boolean): { getName?: () => string; toString: () => string };
  getPrevJieQi?(byDay?: boolean): { getName?: () => string; toString: () => string };
};

type QimenSummary = {
  solarDate?: string;
  lunarDate: string | { year: number; month: number; day: number; isLeapMonth: boolean };
  zodiacKey?: ChartKey;
  signKey?: ChartKey;
  yearPillar: { heavenlyStemKey: ChartKey; earthlyBranchKey: ChartKey };
  monthPillar: { heavenlyStemKey: ChartKey; earthlyBranchKey: ChartKey };
  dayPillar: { heavenlyStemKey: ChartKey; earthlyBranchKey: ChartKey };
  hourPillar: { heavenlyStemKey: ChartKey; earthlyBranchKey: ChartKey };
  jieQiKey: ChartKey;
  sanYuanKey: ChartKey;
  yinYangDunKey: ChartKey;
  juShu: number;
  xunShou: { heavenlyStemKey: ChartKey; earthlyBranchKey: ChartKey };
  xunShouYiZhangKey: ChartKey;
};

const RI_ZHU_SAN_YUAN: Record<string, '上元' | '中元' | '下元'> = {
  甲子: '上元', 乙丑: '上元', 丙寅: '上元', 丁卯: '上元', 戊辰: '上元',
  己巳: '上元', 庚午: '上元', 辛未: '上元', 壬申: '上元', 癸酉: '上元',
  甲戌: '中元', 乙亥: '中元', 丙子: '中元', 丁丑: '中元', 戊寅: '中元',
  己卯: '中元', 庚辰: '中元', 辛巳: '中元', 壬午: '中元', 癸未: '中元',
  甲申: '下元', 乙酉: '下元', 丙戌: '下元', 丁亥: '下元', 戊子: '下元',
  己丑: '下元', 庚寅: '下元', 辛卯: '下元', 壬辰: '下元', 癸巳: '下元',
  甲午: '上元', 乙未: '上元', 丙申: '上元', 丁酉: '上元', 戊戌: '上元',
  己亥: '上元', 庚子: '上元', 辛丑: '上元', 壬寅: '上元', 癸卯: '上元',
  甲辰: '中元', 乙巳: '中元', 丙午: '中元', 丁未: '中元', 戊申: '中元',
  己酉: '中元', 庚戌: '中元', 辛亥: '中元', 壬子: '中元', 癸丑: '中元',
  甲寅: '下元', 乙卯: '下元', 丙辰: '下元', 丁巳: '下元', 戊午: '下元',
  己未: '下元', 庚申: '下元', 辛酉: '下元', 壬戌: '下元', 癸亥: '下元',
};

const SIX_JIA_ZI_XUN_SHOU_AND_YI_ZHANG: Record<string, [string, string]> = {
  甲子: ['甲子', '戊'], 乙丑: ['甲子', '戊'], 丙寅: ['甲子', '戊'], 丁卯: ['甲子', '戊'], 戊辰: ['甲子', '戊'],
  己巳: ['甲子', '戊'], 庚午: ['甲子', '戊'], 辛未: ['甲子', '戊'], 壬申: ['甲子', '戊'], 癸酉: ['甲子', '戊'],
  甲戌: ['甲戌', '己'], 乙亥: ['甲戌', '己'], 丙子: ['甲戌', '己'], 丁丑: ['甲戌', '己'], 戊寅: ['甲戌', '己'],
  己卯: ['甲戌', '己'], 庚辰: ['甲戌', '己'], 辛巳: ['甲戌', '己'], 壬午: ['甲戌', '己'], 癸未: ['甲戌', '己'],
  甲申: ['甲申', '庚'], 乙酉: ['甲申', '庚'], 丙戌: ['甲申', '庚'], 丁亥: ['甲申', '庚'], 戊子: ['甲申', '庚'],
  己丑: ['甲申', '庚'], 庚寅: ['甲申', '庚'], 辛卯: ['甲申', '庚'], 壬辰: ['甲申', '庚'], 癸巳: ['甲申', '庚'],
  甲午: ['甲午', '辛'], 乙未: ['甲午', '辛'], 丙申: ['甲午', '辛'], 丁酉: ['甲午', '辛'], 戊戌: ['甲午', '辛'],
  己亥: ['甲午', '辛'], 庚子: ['甲午', '辛'], 辛丑: ['甲午', '辛'], 壬寅: ['甲午', '辛'], 癸卯: ['甲午', '辛'],
  甲辰: ['甲辰', '壬'], 乙巳: ['甲辰', '壬'], 丙午: ['甲辰', '壬'], 丁未: ['甲辰', '壬'], 戊申: ['甲辰', '壬'],
  己酉: ['甲辰', '壬'], 庚戌: ['甲辰', '壬'], 辛亥: ['甲辰', '壬'], 壬子: ['甲辰', '壬'], 癸丑: ['甲辰', '壬'],
  甲寅: ['甲寅', '癸'], 乙卯: ['甲寅', '癸'], 丙辰: ['甲寅', '癸'], 丁巳: ['甲寅', '癸'], 戊午: ['甲寅', '癸'],
  己未: ['甲寅', '癸'], 庚申: ['甲寅', '癸'], 辛酉: ['甲寅', '癸'], 壬戌: ['甲寅', '癸'], 癸亥: ['甲寅', '癸'],
};

const JIE_QI_YIN_YANG_DUN: Record<string, '阳遁' | '阴遁'> = {
  冬至: '阳遁', 小寒: '阳遁', 大寒: '阳遁', 立春: '阳遁', 雨水: '阳遁', 惊蛰: '阳遁',
  春分: '阳遁', 清明: '阳遁', 谷雨: '阳遁', 立夏: '阳遁', 小满: '阳遁', 芒种: '阳遁',
  夏至: '阴遁', 小暑: '阴遁', 大暑: '阴遁', 立秋: '阴遁', 处暑: '阴遁', 白露: '阴遁',
  秋分: '阴遁', 寒露: '阴遁', 霜降: '阴遁', 立冬: '阴遁', 小雪: '阴遁', 大雪: '阴遁',
};

const JU_SHU: Record<string, [number, number, number]> = {
  冬至: [1, 7, 4], 小寒: [1, 7, 4], 大寒: [2, 8, 5],
  立春: [2, 8, 5], 雨水: [3, 9, 6], 惊蛰: [3, 9, 6],
  春分: [4, 1, 7], 清明: [4, 1, 7], 谷雨: [5, 2, 8],
  立夏: [5, 2, 8], 小满: [6, 3, 9], 芒种: [6, 3, 9],
  夏至: [9, 3, 6], 小暑: [9, 3, 6], 大暑: [8, 2, 5],
  立秋: [8, 2, 5], 处暑: [7, 1, 4], 白露: [7, 1, 4],
  秋分: [6, 9, 3], 寒露: [6, 9, 3], 霜降: [5, 8, 2],
  立冬: [5, 8, 2], 小雪: [4, 7, 1], 大雪: [4, 7, 1],
};

function toLunarSource(input: BirthInput): LunarSource {
  const hour = input.time.hour ?? 0;
  const minute = input.time.minute ?? 0;

  if (input.calendar === 'gregorian') {
    return Solar.fromYmdHms(input.date.year, input.date.month, input.date.day, hour, minute, 0).getLunar() as unknown as LunarSource;
  }

  return Lunar.fromYmdHms(input.date.year, resolveLunarMonthNumber(input), input.date.day, hour, minute, 0) as unknown as LunarSource;
}

function buildPillars(lunar: LunarSource): Pillar[] {
  const values = [
    { name: 'Year', value: lunar.getYearInGanZhiExact() },
    { name: 'Month', value: lunar.getMonthInGanZhiExact() },
    { name: 'Day', value: lunar.getDayInGanZhiExact() },
    { name: 'Hour', value: lunar.getTimeInGanZhi() },
  ];

  return values.map((pillar) => {
    const pair = toGanZhiPair(pillar.value);
    return {
      name: pillar.name,
      heavenlyStemKey: pair.heavenlyStemKey,
      earthlyBranchKey: pair.earthlyBranchKey,
    };
  });
}

function getActiveJieQi(lunar: LunarSource): string {
  const current = lunar.getJieQi?.();
  if (current) {
    return current;
  }

  const previous = lunar.getPrevJieQi?.(false);
  return previous?.getName?.() ?? previous?.toString() ?? '冬至';
}

function buildSummary(lunar: LunarSource): QimenSummary {
  const yearPillar = toGanZhiPair(lunar.getYearInGanZhiExact());
  const monthPillar = toGanZhiPair(lunar.getMonthInGanZhiExact());
  const dayGanZhi = lunar.getDayInGanZhiExact();
  const dayPillar = toGanZhiPair(dayGanZhi);
  const hourGanZhi = lunar.getTimeInGanZhi();
  const hourPillar = toGanZhiPair(hourGanZhi);
  const jieQi = getActiveJieQi(lunar);
  const sanYuan = RI_ZHU_SAN_YUAN[dayGanZhi] ?? '上元';
  const juShuByCycle = JU_SHU[jieQi] ?? [1, 7, 4];
  const juShu = sanYuan === '上元' ? juShuByCycle[0] : sanYuan === '中元' ? juShuByCycle[1] : juShuByCycle[2];
  const xunShouData = SIX_JIA_ZI_XUN_SHOU_AND_YI_ZHANG[hourGanZhi] ?? ['甲子', '戊'];

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
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    jieQiKey: toJieQiKey(jieQi),
    sanYuanKey: toSanYuanKey(sanYuan),
    yinYangDunKey: toYinYangDunKey(JIE_QI_YIN_YANG_DUN[jieQi] ?? '阳遁'),
    juShu,
    xunShou: toGanZhiPair(xunShouData[0]),
    xunShouYiZhangKey: toHeavenlyStemKey(xunShouData[1]),
  };
}

export class LunarJavascriptQimenAdapter implements AstrologyChartAdapter {
  readonly system = 'qi-men-dun-jia' as const;
  readonly adapterName = 'lunar-javascript';
  readonly adapterVersion = '1.7.7';
  readonly usesViewYear = false;

  async calculateChart(input: BirthInput, _options?: ChartCalculationOptions): Promise<QimenChartSnapshot> {
    const normalizedBirth = normalizeBirthInput(input);
    const warnings = [...normalizedBirth.normalizationConfidence.reasons];

    if (normalizedBirth.normalizationConfidence.blocksExactReading) {
      return createBlockedChartSnapshot({
        input,
        normalizedBirth,
        chartSystem: 'qi-men-dun-jia',
        canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
        adapterVersion: QIMEN_ADAPTER_VERSION,
        confidence: normalizedBirth.normalizationConfidence,
        warnings,
      }) as QimenChartSnapshot;
    }

    const lunar = toLunarSource(input);
    const base = createBaseSnapshotFields({
      input,
      chartSystem: 'qi-men-dun-jia',
      canonicalLibrary: { name: 'lunar-javascript', version: '1.7.7' },
      adapterVersion: QIMEN_ADAPTER_VERSION,
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
      chartSystem: 'qi-men-dun-jia',
      palaces: [],
      pillars: buildPillars(lunar),
      summary: buildSummary(lunar),
    };
  }
}
