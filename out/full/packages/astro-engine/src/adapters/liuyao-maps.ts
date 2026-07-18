import type {
  LiuyaoHexagram,
  LiuyaoLine,
  LiuyaoLineStateKey,
  LiuyaoMethod,
  LiuyaoRoleKey,
  LiuyaoSixKinKey,
  LiuyaoSixSpiritKey,
} from '@ziweiai/contracts';
import { formatBaziNaYinLabel, formatBaziStemBranchLabel, toBaziStemBranchKeyPair } from './bazi-maps';
import { buildHexagramKey, formatMeihuaHexagramLabel, getTrigramKeyByLines } from './meihua-maps';

type XuanshuLiuyaoLineValue = '—' | '--';

const YANG_LINE = '—';

const trigramValueToKey = {
  乾: 'qianTrigram',
  兑: 'duiTrigram',
  兌: 'duiTrigram',
  离: 'liTrigram',
  離: 'liTrigram',
  震: 'zhenTrigram',
  巽: 'xunTrigram',
  坎: 'kanTrigram',
  艮: 'genTrigram',
  坤: 'kunTrigram',
} as const;

const stateNameToKey: Record<string, LiuyaoLineStateKey> = {
  少阴: 'youngYin',
  少陰: 'youngYin',
  少阳: 'youngYang',
  少陽: 'youngYang',
  老阴: 'oldYin',
  老陰: 'oldYin',
  老阳: 'oldYang',
  老陽: 'oldYang',
};

const sixKinValueToKey: Record<string, LiuyaoSixKinKey> = {
  兄弟: 'sibling',
  子孙: 'childDescendant',
  子孫: 'childDescendant',
  妻财: 'wifeWealth',
  妻財: 'wifeWealth',
  官鬼: 'officerGhost',
  父母: 'parent',
};

const sixSpiritValueToKey: Record<string, LiuyaoSixSpiritKey> = {
  青龙: 'azureDragon',
  青龍: 'azureDragon',
  朱雀: 'vermilionBird',
  勾陈: 'hookSnake',
  勾陳: 'hookSnake',
  螣蛇: 'soaringSerpent',
  腾蛇: 'soaringSerpent',
  騰蛇: 'soaringSerpent',
  白虎: 'whiteTiger',
  玄武: 'blackTortoise',
};

const fiveElementValueToKey = {
  木: 'wood',
  火: 'fire',
  土: 'earth',
  金: 'metal',
  水: 'water',
} as const;

const methodLabelsVi: Record<LiuyaoMethod, string> = {
  'time-based': 'Theo thời gian',
  manual: 'Thủ công',
  random: 'Ngẫu nhiên',
};

const sixKinLabelsVi: Record<LiuyaoSixKinKey, string> = {
  sibling: 'Huynh đệ',
  childDescendant: 'Tử tôn',
  wifeWealth: 'Thê tài',
  officerGhost: 'Quan quỷ',
  parent: 'Phụ mẫu',
};

export type XuanshuLiuyaoHexagramLines = {
  yaoAs: string[];
  yaoAsMarkName?: string[];
  shiYing: string[];
  liuQin: string[];
  ganZhi: string[];
  wuXing: string[];
  naYin: string[];
  liuShen: string[];
  fuShen?: string[];
};

function normalizeMarkName(value: string | undefined, fallbackValue: XuanshuLiuyaoLineValue): LiuyaoLineStateKey {
  const normalized = value?.trim();
  if (normalized && stateNameToKey[normalized]) {
    return stateNameToKey[normalized];
  }

  return fallbackValue === YANG_LINE ? 'youngYang' : 'youngYin';
}

function normalizeRole(value: string): LiuyaoRoleKey {
  if (value === '世') {
    return 'shi';
  }

  if (value === '应' || value === '應') {
    return 'ying';
  }

  return 'none';
}

function normalizeSixKin(value: string): LiuyaoSixKinKey {
  const normalized = value.trim();
  const key = sixKinValueToKey[normalized];
  if (!key) {
    throw new Error(`Không nhận diện được lục thân Lục Hào: "${value}"`);
  }

  return key;
}

function normalizeSixSpirit(value: string): LiuyaoSixSpiritKey {
  const normalized = value.trim();
  const key = sixSpiritValueToKey[normalized];
  if (!key) {
    throw new Error(`Không nhận diện được lục thần Lục Hào: "${value}"`);
  }

  return key;
}

function normalizeFiveElement(value: string): LiuyaoLine['fiveElementKey'] {
  const normalized = value.trim();
  const key = fiveElementValueToKey[normalized as keyof typeof fiveElementValueToKey];
  if (!key) {
    throw new Error(`Không nhận diện được ngũ hành Lục Hào: "${value}"`);
  }

  return key;
}

function normalizeLineValue(value: string): LiuyaoLine['value'] {
  return value.trim() === YANG_LINE ? 'yang' : 'yin';
}

function normalizeTrigramKey(value: string): LiuyaoHexagram['topTrigramKey'] {
  const normalized = value.trim()[0] ?? '';
  const key = trigramValueToKey[normalized as keyof typeof trigramValueToKey];
  if (!key) {
    throw new Error(`Không nhận diện được quái Lục Hào: "${value}"`);
  }

  return key;
}

export function buildLiuyaoMethodLabel(method: LiuyaoMethod): string {
  return methodLabelsVi[method];
}

export function buildLiuyaoHexagramLabel(input: {
  topTrigramKey: LiuyaoHexagram['topTrigramKey'];
  bottomTrigramKey: LiuyaoHexagram['bottomTrigramKey'];
}): string {
  return formatMeihuaHexagramLabel(input);
}

export function buildLiuyaoMovingLinesLabel(lines: readonly LiuyaoLine[]): string {
  const labels = lines
    .filter((line) => line.isMoving)
    .map((line) => `Hào ${line.position}`);

  return labels.join(', ');
}

export function buildLiuyaoRoleLineLabel(lines: readonly LiuyaoLine[], roleKey: LiuyaoRoleKey): string {
  const line = lines.find((item) => item.roleKey === roleKey);
  return line ? `Hào ${line.position}` : 'Không đánh dấu';
}

export function buildHexagramFromXuanshuLines(params: {
  lineData: XuanshuLiuyaoHexagramLines;
  topTrigramLabel?: string;
  bottomTrigramLabel?: string;
  hiddenSpiritMode: 'preserve' | 'drop';
  baseStateKeys?: readonly LiuyaoLineStateKey[];
}): LiuyaoHexagram {
  const lineValues = params.lineData.yaoAs.map((value) => normalizeLineValue(value));
  const bottomTrigramKey = params.bottomTrigramLabel
    ? normalizeTrigramKey(params.bottomTrigramLabel)
    : getTrigramKeyByLines(lineValues.slice(0, 3));
  const topTrigramKey = params.topTrigramLabel
    ? normalizeTrigramKey(params.topTrigramLabel)
    : getTrigramKeyByLines(lineValues.slice(3, 6));
  const lines = lineValues.map((value, index) => {
    const stateKey =
      params.baseStateKeys?.[index] ??
      normalizeMarkName(params.lineData.yaoAsMarkName?.[index], params.lineData.yaoAs[index]?.trim() === YANG_LINE ? YANG_LINE : '--');
    const roleKey = normalizeRole(params.lineData.shiYing[index] ?? '');
    const sixKinKey = normalizeSixKin(params.lineData.liuQin[index] ?? '');
    const { earthlyBranchKey } = toBaziStemBranchKeyPair(params.lineData.ganZhi[index] ?? '');

    return {
      position: index + 1,
      value,
      stateKey,
      isMoving: stateKey === 'oldYin' || stateKey === 'oldYang',
      roleKey,
      sixKinKey,
      earthlyBranchKey,
      fiveElementKey: normalizeFiveElement(params.lineData.wuXing[index] ?? ''),
      naYin: formatBaziNaYinLabel(params.lineData.naYin[index] ?? ''),
      sixSpiritKey: normalizeSixSpirit(params.lineData.liuShen[index] ?? ''),
      hiddenSpirit:
        params.hiddenSpiritMode === 'preserve' && params.lineData.fuShen?.[index]
          ? sixKinLabelsVi[normalizeSixKin(params.lineData.fuShen[index]!)]
          : null,
    } satisfies LiuyaoLine;
  });

  return {
    key: buildHexagramKey(topTrigramKey, bottomTrigramKey),
    topTrigramKey,
    bottomTrigramKey,
    name: buildLiuyaoHexagramLabel({ topTrigramKey, bottomTrigramKey }),
    symbol: lineValues.map((value) => (value === 'yang' ? '1' : '0')).join(''),
    lines,
  };
}

export function buildDerivedNuclearHexagram(baseHexagram: LiuyaoHexagram): LiuyaoHexagram {
  const source = baseHexagram.lines.map((line) => line.value);
  const bottomLines = [source[1]!, source[2]!, source[3]!];
  const topLines = [source[2]!, source[3]!, source[4]!];
  const bottomTrigramKey = getTrigramKeyByLines(bottomLines);
  const topTrigramKey = getTrigramKeyByLines(topLines);

  return {
    key: buildHexagramKey(topTrigramKey, bottomTrigramKey),
    topTrigramKey,
    bottomTrigramKey,
    name: buildLiuyaoHexagramLabel({ topTrigramKey, bottomTrigramKey }),
    symbol: [...bottomLines, ...topLines].map((value) => (value === 'yang' ? '1' : '0')).join(''),
    lines: baseHexagram.lines.map((line, index) => {
      const value = [...bottomLines, ...topLines][index]!;
      return {
        ...line,
        position: index + 1,
        value,
        stateKey: value === 'yang' ? 'youngYang' : 'youngYin',
        isMoving: false,
        hiddenSpirit: null,
      };
    }),
  };
}

export function buildPillarsFromGanZhi(ganZhi: {
  year: string;
  month: string;
  day: string;
  hour: string;
}) {
  return [
    { name: 'year', value: formatBaziStemBranchLabel(toBaziStemBranchKeyPair(ganZhi.year)) },
    { name: 'month', value: formatBaziStemBranchLabel(toBaziStemBranchKeyPair(ganZhi.month)) },
    { name: 'day', value: formatBaziStemBranchLabel(toBaziStemBranchKeyPair(ganZhi.day)) },
    { name: 'hour', value: formatBaziStemBranchLabel(toBaziStemBranchKeyPair(ganZhi.hour)) },
  ];
}
