import { SolarDay } from 'tyme4ts';
import type { AlmanacDayCandidate, AlmanacTopic } from '@ziweiai/contracts';
import { ALMANAC_VOCAB } from './data/almanac-vocab-data';

// US-040 (backlog #48): engine Hoàng lịch. tyme4ts lo toàn bộ phần tính lịch (nghi/kỵ/thần sát/12
// trực/28 sao/cửu tinh/Bành Tổ/can chi). Engine này KHÔNG sửa toán của thư viện: nó chạy thư viện,
// chấm điểm theo chủ đề trên CHUỖI HÁN THÔ (khớp đúng logic nguồn .ref/mingyu đã kiểm chứng), rồi
// ánh xạ mọi chuỗi hiển thị qua bảng tra ALMANAC_VOCAB (overlay đã dịch sẵn qua pipeline B6-0).
// Han-gate: bất kỳ chuỗi Hán nào thiếu trong bảng tra -> ném lỗi ngay (fail-fast), không để chữ Hán
// lọt ra ngoài module. v1 KHÔNG phân tích xung khắc bát tự người tham gia (để v2).

// Từ khóa chủ đề giữ NGUYÊN VĂN HÁN: chỉ dùng nội bộ để chấm điểm khớp với output Hán thô của
// tyme4ts, không bao giờ rời module. Port từ .ref/mingyu/.../almanac.ts.
const TOPIC_RECOMMEND_KEYWORDS: Record<AlmanacTopic, string[]> = {
  move: ['入宅', '移徙', '安床', '修造', '动土'],
  marriage: ['嫁娶', '纳采', '订盟', '会亲友'],
  opening: ['开市', '交易', '立券', '纳财'],
  contract: ['交易', '立券', '纳财', '会亲友'],
  travel: ['出行', '赴任', '移徙'],
  medical: ['求医', '治病', '解除'],
  study: ['入学', '求嗣', '祭祀', '祈福'],
  custom: [],
};

const TOPIC_AVOID_KEYWORDS: Record<AlmanacTopic, string[]> = {
  move: ['入宅', '移徙', '安床', '动土'],
  marriage: ['嫁娶', '纳采', '订盟'],
  opening: ['开市', '交易', '立券'],
  contract: ['交易', '立券'],
  travel: ['出行', '赴任'],
  medical: ['求医', '治病'],
  study: ['入学', '求嗣'],
  custom: [],
};

const WEEKDAYS_VI = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy',
];

const MAX_RANGE_DAYS = 31;

export class AlmanacEngineError extends Error {}

// Han-gate: tra một chuỗi Hán qua bảng overlay. Thiếu -> ném (chặn chữ Hán lọt ra ngoài).
function toVi(han: string): string {
  const vi = ALMANAC_VOCAB[han];
  if (vi === undefined) {
    throw new AlmanacEngineError(`Bảng tra Hoàng lịch thiếu bản dịch cho "${han}" (chạy lại job almanac-vocab).`);
  }
  return vi;
}

function parseDateText(value: string, fieldName: string): { year: number; month: number; day: number; date: Date } {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new AlmanacEngineError(`${fieldName} cần định dạng YYYY-MM-DD.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || year > 2100) {
    throw new AlmanacEngineError(`${fieldName} cần nằm trong khoảng năm 1900-2100.`);
  }
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new AlmanacEngineError(`${fieldName} không phải ngày hợp lệ.`);
  }
  return { year, month, day, date };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hasAnyKeyword(values: readonly string[], keywords: readonly string[]): boolean {
  if (keywords.length === 0) {
    return false;
  }
  return values.some((value) => keywords.some((keyword) => value.includes(keyword)));
}

type DayScore = {
  score: number;
  highlights: string[];
  cautions: string[];
};

// Chấm điểm trên CHUỖI HÁN THÔ (recommends/avoids/gods chưa dịch) để khớp đúng logic nguồn. Highlights
// /cautions do code sinh nên viết thẳng tiếng Việt với nhãn chủ đề (đã là tiếng Việt từ contract).
function scoreDay(params: {
  topic: AlmanacTopic;
  topicLabel: string;
  recommendsHan: readonly string[];
  avoidsHan: readonly string[];
  godsHan: readonly string[];
}): DayScore {
  const highlights: string[] = [];
  const cautions: string[] = [];
  let score = 60;

  if (hasAnyKeyword(params.recommendsHan, TOPIC_RECOMMEND_KEYWORDS[params.topic])) {
    score += 18;
    highlights.push(`Việc nên trong ngày khớp với ${params.topicLabel}`);
  }
  if (hasAnyKeyword(params.avoidsHan, TOPIC_AVOID_KEYWORDS[params.topic])) {
    score -= 24;
    cautions.push(`Việc kỵ trong ngày chạm tới ${params.topicLabel}`);
  }
  if (params.godsHan.length >= 4) {
    score += 6;
    highlights.push('Nhiều cát thần trong ngày, có thể tính là điểm cộng tham khảo');
  }

  return { score: Math.max(0, Math.min(100, score)), highlights, cautions };
}

function buildDayCandidate(date: Date, topic: AlmanacTopic, topicLabel: string): AlmanacDayCandidate {
  const lunarDay = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunarDay();
  const dayCycle = lunarDay.getSixtyCycle();
  const branch = dayCycle.getEarthBranch();

  // Hán thô để chấm điểm (giữ logic nguồn).
  const recommendsHan = lunarDay.getRecommends().map((item) => item.getName());
  const avoidsHan = lunarDay.getAvoids().map((item) => item.getName());
  const godsHan = lunarDay.getGods().map((item) => item.getName());

  const scoring = scoreDay({ topic, topicLabel, recommendsHan, avoidsHan, godsHan });

  // Mọi chuỗi hiển thị đi qua Han-gate (toVi).
  const oppositeZodiacVi = toVi(branch.getOpposite().getZodiac().getName());
  const ominousVi = toVi(branch.getOminous().getName());

  // tyme4ts toString() của LunarDay/LunarMonth chứa chữ Hán ("农历...") KHÔNG nằm trong bảng tra
  // (bảng chỉ gom thuật ngữ nghi/kỵ/thần sát/can chi...). Dựng lunarDate thẳng từ thành phần SỐ +
  // can chi năm đã dịch để không có chữ Hán lọt ra (Han-scan ở web).
  const lunarMonth = lunarDay.getLunarMonth();
  const lunarDayNumber = lunarDay.getDay();
  const lunarMonthNumber = lunarMonth.getMonth();
  const lunarYearGanzhiVi = toVi(lunarDay.getYearSixtyCycle().getName());
  const leapSuffix = lunarMonth.isLeap() ? ' (nhuận)' : '';
  const lunarDateVi = `Ngày ${lunarDayNumber} tháng ${lunarMonthNumber}${leapSuffix} âm lịch, năm ${lunarYearGanzhiVi}`;

  return {
    date: formatDate(date),
    weekday: WEEKDAYS_VI[date.getDay()],
    lunarDate: lunarDateVi,
    ganzhi: {
      year: toVi(lunarDay.getYearSixtyCycle().getName()),
      month: toVi(lunarDay.getMonthSixtyCycle().getName()),
      day: toVi(dayCycle.getName()),
    },
    zodiac: toVi(branch.getZodiac().getName()),
    dayOfficer: toVi(lunarDay.getDuty().getName()),
    twelveStar: toVi(lunarDay.getTwelveStar().getName()),
    twentyEightStar: toVi(lunarDay.getTwentyEightStar().getName()),
    nineStar: toVi(lunarDay.getNineStar().toString()),
    gods: godsHan.map(toVi),
    recommends: recommendsHan.map(toVi),
    avoids: avoidsHan.map(toVi),
    pengZu: toVi(dayCycle.getPengZu().getName()),
    clash: `Xung tuổi ${oppositeZodiacVi}, sát hướng ${ominousVi}`,
    score: scoring.score,
    highlights: scoring.highlights,
    cautions: scoring.cautions,
  };
}

export type AlmanacSelectionResult = {
  days: AlmanacDayCandidate[];
};

// Sinh danh sách ngày ứng viên trong khoảng [startDate, endDate], chấm điểm theo chủ đề, sort giảm
// dần theo điểm. Bài luận do service gọi LLM sinh riêng (engine chỉ lo phần tất định).
export function generateAlmanacSelection(params: {
  topic: AlmanacTopic;
  topicLabel: string;
  startDate: string;
  endDate: string;
}): AlmanacSelectionResult {
  const start = parseDateText(params.startDate, 'Ngày bắt đầu');
  const end = parseDateText(params.endDate, 'Ngày kết thúc');
  const diffDays = Math.round((end.date.getTime() - start.date.getTime()) / 86_400_000);

  if (diffDays < 0) {
    throw new AlmanacEngineError('Ngày kết thúc không được trước ngày bắt đầu.');
  }
  if (diffDays > MAX_RANGE_DAYS - 1) {
    throw new AlmanacEngineError(`Chọn ngày Hoàng lịch mỗi lần so tối đa ${MAX_RANGE_DAYS} ngày, hãy thu hẹp khoảng ngày.`);
  }

  const days = Array.from({ length: diffDays + 1 }, (_, index) => {
    const current = new Date(start.date);
    current.setDate(start.date.getDate() + index);
    return buildDayCandidate(current, params.topic, params.topicLabel);
  }).sort((a, b) => b.score - a.score);

  return { days };
}
