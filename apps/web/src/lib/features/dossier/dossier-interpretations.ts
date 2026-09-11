import type { ChartSnapshot } from '@ziweiai/contracts';
import { translateBaziKey } from '@ziweiai/contracts';
import { formatStructuredLunarDate } from '$lib/features/chart/chart-display';

export interface PalaceDossierData {
  index: number;
  name: string;
  earthlyBranch: string;
  heavenlyStem: string;
  isBody: boolean;
  majorStars: { name: string; brightness?: string; mutagen?: string }[];
  goodStars: string[];
  badStars: string[];
  neutralStars: string[];
  essenceReading: string;
  opportunityReading: string;
  warningReading: string;
  guidanceReading: string;
}

export interface DossierInterpretationPayload {
  userName: string;
  genderText: string;
  solarDateText: string;
  lunarDateText: string;
  destinyElementText: string;
  fiveElementsClassText: string;
  destinyYinYangText: string;
  bodyPalaceText: string;
  masterStarText: string;
  bodyMasterStarText: string;
  baziYear: string;
  baziMonth: string;
  baziDay: string;
  baziHour: string;
  palaces: PalaceDossierData[];
  overviewReading: string;
  decadalSummary: { ageRange: string; palaceName: string; branchName: string; stars: string }[];
  yearly2026: {
    yearCanChi: string;
    thaiTuePalace: string;
    kinhDuongBranch: string;
    daLaBranch: string;
    tangMonBranch: string;
    bachHoBranch: string;
    analysis: string;
    advice: string;
  };
}

const BRIGHTNESS_MAP: Record<string, string> = {
  miao: 'Miếu',
  wang: 'Vượng',
  de: 'Đắc',
  li: 'Lợi',
  ping: 'Bình',
  bu: 'Bất',
  xian: 'Hãm',
};

const MUTAGEN_MAP: Record<string, string> = {
  lu: 'Hóa Lộc',
  quyen: 'Hóa Quyền',
  khoa: 'Hóa Khoa',
  ky: 'Hóa Kỵ',
};

const PALACE_PURPOSE_MAP: Record<string, { role: string; focus: string }> = {
  'Mệnh': { role: 'Bản Cung Gốc Rễ', focus: 'Tính cách, cốt cách, khí chất tiên thiên và tổng hòa vận mệnh đời người' },
  'Huynh Đệ': { role: 'Cung Tình Thân', focus: 'Mối quan hệ ruột thịt anh em, bạn bè tri kỷ và nền tảng hỗ trợ hậu thuẫn' },
  'Phu Thê': { role: 'Cung Duyên Nợ', focus: 'Nhân duyên phối ngẫu, hôn nhân gia đạo, tình cảm sắt son và thời điểm kết tóc' },
  'Tử Tức': { role: 'Cung Hậu Duệ', focus: 'Con cái, truyền thừa phúc trạch dòng dõi, phúc phận về già và giáo dưỡng gia phong' },
  'Tài Bạch': { role: 'Cung Kim Ngân', focus: 'Dòng tiền, của cải tài lộc, năng lực quản lý tài chính và phương thức tích lũy phú quý' },
  'Tật Ách': { role: 'Cung Khang Kiện', focus: 'Tạng phủ ngũ hành, sức khỏe thể chất, nguy cơ tai ương tiềm ẩn và phép dưỡng sinh' },
  'Thiên Di': { role: 'Cung Xuất Ngoại', focus: 'Giao tế xã hội, hành trang xuất hành, vị thế ngoài xã hội và vận số phương xa' },
  'Nô Bộc': { role: 'Cung Giao Hữu', focus: 'Bằng hữu, cấp dưới, cộng sự đồng hành, quý nhân phò trợ hay tiểu nhân quấy nhiễu' },
  'Giao Hữu': { role: 'Cung Giao Hữu', focus: 'Bằng hữu, cấp dưới, cộng sự đồng hành, quý nhân phò trợ hay tiểu nhân quấy nhiễu' },
  'Quan Lộc': { role: 'Cung Sự Nghiệp', focus: 'Công danh chức nghiệp, địa vị xã hội, khát vọng thăng tiến và thành tựu đỉnh cao' },
  'Điền Trạch': { role: 'Cung Cơ Nghiệp', focus: 'Nhà cửa đất đai, bất động sản thừa kế, phong thủy nơi an cư và sản nghiệp lưu truyền' },
  'Phúc Đức': { role: 'Cung Cội Nguồn', focus: 'Phúc ấm tổ tiên dòng họ, thọ yểu, an lạc tâm hồn và nền tảng cứu giải tai ương' },
  'Phụ Mẫu': { role: 'Cung Sinh Thành', focus: 'Ân đức cha mẹ, dưỡng dục thuở thiếu thời, phúc trạch song thân và gia đạo gốc tích' },
};

export function buildDossierData(snapshot: ChartSnapshot, userNameInput?: string): DossierInterpretationPayload {
  const summary: any = snapshot.summary || {};
  const birth: any = snapshot.birth || {};

  const name = userNameInput || birth.name || 'Đương Số Hoàng Triều';
  const gender = birth.gender === 'male' ? 'Nam Mạng' : (birth.gender === 'female' ? 'Nữ Mạng' : 'Bản Mệnh');

  const resolvedDate = birth.resolvedDateTime?.date;
  const solarDate =
    summary.solarDate ||
    birth.solarDate ||
    (resolvedDate ? `${resolvedDate.day}/${resolvedDate.month}/${resolvedDate.year}` : 'N/A');

  const rawLunar = summary.lunarDate || birth.lunarDate;
  const lunarDate = (rawLunar ? formatStructuredLunarDate(rawLunar) : '') || 'N/A';

  const fiveElements = summary.destinyElement || summary.fiveElements || 'Chưa định';
  const fiveElementsClass = summary.fiveElementsClass || 'N/A';
  const destinyYinYang = summary.destinyYinYang || 'Âm Dương Thuận Lý';
  const bodyPalace = summary.bodyPalace || 'Cung Mệnh';
  const masterStar = summary.destinyMaster || summary.masterStar || 'Tử Vi';
  const bodyMasterStar = summary.bodyMaster || summary.bodyMasterStar || 'Thiên Tướng';

  const extractPillar = (p: any) => {
    if (!p) return 'N/A';
    if (typeof p === 'string') return p;
    return p.stemBranch || p.name || JSON.stringify(p);
  };

  const baziPillars = snapshot.bazi?.pillars;
  const rawYear = extractPillar(summary.yearPillar);
  const baziYear = rawYear !== 'N/A'
    ? rawYear
    : (baziPillars?.[0] ? `${translateBaziKey(baziPillars[0].heavenlyStemKey)} ${translateBaziKey(baziPillars[0].earthlyBranchKey)}` : 'N/A');

  const rawMonth = extractPillar(summary.monthPillar);
  const baziMonth = rawMonth !== 'N/A'
    ? rawMonth
    : (baziPillars?.[1] ? `${translateBaziKey(baziPillars[1].heavenlyStemKey)} ${translateBaziKey(baziPillars[1].earthlyBranchKey)}` : 'N/A');

  const rawDay = extractPillar(summary.dayPillar);
  const baziDay = rawDay !== 'N/A'
    ? rawDay
    : (baziPillars?.[2] ? `${translateBaziKey(baziPillars[2].heavenlyStemKey)} ${translateBaziKey(baziPillars[2].earthlyBranchKey)}` : 'N/A');

  const rawHour = extractPillar(summary.hourPillar);
  const baziHour = rawHour !== 'N/A'
    ? rawHour
    : (baziPillars?.[3] ? `${translateBaziKey(baziPillars[3].heavenlyStemKey)} ${translateBaziKey(baziPillars[3].earthlyBranchKey)}` : 'N/A');

  // Map 12 Palaces
  const palaces: PalaceDossierData[] = (snapshot.palaces || []).map((p: any, idx: number) => {
    const palaceName = p.displayName || p.name || `Cung ${idx + 1}`;
    const branch = (p.earthlyBranchKey || '').replace(/^earthlyBranch_?/, '').replace(/^.*_/, '');
    const stem = (p.heavenlyStemKey || '').replace(/^heavenlyStem_?/, '').replace(/^.*_/, '');
    const isBody = Boolean(p.isBodyPalace);

    const majorStars: { name: string; brightness?: string; mutagen?: string }[] = (p.majorStars || []).map((s: any) => ({
      name: s.displayName || s.name || s.nameKey,
      brightness: s.brightnessKey ? BRIGHTNESS_MAP[s.brightnessKey] || s.brightnessKey : undefined,
      mutagen: s.mutagenKey ? MUTAGEN_MAP[s.mutagenKey] || s.mutagenKey : undefined,
    }));

    const minorStars = (p.minorStars || []).map((s: any) => s.displayName || s.name || s.nameKey);
    const adjectiveStars = (p.adjectiveStars || []).map((s: any) => s.displayName || s.name || s.nameKey);

    const goodStars: string[] = [];
    const badStars: string[] = [];
    const neutralStars: string[] = [];

    const GOOD_KEYWORDS = ['Khoa', 'Quyền', 'Lộc', 'Khôi', 'Việt', 'Xương', 'Khúc', 'Tả', 'Hữu', 'Đào', 'Hồng', 'Hỷ', 'Ân Quang', 'Thiên Quý', 'Long', 'Phượng', 'Giải Thần', 'Thái Tuế', 'Thiên Mã', 'Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa'];
    const BAD_KEYWORDS = ['Kình', 'Đà', 'Hỏa', 'Linh', 'Không', 'Kiếp', 'Tang', 'Hổ', 'Khốc', 'Hư', 'Thiên Hình', 'Thiên Riêu', 'Hóa Kỵ', 'Kỵ', 'Cô Thần', 'Quả Tú', 'Đại Hao', 'Tiểu Hao', 'Tử Phù', 'Trực Phù'];

    [...minorStars, ...adjectiveStars].forEach((starName: string) => {
      if (GOOD_KEYWORDS.some((k) => starName.includes(k))) {
        goodStars.push(starName);
      } else if (BAD_KEYWORDS.some((k) => starName.includes(k))) {
        badStars.push(starName);
      } else {
        neutralStars.push(starName);
      }
    });

    const purpose = PALACE_PURPOSE_MAP[palaceName] || { role: 'Cung Vị Trọng Yếu', focus: 'Vận trình tương tác' };

    const majorStarNames = majorStars
      .map((s: { name: string; brightness?: string; mutagen?: string }) => `${s.name}${s.brightness ? ` (${s.brightness})` : ''}${s.mutagen ? ` [${s.mutagen}]` : ''}`)
      .join(', ');
    const starSummary = majorStarNames.length > 0 ? majorStarNames : 'Vô Chính Diệu (mượn lực xung chiếu)';

    const essenceReading = `Cung ${palaceName} tọa tại phương vị chi ${branch.toUpperCase()}, giữ trọng trách ${purpose.role}. Chủ sự về: ${purpose.focus}. Cung vị hội tụ các vì tinh tú: ${starSummary}. ${isBody ? 'Đặc biệt cung này đồng thời là THÂN CƯ, phản ánh hậu vận từ trung niên trở đi sẽ gắn liền chặt chẽ với những biến chuyển tại đây.' : 'Cung vị này định hình cung bậc cuộc sống từ sớm, đóng vai trò nền tảng trong mạng lưới tam phương tứ chính.'}`;

    const opportunityReading = `Về mặt vận hội và tiềm năng: ${goodStars.length > 0 ? `Sự hiện diện của các cát tinh như ${goodStars.slice(0, 4).join(', ')} mang lại phúc khí cát tường, trợ lực mạnh mẽ trong việc hanh thông đường lối.` : 'Tuy không có nhiều đại cát tinh phụ tá nhưng thế cờ thanh nhã, phù hợp phát triển thực lực tự thân một cách kiên trì.'} Những cơ hội lớn thường mở ra khi bước vào các lưu niên tương hợp với can chi ${stem.toUpperCase()} ${branch.toUpperCase()}.`;

    const warningReading = `Về mặt rủi ro và cạm bẫy: ${badStars.length > 0 ? `Cung vị gặp phải sự giao tranh của hung sát tinh như ${badStars.slice(0, 4).join(', ')}. Cần hết sức thận trọng trước sự bộc phát nóng vội, thị phi khẩu thiệt hoặc những trở lực bất ngờ khi gặp vận suy.` : 'Các sát tinh bàng đạo không đáng ngại, song không nên chủ quan khi gặp các năm xung thái tuế.'}`;

    const guidanceReading = `Kim chỉ nam Khâm Thiên Giám: Cần lấy chữ "Nhẫn" làm đầu, biết nhu biết cương tùy thời thế. Kích hoạt tài vận và bình an bằng cách tu dưỡng tâm tính, giữ gìn hòa khí và hành sự cẩn trọng trên mọi quyết định then chốt liên quan đến lĩnh vực của cung ${palaceName}.`;

    return {
      index: idx,
      name: palaceName,
      earthlyBranch: branch,
      heavenlyStem: stem,
      isBody,
      majorStars,
      goodStars,
      badStars,
      neutralStars,
      essenceReading,
      opportunityReading,
      warningReading,
      guidanceReading,
    };
  });

  // Decadal summary
  const decadalSummary = palaces.map((p) => ({
    ageRange: `${(p.index * 10) + 2} - ${(p.index * 10) + 11} tuổi`,
    palaceName: p.name,
    branchName: p.earthlyBranch,
    stars: p.majorStars.map((s) => s.name).join(', ') || 'Vô Chính Diệu',
  }));

  const overviewReading = `Đương số ${name}, bản mệnh ${fiveElements}, nạp âm ${fiveElementsClass}, thụ bẩm linh khí trời đất với cách cục ${destinyYinYang}. Chủ Mệnh là ${masterStar}, Chủ Thân là ${bodyMasterStar}, đóng tại ${bodyPalace}. Đây là kết cấu tinh bàn có sự quân bình giữa lý trí và trực cảm. Khi thời vận tương phùng, đương số có khả năng nắm bắt cơ hội lớn để kiến tạo sự nghiệp bền vững.`;

  const yearly2026 = {
    yearCanChi: 'Bính Ngọ (2026)',
    thaiTuePalace: 'Cung Ngọ (Phương Nam Hỏa Vượng)',
    kinhDuongBranch: 'Thìn',
    daLaBranch: 'Dần',
    tangMonBranch: 'Thân',
    bachHoBranch: 'Dần',
    analysis: `Năm Bính Ngọ 2026 thuộc hành Hỏa (Thiên Hà Hỏa). Lưu Thái Tuế tọa tại cung Ngọ kích hoạt luồng năng lượng biến động mạnh mẽ về danh vọng và công việc. Lưu Tang Môn tại Thân và Lưu Bạch Hổ tại Dần cảnh báo các biến chuyển trong gia đạo và sức khỏe, đòi hỏi sự trầm tĩnh trước mọi xung đột.`,
    advice: `Năm 2026 nên chú trọng phòng thủ tài chính, tránh đầu tư mạo hiểm vào các tháng giữa năm. Ưu tiên trau dồi chuyên môn, mở rộng mạng lưới giao hảo thiện lành và làm việc thiện để tích lũy phúc đức hóa giải hung sát.`,
  };

  return {
    userName: name,
    genderText: gender,
    solarDateText: solarDate,
    lunarDateText: lunarDate,
    destinyElementText: fiveElements,
    fiveElementsClassText: fiveElementsClass,
    destinyYinYangText: destinyYinYang,
    bodyPalaceText: bodyPalace,
    masterStarText: masterStar,
    bodyMasterStarText: bodyMasterStar,
    baziYear,
    baziMonth,
    baziDay,
    baziHour,
    palaces,
    overviewReading,
    decadalSummary,
    yearly2026,
  };
}
