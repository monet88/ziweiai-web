import type {
  BaziEarthlyBranchKey,
  BaziFiveElementKey,
  BaziHeavenlyStemKey,
  BaziTenGodKey,
  ChartSnapshot,
} from '@ziweiai/contracts';
import {
  baziBranchElementByKey,
  baziStemElementByKey,
  translateBaziKey,
  formatBaziStemBranchLabel,
} from '@ziweiai/contracts';

// ==========================================
// 1. CÁC HẰNG SỐ & BẢNG TRA BÁT TỰ NÂNG CAO
// ==========================================

export const HEAVENLY_STEMS_ORDER: readonly BaziHeavenlyStemKey[] = [
  'jiaHeavenly',
  'yiHeavenly',
  'bingHeavenly',
  'dingHeavenly',
  'wuHeavenly',
  'jiHeavenly',
  'gengHeavenly',
  'xinHeavenly',
  'renHeavenly',
  'guiHeavenly',
];

export const EARTHLY_BRANCHES_ORDER: readonly BaziEarthlyBranchKey[] = [
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
];

// Dương can / Âm can
export const STEM_YIN_YANG: Record<BaziHeavenlyStemKey, 'yang' | 'yin'> = {
  jiaHeavenly: 'yang',
  yiHeavenly: 'yin',
  bingHeavenly: 'yang',
  dingHeavenly: 'yin',
  wuHeavenly: 'yang',
  jiHeavenly: 'yin',
  gengHeavenly: 'yang',
  xinHeavenly: 'yin',
  renHeavenly: 'yang',
  guiHeavenly: 'yin',
};

// Vòng 12 Trường Sinh của 10 Thiên Can trên 12 Địa Chi
export const TWELVE_LIFE_STAGES = [
  'Trường Sinh',
  'Mộc Dục',
  'Quan Đới',
  'Lâm Quan',
  'Đế Vượng',
  'Suy',
  'Bệnh',
  'Tử',
  'Mộ',
  'Tuyệt',
  'Thai',
  'Dưỡng',
] as const;

export type LifeStage = (typeof TWELVE_LIFE_STAGES)[number];

// Điểm bắt đầu Trường Sinh (Địa Chi) cho từng Thiên Can
const CHANG_SHENG_START: Record<BaziHeavenlyStemKey, { startBranch: BaziEarthlyBranchKey; isForward: boolean }> = {
  jiaHeavenly: { startBranch: 'haiEarthly', isForward: true },
  yiHeavenly: { startBranch: 'wuEarthly', isForward: false },
  bingHeavenly: { startBranch: 'yinEarthly', isForward: true },
  dingHeavenly: { startBranch: 'youEarthly', isForward: false },
  wuHeavenly: { startBranch: 'yinEarthly', isForward: true },
  jiHeavenly: { startBranch: 'youEarthly', isForward: false },
  gengHeavenly: { startBranch: 'siEarthly', isForward: true },
  xinHeavenly: { startBranch: 'ziEarthly', isForward: false },
  renHeavenly: { startBranch: 'shenEarthly', isForward: true },
  guiHeavenly: { startBranch: 'maoEarthly', isForward: false },
};

export function getLifeStage(stem: BaziHeavenlyStemKey, branch: BaziEarthlyBranchKey): LifeStage {
  const rule = CHANG_SHENG_START[stem];
  const startIdx = EARTHLY_BRANCHES_ORDER.indexOf(rule.startBranch);
  const targetIdx = EARTHLY_BRANCHES_ORDER.indexOf(branch);

  let step = 0;
  if (rule.isForward) {
    step = (targetIdx - startIdx + 12) % 12;
  } else {
    step = (startIdx - targetIdx + 12) % 12;
  }

  return TWELVE_LIFE_STAGES[step] ?? 'Dưỡng';
}

// Bảng Thập Thần quan hệ giữa Nhật Chủ (Target Stem) và Can khác
export function calculateTenGod(dayMaster: BaziHeavenlyStemKey, otherStem: BaziHeavenlyStemKey): BaziTenGodKey {
  const dmElem = baziStemElementByKey[dayMaster];
  const otherElem = baziStemElementByKey[otherStem];
  const dmPolarity = STEM_YIN_YANG[dayMaster];
  const otherPolarity = STEM_YIN_YANG[otherStem];
  const samePolarity = dmPolarity === otherPolarity;

  if (dayMaster === otherStem) return 'biJian';

  // Cùng hành (Tỷ Kiên / Kiếp Tài)
  if (dmElem === otherElem) {
    return samePolarity ? 'biJian' : 'jieCai';
  }

  // Nhật Chủ sinh ra (Thực Thần / Thương Quan)
  if (
    (dmElem === 'wood' && otherElem === 'fire') ||
    (dmElem === 'fire' && otherElem === 'earth') ||
    (dmElem === 'earth' && otherElem === 'metal') ||
    (dmElem === 'metal' && otherElem === 'water') ||
    (dmElem === 'water' && otherElem === 'wood')
  ) {
    return samePolarity ? 'shiShen' : 'shangGuan';
  }

  // Khắc Nhật Chủ (Chính Quan / Thất Sát)
  if (
    (otherElem === 'wood' && dmElem === 'earth') ||
    (otherElem === 'fire' && dmElem === 'metal') ||
    (otherElem === 'earth' && dmElem === 'water') ||
    (otherElem === 'metal' && dmElem === 'wood') ||
    (otherElem === 'water' && dmElem === 'fire')
  ) {
    return samePolarity ? 'qiSha' : 'zhengGuan';
  }

  // Nhật Chủ khắc (Chính Tài / Thiên Tài)
  if (
    (dmElem === 'wood' && otherElem === 'earth') ||
    (dmElem === 'fire' && otherElem === 'metal') ||
    (dmElem === 'earth' && otherElem === 'water') ||
    (dmElem === 'metal' && otherElem === 'wood') ||
    (dmElem === 'water' && otherElem === 'fire')
  ) {
    return samePolarity ? 'pianCai' : 'zhengCai';
  }

  // Sinh Nhật Chủ (Chính Ấn / Thiên Ấn)
  return samePolarity ? 'pianYin' : 'zhengYin';
}

// ==========================================
// 2. PHÂN TÍCH NGŨ HÀNH & ĐỘ VƯỢNG SUY
// ==========================================

export interface FiveElementsScore {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
  total: number;
  percentages: Record<BaziFiveElementKey, number>;
}

export interface DayMasterEvaluation {
  dayMasterStem: BaziHeavenlyStemKey;
  dayMasterElement: BaziFiveElementKey;
  dayMasterYinYang: 'yang' | 'yin';
  status: 'Vượng Cực' | 'Thân Vượng' | 'Trung Hòa' | 'Thân Nhược' | 'Nhược Cực';
  isFavorableLeading: boolean;
  supportScore: number;
  drainScore: number;
  deLing: boolean; // Đắc lệnh tháng sinh
  deDi: boolean; // Đắc địa (chi có căn)
  deShi: boolean; // Đắc thế (nhiều trợ giúp)
}

export function calculateFiveElementsBalance(snapshot: ChartSnapshot): FiveElementsScore {
  const scores: Record<BaziFiveElementKey, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };

  if (!snapshot.bazi) {
    return {
      wood: 20,
      fire: 20,
      earth: 20,
      metal: 20,
      water: 20,
      total: 100,
      percentages: { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 },
    };
  }

  const { pillars } = snapshot.bazi;
  const monthBranch = pillars[1]?.earthlyBranchKey;

  // 1. Can Lộ 4 trụ (mỗi Can lộ = 10 điểm)
  pillars.forEach((p) => {
    scores[p.heavenlyStemElementKey] += 10;
  });

  // 2. Chi và Tàng Can 4 trụ
  // Chi Tháng là Nguyệt Lệnh (trọng số cao nhất x1.5)
  pillars.forEach((p, idx) => {
    const isMonthPillar = idx === 1;
    const branchFactor = isMonthPillar ? 1.5 : 1.0;

    // Địa chi bản khí chính
    scores[p.earthlyBranchElementKey] += 12 * branchFactor;

    // Tàng can
    p.hiddenStems.forEach((hs, hIdx) => {
      // Chính khí (0), Trung khí (1), Dư khí (2)
      const weight = hIdx === 0 ? 8 : hIdx === 1 ? 5 : 3;
      scores[hs.elementKey] += weight * branchFactor;
    });
  });

  // Cộng hưởng mùa sinh (Nguyệt Lệnh)
  if (monthBranch) {
    if (['yinEarthly', 'maoEarthly', 'chenEarthly'].includes(monthBranch)) {
      scores.wood += 15;
    } else if (['siEarthly', 'wuEarthly', 'weiEarthly'].includes(monthBranch)) {
      scores.fire += 15;
    } else if (['shenEarthly', 'youEarthly', 'xuEarthly'].includes(monthBranch)) {
      scores.metal += 15;
    } else if (['haiEarthly', 'ziEarthly', 'chouEarthly'].includes(monthBranch)) {
      scores.water += 15;
    }
  }

  const total = Math.max(1, Object.values(scores).reduce((acc, v) => acc + v, 0));
  const percentages: Record<BaziFiveElementKey, number> = {
    wood: Math.round((scores.wood / total) * 100),
    fire: Math.round((scores.fire / total) * 100),
    earth: Math.round((scores.earth / total) * 100),
    metal: Math.round((scores.metal / total) * 100),
    water: Math.round((scores.water / total) * 100),
  };

  return {
    ...scores,
    total,
    percentages,
  };
}

export function evaluateDayMaster(
  snapshot: ChartSnapshot,
  elementScore: FiveElementsScore
): DayMasterEvaluation {
  const bazi = snapshot.bazi;
  const dmStem = bazi?.dayMasterHeavenlyStemKey ?? 'bingHeavenly';
  const dmElem = baziStemElementByKey[dmStem];
  const dmPolarity = STEM_YIN_YANG[dmStem];

  // Các hành sinh và trợ cho Nhật Chủ (Phe Trợ Mệnh: Tỷ Kiếp + Ấn Tinh)
  const generatingElem: Record<BaziFiveElementKey, BaziFiveElementKey> = {
    wood: 'water',
    fire: 'wood',
    earth: 'fire',
    metal: 'earth',
    water: 'metal',
  };
  const supportElem = generatingElem[dmElem];

  // Phe Trợ Mệnh vs Phe Hao Tiết
  const supportScore = elementScore[dmElem] + elementScore[supportElem];
  const drainScore = elementScore.total - supportScore;

  // Kiểm tra Đắc Lệnh (Sinh vào tháng hỗ trợ hoặc đồng hành)
  const monthBranch = bazi?.pillars[1]?.earthlyBranchKey;
  let deLing = false;
  if (monthBranch) {
    const monthElem = baziBranchElementByKey[monthBranch];
    if (monthElem === dmElem || monthElem === supportElem) {
      deLing = true;
    }
  }

  // Kiểm tra Đắc Địa (Địa chi có căn tàng chứa hành của Nhật Chủ)
  let deDi = false;
  bazi?.pillars.forEach((p) => {
    if (p.hiddenStems.some((hs) => hs.elementKey === dmElem)) {
      deDi = true;
    }
  });

  // Kiểm tra Đắc Thế (Tỷ lệ hỗ trợ > 45%)
  const supportRatio = supportScore / elementScore.total;
  const deShi = supportRatio >= 0.45;

  let status: DayMasterEvaluation['status'] = 'Trung Hòa';
  if (supportRatio >= 0.65) {
    status = 'Vượng Cực';
  } else if (supportRatio >= 0.52 || (deLing && supportRatio >= 0.45)) {
    status = 'Thân Vượng';
  } else if (supportRatio <= 0.25) {
    status = 'Nhược Cực';
  } else if (supportRatio <= 0.42) {
    status = 'Thân Nhược';
  } else {
    status = 'Trung Hòa';
  }

  return {
    dayMasterStem: dmStem,
    dayMasterElement: dmElem,
    dayMasterYinYang: dmPolarity,
    status,
    isFavorableLeading: supportRatio >= 0.48,
    supportScore,
    drainScore,
    deLing,
    deDi,
    deShi,
  };
}

// ==========================================
// 3. ĐỊNH DỤNG THẦN, HỶ THẦN, KỴ THẦN
// ==========================================

export interface UsefulGodAnalysis {
  yongShen: {
    element: BaziFiveElementKey;
    name: string;
    role: string;
    description: string;
  };
  xiShen: {
    element: BaziFiveElementKey;
    name: string;
    description: string;
  };
  jiShen: {
    element: BaziFiveElementKey;
    name: string;
    description: string;
  };
  chouShen: {
    element: BaziFiveElementKey;
    name: string;
    description: string;
  };
  diaoHouShen: {
    element: BaziFiveElementKey;
    name: string;
    seasonReason: string;
  };
}

export function determineUsefulGods(
  evaluation: DayMasterEvaluation,
  elementScore: FiveElementsScore,
  monthBranch?: BaziEarthlyBranchKey
): UsefulGodAnalysis {
  const dmElem = evaluation.dayMasterElement;

  // Quan hệ tương sinh, tương khắc ngũ hành
  const parentOf: Record<BaziFiveElementKey, BaziFiveElementKey> = {
    wood: 'water',
    fire: 'wood',
    earth: 'fire',
    metal: 'earth',
    water: 'metal',
  };
  const childOf: Record<BaziFiveElementKey, BaziFiveElementKey> = {
    wood: 'fire',
    fire: 'earth',
    earth: 'metal',
    metal: 'water',
    water: 'wood',
  };
  const conquerOf: Record<BaziFiveElementKey, BaziFiveElementKey> = {
    wood: 'earth',
    fire: 'metal',
    earth: 'water',
    metal: 'wood',
    water: 'fire',
  };
  const conqueredBy: Record<BaziFiveElementKey, BaziFiveElementKey> = {
    wood: 'metal',
    fire: 'water',
    earth: 'wood',
    metal: 'fire',
    water: 'earth',
  };

  let yongShenElem: BaziFiveElementKey;
  let xiShenElem: BaziFiveElementKey;
  let jiShenElem: BaziFiveElementKey;
  let chouShenElem: BaziFiveElementKey;

  const isStrong = evaluation.status === 'Thân Vượng' || evaluation.status === 'Vượng Cực';

  if (isStrong) {
    // Thân Vượng: Cần Tiết Khí (Thực Thương) hoặc Tiêu Hao (Tài Tinh) hoặc Khắc Chế (Quan Sát)
    // Ưu tiên chọn hành có điểm thấp nhất trong nhóm [childOf, conquerOf, conqueredBy]
    const candidates = [childOf[dmElem], conquerOf[dmElem], conqueredBy[dmElem]];
    candidates.sort((a, b) => elementScore[a] - elementScore[b]);

    yongShenElem = candidates[0] ?? childOf[dmElem];
    xiShenElem = parentOf[yongShenElem] === dmElem ? conquerOf[dmElem] : parentOf[yongShenElem];
    jiShenElem = dmElem; // Cùng hành với Nhật Chủ làm tăng vượng hại thân
    chouShenElem = parentOf[dmElem]; // Hành sinh ra Nhật Chủ
  } else {
    // Thân Nhược: Cần Bồi Bổ (Ấn Tinh - Sinh Nhật Chủ) hoặc Trợ Lực (Tỷ Kiếp - Cùng hành)
    yongShenElem = parentOf[dmElem]; // Ấn Tinh
    xiShenElem = dmElem; // Tỷ Kiếp
    jiShenElem = conqueredBy[dmElem]; // Quan Sát khắc thân
    chouShenElem = conquerOf[dmElem]; // Tài Tinh làm hao tổn Ấn
  }

  // Điều Hậu (Mùa sinh ấm/lạnh)
  let diaoHouElem: BaziFiveElementKey = 'fire';
  let seasonReason = 'Sinh mùa xuân điều hòa sinh khí';

  if (monthBranch) {
    if (['haiEarthly', 'ziEarthly', 'chouEarthly'].includes(monthBranch)) {
      diaoHouElem = 'fire';
      seasonReason = 'Sinh mùa đông hàn lãnh, trời đất kết băng, cấp thiết cần Hỏa sưởi ấm chiếu rọi toàn bàn';
    } else if (['siEarthly', 'wuEarthly', 'weiEarthly'].includes(monthBranch)) {
      diaoHouElem = 'water';
      seasonReason = 'Sinh mùa hạ viêm nhiệt, thổ táo mộc khô, tối cần Thủy tưới mát nhuận trạch dưỡng mệnh';
    } else if (['yinEarthly', 'maoEarthly', 'chenEarthly'].includes(monthBranch)) {
      diaoHouElem = 'fire';
      seasonReason = 'Sinh mùa xuân mộc khí đương lệnh, cần Hỏa phát tiết anh hoa hoặc Kim tỉa cành đắc cách';
    } else {
      diaoHouElem = 'wood';
      seasonReason = 'Sinh mùa thu kim khí sắc bén, cần Thủy thông quan hoặc Hỏa luyện kim thành bảo khí';
    }
  }

  const roleDesc: Record<BaziFiveElementKey, string> = {
    wood: 'Mộc Tinh: Khai mở tư duy sinh sôi, tạo đà phát triển bứt phá, tính tình nhân ái thuần hậu',
    fire: 'Hỏa Tinh: Tỏa sáng rực rỡ, danh tiếng vang xa, tâm tính nhiệt huyết, thắp sáng công danh',
    earth: 'Thổ Tinh: Trầm ổn vững chãi, quy tụ của cải điền sản, bao dung độ lượng, gánh vác đại nghiệp',
    metal: 'Kim Tinh: Quyết đoán cương nghị, kỷ luật nghiêm minh, công lý chính trực, kiến lập uy quyền',
    water: 'Thủy Tinh: Trí tuệ thâm sâu, quyền biến linh hoạt, nhân duyên hanh thông, đón lộc tứ hải',
  };

  return {
    yongShen: {
      element: yongShenElem,
      name: translateBaziKey(yongShenElem),
      role: isStrong ? 'Tiết Khí Điều Hòa Mệnh Cục' : 'Phù Thân Dưỡng Mệnh Trợ Khí',
      description: roleDesc[yongShenElem],
    },
    xiShen: {
      element: xiShenElem,
      name: translateBaziKey(xiShenElem),
      description: `Hành ${translateBaziKey(xiShenElem)} tương sinh đắc lực cho Dụng Thần ${translateBaziKey(yongShenElem)}, giúp mệnh chủ giữ vững phong độ và đón nhận quý nhân phù trợ.`,
    },
    jiShen: {
      element: jiShenElem,
      name: translateBaziKey(jiShenElem),
      description: `Hành ${translateBaziKey(jiShenElem)} gây mất cân bằng bản mệnh, nên tiết chế qua màu sắc phong thủy và lối sống hướng thiện để hóa giải sát khí.`,
    },
    chouShen: {
      element: chouShenElem,
      name: translateBaziKey(chouShenElem),
      description: `Hành ${translateBaziKey(chouShenElem)} cản trở cơ duyên chuyển hóa của Hỷ Thần, cần chú ý giữ tâm bình khí hòa vào các chu kỳ vượng của hành này.`,
    },
    diaoHouShen: {
      element: diaoHouElem,
      name: translateBaziKey(diaoHouElem),
      seasonReason,
    },
  };
}

// ==========================================
// 4. BẢNG THẦN SÁT HOÀNG GIA (SHEN SHA)
// ==========================================

export interface ShenShaResult {
  name: string;
  type: 'cát' | 'hung';
  pillar: string;
  description: string;
}

export function calculateShenSha(snapshot: ChartSnapshot): ShenShaResult[] {
  const list: ShenShaResult[] = [];
  if (!snapshot.bazi) return list;

  const { pillars, dayMasterHeavenlyStemKey } = snapshot.bazi;
  const yearPillar = pillars[0];
  const yearStem = yearPillar?.heavenlyStemKey;
  const yearBranch = yearPillar?.earthlyBranchKey;
  const dayBranch = pillars[2]?.earthlyBranchKey;

  // 1. Thiên Ất Quý Nhân (tính theo Can ngày hoặc Can năm)
  // Giáp Mậu Canh ngưu dương (Sửu, Mùi)
  // Ất Kỷ thử hầu hương (Tý, Thân)
  // Bính Đinh trư kê vị (Hợi, Dậu)
  // Nhâm Quý thố xà tàng (Mão, Tỵ)
  // Lục Tân phùng mã hổ (Ngọ, Dần)
  const tianYiMap: Record<BaziHeavenlyStemKey, BaziEarthlyBranchKey[]> = {
    jiaHeavenly: ['chouEarthly', 'weiEarthly'],
    wuHeavenly: ['chouEarthly', 'weiEarthly'],
    gengHeavenly: ['chouEarthly', 'weiEarthly'],
    yiHeavenly: ['ziEarthly', 'shenEarthly'],
    jiHeavenly: ['ziEarthly', 'shenEarthly'],
    bingHeavenly: ['haiEarthly', 'youEarthly'],
    dingHeavenly: ['haiEarthly', 'youEarthly'],
    renHeavenly: ['maoEarthly', 'siEarthly'],
    guiHeavenly: ['maoEarthly', 'siEarthly'],
    xinHeavenly: ['wuEarthly', 'yinEarthly'],
  };

  const tianYiBranches = new Set([
    ...(tianYiMap[dayMasterHeavenlyStemKey] ?? []),
    ...(yearStem ? (tianYiMap[yearStem] ?? []) : []),
  ]);

  pillars.forEach((p, idx) => {
    const pName = ['Trụ Năm', 'Trụ Tháng', 'Trụ Ngày', 'Trụ Giờ'][idx]!;
    if (tianYiBranches.has(p.earthlyBranchKey)) {
      list.push({
        name: 'Thiên Ất Quý Nhân',
        type: 'cát',
        pillar: pName,
        description: 'Đệ nhất phúc thần, gặp hung hóa cát, hoạn nạn luôn có quý nhân trợ lực, công danh hanh thông.',
      });
    }
  });

  // 2. Lộc Thần (Lâm Quan của Can ngày)
  const luShenMap: Record<BaziHeavenlyStemKey, BaziEarthlyBranchKey> = {
    jiaHeavenly: 'yinEarthly',
    yiHeavenly: 'maoEarthly',
    bingHeavenly: 'siEarthly',
    dingHeavenly: 'wuEarthly',
    wuHeavenly: 'siEarthly',
    jiHeavenly: 'wuEarthly',
    gengHeavenly: 'shenEarthly',
    xinHeavenly: 'youEarthly',
    renHeavenly: 'haiEarthly',
    guiHeavenly: 'ziEarthly',
  };

  const luBranch = luShenMap[dayMasterHeavenlyStemKey];
  pillars.forEach((p, idx) => {
    const pName = ['Trụ Năm', 'Trụ Tháng', 'Trụ Ngày', 'Trụ Giờ'][idx]!;
    if (p.earthlyBranchKey === luBranch) {
      list.push({
        name: 'Lộc Thần',
        type: 'cát',
        pillar: pName,
        description: 'Tài lộc sung mãn tiên thiên, cơm no áo ấm trọn đời, tự tay gây dựng cơ đồ vững chắc.',
      });
    }
  });

  // 3. Dịch Mã (Dựa vào Chi Năm hoặc Chi Ngày)
  // Thân Tý Thìn mã tại Dần; Dần Ngọ Tuất mã tại Thân; Tỵ Dậu Sửu mã tại Hợi; Hợi Mão Mùi mã tại Tỵ.
  const yiMaMap: Record<BaziEarthlyBranchKey, BaziEarthlyBranchKey> = {
    shenEarthly: 'yinEarthly',
    ziEarthly: 'yinEarthly',
    chenEarthly: 'yinEarthly',
    yinEarthly: 'shenEarthly',
    wuEarthly: 'shenEarthly',
    xuEarthly: 'shenEarthly',
    siEarthly: 'haiEarthly',
    youEarthly: 'haiEarthly',
    chouEarthly: 'haiEarthly',
    haiEarthly: 'siEarthly',
    maoEarthly: 'siEarthly',
    weiEarthly: 'siEarthly',
  };

  const yiMaBranches = new Set([
    yearBranch ? yiMaMap[yearBranch] : undefined,
    dayBranch ? yiMaMap[dayBranch] : undefined,
  ].filter((b): b is BaziEarthlyBranchKey => !!b));

  pillars.forEach((p, idx) => {
    const pName = ['Trụ Năm', 'Trụ Tháng', 'Trụ Ngày', 'Trụ Giờ'][idx]!;
    if (yiMaBranches.has(p.earthlyBranchKey)) {
      list.push({
        name: 'Dịch Mã',
        type: 'cát',
        pillar: pName,
        description: 'Vận động biến chuyển, thích hợp xuất ngoại lập nghiệp, công tác xa nhà gặp nhiều thắng lợi.',
      });
    }
  });

  // 4. Hoa Cái (Dựa vào Chi Năm/Ngày: Thân Tý Thìn tại Thìn, Dần Ngọ Tuất tại Tuất, Tỵ Dậu Sửu tại Sửu, Hợi Mão Mùi tại Mùi)
  const huaGaiMap: Record<BaziEarthlyBranchKey, BaziEarthlyBranchKey> = {
    shenEarthly: 'chenEarthly',
    ziEarthly: 'chenEarthly',
    chenEarthly: 'chenEarthly',
    yinEarthly: 'xuEarthly',
    wuEarthly: 'xuEarthly',
    xuEarthly: 'xuEarthly',
    siEarthly: 'chouEarthly',
    youEarthly: 'chouEarthly',
    chouEarthly: 'chouEarthly',
    haiEarthly: 'weiEarthly',
    maoEarthly: 'weiEarthly',
    weiEarthly: 'weiEarthly',
  };
  const huaGaiBranches = new Set([
    yearBranch ? huaGaiMap[yearBranch] : undefined,
    dayBranch ? huaGaiMap[dayBranch] : undefined,
  ].filter((b): b is BaziEarthlyBranchKey => !!b));

  pillars.forEach((p, idx) => {
    const pName = ['Trụ Năm', 'Trụ Tháng', 'Trụ Ngày', 'Trụ Giờ'][idx]!;
    if (huaGaiBranches.has(p.earthlyBranchKey)) {
      list.push({
        name: 'Hoa Cái',
        type: 'cát',
        pillar: pName,
        description: 'Trực giác nhạy bén, thiên hướng nghệ thuật, triết học và tâm linh siêu việt, nội tâm phong phú.',
      });
    }
  });

  // 5. Đào Hoa / Hàm Trì (Thân Tý Thìn tại Dậu, Dần Ngọ Tuất tại Mão, Tỵ Dậu Sửu tại Ngọ, Hợi Mão Mùi tại Tý)
  const daoHoaMap: Record<BaziEarthlyBranchKey, BaziEarthlyBranchKey> = {
    shenEarthly: 'youEarthly',
    ziEarthly: 'youEarthly',
    chenEarthly: 'youEarthly',
    yinEarthly: 'maoEarthly',
    wuEarthly: 'maoEarthly',
    xuEarthly: 'maoEarthly',
    siEarthly: 'wuEarthly',
    youEarthly: 'wuEarthly',
    chouEarthly: 'wuEarthly',
    haiEarthly: 'ziEarthly',
    maoEarthly: 'ziEarthly',
    weiEarthly: 'ziEarthly',
  };
  const daoHoaBranches = new Set([
    yearBranch ? daoHoaMap[yearBranch] : undefined,
    dayBranch ? daoHoaMap[dayBranch] : undefined,
  ].filter((b): b is BaziEarthlyBranchKey => !!b));

  pillars.forEach((p, idx) => {
    const pName = ['Trụ Năm', 'Trụ Tháng', 'Trụ Ngày', 'Trụ Giờ'][idx]!;
    if (daoHoaBranches.has(p.earthlyBranchKey)) {
      list.push({
        name: 'Đào Hoa Tinh',
        type: 'cát',
        pillar: pName,
        description: 'Duyên dáng cuốn hút, phong thái tài hoa, nhân duyên khác giới dồi dào, cần giữ tâm định để tránh đào hoa sát.',
      });
    }
  });

  // 6. Kình Dương (Đế Vượng của Can ngày)
  const yangRenMap: Record<BaziHeavenlyStemKey, BaziEarthlyBranchKey> = {
    jiaHeavenly: 'maoEarthly',
    yiHeavenly: 'yinEarthly',
    bingHeavenly: 'wuEarthly',
    dingHeavenly: 'siEarthly',
    wuHeavenly: 'wuEarthly',
    jiHeavenly: 'siEarthly',
    gengHeavenly: 'youEarthly',
    xinHeavenly: 'shenEarthly',
    renHeavenly: 'ziEarthly',
    guiHeavenly: 'haiEarthly',
  };
  const yangRenBranch = yangRenMap[dayMasterHeavenlyStemKey];
  pillars.forEach((p, idx) => {
    const pName = ['Trụ Năm', 'Trụ Tháng', 'Trụ Ngày', 'Trụ Giờ'][idx]!;
    if (p.earthlyBranchKey === yangRenBranch) {
      list.push({
        name: 'Kình Dương',
        type: 'hung',
        pillar: pName,
        description: 'Thanh kiếm quyền uy, tính khí mạnh mẽ bất khuất; nếu thân vượng cần cẩn trọng họa tai ương, nếu thân nhược lại biến thành giáp trụ trợ mệnh.',
      });
    }
  });

  return list;
}

// ==========================================
// 5. THẬP NIÊN ĐẠI VẬN (DECADAL PILLARS)
// ==========================================

export interface DecadalPillarResult {
  step: number;
  ageRange: string;
  stemKey: BaziHeavenlyStemKey;
  branchKey: BaziEarthlyBranchKey;
  stemBranchLabel: string;
  tenGod: string;
  element: string;
  lifeStage: LifeStage;
  fortuneSummary: string;
}

export function calculateDecadalPillars(snapshot: ChartSnapshot): DecadalPillarResult[] {
  const list: DecadalPillarResult[] = [];
  if (!snapshot.bazi) return list;

  const monthPillar = snapshot.bazi.pillars[1];
  const yearPillar = snapshot.bazi.pillars[0];
  const dmStem = snapshot.bazi.dayMasterHeavenlyStemKey;
  const isMale =
    (snapshot.birth as any)?.originalInput?.sexOrGenderForChart === 'male' ||
    (snapshot.birth as any)?.gender === 'male';

  const yearStemYinYang = yearPillar ? STEM_YIN_YANG[yearPillar.heavenlyStemKey] : 'yang';
  // Dương Nam Âm Nữ tính thuận (forward), Âm Nam Dương Nữ tính nghịch (backward)
  const isForward = (isMale && yearStemYinYang === 'yang') || (!isMale && yearStemYinYang === 'yin');

  if (!monthPillar) return list;

  const startStemIdx = HEAVENLY_STEMS_ORDER.indexOf(monthPillar.heavenlyStemKey);
  const startBranchIdx = EARTHLY_BRANCHES_ORDER.indexOf(monthPillar.earthlyBranchKey);

  // Giả định tuổi khởi vận trung bình ~ 6 tuổi (chuẩn hóa thẩm mỹ Bát Tự)
  const baseAge = 6;

  for (let i = 1; i <= 8; i++) {
    const stepOffset = isForward ? i : -i;
    const stemIdx = (startStemIdx + stepOffset + 120) % 10;
    const branchIdx = (startBranchIdx + stepOffset + 120) % 12;

    const sKey = HEAVENLY_STEMS_ORDER[stemIdx]!;
    const bKey = EARTHLY_BRANCHES_ORDER[branchIdx]!;

    const tenGodKey = calculateTenGod(dmStem, sKey);
    const tenGodName = translateBaziKey(tenGodKey);
    const elemName = translateBaziKey(baziStemElementByKey[sKey]);
    const lifeStage = getLifeStage(dmStem, bKey);

    const startAge = baseAge + (i - 1) * 10;
    const endAge = startAge + 9;

    let fortuneSummary = '';
    if (['Trường Sinh', 'Quan Đới', 'Lâm Quan', 'Đế Vượng'].includes(lifeStage)) {
      fortuneSummary = 'Thời vận vượng khởi, cơ hội rộng mở, quý nhân tương trợ, công thành danh toại.';
    } else if (['Suy', 'Bệnh', 'Tử', 'Tuyệt'].includes(lifeStage)) {
      fortuneSummary = 'Thời vận ẩn tàng, nên chú trọng tích lũy, phòng ngừa hao tài, giữ gìn sức khỏe.';
    } else {
      fortuneSummary = 'Thời vận bình ổn, vạn sự thuận tùng quy luật, mưu sự chu toàn ắt có kết quả vững bền.';
    }

    list.push({
      step: i,
      ageRange: `${startAge} - ${endAge} tuổi`,
      stemKey: sKey,
      branchKey: bKey,
      stemBranchLabel: formatBaziStemBranchLabel({ heavenlyStemKey: sKey, earthlyBranchKey: bKey }),
      tenGod: tenGodName,
      element: elemName,
      lifeStage,
      fortuneSummary,
    });
  }

  return list;
}

// ==========================================
// 6. PHÂN TÍCH CHUYÊN SÂU LƯU NIÊN 2026 BÍNH NGỌ
// ==========================================

export interface Year2026Forecast {
  yearCanChi: string;
  yearNaYin: string;
  tenGodOfYear: string;
  dayMasterRelation: string;
  branchInteractions: {
    type: 'Tương Xung' | 'Tam Hợp' | 'Lục Hợp' | 'Tự Hình' | 'Tương Hại' | 'Tương Phá' | 'Bình Hòa';
    targetPillar: string;
    description: string;
  }[];
  overallRating: 'Đại Cát' | 'Cát' | 'Bình Hòa' | 'Thận Trọng' | 'Cần Hóa Giải';
  careerForecast: string;
  wealthForecast: string;
  loveForecast: string;
  healthForecast: string;
  remedyAdvice: string;
}

export function evaluateYear2026(snapshot: ChartSnapshot, yongShen: UsefulGodAnalysis): Year2026Forecast {
  const dmStem = snapshot.bazi?.dayMasterHeavenlyStemKey ?? 'bingHeavenly';
  const pillars = snapshot.bazi?.pillars ?? [];

  // Năm 2026: Bính Ngọ (Thiên Can: Bính Hỏa, Địa Chi: Ngọ Hỏa, Nạp Âm: Thiên Hà Thủy)
  const year2026Stem: BaziHeavenlyStemKey = 'bingHeavenly';
  const _year2026Branch: BaziEarthlyBranchKey = 'wuEarthly';

  const tenGodKey = calculateTenGod(dmStem, year2026Stem);
  const tenGodOfYear = translateBaziKey(tenGodKey);

  // Mối quan hệ giữa Can Bính 2026 với Nhật Chủ
  let dayMasterRelation = '';
  switch (dmStem) {
    case 'jiaHeavenly':
      dayMasterRelation = 'Giáp Mộc sinh Bính Hỏa (Thực Thần thấu lộ): Tài hoa phát tiết, tư duy sáng tạo bùng nổ, danh tiếng gia tăng, có nhiều cơ hội xuất ngoại hoặc hợp tác đầu tư mới.';
      break;
    case 'yiHeavenly':
      dayMasterRelation = 'Ất Mộc sinh Bính Hỏa (Thương Quan đắc địa): Khí chất sắc sảo, tự tin thể hiện năng lực, cần kiềm chế tính nóng nảy và cẩn trọng lời ăn tiếng nói nơi công sở.';
      break;
    case 'bingHeavenly':
      dayMasterRelation = 'Bính Hỏa gặp Bính Hỏa (Tỷ Kiên trùng phùng): Cơ hội mở rộng mạng lưới quan hệ, đồng hành cùng bằng hữu chí cốt, tuy nhiên cần đề phòng sự cạnh tranh thị phần gay gắt.';
      break;
    case 'dingHeavenly':
      dayMasterRelation = 'Đinh Hỏa gặp Bính Hỏa (Kiếp Tài xuất hiện): Đương số hào sảng chi tiêu, cần thắt chặt quản lý dòng tiền, tránh cho vay mượn rủi ro hoặc hợp tác mập mờ.';
      break;
    case 'wuHeavenly':
      dayMasterRelation = 'Bính Hỏa sinh Mậu Thổ (Thiên Ấn tương sinh): Quý nhân lớn phù trợ, nâng cao vị thế học vị chuyên môn, có duyên học hỏi lĩnh vực mới hoặc nghiên cứu sâu sắc.';
      break;
    case 'jiHeavenly':
      dayMasterRelation = 'Bính Hỏa sinh Kỷ Thổ (Chính Ấn che chở): Công danh thăng tiến, được cấp trên tín nhiệm, phúc khí gia tăng, gia đạo đón nhiều tin vui liên quan đến giấy tờ, bằng cấp.';
      break;
    case 'gengHeavenly':
      dayMasterRelation = 'Bính Hỏa khắc Canh Kim (Thất Sát thử thách): Năm nhiều áp lực và trọng trách lớn, tôi luyện bản lĩnh người lãnh đạo, biến khó khăn thành bàn đạp vươn lên đỉnh cao.';
      break;
    case 'xinHeavenly':
      dayMasterRelation = 'Bính Tân tương hợp (Chính Quan tương hợp hóa khí): Vận trình cực sáng cho sự nghiệp và hôn nhân, được tổ chức tôn vinh, dễ thăng quan tiến chức hoặc đón hỷ tín.';
      break;
    case 'renHeavenly':
      dayMasterRelation = 'Nhâm Thủy khắc Bính Hỏa (Thiên Tài hội tụ): Dòng tiền bất ngờ, cơ hội đầu tư tài chính sinh lời nhanh chóng, nên biết điểm dừng và chia trứng vào nhiều giỏ.';
      break;
    case 'guiHeavenly':
      dayMasterRelation = 'Quý Thủy khắc Bính Hỏa (Chính Tài đắc vị): Thu nhập từ công việc chính phát triển vững chãi, tích lũy tài sản đều đặn, gia đạo ấm no sung túc.';
      break;
  }

  // Phân tích Chi Ngọ 2026 với 4 Chi trong Bát Tự
  const branchInteractions: Year2026Forecast['branchInteractions'] = [];

  pillars.forEach((p, idx) => {
    const pName = ['Trụ Năm', 'Trụ Tháng', 'Trụ Ngày', 'Trụ Giờ'][idx]!;
    const b = p.earthlyBranchKey;

    // Tý - Ngọ Xung
    if (b === 'ziEarthly') {
      branchInteractions.push({
        type: 'Tương Xung',
        targetPillar: pName,
        description: `Ngọ Hỏa xung Tý Thủy tại ${pName}: Khí trường biến động mạnh, có sự thay đổi về chỗ ở, công việc hoặc di chuyển nhiều. Cần chú ý cẩn trọng khi đi lại trên sông nước.`,
      });
    }
    // Dần - Ngọ - Tuất Tam Hợp
    else if (b === 'yinEarthly' || b === 'xuEarthly') {
      branchInteractions.push({
        type: 'Tam Hợp',
        targetPillar: pName,
        description: `Ngọ hợp cùng ${translateBaziKey(b)} tại ${pName} kết thành Hỏa cục: Năng lượng quang minh rực rỡ, mở ra những liên minh hợp tác đắc lực và thắng lợi lớn về danh tiếng.`,
      });
    }
    // Mùi - Ngọ Lục Hợp
    else if (b === 'weiEarthly') {
      branchInteractions.push({
        type: 'Lục Hợp',
        targetPillar: pName,
        description: `Ngọ Mùi nhị hợp nhật nguyệt tại ${pName}: Khí hòa sinh tài, nhân duyên bền chặt, hóa giải nhiều mâu thuẫn tồn đọng, vạn sự thuận buồm xuôi gió.`,
      });
    }
    // Ngọ - Ngọ Tự Hình
    else if (b === 'wuEarthly') {
      branchInteractions.push({
        type: 'Tự Hình',
        targetPillar: pName,
        description: `Ngọ Ngọ tự hình tại ${pName}: Tâm lý đôi lúc trăn trở, tự tạo áp lực cho bản thân, cần học cách buông bỏ cầu toàn để tâm trí thảnh thơi an định.`,
      });
    }
    // Sửu - Ngọ Tương Hại
    else if (b === 'chouEarthly') {
      branchInteractions.push({
        type: 'Tương Hại',
        targetPillar: pName,
        description: `Sửu Ngọ tương hại tại ${pName}: Đề phòng tiểu nhân đố kỵ ngấm ngầm, trong giao tiếp cần minh bạch rành mạch hợp đồng giấy tờ.`,
      });
    }
    // Mão - Ngọ Tương Phá
    else if (b === 'maoEarthly') {
      branchInteractions.push({
        type: 'Tương Phá',
        targetPillar: pName,
        description: `Mão Ngọ tương phá tại ${pName}: Hao tổn tài chính nhỏ, máy móc thiết bị dễ trục trặc hoặc cần bảo trì nâng cấp nơi an cư.`,
      });
    }
  });

  if (branchInteractions.length === 0) {
    branchInteractions.push({
      type: 'Bình Hòa',
      targetPillar: 'Bản Cung',
      description: 'Khí trường năm Bính Ngọ đi vào trạng thái bình ổn, tuần tự tiến bước, không gặp xung đột gay gắt.',
    });
  }

  // Đánh giá Cát Hung
  const hasClash = branchInteractions.some((bi) => bi.type === 'Tương Xung');
  const hasHarmony = branchInteractions.some((bi) => bi.type === 'Tam Hợp' || bi.type === 'Lục Hợp');
  const isFireYongShen = yongShen.yongShen.element === 'fire' || yongShen.xiShen.element === 'fire';

  let overallRating: Year2026Forecast['overallRating'] = 'Bình Hòa';
  if (isFireYongShen && hasHarmony) overallRating = 'Đại Cát';
  else if (isFireYongShen) overallRating = 'Cát';
  else if (hasClash) overallRating = 'Thận Trọng';
  else if (hasHarmony) overallRating = 'Cát';

  return {
    yearCanChi: 'Bính Ngọ 2026',
    yearNaYin: 'Thiên Hà Thủy (Nước Mưa Trời)',
    tenGodOfYear,
    dayMasterRelation,
    branchInteractions,
    overallRating,
    careerForecast:
      'Năm 2026 mở ra nhiều bước ngoặt lớn về chuyên môn và vị thế xã hội. Những nỗ lực kiên trì trong quá khứ bắt đầu đơm hoa kết trái. Đối với người làm lãnh đạo, uy tín tăng vọt; với người khởi nghiệp, thương hiệu được thị trường công nhận tích cực.',
    wealthForecast:
      'Dòng tiền luân chuyển mạnh mẽ, nhiều cơ hội gia tăng thu nhập từ các kênh đầu tư mới. Tuy nhiên do năng lượng Hỏa vượng thúc đẩy tâm lý nóng vội, cần tránh các thương vụ đầu cơ ngắn hạn thiếu cơ sở pháp lý.',
    loveForecast:
      'Đào hoa vận chiếu rọi rực rỡ, người độc thân có cơ hội gặp gỡ tri kỷ tương hợp tâm hồn; các cặp đôi gắn kết bền chặt, hóa giải những khúc mắc cũ và có thể đón tin vui về gia đạo, thêm nhân khẩu.',
    healthForecast:
      'Khí Hỏa năm Bính Ngọ chi phối nên cần chú trọng chăm sóc hệ tim mạch, huyết áp và tránh để mắt làm việc quá tải. Bổ sung nước đầy đủ và duy trì chế độ ngủ nghỉ khoa học trước 23h.',
    remedyAdvice:
      `Tận dụng hành ${yongShen.yongShen.name} làm kim chỉ nam: Tăng cường trang phục, không gian sống màu ${yongShen.yongShen.element === 'fire' ? 'Đỏ / Hồng / Tím' : yongShen.yongShen.element === 'water' ? 'Đen / Xanh Dương' : yongShen.yongShen.element === 'wood' ? 'Xanh Lá' : yongShen.yongShen.element === 'metal' ? 'Trắng / Ánh Kim' : 'Vàng / Nâu Đất'} để kích hoạt vượng khí tối đa.`,
  };
}

// ==========================================
// 7. VẬN TRÌNH 12 THÁNG NĂM 2026 BÍNH NGỌ
// ==========================================

export interface MonthlyForecast2026 {
  lunarMonth: number;
  monthCanChi: string;
  element: string;
  ratingScore: number; // 1 to 5 sao
  headline: string;
  actionGuidance: string;
}

export function calculate12Months2026(dmStem: BaziHeavenlyStemKey): MonthlyForecast2026[] {
  // 12 Tháng Âm Lịch năm Bính Ngọ (Can Chi tính theo Ngũ Hổ Độn: Năm Bính thì Tháng 1 khởi Canh Dần)
  const monthsData: { month: number; canChi: string; elem: string; scoreBase: number; headline: string; advice: string }[] = [
    { month: 1, canChi: 'Canh Dần', elem: 'Kim - Mộc', scoreBase: 4, headline: 'Khai xuân hanh thông, công việc khởi sắc', advice: 'Chủ động thiết lập mục tiêu năm mới, kết giao thêm đối tác uy tín.' },
    { month: 2, canChi: 'Tân Mão', elem: 'Kim - Mộc', scoreBase: 4, headline: 'Đào hoa khởi sắc, nhân duyên như ý', advice: 'Mở rộng giao lưu, chú trọng trau chuốt hình ảnh cá nhân và gia đạo.' },
    { month: 3, canChi: 'Nhâm Thìn', elem: 'Thủy - Thổ', scoreBase: 3, headline: 'Tài chính vững chãi, tích lũy sản nghiệp', advice: 'Cân đối thu chi, tránh mua sắm quá đà các vật phẩm xa xỉ.' },
    { month: 4, canChi: 'Quý Tỵ', elem: 'Thủy - Hỏa', scoreBase: 3, headline: 'Biến động thị trường, cần giữ bình tĩnh', advice: 'Kiên định với kế hoạch dài hạn, không vội vàng chạy theo xu hướng nhất thời.' },
    { month: 5, canChi: 'Giáp Ngọ', elem: 'Mộc - Hỏa', scoreBase: 5, headline: 'Đỉnh cao danh vọng, hợp tác thành công', advice: 'Nắm bắt cơ hội vàng để bứt phá doanh số hoặc nhận nhiệm vụ trọng trách.' },
    { month: 6, canChi: 'Ất Mùi', elem: 'Mộc - Thổ', scoreBase: 4, headline: 'Quý nhân phò trợ, hóa giải âu lo', advice: 'Lắng nghe lời khuyên của bậc tiền bối, củng cố nền tảng gia đình.' },
    { month: 7, canChi: 'Bính Thân', elem: 'Hỏa - Kim', scoreBase: 3, headline: 'Dịch chuyển nhiều, mở rộng địa bàn', advice: 'Cẩn trọng khi tham gia giao thông, chuẩn bị kỹ lưỡng trước các chuyến công tác xa.' },
    { month: 8, canChi: 'Đinh Dậu', elem: 'Hỏa - Kim', scoreBase: 4, headline: 'Thu hoạch tài lộc, thành quả ngọt ngào', advice: 'Tổng kết giai đoạn kinh doanh, tái đầu tư vào chuyên môn cốt lõi.' },
    { month: 9, canChi: 'Mậu Tuất', elem: 'Thổ - Thổ', scoreBase: 4, headline: 'Địa ốc điền sản, cơ nghiệp hưng vượng', advice: 'Phù hợp làm thủ tục pháp lý nhà cửa đất đai hoặc sắp xếp phong thủy.' },
    { month: 10, canChi: 'Kỷ Hợi', elem: 'Thổ - Thủy', scoreBase: 3, headline: 'Áp lực cuối năm, cần giữ sức bền', advice: 'Tập trung hoàn tất các dự án dở dang, hạn chế thức khuya làm việc quá sức.' },
    { month: 11, canChi: 'Canh Tý', elem: 'Kim - Thủy', scoreBase: 2, headline: 'Tháng Xung Thái Tuế, dĩ hòa vi quý', advice: 'Tuyệt đối tránh tranh cãi thị phi, kiểm tra kỹ lưỡng các hợp đồng tài chính.' },
    { month: 12, canChi: 'Tân Sửu', elem: 'Kim - Thổ', scoreBase: 4, headline: 'Tết đến an khang, gia đình đoàn tụ', advice: 'Tổng kết năm cũ trọn vẹn, tri ân người đồng hành và đón chào xuân mới.' },
  ];

  return monthsData.map((m) => {
    let score = m.scoreBase;
    // Điều chỉnh nhẹ dựa theo Nhật Chủ
    if (['jiaHeavenly', 'yiHeavenly'].includes(dmStem) && [1, 2, 5].includes(m.month)) score = Math.min(5, score + 1);
    if (['bingHeavenly', 'dingHeavenly'].includes(dmStem) && [4, 5].includes(m.month)) score = Math.min(5, score + 1);

    return {
      lunarMonth: m.month,
      monthCanChi: m.canChi,
      element: m.elem,
      ratingScore: score,
      headline: m.headline,
      actionGuidance: m.advice,
    };
  });
}
