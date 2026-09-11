import type { ChartSnapshot } from '@ziweiai/contracts';
import { translateBaziKey, formatBaziStemBranchLabel } from '@ziweiai/contracts';
import { formatStructuredLunarDate } from '$lib/features/chart/chart-display';
import {
  calculateFiveElementsBalance,
  evaluateDayMaster,
  determineUsefulGods,
  calculateShenSha,
  calculateDecadalPillars,
  evaluateYear2026,
  calculate12Months2026,
  getLifeStage,
  type ShenShaResult,
} from './bazi-dossier-calculator';

export interface BaziPillarDossier {
  slot: 'year' | 'month' | 'day' | 'hour';
  slotName: string;
  stemBranchLabel: string;
  stem: string;
  branch: string;
  stemElement: string;
  branchElement: string;
  stemTenGod: string;
  branchTenGods: string;
  hiddenStemsText: string;
  naYin: string;
  lifeStage: string;
  ageRange: string;
  deepReading: string;
}

export interface BaziDossierPayload {
  userName: string;
  genderText: string;
  solarDateText: string;
  lunarDateText: string;
  birthHourText: string;
  dayMasterText: string;
  dayMasterElement: string;
  dayMasterPolarity: string;
  dayMasterStrength: string;
  pillars: BaziPillarDossier[];
  extraPillars: {
    taiYuan: string;
    taiXi: string;
    mingGong: string;
    shenGong: string;
  };
  fiveElements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
    percentages: {
      wood: number;
      fire: number;
      earth: number;
      metal: number;
      water: number;
    };
    summaryText: string;
  };
  usefulGods: {
    yongShen: { name: string; role: string; desc: string };
    xiShen: { name: string; desc: string };
    jiShen: { name: string; desc: string };
    chouShen: { name: string; desc: string };
    diaoHou: { name: string; reason: string };
  };
  tenGodsAnalysis: {
    anTinh: { title: string; evaluation: string; guidance: string };
    quanSat: { title: string; evaluation: string; guidance: string };
    taiTinh: { title: string; evaluation: string; guidance: string };
    thucThuong: { title: string; evaluation: string; guidance: string };
    tyKiep: { title: string; evaluation: string; guidance: string };
  };
  shenShaList: ShenShaResult[];
  decadals: {
    step: number;
    ageRange: string;
    stemBranch: string;
    tenGod: string;
    element: string;
    lifeStage: string;
    summary: string;
  }[];
  yearly2026: {
    yearCanChi: string;
    yearNaYin: string;
    tenGod: string;
    dayMasterRelation: string;
    branchInteractions: { type: string; pillar: string; desc: string }[];
    rating: string;
    career: string;
    wealth: string;
    love: string;
    health: string;
    remedy: string;
    months: {
      month: number;
      canChi: string;
      element: string;
      ratingScore: number;
      headline: string;
      guidance: string;
    }[];
  };
  remedies: {
    luckyColors: string[];
    luckyDirections: string[];
    luckyNumbers: string[];
    careerSectors: string[];
    mindsetAdvice: string;
  };
}

export function buildBaziDossierData(snapshot: ChartSnapshot, userNameInput?: string): BaziDossierPayload {
  const birth: any = snapshot.birth || {};
  const summary: any = snapshot.summary || {};
  const bazi = snapshot.bazi;

  const userName = userNameInput || birth.name || 'Đương Số Hoàng Triều';
  const rawGender = birth.originalInput?.sexOrGenderForChart || birth.gender;
  const genderText = rawGender === 'male' ? 'Nam Mạng' : rawGender === 'female' ? 'Nữ Mạng' : 'Bản Mệnh';

  const resolvedDate = birth.resolvedDateTime?.date;
  const solarDateText =
    summary.solarDate ||
    birth.solarDate ||
    (resolvedDate ? `${resolvedDate.day}/${resolvedDate.month}/${resolvedDate.year}` : 'Chưa xác định');

  const rawLunar = summary.lunarDate || birth.lunarDate;
  const lunarDateText = (rawLunar ? formatStructuredLunarDate(rawLunar) : '') || 'Chưa xác định';

  const resolvedTime = birth.resolvedDateTime?.time || birth.time;
  const birthHourText = resolvedTime
    ? `${String(resolvedTime.hour ?? 0).padStart(2, '0')}:${String(resolvedTime.minute ?? 0).padStart(2, '0')}`
    : 'Chưa xác định';

  const dmStem = bazi?.dayMasterHeavenlyStemKey ?? 'bingHeavenly';
  const dmName = translateBaziKey(dmStem);
  const dmElemKey = bazi?.pillars[2]?.heavenlyStemElementKey ?? 'fire';
  const dmElemName = translateBaziKey(dmElemKey);

  // 1. Phân tích ngũ hành và thân vượng/nhược
  const fiveElementsScore = calculateFiveElementsBalance(snapshot);
  const dmEval = evaluateDayMaster(snapshot, fiveElementsScore);
  const monthBranch = bazi?.pillars[1]?.earthlyBranchKey;
  const usefulGodsData = determineUsefulGods(dmEval, fiveElementsScore, monthBranch);

  // 2. Phân tích 4 Trụ chi tiết
  const slotMeta: Record<'year' | 'month' | 'day' | 'hour', { name: string; ageRange: string }> = {
    year: { name: 'Trụ Năm (Tổ Tiên - Niên Thiếu)', ageRange: '1 - 16 tuổi' },
    month: { name: 'Trụ Tháng (Phụ Mẫu - Lập Nghiệp)', ageRange: '17 - 32 tuổi' },
    day: { name: 'Trụ Ngày (Bản Thân - Hôn Nhân)', ageRange: '33 - 48 tuổi' },
    hour: { name: 'Trụ Giờ (Hậu Vận - Con Cái)', ageRange: '49+ tuổi' },
  };

  const defaultPillars: BaziPillarDossier[] = (['year', 'month', 'day', 'hour'] as const).map((slot, idx) => {
    const p = bazi?.pillars[idx];
    const sStem = p ? translateBaziKey(p.heavenlyStemKey) : 'Canh';
    const sBranch = p ? translateBaziKey(p.earthlyBranchKey) : 'Ngọ';
    const sLabel = p ? formatBaziStemBranchLabel(p) : `${sStem} ${sBranch}`;
    const sElem = p ? translateBaziKey(p.heavenlyStemElementKey) : 'Kim';
    const bElem = p ? translateBaziKey(p.earthlyBranchElementKey) : 'Hỏa';
    const sTenGod = p ? translateBaziKey(p.heavenlyStemTenGodKey) : 'Tỷ Kiên';
    const bTenGods = p?.earthlyBranchTenGodKeys.map((k) => translateBaziKey(k)).join(', ') || 'Chưa định';
    const hiddenStemsText =
      p?.hiddenStems.map((hs) => `${translateBaziKey(hs.heavenlyStemKey)} (${hs.tenGodKey ? translateBaziKey(hs.tenGodKey) : 'Ẩn'})`).join(', ') || 'Chưa định';
    const naYin = p?.naYin || 'Chưa định';
    const lifeStage = p ? getLifeStage(dmStem, p.earthlyBranchKey) : 'Trường Sinh';

    let deepReading = '';
    if (slot === 'year') {
      deepReading = `Trụ Năm đại diện cho cội nguồn tổ tiên, phúc trạch tiên thiên và thuở ấu thơ. Nạp âm ${naYin} kết hợp với Thập Thần ${sTenGod} thấu lộ cho thấy đương số xuất thân trong gia phong có nền tảng vững vàng, thuở nhỏ sớm nhận được ân dưỡng chu đáo từ trưởng bối.`;
    } else if (slot === 'month') {
      deepReading = `Trụ Tháng là Nguyệt Lệnh điều hành khí hậu toàn bàn, chi phối quan hệ song thân và thời kỳ thanh niên gây dựng cơ nghiệp. Khí ${bElem} nắm lệnh làm nền tảng tôi rèn tính cách kiên nghị, dám nghĩ dám làm, sớm định hướng công danh chức nghiệp rõ ràng.`;
    } else if (slot === 'day') {
      deepReading = `Trụ Ngày tọa độ linh hồn của đương số. Nhật Can ${dmName} ngự trên Chi ngày ${sBranch} (${lifeStage}) biểu trưng cho nội lực kiên định, tự chủ cao độ và tinh thần trách nhiệm. Cung phối ngẫu tại chi ngày báo hiệu nhân duyên sắt son, bạn đời tương trợ đắc lực trong sự nghiệp.`;
    } else {
      deepReading = `Trụ Giờ cai quản hậu vận cơ đồ, tài sản tích lũy và phúc lộc con cháu đời sau. Khí trường trụ giờ sinh vượng hứa hẹn tuổi già an nhàn hưởng phúc, con cái phương trưởng thành đạt, kế thừa và phát huy vẻ vang rạng danh gia đạo.`;
    }

    return {
      slot,
      slotName: slotMeta[slot].name,
      stemBranchLabel: sLabel,
      stem: sStem,
      branch: sBranch,
      stemElement: sElem,
      branchElement: bElem,
      stemTenGod: sTenGod,
      branchTenGods: bTenGods,
      hiddenStemsText,
      naYin,
      lifeStage,
      ageRange: slotMeta[slot].ageRange,
      deepReading,
    };
  });

  // 3. Phụ trụ (Thai Nguyên, Thai Tức, Mệnh Cung, Thân Cung)
  const formatCompound = (comp: any) => {
    if (!comp) return 'N/A';
    if (typeof comp === 'string') return comp;
    return `${formatBaziStemBranchLabel(comp)} (${comp.naYin || ''})`;
  };

  const extraPillars = {
    taiYuan: formatCompound(bazi?.taiYuan),
    taiXi: formatCompound(bazi?.taiXi),
    mingGong: formatCompound(bazi?.mingGong),
    shenGong: formatCompound(bazi?.shenGong),
  };

  // 4. Ngũ Hành tóm tắt
  const dominantElement = Object.entries(fiveElementsScore.percentages).sort((a, b) => b[1] - a[1])[0];
  const summaryText = `Toàn bàn ngũ hành quy nạp: Kim (${fiveElementsScore.percentages.metal}%), Mộc (${fiveElementsScore.percentages.wood}%), Thủy (${fiveElementsScore.percentages.water}%), Hỏa (${fiveElementsScore.percentages.fire}%), Thổ (${fiveElementsScore.percentages.earth}%). Hành khí vượng nhất là ${translateBaziKey(dominantElement ? dominantElement[0] : 'wood')}, đóng vai trò chủ đạo định hình khí chất và thể chất của đương số.`;

  // 5. Thập Thần Đại Luận
  const tenGodsAnalysis = {
    anTinh: {
      title: 'Ấn Tinh (Chính Ấn & Thiên Ấn): Trí Tuệ, Phúc Đức & Quý Nhân',
      evaluation: `Ấn Tinh là nguồn năng lượng sinh dưỡng chở che cho Nhật Chủ ${dmName}. Trong mệnh bàn, Ấn Tinh đại diện cho học vấn uyên thâm, bằng cấp danh giá, khả năng tự học xuất chúng và sự dìu dắt từ các bậc ân sư.`,
      guidance: 'Nên chú trọng phát triển con đường học thuật chuyên sâu, gìn giữ phúc đức tổ tiên và duy trì sự lương thiện để phúc khí trường tồn.',
    },
    quanSat: {
      title: 'Quan Sát (Chính Quan & Thất Sát): Uy Quyền, Danh Vọng & Kỷ Cương',
      evaluation: `Quan Sát là lực lượng rèn giũa, thiết lập kỷ cương trật tự và quy củ công danh. Khi kết hợp hài hòa với Nhật Chủ, Quan Sát mang lại phong thái lãnh đạo quyết đoán, công bằng chính trực và sự tín nhiệm tuyệt đối từ tập thể.`,
      guidance: 'Biết cương nhu tùy lúc, tôn trọng pháp luật và quy chuẩn xã hội, biến áp lực trách nhiệm thành động lực vươn lên đỉnh cao sự nghiệp.',
    },
    taiTinh: {
      title: 'Tài Tinh (Chính Tài & Thiên Tài): Dòng Tiền, Sản Nghiệp & Nhân Duyên',
      evaluation: `Tài Tinh là kết tinh của thành quả lao động và khả năng nắm bắt cơ hội kinh doanh. Chính Tài biểu thị thu nhập ổn định bền vững; Thiên Tài biểu trưng cho sự nhạy bén thị trường và lộc tài bất ngờ từ đầu tư mạo hiểm.`,
      guidance: 'Quản trị rủi ro tài chính chặt chẽ, luôn có quỹ dự phòng an toàn và chia sẻ tài lộc bằng việc thiện nguyện để tụ tài dưỡng phúc.',
    },
    thucThuong: {
      title: 'Thực Thương (Thực Thần & Thương Quan): Tài Năng, Khẩu Tài & Đổi Mới',
      evaluation: `Thực Thương là trí tuệ phát tiết ra bên ngoài qua tài ăn nói, khiếu nghệ thuật, năng lực đổi mới sáng tạo và gu thẩm mỹ tinh tế. Thực Thần đôn hậu phúc thọ, Thương Quan sắc sảo nhạy bén phá vỡ lối mòn.`,
      guidance: 'Khai thác tối đa năng lực truyền cảm hứng và sáng tạo, tránh kiêu ngạo tự phụ, rèn luyện tính kiên nhẫn để chuyển hóa ý tưởng thành hiện thực.',
    },
    tyKiep: {
      title: 'Tỷ Kiếp (Tỷ Kiên & Kiếp Tài): Ý Chí Tự Lập, Tình Huynh Đệ & Cạnh Tranh',
      evaluation: `Tỷ Kiếp là điểm tựa bản lĩnh kiên cường, lòng tự tôn và ý chí vượt khó không đầu hàng nghịch cảnh. Đồng thời đại diện cho bạn bè, cộng sự đồng cam cộng khổ trên thương trường.`,
      guidance: 'Chọn bạn mà chơi, phân định rạch ròi giữa tình cảm và tiền bạc trong hợp tác làm ăn, lấy sự chân thành làm cầu nối bền vững.',
    },
  };

  // 6. Thần Sát
  const shenShaList = calculateShenSha(snapshot);

  // 7. Thập Niên Đại Vận
  const decadals = calculateDecadalPillars(snapshot).map((d) => ({
    step: d.step,
    ageRange: d.ageRange,
    stemBranch: d.stemBranchLabel,
    tenGod: d.tenGod,
    element: d.element,
    lifeStage: d.lifeStage,
    summary: d.fortuneSummary,
  }));

  // 8. Vận Hạn 2026 Bính Ngọ
  const year2026Forecast = evaluateYear2026(snapshot, usefulGodsData);
  const months2026 = calculate12Months2026(dmStem).map((m) => ({
    month: m.lunarMonth,
    canChi: m.monthCanChi,
    element: m.element,
    ratingScore: m.ratingScore,
    headline: m.headline,
    guidance: m.actionGuidance,
  }));

  // 9. Chiến lược Cải Vận & Phong Thủy Dụng Thần
  const yongElem = usefulGodsData.yongShen.element;
  const colorMap: Record<string, string[]> = {
    wood: ['Xanh lá cây', 'Xanh lục bảo', 'Xanh ngọc bích', 'Màu vân gỗ'],
    fire: ['Đỏ son', 'Hồng cánh sen', 'Cam san hô', 'Tím hoàng gia'],
    earth: ['Vàng hoàng yến', 'Nâu đất', 'Vàng hổ phách', 'Cà phê'],
    metal: ['Trắng tinh khiết', 'Bạc ánh kim', 'Vàng kim loại', 'Xám khói'],
    water: ['Đen tuyền', 'Xanh dương thẫm', 'Xanh lam biển sâu', 'Xanh tím than'],
  };

  const dirMap: Record<string, string[]> = {
    wood: ['Hướng Đông', 'Hướng Đông Nam'],
    fire: ['Hướng Nam'],
    earth: ['Hướng Tây Nam', 'Hướng Đông Bắc', 'Trung Cung'],
    metal: ['Hướng Tây', 'Hướng Tây Bắc'],
    water: ['Hướng Bắc'],
  };

  const numMap: Record<string, string[]> = {
    wood: ['Số 3', 'Số 8'],
    fire: ['Số 2', 'Số 7'],
    earth: ['Số 5', 'Số 0'],
    metal: ['Số 4', 'Số 9'],
    water: ['Số 1', 'Số 6'],
  };

  const careerMap: Record<string, string[]> = {
    wood: ['Giáo dục & Đào tạo', 'Nông nghiệp sạch & Lâm nghiệp', 'Thiết kế thời trang', 'Văn hóa nghệ thuật', 'Xuất bản sách báo'],
    fire: ['Công nghệ cao & Trí tuệ nhân tạo', 'Năng lượng & Điện lực', 'Truyền thông & Giải trí', 'Quảng cáo & Sự kiện', 'Ẩm thực cao cấp'],
    earth: ['Bất động sản & Điền sản', 'Kiến trúc & Xây dựng', 'Quản lý kho vận lưu trữ', 'Khai khoáng & Vật liệu', 'Gốm sứ & Điêu khắc'],
    metal: ['Tài chính & Ngân hàng', 'Cơ khí chính xác & Chế tạo', 'Kinh doanh kim hoàn trang sức', 'Luật & Thẩm phán', 'An ninh quốc phòng'],
    water: ['Thương mại quốc tế & Xuất nhập khẩu', 'Logistics & Vận tải biển', 'Du lịch khách sạn', 'Thủy sản & Đồ uống', 'Tâm lý học & Tư vấn'],
  };

  return {
    userName,
    genderText,
    solarDateText,
    lunarDateText,
    birthHourText,
    dayMasterText: dmName,
    dayMasterElement: dmElemName,
    dayMasterPolarity: dmEval.dayMasterYinYang === 'yang' ? 'Dương Can' : 'Âm Can',
    dayMasterStrength: dmEval.status,
    pillars: defaultPillars,
    extraPillars,
    fiveElements: {
      wood: fiveElementsScore.wood,
      fire: fiveElementsScore.fire,
      earth: fiveElementsScore.earth,
      metal: fiveElementsScore.metal,
      water: fiveElementsScore.water,
      percentages: fiveElementsScore.percentages,
      summaryText,
    },
    usefulGods: {
      yongShen: {
        name: usefulGodsData.yongShen.name,
        role: usefulGodsData.yongShen.role,
        desc: usefulGodsData.yongShen.description,
      },
      xiShen: {
        name: usefulGodsData.xiShen.name,
        desc: usefulGodsData.xiShen.description,
      },
      jiShen: {
        name: usefulGodsData.jiShen.name,
        desc: usefulGodsData.jiShen.description,
      },
      chouShen: {
        name: usefulGodsData.chouShen.name,
        desc: usefulGodsData.chouShen.description,
      },
      diaoHou: {
        name: usefulGodsData.diaoHouShen.name,
        reason: usefulGodsData.diaoHouShen.seasonReason,
      },
    },
    tenGodsAnalysis,
    shenShaList,
    decadals,
    yearly2026: {
      yearCanChi: year2026Forecast.yearCanChi,
      yearNaYin: year2026Forecast.yearNaYin,
      tenGod: year2026Forecast.tenGodOfYear,
      dayMasterRelation: year2026Forecast.dayMasterRelation,
      branchInteractions: year2026Forecast.branchInteractions.map((bi) => ({
        type: bi.type,
        pillar: bi.targetPillar,
        desc: bi.description,
      })),
      rating: year2026Forecast.overallRating,
      career: year2026Forecast.careerForecast,
      wealth: year2026Forecast.wealthForecast,
      love: year2026Forecast.loveForecast,
      health: year2026Forecast.healthForecast,
      remedy: year2026Forecast.remedyAdvice,
      months: months2026,
    },
    remedies: {
      luckyColors: colorMap[yongElem] || ['Vàng hoàng yến', 'Đỏ son'],
      luckyDirections: dirMap[yongElem] || ['Hướng Nam', 'Hướng Đông'],
      luckyNumbers: numMap[yongElem] || ['Số 3', 'Số 8'],
      careerSectors: careerMap[yongElem] || ['Tài chính', 'Công nghệ'],
      mindsetAdvice:
        'Cổ nhân dạy: "Tận nhân lực, tri thiên mệnh". Bát Tự là tấm bản đồ thời tiết của đời người, còn tay chèo nằm ở ý chí và đạo đức của đương số. Thường xuyên tích lũy âm đức, đối đãi chân thành khoan dung, hành sự thuận theo lẽ trời đất thì ắt họa lùi phúc tới, cơ đồ vững như bàn thạch.',
    },
  };
}
