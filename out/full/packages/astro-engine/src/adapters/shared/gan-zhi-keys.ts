import type { ChartKey } from '@ziweiai/contracts';
import { toEarthlyBranchKey, toHeavenlyStemKey, toSignKey, toZodiacKey } from '../iztro-key-maps';

type GanZhiPair = {
  heavenlyStemKey: ChartKey;
  earthlyBranchKey: ChartKey;
};

const solarSignValueToKey: Record<string, ChartKey> = {
  白羊: 'aries',
  金牛: 'taurus',
  双子: 'gemini',
  巨蟹: 'cancer',
  狮子: 'leo',
  处女: 'virgo',
  天秤: 'libra',
  天蝎: 'scorpio',
  射手: 'sagittarius',
  摩羯: 'capricorn',
  水瓶: 'aquarius',
  双鱼: 'pisces',
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

const tenGodValueToKey: Record<string, ChartKey> = {
  '比肩': 'biJianTenGod',
  '劫财': 'jieCaiTenGod',
  '食神': 'shiShenTenGod',
  '伤官': 'shangGuanTenGod',
  '偏财': 'pianCaiTenGod',
  '正财': 'zhengCaiTenGod',
  '七杀': 'qiShaTenGod',
  '正官': 'zhengGuanTenGod',
  '偏印': 'pianYinTenGod',
  '正印': 'zhengYinTenGod',
  '日主': 'riZhuTenGod',
};

function splitGanZhi(value: string): [string, string] {
  if (value.length < 2) {
    throw new Error(`Unsupported GanZhi value: ${value}`);
  }

  return [value.slice(0, 1), value.slice(1)];
}

export function toGanZhiPair(value: string): GanZhiPair {
  const [heavenly, earthly] = splitGanZhi(value);
  return {
    heavenlyStemKey: toHeavenlyStemKey(heavenly),
    earthlyBranchKey: toEarthlyBranchKey(earthly),
  };
}

export function toHiddenStemKeys(value: string | string[]): ChartKey[] {
  const values = Array.isArray(value)
    ? value
    : value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  return values.map((item) => toHeavenlyStemKey(item));
}

export function toTenGodKey(value: string): ChartKey {
  const key = tenGodValueToKey[value];
  if (!key) {
    throw new Error(`Unsupported ten-god value: ${value}`);
  }

  return key;
}

export function toTenGodKeys(value: string | string[]): ChartKey[] {
  const values = Array.isArray(value)
    ? value
    : value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  return values.map((item) => toTenGodKey(item));
}

export function toSolarSignKey(value: string): ChartKey {
  const key = solarSignValueToKey[value];
  if (key) {
    return key;
  }

  return toSignKey(value);
}

export function toYearZodiacKey(value: string): ChartKey {
  return toZodiacKey(value);
}
