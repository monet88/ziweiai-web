import {
  formatBaziStemBranchLabel,
  formatMeihuaHexagramLabel,
  translateBaziKey,
  translateDaliurenBoardTypeKey,
  translateDaliurenMonthGeneralKey,
  translateDaliurenSpiritKey,
  translateDaliurenTransmissionSlot,
  translateLiuyaoMethodKey,
  translateLiuyaoRoleKey,
  translateLiuyaoSixKinKey,
  translateLiuyaoSixSpiritKey,
  translateMeihuaElementKey,
  translateMeihuaRelationKey,
  translateMeihuaTrigramKey,
  translateQimenDunKey,
  translateQimenGateKey,
  translateQimenStarKey,
  translateQimenYuanKey,
  type ChartDetailResponse,
} from '@ziweiai/contracts';
import { normalizeLegacyLunarDate } from './legacy-lunar-date';
import { translateZiweiKey, tryTranslateZiweiKey } from '../../i18n/ziwei-terms-vi';
import { viCopy } from '../../i18n/vi';
import { buildPalaceViews, type PalaceView, type StarTokenView } from './palace-view-builder';

type SummaryItem = { label: string; value: string };
type SnapshotSummary = ChartDetailResponse['snapshot']['summary'];

const summaryLabelMap: Record<string, string> = {
  method: 'Phương pháp',
  genderKey: 'Giới tính',
  gender: 'Giới tính',
  lunarDate: 'Âm lịch',
  solarDate: 'Dương lịch',
  signKey: 'Cung hoàng đạo',
  sign: 'Cung hoàng đạo',
  zodiacKey: 'Con giáp',
  zodiac: 'Con giáp',
  timeEarthlyBranchKey: 'Giờ sinh',
  time: 'Giờ sinh',
  soulPalaceNameKey: 'Cung Mệnh',
  bodyPalaceNameKey: 'Cung Thân',
  lifeMasterKey: 'Mệnh chủ',
  bodyMasterKey: 'Thân chủ',
  fiveElementsClassKey: 'Cục mệnh',
  mingGong: 'Mệnh cung',
  shenGong: 'Thân cung',
  dayMaster: 'Ngày chủ',
  taiYuan: 'Thai nguyên',
  taiXi: 'Thai tức',
  baseHexagram: 'Quẻ gốc',
  mainHexagram: 'Quẻ chính',
  changedHexagram: 'Quẻ biến',
  nuclearHexagram: 'Quẻ hỗ',
  movingLines: 'Hào động',
  shiLine: 'Hào Thế',
  yingLine: 'Hào Ứng',
  movingLine: 'Hào động',
  bodyTrigram: 'Thể quái',
  useTrigram: 'Dụng quái',
  relation: 'Quan hệ thể dụng',
  status: 'Trạng thái',
  reason: 'Lý do',
};

function humanizeKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

function formatStructuredLunarDate(value: unknown): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return normalizeLegacyLunarDate(value);
  }

  if (typeof value !== 'object' || !('day' in value) || !('month' in value) || !('year' in value) || !('isLeapMonth' in value)) {
    return JSON.stringify(value);
  }

  const typedValue = value as {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
    sexagenaryYearKey?: string;
  };

  const day = String(typedValue.day).padStart(2, '0');
  const month = String(typedValue.month).padStart(2, '0');
  const leapSuffix = typedValue.isLeapMonth ? ' (nhuận)' : '';
  const sexagenary = typedValue.sexagenaryYearKey ? ` ${humanizeKey(typedValue.sexagenaryYearKey)}` : '';

  return `${day}/${month}/${typedValue.year}${leapSuffix}${sexagenary}`;
}

// Các field thuộc summary Tử Vi đã định kiểu — value là key thuật ngữ bắt buộc có
// bản dịch (fail rõ nếu thiếu, debug-first). Tách riêng để summary legacy/khác hệ
// (z.record tự do) không vô tình throw khi gặp label tình cờ kết thúc bằng "Key".
const ZIWEI_SUMMARY_KEY_FIELDS = new Set([
  'genderKey',
  'zodiacKey',
  'signKey',
  'timeEarthlyBranchKey',
  'soulPalaceNameKey',
  'bodyPalaceNameKey',
  'lifeMasterKey',
  'bodyMasterKey',
  'fiveElementsClassKey',
]);

const summaryStatusValueMap: Record<string, string> = {
  blocked: 'Bị chặn',
};

const legacySummaryValueMap: Record<string, Record<string, string>> = {
  gender: {
    男: 'Nam',
    女: 'Nữ',
  },
  sign: {
    白羊座: 'Bạch Dương',
    金牛座: 'Kim Ngưu',
    双子座: 'Song Tử',
    巨蟹座: 'Cự Giải',
    狮子座: 'Sư Tử',
    处女座: 'Xử Nữ',
    天秤座: 'Thiên Bình',
    天蝎座: 'Bọ Cạp',
    射手座: 'Nhân Mã',
    摩羯座: 'Ma Kết',
    水瓶座: 'Bảo Bình',
    双鱼座: 'Song Ngư',
  },
  time: {
    子时: 'Giờ Tý',
    丑时: 'Giờ Sửu',
    寅时: 'Giờ Dần',
    卯时: 'Giờ Mão',
    辰时: 'Giờ Thìn',
    巳时: 'Giờ Tỵ',
    午时: 'Giờ Ngọ',
    未时: 'Giờ Mùi',
    申时: 'Giờ Thân',
    酉时: 'Giờ Dậu',
    戌时: 'Giờ Tuất',
    亥时: 'Giờ Hợi',
  },
  zodiac: {
    鼠: 'Chuột',
    牛: 'Trâu',
    虎: 'Hổ',
    兔: 'Mèo',
    龙: 'Rồng',
    蛇: 'Rắn',
    马: 'Ngựa',
    羊: 'Dê',
    猴: 'Khỉ',
    鸡: 'Gà',
    狗: 'Chó',
    猪: 'Heo',
  },
};

const pillarLabelMap: Record<string, string> = {
  year: 'Năm',
  month: 'Tháng',
  day: 'Ngày',
  hour: 'Giờ',
  Soul: 'Cung Mệnh',
  Body: 'Cung Thân',
  FiveElementsClass: 'Cục mệnh',
};

// Quy tắc dịch giá trị tóm tắt:
// - lunarDate: format riêng.
// - field Tử Vi đã định kiểu: tra từ điển, fail rõ nếu thiếu (debug-first).
// - status: dịch nhãn trạng thái (vd blocked → Bị chặn).
// - label legacy kết thúc "Key": tra mềm, không throw, fallback nhân hóa ASCII.
// - còn lại (solarDate, reason, chuỗi hệ khác): giữ nguyên.
function formatSummaryValue(label: string, value: unknown): string {
  if (label === 'lunarDate') {
    return formatStructuredLunarDate(value);
  }

  if (typeof value === 'string') {
    if (ZIWEI_SUMMARY_KEY_FIELDS.has(label)) {
      return translateZiweiKey(value);
    }

    if (label === 'status') {
      return summaryStatusValueMap[value] ?? value;
    }

    if (label in legacySummaryValueMap) {
      return legacySummaryValueMap[label]?.[value] ?? value;
    }

    if (label.endsWith('Key')) {
      return tryTranslateZiweiKey(value) ?? humanizeKey(value);
    }

    if (label === 'relation') {
      return value;
    }

    return value;
  }

  return JSON.stringify(value);
}

function humanizeLabel(label: string): string {
  return summaryLabelMap[label] ?? humanizeKey(label);
}

export function formatChartSystemLabel(value: string): string {
  return viCopy.chartSystem[value as keyof typeof viCopy.chartSystem] ?? value;
}

export function formatApiStateLabel(value: string): string {
  return viCopy.apiState[value as keyof typeof viCopy.apiState] ?? value;
}

export function formatConfidenceLevel(value: string): string {
  return viCopy.confidence[value as keyof typeof viCopy.confidence] ?? value;
}

export function formatVisibleMessageKey(value: string): string {
  return viCopy.normalizationMessage[value as keyof typeof viCopy.normalizationMessage] ?? value;
}

export function formatLocationLabel(value: string): string {
  if (value === 'Ho Chi Minh City') {
    return 'Thành phố Hồ Chí Minh';
  }

  return value;
}

export function formatHistoryViewedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}

export function formatChartSummaryItems(summary: SnapshotSummary): SummaryItem[] {
  return Object.entries(summary).map(([label, value]) => ({
    label: humanizeLabel(label),
    value: formatSummaryValue(label, value),
  }));
}

// Hiển thị các trụ (pillars) cho hệ KHÔNG phải Tử Vi (vd Bát Tự) — nơi pillars là
// dữ liệu chính thay cho lưới 12 cung. Giá trị giữ nguyên (chưa key-hóa cho ba-zi).
export function formatPillarItems(snapshot: ChartDetailResponse['snapshot']): SummaryItem[] {
  return snapshot.pillars.map((pillar) => ({
    label: pillarLabelMap[pillar.name] ?? humanizeKey(pillar.name),
    value:
      pillar.value ??
      `${pillar.heavenlyStemKey ? translateZiweiKey(pillar.heavenlyStemKey) : ''} ${pillar.earthlyBranchKey ? translateZiweiKey(pillar.earthlyBranchKey) : ''}`.trim(),
  }));
}

export function formatBaziPillarDescription(pillar: NonNullable<ChartDetailResponse['snapshot']['bazi']>['pillars'][number]): string {
  const stemTenGod = translateBaziKey(pillar.heavenlyStemTenGodKey);
  const hiddenStems = pillar.hiddenStems
    .map((item) => `${translateBaziKey(item.heavenlyStemKey)} (${item.tenGodKey ? translateBaziKey(item.tenGodKey) : 'chưa định danh'})`)
    .join(', ');
  const branchTenGods = pillar.earthlyBranchTenGodKeys.map((item) => translateBaziKey(item)).join(', ');

  return [
    `${translateBaziKey(pillar.heavenlyStemElementKey)} - ${stemTenGod}`,
    `${translateBaziKey(pillar.earthlyBranchElementKey)} - ${branchTenGods || 'chưa định danh'}`,
    `Tàng can: ${hiddenStems || 'không có'}`,
    `Nạp âm: ${pillar.naYin}`,
  ].join(' | ');
}

export function formatBaziPillarRows(snapshot: ChartDetailResponse['snapshot']): SummaryItem[] {
  if (!snapshot.bazi) {
    return formatPillarItems(snapshot);
  }

  return snapshot.bazi.pillars.map((pillar) => ({
    label: translateBaziKey(pillar.slot),
    value: `${formatBaziStemBranchLabel(pillar)} | ${formatBaziPillarDescription(pillar)}`,
  }));
}

export function formatBaziMetaItems(snapshot: ChartDetailResponse['snapshot']): SummaryItem[] {
  if (!snapshot.bazi) {
    return [];
  }

  return [
    { label: 'Ngày chủ', value: translateBaziKey(snapshot.bazi.dayMasterHeavenlyStemKey) },
    { label: 'Thai nguyên', value: `${formatBaziStemBranchLabel(snapshot.bazi.taiYuan)} | ${snapshot.bazi.taiYuan.naYin}` },
    { label: 'Thai tức', value: `${formatBaziStemBranchLabel(snapshot.bazi.taiXi)} | ${snapshot.bazi.taiXi.naYin}` },
    { label: 'Mệnh cung', value: `${formatBaziStemBranchLabel(snapshot.bazi.mingGong)} | ${snapshot.bazi.mingGong.naYin}` },
    { label: 'Thân cung', value: `${formatBaziStemBranchLabel(snapshot.bazi.shenGong)} | ${snapshot.bazi.shenGong.naYin}` },
  ];
}

export function formatMeihuaMetaItems(snapshot: ChartDetailResponse['snapshot']): SummaryItem[] {
  if (!snapshot.meihua) {
    return [];
  }

  return [
    { label: 'Phương pháp', value: snapshot.meihua.method === 'time-based' ? 'Theo thời gian' : snapshot.meihua.method },
    { label: 'Mã quẻ', value: String(snapshot.meihua.guaCode) },
    { label: 'Hào động', value: `Hào ${snapshot.meihua.movingLine}` },
    {
      label: 'Thể quái',
      value: `${translateMeihuaTrigramKey(snapshot.meihua.bodyTrigramKey)} | ${translateMeihuaElementKey(snapshot.meihua.bodyElementKey)}`,
    },
    {
      label: 'Dụng quái',
      value: `${translateMeihuaTrigramKey(snapshot.meihua.useTrigramKey)} | ${translateMeihuaElementKey(snapshot.meihua.useElementKey)}`,
    },
    { label: 'Quan hệ thể dụng', value: translateMeihuaRelationKey(snapshot.meihua.relationKey) },
  ];
}

export function formatMeihuaHexagramItems(snapshot: ChartDetailResponse['snapshot']): SummaryItem[] {
  if (!snapshot.meihua) {
    return [];
  }

  return [
    { label: 'Quẻ chính', value: formatMeihuaHexagramLabel(snapshot.meihua.mainHexagram) },
    { label: 'Quẻ hỗ', value: formatMeihuaHexagramLabel(snapshot.meihua.nuclearHexagram) },
    { label: 'Quẻ biến', value: formatMeihuaHexagramLabel(snapshot.meihua.changedHexagram) },
  ];
}

export function formatLiuyaoLineDescription(
  line: NonNullable<ChartDetailResponse['snapshot']['liuyao']>['baseHexagram']['lines'][number],
): string {
  const segments = [
    `Lục thân: ${translateLiuyaoSixKinKey(line.sixKinKey)}`,
    `Vai trò: ${translateLiuyaoRoleKey(line.roleKey)}`,
    `Lục thần: ${translateLiuyaoSixSpiritKey(line.sixSpiritKey)}`,
  ];

  if (line.hiddenSpirit) {
    segments.push(`Phục thần: ${line.hiddenSpirit}`);
  }

  return segments.join(' | ');
}

export function formatLiuyaoMetaItems(snapshot: ChartDetailResponse['snapshot']): SummaryItem[] {
  if (!snapshot.liuyao) {
    return [];
  }

  const shiLine = snapshot.liuyao.baseHexagram.lines.find((line) => line.roleKey === 'shi');
  const yingLine = snapshot.liuyao.baseHexagram.lines.find((line) => line.roleKey === 'ying');

  return [
    { label: 'Phương pháp', value: translateLiuyaoMethodKey(snapshot.liuyao.method) },
    { label: 'Hào động', value: snapshot.liuyao.movingLinePositions.map((position) => `Hào ${position}`).join(', ') },
    { label: 'Hào Thế', value: shiLine ? `Hào ${shiLine.position}` : 'Không đánh dấu' },
    { label: 'Hào Ứng', value: yingLine ? `Hào ${yingLine.position}` : 'Không đánh dấu' },
  ];
}

export function formatDaliurenMetaItems(snapshot: ChartDetailResponse['snapshot']): SummaryItem[] {
  if (!snapshot.daliuren) {
    return [];
  }

  return [
    { label: 'Kiểu thiên địa bàn', value: translateDaliurenBoardTypeKey(snapshot.daliuren.boardTypeKey) },
    {
      label: 'Nguyệt tướng',
      value: `${translateBaziKey(snapshot.daliuren.monthGeneralBranchKey)} ${translateDaliurenMonthGeneralKey(snapshot.daliuren.monthGeneralKey)}`,
    },
    {
      label: 'Số khóa',
      value: String(snapshot.daliuren.fourLessons.length),
    },
    {
      label: 'Số truyền',
      value: String(snapshot.daliuren.threeTransmissions.length),
    },
  ];
}

export function formatDaliurenLessonItems(snapshot: ChartDetailResponse['snapshot']): SummaryItem[] {
  if (!snapshot.daliuren) {
    return [];
  }

  return snapshot.daliuren.fourLessons.map((lesson) => {
    const upper = translateBaziKey(lesson.upperBranchKey);
    const lower = lesson.lowerStemKey
      ? translateBaziKey(lesson.lowerStemKey)
      : lesson.lowerBranchKey
        ? translateBaziKey(lesson.lowerBranchKey)
        : 'không có';
    const dunGan = lesson.dunGanKey ? `, độn ${translateBaziKey(lesson.dunGanKey)}` : '';
    return {
      label: `Khóa ${lesson.position}`,
      value: `${upper}/${lower} (${translateDaliurenSpiritKey(lesson.spiritKey)}${dunGan})`,
    };
  });
}

export function formatDaliurenTransmissionItems(snapshot: ChartDetailResponse['snapshot']): SummaryItem[] {
  if (!snapshot.daliuren) {
    return [];
  }

  return snapshot.daliuren.threeTransmissions.map((transmission) => {
    const dunGan = transmission.dunGanKey ? ` | độn ${translateBaziKey(transmission.dunGanKey)}` : '';
    return {
      label: translateDaliurenTransmissionSlot(transmission.slot),
      value: `${translateBaziKey(transmission.branchKey)} | ${translateDaliurenSpiritKey(transmission.spiritKey)} | ${translateLiuyaoSixKinKey(transmission.sixKinKey)}${dunGan}`,
    };
  });
}

// Bố cục Lạc Thư cho Kỳ Môn (cửu cung): hàng trên 4-9-2, giữa 3-5-7, dưới 8-1-6.
// Trả về palace theo thứ tự đó để renderer dựng lưới 3x3 đúng vị trí.
export const QIMEN_LUOSHU_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6] as const;

export function getQimenPalaceByIndex(
  snapshot: ChartDetailResponse['snapshot'],
  palaceIndex: number,
) {
  return snapshot.qimen?.palaces.find((palace) => palace.palaceIndex === palaceIndex) ?? null;
}

export function formatLiuyaoHexagramItems(snapshot: ChartDetailResponse['snapshot']): SummaryItem[] {
  if (!snapshot.liuyao) {
    return [];
  }

  const items: SummaryItem[] = [
    { label: 'Quẻ gốc', value: snapshot.liuyao.baseHexagram.name },
    { label: 'Quẻ biến', value: snapshot.liuyao.changedHexagram.name },
  ];

  if (snapshot.liuyao.nuclearHexagram) {
    items.push({ label: 'Quẻ hỗ', value: snapshot.liuyao.nuclearHexagram.name });
  }

  return items;
}

export function formatQimenMetaItems(snapshot: ChartDetailResponse['snapshot']): SummaryItem[] {
  if (!snapshot.qimen) {
    return [];
  }

  return [
    { label: 'Cục độn', value: translateQimenDunKey(snapshot.qimen.dunKey) },
    { label: 'Tam nguyên', value: translateQimenYuanKey(snapshot.qimen.yuanKey) },
    { label: 'Số cục', value: `${translateQimenDunKey(snapshot.qimen.dunKey)} ${snapshot.qimen.juShu} cục` },
    { label: 'Trực phù', value: translateQimenStarKey(snapshot.qimen.dutyChiefStarKey) },
    { label: 'Trực sử', value: translateQimenGateKey(snapshot.qimen.dutyGateKey) },
  ];
}

// Tóm tắt bản mệnh cho ô trung cung (Bản mệnh/Cục/Mệnh chủ/Thân chủ + ngày sinh).
export function formatCenterSummaryItems(summary: SnapshotSummary): SummaryItem[] {
  const centerLabels = [
    'soulPalaceNameKey',
    'bodyPalaceNameKey',
    'fiveElementsClassKey',
    'lifeMasterKey',
    'bodyMasterKey',
    'zodiacKey',
    'signKey',
    'solarDate',
    'lunarDate',
  ] as const;

  return centerLabels
    .filter((label) => label in summary && (summary as Record<string, unknown>)[label] != null)
    .map((label) => ({
      label: humanizeLabel(label),
      value: formatSummaryValue(label, (summary as Record<string, unknown>)[label]),
    }));
}

export { buildPalaceViews, type PalaceView, type StarTokenView };
