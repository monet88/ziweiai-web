import {
  toBaziHeavenlyStemKey,
  translateQimenDunKey,
  translateQimenGateKey,
  translateQimenStarKey,
  type BaziHeavenlyStemKey,
  type QimenChart,
  type QimenDunKey,
  type QimenGateKey,
  type QimenPalace,
  type QimenSpiritKey,
  type QimenStarKey,
  type QimenSummary,
  type QimenYuanKey,
} from '@ziweiai/contracts';
import { formatBaziStemBranchLabel, toBaziStemBranchKeyPair } from './bazi-maps';

// Đầu ra của createQiMenPaiPan trong .ref/xuanshu — chỉ giữ field cần thiết.
export type XuanshuQimenResult = {
  lunar: string;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  hourGanZhi: string;
  yinYangDun: string;
  juShu: string;
  sanYuan?: string;
  zhiFu: string;
  zhiShi: string;
  diPan: string[];
  tianPan: string[];
  renPan: string[];
  shenPan: string[];
};

const starValueToKey: Record<string, QimenStarKey> = {
  天蓬: 'tianPeng',
  天芮: 'tianRui',
  天冲: 'tianChong',
  天衝: 'tianChong',
  天辅: 'tianFu',
  天輔: 'tianFu',
  天禽: 'tianQin',
  芮禽: 'tianQin',
  天心: 'tianXin',
  天柱: 'tianZhu',
  天任: 'tianRen',
  天英: 'tianYing',
};

const gateValueToKey: Record<string, QimenGateKey> = {
  休门: 'restGate',
  休門: 'restGate',
  生门: 'lifeGate',
  生門: 'lifeGate',
  伤门: 'hurtGate',
  傷門: 'hurtGate',
  杜门: 'blockGate',
  杜門: 'blockGate',
  景门: 'viewGate',
  景門: 'viewGate',
  死门: 'deathGate',
  死門: 'deathGate',
  惊门: 'fearGate',
  驚門: 'fearGate',
  开门: 'openGate',
  開門: 'openGate',
};

const spiritValueToKey: Record<string, QimenSpiritKey> = {
  值符: 'dutyChief',
  值符同宫: 'dutyChief',
  螣蛇: 'soaringSerpent',
  腾蛇: 'soaringSerpent',
  騰蛇: 'soaringSerpent',
  太阴: 'greatYin',
  太陰: 'greatYin',
  六合: 'sixHarmony',
  白虎: 'whiteTiger',
  玄武: 'blackTortoise',
  九地: 'nineEarth',
  九天: 'nineHeaven',
};

const dunValueToKey: Record<string, QimenDunKey> = {
  阳遁: 'yangDun',
  陽遁: 'yangDun',
  阴遁: 'yinDun',
  陰遁: 'yinDun',
};

const yuanValueToKey: Record<string, QimenYuanKey> = {
  上元: 'upperYuan',
  中元: 'middleYuan',
  下元: 'lowerYuan',
};

function normalizeStar(value: string): QimenStarKey | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  const key = starValueToKey[normalized];
  if (!key) {
    throw new Error(`Không nhận diện được cửu tinh Kỳ Môn: "${value}"`);
  }
  return key;
}

function normalizeGate(value: string): QimenGateKey | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  const key = gateValueToKey[normalized];
  if (!key) {
    throw new Error(`Không nhận diện được bát môn Kỳ Môn: "${value}"`);
  }
  return key;
}

function normalizeSpirit(value: string): QimenSpiritKey | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  const key = spiritValueToKey[normalized];
  if (!key) {
    throw new Error(`Không nhận diện được bát thần Kỳ Môn: "${value}"`);
  }
  return key;
}

function normalizeDun(value: string): QimenDunKey {
  const normalized = value.trim();
  const key = dunValueToKey[normalized];
  if (!key) {
    throw new Error(`Không nhận diện được Âm/Dương Độn Kỳ Môn: "${value}"`);
  }
  return key;
}

function normalizeYuan(value: string | undefined): QimenYuanKey {
  const normalized = (value ?? '').trim();
  const key = yuanValueToKey[normalized];
  if (!key) {
    // Một số cấu hình không trả về sanYuan; mặc định Thượng Nguyên để tránh chặn pipeline.
    return 'upperYuan';
  }
  return key;
}

function parseJuShu(value: string): number {
  // Format: "阳遁1局" / "阴遁9局" — trích số 1-9.
  const match = value.match(/(\d)/);
  if (!match) {
    throw new Error(`Không nhận diện được số cục Kỳ Môn: "${value}"`);
  }
  const number = Number(match[1]);
  if (number < 1 || number > 9) {
    throw new Error(`Số cục Kỳ Môn ngoài phạm vi 1-9: "${value}"`);
  }
  return number;
}

function toNullableStemKey(value: string | undefined): BaziHeavenlyStemKey | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  return toBaziHeavenlyStemKey(normalized);
}

export function buildQimenChartFromXuanshu(result: XuanshuQimenResult): {
  chart: QimenChart;
  summary: QimenSummary;
} {
  const dunKey = normalizeDun(result.yinYangDun);
  const yuanKey = normalizeYuan(result.sanYuan);
  const juShu = parseJuShu(result.juShu);

  const palaces: QimenPalace[] = [];
  for (let index = 0; index < 9; index += 1) {
    const palaceIndex = index + 1;
    const isCenter = palaceIndex === 5;
    const starRaw = result.tianPan[index] ?? '';
    const starKey = normalizeStar(starRaw);
    let companionStarKey: QimenStarKey | null = null;
    // Trường hợp "天禽寄某宫" hoặc "芮禽" — sao Cầm gửi cùng một cung khác.
    if (starRaw.includes('禽') && starRaw.length > 1) {
      companionStarKey = 'tianQin';
    }
    palaces.push({
      palaceIndex,
      diPanStemKey: toNullableStemKey(result.diPan[index]),
      tianPanStemKey: toNullableStemKey(result.tianPan[index]?.match(/[甲乙丙丁戊己庚辛壬癸]/)?.[0]),
      starKey: isCenter ? null : starKey,
      companionStarKey,
      gateKey: isCenter ? null : normalizeGate(result.renPan[index] ?? ''),
      spiritKey: isCenter ? null : normalizeSpirit(result.shenPan[index] ?? ''),
    });
  }

  const dutyChiefStarKey = normalizeStar(result.zhiFu);
  const dutyGateKey = normalizeGate(result.zhiShi);
  if (!dutyChiefStarKey) {
    throw new Error('Trực phù Kỳ Môn rỗng — dữ liệu nguồn không hợp lệ.');
  }
  if (!dutyGateKey) {
    throw new Error('Trực sử Kỳ Môn rỗng — dữ liệu nguồn không hợp lệ.');
  }

  const chart: QimenChart = {
    dunKey,
    yuanKey,
    juShu,
    dutyChiefStarKey,
    dutyGateKey,
    palaces,
  };

  const summary: QimenSummary = {
    dun: translateQimenDunKey(dunKey),
    juShu: `${translateQimenDunKey(dunKey)} ${juShu} cục`,
    dutyChief: translateQimenStarKey(dutyChiefStarKey),
    dutyGate: translateQimenGateKey(dutyGateKey),
  };

  return { chart, summary };
}

export function buildQimenPillarsFromGanZhi(result: XuanshuQimenResult) {
  return [
    { name: 'year', value: formatPillar(result.yearGanZhi) },
    { name: 'month', value: formatPillar(result.monthGanZhi) },
    { name: 'day', value: formatPillar(result.dayGanZhi) },
    { name: 'hour', value: formatPillar(result.hourGanZhi) },
  ];
}

function formatPillar(value: string): string {
  return formatBaziStemBranchLabel(toBaziStemBranchKeyPair(value));
}
