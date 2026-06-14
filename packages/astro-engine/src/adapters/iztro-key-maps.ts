import type { BrightnessKey, ChartKey, LunarDateSummary, MutagenKey } from '@ziweiai/contracts';
import zhCnBrightness from 'iztro/lib/i18n/locales/zh-CN/brightness';
import zhCnEarthlyBranch from 'iztro/lib/i18n/locales/zh-CN/earthlyBranch';
import zhCnFiveElementsClass from 'iztro/lib/i18n/locales/zh-CN/fiveElementsClass';
import zhCnHeavenlyStem from 'iztro/lib/i18n/locales/zh-CN/heavenlyStem';
import zhCnPalace from 'iztro/lib/i18n/locales/zh-CN/palace';
import zhCnStar from 'iztro/lib/i18n/locales/zh-CN/star';

const zodiacValueToKey: Record<string, ChartKey> = {
  鼠: 'rat',
  牛: 'ox',
  虎: 'tiger',
  兔: 'rabbit',
  龙: 'dragon',
  蛇: 'snake',
  马: 'horse',
  羊: 'goat',
  猴: 'monkey',
  鸡: 'rooster',
  狗: 'dog',
  猪: 'pig',
};

const signValueToKey: Record<string, ChartKey> = {
  白羊座: 'aries',
  金牛座: 'taurus',
  双子座: 'gemini',
  巨蟹座: 'cancer',
  狮子座: 'leo',
  处女座: 'virgo',
  天秤座: 'libra',
  天蝎座: 'scorpio',
  射手座: 'sagittarius',
  摩羯座: 'capricorn',
  水瓶座: 'aquarius',
  双鱼座: 'pisces',
};

const genderValueToKey: Record<string, ChartKey> = {
  男: 'male',
  女: 'female',
};

const lunarMonthMap: Record<string, number> = {
  正: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
  冬: 11,
  腊: 12,
};

const lunarDayMap: Record<string, number> = {
  初一: 1,
  初二: 2,
  初三: 3,
  初四: 4,
  初五: 5,
  初六: 6,
  初七: 7,
  初八: 8,
  初九: 9,
  初十: 10,
  十一: 11,
  十二: 12,
  十三: 13,
  十四: 14,
  十五: 15,
  十六: 16,
  十七: 17,
  十八: 18,
  十九: 19,
  二十: 20,
  廿一: 21,
  廿二: 22,
  廿三: 23,
  廿四: 24,
  廿五: 25,
  廿六: 26,
  廿七: 27,
  廿八: 28,
  廿九: 29,
  三十: 30,
};

const chineseDigitMap: Record<string, string> = {
  〇: '0',
  一: '1',
  二: '2',
  三: '3',
  四: '4',
  五: '5',
  六: '6',
  七: '7',
  八: '8',
  九: '9',
};

const timeIndexToEarthlyBranchKey: ChartKey[] = [
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
  'ziEarthly',
];

function invertRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [value, key]));
}

function lookupKey(reverseMap: Record<string, string>, value: string, kind: string): ChartKey {
  const key = reverseMap[value];
  if (!key) {
    throw new Error(`Unsupported iztro ${kind}: ${value}`);
  }
  return key;
}

const palaceValueToKey = invertRecord(zhCnPalace as Record<string, string>);
const starValueToKey = invertRecord(zhCnStar as Record<string, string>);
const heavenlyStemValueToKey = invertRecord(zhCnHeavenlyStem as Record<string, string>);
const earthlyBranchValueToKey = invertRecord(zhCnEarthlyBranch as Record<string, string>);
const fiveElementsClassValueToKey = invertRecord(zhCnFiveElementsClass as Record<string, string>);
const brightnessValueToKeyMap = invertRecord(zhCnBrightness as Record<string, string>) as Record<string, BrightnessKey>;

const mutagenValueToKeyMap: Record<string, MutagenKey> = {
  禄: 'lu',
  权: 'quyen',
  科: 'khoa',
  忌: 'ky',
};

export const iztroEmittedLocaleKeys = {
  brightness: Object.keys(zhCnBrightness as Record<string, string>),
  earthlyBranch: Object.keys(zhCnEarthlyBranch as Record<string, string>),
  fiveElementsClass: Object.keys(zhCnFiveElementsClass as Record<string, string>),
  heavenlyStem: Object.keys(zhCnHeavenlyStem as Record<string, string>),
  mutagen: Object.values(mutagenValueToKeyMap),
  palace: Object.keys(zhCnPalace as Record<string, string>),
  star: Object.keys(zhCnStar as Record<string, string>),
} as const;

export function toPalaceKey(value: string): ChartKey {
  return lookupKey(palaceValueToKey, value, 'palace name');
}

export function toStarKey(value: string): ChartKey {
  return lookupKey(starValueToKey, value, 'star name');
}

export function toHeavenlyStemKey(value: string): ChartKey {
  return lookupKey(heavenlyStemValueToKey, value, 'heavenly stem');
}

export function toEarthlyBranchKey(value: string): ChartKey {
  return lookupKey(earthlyBranchValueToKey, value, 'earthly branch');
}

export function toFiveElementsClassKey(value: string): ChartKey {
  return lookupKey(fiveElementsClassValueToKey, value, 'five elements class');
}

export function toBrightnessKey(value?: string): BrightnessKey | undefined {
  if (!value) {
    return undefined;
  }
  const key = brightnessValueToKeyMap[value];
  if (!key) {
    throw new Error(`Unsupported iztro brightness: ${value}`);
  }
  return key;
}

export function toMutagenKey(value?: string): MutagenKey | undefined {
  if (!value) {
    return undefined;
  }
  const key = mutagenValueToKeyMap[value];
  if (!key) {
    throw new Error(`Unsupported iztro mutagen: ${value}`);
  }
  return key;
}

export function toGenderKey(value: string): ChartKey {
  const key = genderValueToKey[value];
  if (!key) {
    throw new Error(`Unsupported iztro gender: ${value}`);
  }
  return key;
}

export function toZodiacKey(value: string): ChartKey {
  const key = zodiacValueToKey[value];
  if (!key) {
    throw new Error(`Unsupported iztro zodiac: ${value}`);
  }
  return key;
}

export function toSignKey(value: string): ChartKey {
  const key = signValueToKey[value];
  if (!key) {
    throw new Error(`Unsupported iztro sign: ${value}`);
  }
  return key;
}

export function toTimeEarthlyBranchKey(timeIndex: number): ChartKey {
  const key = timeIndexToEarthlyBranchKey[timeIndex];
  if (!key) {
    throw new Error(`Unsupported iztro time index: ${timeIndex}`);
  }
  return key;
}

export function parseIztroLunarDate(value: string): LunarDateSummary {
  const leapMonth = value.includes('闰');
  const sanitized = value.replace('闰', '');
  const yearMatch = sanitized.match(/^([〇一二三四五六七八九]{4})年(.+?)月(.+)$/u);
  if (!yearMatch) {
    throw new Error(`Unsupported iztro lunar date: ${value}`);
  }

  const month = lunarMonthMap[yearMatch[2]];
  const day = lunarDayMap[yearMatch[3]];
  if (month === undefined || day === undefined) {
    throw new Error(`Unsupported iztro lunar date: ${value}`);
  }

  const year = Number(
    yearMatch[1]
      .split('')
      .map((character) => chineseDigitMap[character] ?? character)
      .join(''),
  );

  return {
    year,
    month,
    day,
    isLeapMonth: leapMonth,
  };
}
