import {
  type BaziEarthlyBranchKey,
  type BaziFiveElementKey,
  type BirthInput,
  type PairingCompatibility,
  type PairingRelationType,
} from '@ziweiai/contracts';
import { Lunar, Solar } from 'lunar-javascript';
import { baziBranchElementByKey, baziStemElementByKey, toBaziStemBranchKeyPair } from './adapters/bazi-maps';

// Port thuật toán tương hợp Hợp Hôn từ .ref/taibu/src/lib/divination/hepan.ts (analyzeCompatibility),
// chạy server-side (boundary 0007) và DỊCH toàn bộ nhãn/mô tả sang tiếng Việt — KHÔNG mang chữ Hán
// vào source. Tính bằng bazi (ngũ hành + địa chi) qua lunar-javascript, deterministic theo input.

type Pillar = { stemKey: ReturnType<typeof toBaziStemBranchKeyPair>['heavenlyStemKey']; branchKey: BaziEarthlyBranchKey };
type FourPillars = { year: Pillar; month: Pillar; day: Pillar; hour: Pillar };

// Ngũ hành tương sinh (sinh ra): mộc→hỏa→thổ→kim→thủy→mộc.
const ELEMENT_SHENG: Record<BaziFiveElementKey, BaziFiveElementKey> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

// Ngũ hành tương khắc: mộc khắc thổ, thổ khắc thủy, thủy khắc hỏa, hỏa khắc kim, kim khắc mộc.
const ELEMENT_KE: Record<BaziFiveElementKey, BaziFiveElementKey> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

// Địa chi lục hợp (đối xứng).
const BRANCH_LIUHE: Partial<Record<BaziEarthlyBranchKey, BaziEarthlyBranchKey>> = {
  ziEarthly: 'chouEarthly',
  chouEarthly: 'ziEarthly',
  yinEarthly: 'haiEarthly',
  haiEarthly: 'yinEarthly',
  maoEarthly: 'xuEarthly',
  xuEarthly: 'maoEarthly',
  chenEarthly: 'youEarthly',
  youEarthly: 'chenEarthly',
  siEarthly: 'shenEarthly',
  shenEarthly: 'siEarthly',
  wuEarthly: 'weiEarthly',
  weiEarthly: 'wuEarthly',
};

// Địa chi tương xung (đối xứng).
const BRANCH_CHONG: Partial<Record<BaziEarthlyBranchKey, BaziEarthlyBranchKey>> = {
  ziEarthly: 'wuEarthly',
  wuEarthly: 'ziEarthly',
  chouEarthly: 'weiEarthly',
  weiEarthly: 'chouEarthly',
  yinEarthly: 'shenEarthly',
  shenEarthly: 'yinEarthly',
  maoEarthly: 'youEarthly',
  youEarthly: 'maoEarthly',
  chenEarthly: 'xuEarthly',
  xuEarthly: 'chenEarthly',
  siEarthly: 'haiEarthly',
  haiEarthly: 'siEarthly',
};

const ELEMENT_LABEL_VI: Record<BaziFiveElementKey, string> = {
  wood: 'Mộc',
  fire: 'Hỏa',
  earth: 'Thổ',
  metal: 'Kim',
  water: 'Thủy',
};

const RELATION_TYPE_LABEL_VI: Record<PairingRelationType, string> = {
  love: 'Hợp đôi tình cảm',
  business: 'Hợp tác kinh doanh',
  family: 'Quan hệ gia đình',
};

// Thứ tự duyệt ngũ hành để chọn hành chủ đạo — giữ tie-break giống nguồn (kim/mộc/thủy/hỏa/thổ:
// hành đầu tiên có số đếm lớn nhất thắng).
const ELEMENT_SCAN_ORDER: readonly BaziFiveElementKey[] = ['metal', 'wood', 'water', 'fire', 'earth'];

type WuxingRelation = 'sheng' | 'ke' | 'bei_ke' | 'bei_sheng' | 'neutral';

function wuxingRelation(a: BaziFiveElementKey, b: BaziFiveElementKey): WuxingRelation {
  if (ELEMENT_SHENG[a] === b) return 'sheng'; // a sinh b
  if (ELEMENT_SHENG[b] === a) return 'bei_sheng'; // a được b sinh
  if (ELEMENT_KE[a] === b) return 'ke'; // a khắc b
  if (ELEMENT_KE[b] === a) return 'bei_ke'; // a bị b khắc
  return 'neutral';
}

function toLunar(input: BirthInput) {
  const hour = input.time.hour ?? 0;
  const minute = input.time.minute ?? 0;
  if (input.calendar === 'lunar') {
    // lunar-javascript quy ước tháng nhuận bằng số tháng ÂM (vd tháng 6 nhuận = -6). Bỏ cờ
    // isLeapMonth sẽ tính nhầm sang tháng thường → sai can-chi nguyệt trụ (vd 丙午 vs 丁未).
    const lunarMonth = input.date.isLeapMonth ? -input.date.month : input.date.month;
    return Lunar.fromYmdHms(input.date.year, lunarMonth, input.date.day, hour, minute, 0);
  }
  return Solar.fromYmdHms(input.date.year, input.date.month, input.date.day, hour, minute, 0).getLunar();
}

function toPillar(stemBranchValue: string): Pillar {
  const { heavenlyStemKey, earthlyBranchKey } = toBaziStemBranchKeyPair(stemBranchValue);
  return { stemKey: heavenlyStemKey, branchKey: earthlyBranchKey };
}

function computeFourPillars(input: BirthInput): FourPillars {
  const eightChar = toLunar(input).getEightChar();
  return {
    year: toPillar(`${eightChar.getYearGan()}${eightChar.getYearZhi()}`),
    month: toPillar(`${eightChar.getMonthGan()}${eightChar.getMonthZhi()}`),
    day: toPillar(`${eightChar.getDayGan()}${eightChar.getDayZhi()}`),
    hour: toPillar(`${eightChar.getTimeGan()}${eightChar.getTimeZhi()}`),
  };
}

function dominantElement(pillars: FourPillars): BaziFiveElementKey {
  const counts: Record<BaziFiveElementKey, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const pillar of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    counts[baziStemElementByKey[pillar.stemKey]] += 1;
    counts[baziBranchElementByKey[pillar.branchKey]] += 1;
  }
  let dominant: BaziFiveElementKey = 'earth';
  let max = 0;
  for (const element of ELEMENT_SCAN_ORDER) {
    if (counts[element] > max) {
      max = counts[element];
      dominant = element;
    }
  }
  return dominant;
}

function clamp(score: number): number {
  return Math.max(30, Math.min(95, score));
}

interface Dimension {
  name: string;
  score: number;
  description: string;
}

function buildElementDimension(a: BaziFiveElementKey, b: BaziFiveElementKey): Dimension {
  const relation = wuxingRelation(a, b);
  const labelA = ELEMENT_LABEL_VI[a];
  const labelB = ELEMENT_LABEL_VI[b];
  switch (relation) {
    case 'sheng':
      return { name: 'Ngũ hành phối hợp', score: 85, description: `${labelA} sinh ${labelB} — quan hệ kiểu cho đi, hỗ trợ chủ động.` };
    case 'bei_sheng':
      return { name: 'Ngũ hành phối hợp', score: 80, description: `${labelA} được ${labelB} nuôi dưỡng — quan hệ kiểu tiếp nhận.` };
    case 'ke':
      return { name: 'Ngũ hành phối hợp', score: 50, description: `${labelA} khắc ${labelB} — cần lưu ý cách ứng xử, tránh áp chế.` };
    case 'bei_ke':
      return { name: 'Ngũ hành phối hợp', score: 45, description: `${labelA} bị ${labelB} khắc — một bên dễ cảm thấy áp lực, cần không gian riêng.` };
    default:
      return { name: 'Ngũ hành phối hợp', score: 70, description: 'Ngũ hành hài hòa, quan hệ cân bằng.' };
  }
}

function buildBranchDimension(
  name: string,
  branch1: BaziEarthlyBranchKey,
  branch2: BaziEarthlyBranchKey,
  liuheScore: number,
  liuheText: string,
  chongScore: number,
  chongText: string,
  neutralText: string,
): Dimension {
  if (BRANCH_LIUHE[branch1] === branch2) {
    return { name, score: liuheScore, description: liuheText };
  }
  if (BRANCH_CHONG[branch1] === branch2) {
    return { name, score: chongScore, description: chongText };
  }
  return { name, score: 65, description: neutralText };
}

// Chiều theo loại quan hệ: love→nguyệt trụ, business→thời trụ, family→nguyệt trụ (giống nguồn).
function buildTypeDimension(pillars1: FourPillars, pillars2: FourPillars, type: PairingRelationType): Dimension {
  if (type === 'business') {
    return buildPairPillarDimension('Bổ trợ sự nghiệp', pillars1.hour, pillars2.hour, {
      liuhe: 'Thời chi lục hợp, mục tiêu sự nghiệp đồng điệu.',
      chong: 'Thời chi tương xung, quan điểm sự nghiệp có phần khác biệt.',
      sheng: 'Thiên can thời trụ tương sinh, năng lực bổ trợ, phối hợp trôi chảy.',
      ke: 'Thiên can thời trụ tương khắc, cần phân vai rõ ràng.',
      neutral: 'Phối hợp sự nghiệp ổn định, cần thời gian ăn ý hơn.',
    });
  }
  if (type === 'family') {
    return buildPairPillarDimension('Giao tiếp gia đình', pillars1.month, pillars2.month, {
      liuhe: 'Nguyệt chi lục hợp, giao tiếp thuận, thấu hiểu sâu.',
      chong: 'Nguyệt chi tương xung, cách giao tiếp cần điều chỉnh.',
      sheng: 'Thiên can nguyệt trụ tương sinh, quan hệ gắn bó hòa thuận.',
      ke: 'Thiên can nguyệt trụ tương khắc, cần tăng trao đổi.',
      neutral: 'Quan hệ ổn định, nên tương tác nhiều để thêm thấu hiểu.',
    });
  }
  return buildPairPillarDimension('Duyên tình cảm', pillars1.month, pillars2.month, {
    liuhe: 'Nguyệt chi lục hợp, đồng điệu cảm xúc sâu sắc.',
    chong: 'Nguyệt chi tương xung, cách thể hiện cảm xúc có khác biệt.',
    sheng: 'Thiên can nguyệt trụ tương sinh, nền tảng tình cảm bền chặt.',
    ke: 'Thiên can nguyệt trụ tương khắc, tình cảm cần vun đắp.',
    neutral: 'Tình cảm ổn định, cần dụng tâm vun đắp.',
  });
}

function buildPairPillarDimension(
  name: string,
  pillar1: Pillar,
  pillar2: Pillar,
  texts: { liuhe: string; chong: string; sheng: string; ke: string; neutral: string },
): Dimension {
  let score = 60;
  let description = '';

  if (BRANCH_LIUHE[pillar1.branchKey] === pillar2.branchKey) {
    score += 25;
    description = texts.liuhe;
  } else if (BRANCH_CHONG[pillar1.branchKey] === pillar2.branchKey) {
    score -= 15;
    description = texts.chong;
  }

  const stemRelation = wuxingRelation(baziStemElementByKey[pillar1.stemKey], baziStemElementByKey[pillar2.stemKey]);
  if (stemRelation === 'sheng' || stemRelation === 'bei_sheng') {
    score += 10;
    if (!description) description = texts.sheng;
  } else if (stemRelation === 'ke' || stemRelation === 'bei_ke') {
    score -= 5;
    if (!description) description = texts.ke;
  } else if (!description) {
    description = texts.neutral;
  }

  return { name, score: clamp(score), description };
}

function compatibilityLevel(score: number): string {
  if (score >= 80) return 'Rất hợp';
  if (score >= 65) return 'Tốt';
  if (score >= 50) return 'Bình thường';
  return 'Cần lưu ý';
}

/**
 * Phân tích tương hợp Hợp Hôn từ 2 birth-input + loại quan hệ. Deterministic, không gọi LLM.
 * Trả về shape khớp `pairingCompatibilitySchema` (@ziweiai/contracts): overallScore + level +
 * dimensions + narrative, toàn tiếng Việt (0 chữ Hán).
 */
export function analyzeHepanCompatibility(
  primary: BirthInput,
  partner: BirthInput,
  relationType: PairingRelationType,
): PairingCompatibility {
  const pillars1 = computeFourPillars(primary);
  const pillars2 = computeFourPillars(partner);

  const dimensions: Dimension[] = [
    buildElementDimension(dominantElement(pillars1), dominantElement(pillars2)),
    buildBranchDimension(
      'Duyên nhật trụ',
      pillars1.day.branchKey,
      pillars2.day.branchKey,
      90,
      'Nhật chi lục hợp, duyên hợp trời định.',
      40,
      'Nhật chi tương xung, dễ phát sinh va chạm trong sinh hoạt.',
      'Nhật chi bình hòa.',
    ),
    buildBranchDimension(
      'Tương hợp gia đình',
      pillars1.year.branchKey,
      pillars2.year.branchKey,
      85,
      'Niên chi lục hợp, bối cảnh gia đình hợp nhau.',
      50,
      'Niên chi tương xung, quan niệm gia đình có khác biệt.',
      'Niên trụ bình hòa.',
    ),
    buildTypeDimension(pillars1, pillars2, relationType),
  ];

  const overallScore = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length);
  const level = compatibilityLevel(overallScore);
  const typeLabel = RELATION_TYPE_LABEL_VI[relationType];
  const narrative = `Tổng quan ${typeLabel}: mức tương hợp ${overallScore}/100 (${level}). Các chiều nổi bật: ${dimensions
    .map((d) => `${d.name} ${d.score}%`)
    .join('; ')}. Hãy xem đây là gợi ý tham khảo: phát huy các chiều điểm cao, lưu tâm những chiều thấp để chủ động dung hòa.`;

  return { overallScore, level, dimensions, narrative };
}
