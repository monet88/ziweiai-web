import type { ChartKey, DaliurenChartSnapshot, LiuyaoChartSnapshot, LunarDateSummary } from '@ziweiai/contracts';
import { toEarthlyBranchKey } from '../iztro-key-maps';
import { toGanZhiPair, toSolarSignKey, toYearZodiacKey } from './gan-zhi-keys';

export interface JieQiRef {
  toString(): string;
  getSolar(): {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
    toYmdHms(): string;
  };
}

export interface LunarSource {
  getSolar(): { toYmd(): string; getXingZuo(): string };
  getYear(): number;
  getMonth(): number;
  getDay(): number;
  getYearShengXiao(): string;
  getYearInGanZhiExact(): string;
  getMonthInGanZhiExact(): string;
  getDayInGanZhiExact(): string;
  getTimeInGanZhi(): string;
  getPrevQi?(byDay: boolean): JieQiRef;
  getNextQi?(byDay: boolean): JieQiRef;
}

export interface DaLiuRenLunarSource extends LunarSource {
  getMonthInGanZhi?(): string;
}

const BRANCH_NUMBER_KEYS: Record<string, number> = {
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

const TRIGRAM_BY_NUMBER: Record<number, ChartKey> = {
  1: 'qianTrigram',
  2: 'duiTrigram',
  3: 'liTrigram',
  4: 'zhenTrigram',
  5: 'xunTrigram',
  6: 'kanTrigram',
  7: 'genTrigram',
  8: 'kunTrigram',
};

const TRIGRAM_LINES_BY_KEY: Record<ChartKey, [0 | 1, 0 | 1, 0 | 1]> = {
  qianTrigram: [1, 1, 1],
  duiTrigram: [1, 1, 0],
  liTrigram: [1, 0, 1],
  zhenTrigram: [1, 0, 0],
  xunTrigram: [0, 1, 1],
  kanTrigram: [0, 1, 0],
  genTrigram: [0, 0, 1],
  kunTrigram: [0, 0, 0],
};

const TRIGRAM_KEY_BY_LINES: Record<string, ChartKey> = Object.fromEntries(
  Object.entries(TRIGRAM_LINES_BY_KEY).map(([key, lines]) => [lines.join(''), key as ChartKey]),
) as Record<string, ChartKey>;

const YUE_JIANG_BY_QI: Record<string, { branchKey: ChartKey; spiritKey: ChartKey }> = {
  '大寒雨水': { branchKey: 'ziEarthly', spiritKey: 'shenHouSpirit' },
  '冬至大寒': { branchKey: 'chouEarthly', spiritKey: 'daJiSpirit' },
  '小雪冬至': { branchKey: 'yinEarthly', spiritKey: 'gongCaoSpirit' },
  '霜降小雪': { branchKey: 'maoEarthly', spiritKey: 'taiChongSpirit' },
  '秋分霜降': { branchKey: 'chenEarthly', spiritKey: 'tianGangSpirit' },
  '处暑秋分': { branchKey: 'siEarthly', spiritKey: 'taiYiSpirit' },
  '大暑处暑': { branchKey: 'wuEarthly', spiritKey: 'shengGuangSpirit' },
  '夏至大暑': { branchKey: 'weiEarthly', spiritKey: 'xiaoJiSpirit' },
  '小满夏至': { branchKey: 'shenEarthly', spiritKey: 'chuanSongSpirit' },
  '谷雨小满': { branchKey: 'youEarthly', spiritKey: 'congKuiSpirit' },
  '春分谷雨': { branchKey: 'xuEarthly', spiritKey: 'heKuiSpirit' },
  '雨水春分': { branchKey: 'haiEarthly', spiritKey: 'dengMingSpirit' },
};

const GUI_REN_MODE_KEY_BY_VALUE: Record<number, ChartKey> = {
  0: 'autoGuiRenMode',
  1: 'dayGuiRenMode',
  2: 'nightGuiRenMode',
};

const SEXAGENARY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const SEXAGENARY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
const SEXAGENARY_CYCLE = Array.from({ length: 60 }, (_, index) => `${SEXAGENARY_STEMS[index % 10]}${SEXAGENARY_BRANCHES[index % 12]}`);
const KONG_WANG_BRANCHES_BY_GROUP: [ChartKey, ChartKey][] = [
  ['xuEarthly', 'haiEarthly'],
  ['shenEarthly', 'youEarthly'],
  ['wuEarthly', 'weiEarthly'],
  ['chenEarthly', 'siEarthly'],
  ['yinEarthly', 'maoEarthly'],
  ['ziEarthly', 'chouEarthly'],
];

function normalizeNumber(value: number, modulo: number): number {
  const remainder = value % modulo;
  return remainder === 0 ? modulo : remainder;
}

function getBranchNumber(branchKey: ChartKey): number {
  return BRANCH_NUMBER_KEYS[branchKey] ?? 1;
}

function getLunarDateSummary(lunar: LunarSource): LunarDateSummary {
  return {
    year: lunar.getYear(),
    month: Math.abs(lunar.getMonth()),
    day: lunar.getDay(),
    isLeapMonth: lunar.getMonth() < 0,
  };
}

function getYueJiangInfo(lunar: LunarSource): { branchKey: ChartKey; spiritKey: ChartKey } {
  const prevQi = lunar.getPrevQi?.(false)?.toString() ?? '';
  const nextQi = lunar.getNextQi?.(false)?.toString() ?? '';
  const info = YUE_JIANG_BY_QI[`${prevQi}${nextQi}`];
  if (!info) {
    throw new Error(`Unsupported yue jiang pair: ${prevQi}${nextQi}`);
  }
  return info;
}

function getKongWangBranches(dayGanZhi: string): [ChartKey, ChartKey] {
  const index = SEXAGENARY_CYCLE.indexOf(dayGanZhi);
  if (index < 0) {
    throw new Error(`Unsupported GanZhi value: ${dayGanZhi}`);
  }
  return KONG_WANG_BRANCHES_BY_GROUP[Math.floor(index / 10)] ?? KONG_WANG_BRANCHES_BY_GROUP[5];
}

function getTrigramKeyFromLines(lines: [0 | 1, 0 | 1, 0 | 1]): ChartKey {
  const key = TRIGRAM_KEY_BY_LINES[lines.join('')];
  if (!key) {
    throw new Error(`Unsupported trigram lines: ${lines.join('')}`);
  }
  return key;
}

function buildLiuYaoTrigramKeys(lunar: LunarSource) {
  const yearPillar = toGanZhiPair(lunar.getYearInGanZhiExact());
  const monthPillar = toGanZhiPair(lunar.getMonthInGanZhiExact());
  const dayPillar = toGanZhiPair(lunar.getDayInGanZhiExact());
  const hourPillar = toGanZhiPair(lunar.getTimeInGanZhi());
  const yearNumber = getBranchNumber(yearPillar.earthlyBranchKey);
  const monthNumber = Math.abs(lunar.getMonth());
  const dayNumber = lunar.getDay();
  const hourNumber = getBranchNumber(hourPillar.earthlyBranchKey);
  const upperNumber = normalizeNumber(yearNumber + monthNumber + dayNumber, 8);
  const lowerNumber = normalizeNumber(yearNumber + monthNumber + dayNumber + hourNumber, 8);
  const movingLine = normalizeNumber(yearNumber + monthNumber + dayNumber + hourNumber, 6);
  const upperTrigramKey = TRIGRAM_BY_NUMBER[upperNumber];
  const lowerTrigramKey = TRIGRAM_BY_NUMBER[lowerNumber];
  const combinedLines = [
    ...TRIGRAM_LINES_BY_KEY[lowerTrigramKey],
    ...TRIGRAM_LINES_BY_KEY[upperTrigramKey],
  ] as [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1];
  const transformedLines = [...combinedLines] as [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1];
  const movingIndex = movingLine - 1;
  transformedLines[movingIndex] = transformedLines[movingIndex] === 1 ? 0 : 1;

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    upperTrigramKey,
    lowerTrigramKey,
    transformedUpperTrigramKey: getTrigramKeyFromLines([
      transformedLines[3],
      transformedLines[4],
      transformedLines[5],
    ]),
    transformedLowerTrigramKey: getTrigramKeyFromLines([
      transformedLines[0],
      transformedLines[1],
      transformedLines[2],
    ]),
    movingLine,
  };
}

export function buildLiuYaoSummary(lunar: LunarSource): LiuyaoChartSnapshot['summary'] {
  const trigramKeys = buildLiuYaoTrigramKeys(lunar);
  const yueJiang = getYueJiangInfo(lunar);
  const kongWang = getKongWangBranches(lunar.getDayInGanZhiExact());

  return {
    solarDate: lunar.getSolar().toYmd(),
    lunarDate: getLunarDateSummary(lunar),
    zodiacKey: toYearZodiacKey(lunar.getYearShengXiao()),
    signKey: toSolarSignKey(lunar.getSolar().getXingZuo()),
    yearPillar: trigramKeys.yearPillar,
    monthPillar: trigramKeys.monthPillar,
    dayPillar: trigramKeys.dayPillar,
    hourPillar: trigramKeys.hourPillar,
    upperTrigramKey: trigramKeys.upperTrigramKey,
    lowerTrigramKey: trigramKeys.lowerTrigramKey,
    transformedUpperTrigramKey: trigramKeys.transformedUpperTrigramKey,
    transformedLowerTrigramKey: trigramKeys.transformedLowerTrigramKey,
    yueJiangBranchKey: yueJiang.branchKey,
    yueJiangSpiritKey: yueJiang.spiritKey,
    kongWangFirstBranchKey: kongWang[0],
    kongWangSecondBranchKey: kongWang[1],
    movingLine: trigramKeys.movingLine,
  };
}

export function buildDaLiuRenSummary(lunar: DaLiuRenLunarSource, guiRenType: 0 | 1 | 2): DaliurenChartSnapshot['summary'] {
  const yueJiang = getYueJiangInfo(lunar);
  const dayGan = lunar.getDayInGanZhiExact().slice(0, 1);
  const hourZhi = lunar.getTimeInGanZhi().slice(1);

  return {
    solarDate: lunar.getSolar().toYmd(),
    lunarDate: getLunarDateSummary(lunar),
    zodiacKey: toYearZodiacKey(lunar.getYearShengXiao()),
    signKey: toSolarSignKey(lunar.getSolar().getXingZuo()),
    yearPillar: toGanZhiPair(lunar.getYearInGanZhiExact()),
    monthPillar: toGanZhiPair(lunar.getMonthInGanZhi?.() ?? lunar.getMonthInGanZhiExact()),
    dayPillar: toGanZhiPair(lunar.getDayInGanZhiExact()),
    hourPillar: toGanZhiPair(lunar.getTimeInGanZhi()),
    yueJiangBranchKey: yueJiang.branchKey,
    yueJiangSpiritKey: yueJiang.spiritKey,
    guiRenModeKey: GUI_REN_MODE_KEY_BY_VALUE[guiRenType] ?? GUI_REN_MODE_KEY_BY_VALUE[0],
    guiRenStartBranchKey: toEarthlyBranchKey(resolveGuiRenStartBranch(dayGan, hourZhi, guiRenType)),
  };
}

function resolveGuiRenStartBranch(dayGan: string, hourZhi: string, guiRenType: 0 | 1 | 2): string {
  if (guiRenType === 1) {
    return resolveDayGuiRenBranch(dayGan);
  }

  if (guiRenType === 2) {
    return resolveNightGuiRenBranch(dayGan);
  }

  const isDayTime = ['卯', '辰', '巳', '午', '未', '申'].includes(hourZhi);
  return isDayTime ? resolveDayGuiRenBranch(dayGan) : resolveNightGuiRenBranch(dayGan);
}

function resolveDayGuiRenBranch(dayGan: string): string {
  if (dayGan === '甲' || dayGan === '戊' || dayGan === '庚') {
    return '丑';
  }
  if (dayGan === '乙' || dayGan === '己') {
    return '子';
  }
  if (dayGan === '丙' || dayGan === '丁') {
    return '亥';
  }
  if (dayGan === '辛') {
    return '午';
  }
  return '巳';
}

function resolveNightGuiRenBranch(dayGan: string): string {
  if (dayGan === '甲' || dayGan === '戊' || dayGan === '庚') {
    return '未';
  }
  if (dayGan === '乙' || dayGan === '己') {
    return '申';
  }
  if (dayGan === '丙' || dayGan === '丁') {
    return '酉';
  }
  if (dayGan === '辛') {
    return '寅';
  }
  return '卯';
}
