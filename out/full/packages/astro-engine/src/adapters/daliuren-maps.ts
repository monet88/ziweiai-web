import {
  formatBaziStemBranchLabel,
  toBaziEarthlyBranchKey,
  toBaziHeavenlyStemKey,
  translateBaziKey,
  translateDaliurenBoardTypeKey,
  translateDaliurenMonthGeneralKey,
  translateDaliurenSpiritKey,
  translateDaliurenTransmissionSlot,
  type DaliurenBoardTypeKey,
  type DaliurenChart,
  type DaliurenMonthGeneralKey,
  type DaliurenSpiritKey,
  type DaliurenSummary,
  type DaliurenTransmissionSlot,
  type LiuyaoSixKinKey,
} from '@ziweiai/contracts';

export type XuanshuDaliurenResult = {
  lunar: string;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  hourGanZhi: string;
  diPan: string[];
  tianPan: string[];
  shenPan: string[];
  tianGan: string[];
  siKe: string[][];
  siKeDunGan: string[][];
  siKeShenJiang: string[][];
  sanChuan: string[];
  sanChuanDunGan: string[];
  sanChuanShenJiang: string[];
  sanChuanLiuQin: string[];
  tianDiPanType: string;
  yueJiang: string;
  yueJiangShen: string;
};

const spiritValueToKey: Record<string, DaliurenSpiritKey> = {
  贵人: 'noblePerson',
  貴人: 'noblePerson',
  螣蛇: 'soaringSerpent',
  腾蛇: 'soaringSerpent',
  騰蛇: 'soaringSerpent',
  朱雀: 'vermilionBird',
  六合: 'sixHarmony',
  勾陈: 'hookSnake',
  勾陳: 'hookSnake',
  青龙: 'azureDragon',
  青龍: 'azureDragon',
  天空: 'skyVoid',
  白虎: 'whiteTiger',
  太常: 'greatConstancy',
  玄武: 'blackTortoise',
  太阴: 'greatYin',
  太陰: 'greatYin',
  天后: 'heavenQueen',
};

const monthGeneralValueToKey: Record<string, DaliurenMonthGeneralKey> = {
  神后: 'shenHou',
  大吉: 'daJi',
  功曹: 'gongCao',
  太冲: 'taiChong',
  太衝: 'taiChong',
  天罡: 'tianGang',
  太乙: 'taiYi',
  胜光: 'shengGuang',
  勝光: 'shengGuang',
  小吉: 'xiaoJi',
  传送: 'chuanSong',
  傳送: 'chuanSong',
  从魁: 'congKui',
  從魁: 'congKui',
  河魁: 'heKui',
  登明: 'dengMing',
};

const boardTypeValueToKey: Record<string, DaliurenBoardTypeKey> = {
  伏吟盘: 'fuYin',
  返吟盘: 'fanYin',
  顺三合盘: 'forwardSanHe',
  逆三合盘: 'reverseSanHe',
  进连茹盘: 'advanceLianRu',
  退连茹盘: 'retreatLianRu',
  进间传盘: 'advanceJianChuan',
  退间传盘: 'retreatJianChuan',
  病元胎盘: 'sickYuanTai',
  生元胎盘: 'birthYuanTai',
  四正临绝盘: 'fourCorrectLinJue',
  四墓覆生盘: 'fourTombFuSheng',
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

function normalizeSpirit(value: string): DaliurenSpiritKey {
  const key = spiritValueToKey[value.trim()];
  if (!key) {
    throw new Error(`Không nhận diện được thiên tướng Đại Lục Nhâm: "${value}"`);
  }
  return key;
}

function normalizeMonthGeneral(value: string): DaliurenMonthGeneralKey {
  const key = monthGeneralValueToKey[value.trim()];
  if (!key) {
    throw new Error(`Không nhận diện được nguyệt tướng Đại Lục Nhâm: "${value}"`);
  }
  return key;
}

function normalizeBoardType(value: string): DaliurenBoardTypeKey {
  const key = boardTypeValueToKey[value.trim()];
  if (!key) {
    throw new Error(`Không nhận diện được kiểu thiên địa bàn Đại Lục Nhâm: "${value}"`);
  }
  return key;
}

function normalizeSixKin(value: string): LiuyaoSixKinKey {
  const key = sixKinValueToKey[value.trim()];
  if (!key) {
    throw new Error(`Không nhận diện được lục thân Đại Lục Nhâm: "${value}"`);
  }
  return key;
}

// Độn can có thể là rỗng hoặc ký hiệu trống "○" trong nguồn — trả null thay vì throw.
function toNullableStemKey(value: string | undefined): ReturnType<typeof toBaziHeavenlyStemKey> | null {
  const normalized = value?.trim();
  if (!normalized || normalized === '○' || normalized === '〇' || normalized === '○') {
    return null;
  }
  return toBaziHeavenlyStemKey(normalized);
}

const transmissionSlots: DaliurenTransmissionSlot[] = ['initial', 'middle', 'final'];

export function buildDaliurenChartFromXuanshu(result: XuanshuDaliurenResult): {
  chart: DaliurenChart;
  summary: DaliurenSummary;
} {
  const cells: DaliurenChart['cells'] = result.diPan.map((branch, index) => ({
    positionBranchKey: toBaziEarthlyBranchKey(branch),
    heavenBranchKey: toBaziEarthlyBranchKey(result.tianPan[index] ?? ''),
    spiritKey: normalizeSpirit(result.shenPan[index] ?? ''),
    stemKey: toNullableStemKey(result.tianGan[index]),
  }));

  const fourLessons: DaliurenChart['fourLessons'] = result.siKe.map((lesson, index) => ({
    position: index + 1,
    upperBranchKey: toBaziEarthlyBranchKey(lesson[0] ?? ''),
    lowerStemKey: index === 0 ? toBaziHeavenlyStemKey(lesson[1] ?? '') : null,
    lowerBranchKey: index === 0 ? null : toBaziEarthlyBranchKey(lesson[1] ?? ''),
    dunGanKey: toNullableStemKey(result.siKeDunGan[index]?.[0]),
    spiritKey: normalizeSpirit(result.siKeShenJiang[index]?.[0] ?? ''),
  }));

  const threeTransmissions: DaliurenChart['threeTransmissions'] = result.sanChuan.map((branch, index) => ({
    slot: transmissionSlots[index] ?? 'final',
    branchKey: toBaziEarthlyBranchKey(branch),
    dunGanKey: toNullableStemKey(result.sanChuanDunGan[index]),
    spiritKey: normalizeSpirit(result.sanChuanShenJiang[index] ?? ''),
    sixKinKey: normalizeSixKin(result.sanChuanLiuQin[index] ?? ''),
  }));

  const boardTypeKey = normalizeBoardType(result.tianDiPanType);
  const monthGeneralBranchKey = toBaziEarthlyBranchKey(result.yueJiang);
  const monthGeneralKey = normalizeMonthGeneral(result.yueJiangShen);

  const chart: DaliurenChart = {
    boardTypeKey,
    monthGeneralBranchKey,
    monthGeneralKey,
    cells,
    fourLessons,
    threeTransmissions,
  };

  const firstLesson = fourLessons[0];
  const firstTransmission = threeTransmissions[0];
  const summary: DaliurenSummary = {
    boardType: translateDaliurenBoardTypeKey(boardTypeKey),
    monthGeneral: `${translateBaziKey(monthGeneralBranchKey)} ${translateDaliurenMonthGeneralKey(monthGeneralKey)}`,
    firstLesson: `${translateBaziKey(firstLesson.upperBranchKey)}/${translateBaziKey(
      firstLesson.lowerStemKey ?? firstLesson.lowerBranchKey ?? '',
    )} (${translateDaliurenSpiritKey(firstLesson.spiritKey)})`,
    initialTransmission: `${translateDaliurenTransmissionSlot(firstTransmission.slot)}: ${translateBaziKey(
      firstTransmission.branchKey,
    )} (${translateDaliurenSpiritKey(firstTransmission.spiritKey)})`,
  };

  return { chart, summary };
}

export function buildDaliurenPillarsFromGanZhi(result: XuanshuDaliurenResult) {
  return [
    { name: 'year', value: formatBaziStemBranchLabel(splitGanZhi(result.yearGanZhi)) },
    { name: 'month', value: formatBaziStemBranchLabel(splitGanZhi(result.monthGanZhi)) },
    { name: 'day', value: formatBaziStemBranchLabel(splitGanZhi(result.dayGanZhi)) },
    { name: 'hour', value: formatBaziStemBranchLabel(splitGanZhi(result.hourGanZhi)) },
  ];
}

function splitGanZhi(value: string) {
  const normalized = value.trim();
  return {
    heavenlyStemKey: toBaziHeavenlyStemKey(normalized[0] ?? ''),
    earthlyBranchKey: toBaziEarthlyBranchKey(normalized[1] ?? ''),
  };
}
