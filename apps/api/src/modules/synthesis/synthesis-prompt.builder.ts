import {
  type ChartSnapshot,
  type AstrologicalSynthesisRequest,
  translateBaziKey,
  formatBaziStemBranchLabel,
} from '@ziweiai/contracts';

function reduceDigits(num: number): number {
  if (num === 0) return 0;
  let current = num;
  while (current > 9 && current !== 11 && current !== 22 && current !== 33) {
    let sum = 0;
    let temp = current;
    while (temp > 0) {
      sum += temp % 10;
      temp = Math.floor(temp / 10);
    }
    current = sum;
  }
  return current;
}

export function calculateQuickLifePath(birthIso: string): number {
  try {
    const parts = birthIso.split('T')[0]?.split('-').map(Number);
    if (!parts || parts.length !== 3 || parts.some(isNaN)) return 7;
    const [y, m, d] = parts as [number, number, number];
    return reduceDigits(reduceDigits(y) + reduceDigits(m) + reduceDigits(d));
  } catch {
    return 7;
  }
}

export function buildSynthesisPrompt(
  snapshot: ChartSnapshot,
  request: AstrologicalSynthesisRequest,
): { systemPrompt: string; userPrompt: string } {
  const birthDate = snapshot.birth?.originalInput?.date;
  const birthDateStr = birthDate
    ? `${birthDate.year}-${String(birthDate.month).padStart(2, '0')}-${String(birthDate.day).padStart(2, '0')}`
    : snapshot.createdAt;
  const lifePath = calculateQuickLifePath(birthDateStr);

  const systemPrompt = [
    'Bạn là Hội Đồng Chiêm Tinh Khâm Thiên Giám Hoàng Gia Đại Việt, bậc thầy thông tuệ kết hợp tinh hoa của 3 đại môn phái:',
    '1. Thiên Đạo — Tử Vi Đẩu Số (Thiên bàn, Thập nhị cung, Chính tinh vương giả).',
    '2. Địa Đạo — Bát Tự Hà Lạc (Tứ trụ, Ngũ hành sinh khắc, Dụng thần cứu giải).',
    '3. Nhân Đạo — Thần Số Học Pythagoras (Con số đường đời, Chu kỳ rung động tâm thức).',
    '',
    'NHIỆM VỤ: Tổng hòa ba môn phái thành Đại Bản Luận Giải "Thiên - Địa - Nhân Tương Ứng".',
    'YÊU CẦU BẮT BUỘC:',
    '- Trả về DUY NHẤT một chuỗi JSON hợp lệ, không chứa ký tự markdown ```json thừa.',
    '- Ngôn ngữ: 100% Tiếng Việt trang nhã, hoàng gia uy nghiêm, sâu sắc nhưng dễ hiểu.',
    '- Tuyệt đối KHÔNG dùng chữ Hán/Trung Quốc.',
    '- Đánh giá khách quan mức độ đồng thuận (consensusScore từ 0 đến 100).',
    '- Chỉ ra điểm tương hỗ (resonance) và điểm mâu thuẫn cần hóa giải (tension resolution).',
  ].join('\n');

  // Trích xuất dữ kiện Tử Vi
  const summaryObj = (snapshot.summary || {}) as Record<string, any>;
  const ziweiData = [
    `Cung Mệnh: ${summaryObj.mingGongLabel || 'Mệnh Cung'} (Chính tinh: ${Array.isArray(summaryObj.majorStars) ? summaryObj.majorStars.join(', ') : 'Đồng độ'})`,
    `Cục & Ngũ hành: ${summaryObj.elementalBureau || 'Hỏa Lục Cục'}`,
    `Cung Thân: ${summaryObj.shenGongLabel || 'Thân cư Phúc Đức'}`,
  ].join('; ');

  // Trích xuất dữ kiện Bát Tự
  let baziData = 'Bát tự: ';
  if (snapshot.bazi) {
    baziData += `Ngày chủ ${translateBaziKey(snapshot.bazi.dayMasterHeavenlyStemKey)}; `;
    baziData += `Tứ trụ: ${snapshot.bazi.pillars.map((p) => `${translateBaziKey(p.slot)}: ${formatBaziStemBranchLabel(p)} (${p.naYin})`).join(', ')}`;
  } else {
    baziData += 'Dựa trên can chi năm tháng ngày giờ sinh hoàng đạo.';
  }

  const userPrompt = [
    'Thông tin lá số chủ mệnh:',
    `Họ tên: ${(snapshot.birth as any)?.fullName || 'Chủ Mệnh'}`,
    `Ngày sinh: ${birthDateStr}`,
    `Giới tính: ${snapshot.birth?.originalInput?.sexOrGenderForChart === 'female' ? 'Nữ mạng' : 'Nam mạng'}`,
    `1. Dữ liệu Tử Vi: ${ziweiData}`,
    `2. Dữ liệu Bát Tự: ${baziData}`,
    `3. Dữ liệu Thần Số Học: Số chủ đạo (Life Path) = ${lifePath}`,
    `Lĩnh vực trọng tâm cần luận giải: ${request.focusAreas.join(', ')}`,
    '',
    'Hãy trả về JSON đúng cấu trúc sau:',
    JSON.stringify({
      consensusScore: 88,
      summary: 'Lời đúc kết sấm truyền tổng quan về vận mệnh thiên - địa - nhân.',
      heavenAspect: {
        title: 'Thiên Đạo • Tinh Tú Tử Vi Chỉ Lối',
        detail: 'Phân tích vị thế các vì tinh tú và trục Mệnh - Thân - Quan - Tài.',
        starsSummary: ['Tử Vi', 'Thiên Phủ', 'Hóa Quyền'],
      },
      earthAspect: {
        title: 'Địa Đạo • Bát Tự Ngũ Hành Vượng Suy',
        detail: 'Phân tích thế cân bằng âm dương ngũ hành và Dụng thần trợ lực.',
        elementsSummary: ['Hỏa vượng sinh Thổ', 'Dụng thần: Thủy', 'Hỷ thần: Kim'],
      },
      humanAspect: {
        title: 'Nhân Đạo • Sóng Rung Số Đạo & Tâm Thức',
        detail: 'Phân tích con số chủ đạo và khả năng chuyển hóa ý chí nội tại.',
        lifePathSummary: `Số chủ đạo ${lifePath}: Sứ mệnh kiến tạo và dẫn dắt.`,
      },
      disciplines: [
        {
          discipline: 'ziwei',
          title: 'Tử Vi Đẩu Số',
          keyFindings: ['Điểm mạnh chính tinh', 'Cung vị nổi bật'],
          elementBalance: 'Ngũ hành tương hợp',
          potentialRisk: 'Điểm lưu tâm',
          opportunity: 'Thời cơ vàng',
        },
        {
          discipline: 'bazi',
          title: 'Bát Tự Tứ Trụ',
          keyFindings: ['Thế ngày chủ', 'Thập thần đắc cách'],
          elementBalance: 'Ngũ hành trợ mệnh',
          potentialRisk: 'Xung khắc can chi',
          opportunity: 'Đại vận khởi sắc',
        },
        {
          discipline: 'numerology',
          title: 'Thần Số Pythagoras',
          keyFindings: ['Bài học đường đời', 'Năng lượng chủ đạo'],
          elementBalance: 'Trường năng lượng',
          potentialRisk: 'Thử thách nội tâm',
          opportunity: 'Đỉnh cao vận số',
        },
      ],
      actionableStrategy: {
        doList: ['Nên tập trung mở rộng chuyên môn', 'Nên đầu tư dài hạn'],
        dontList: ['Tránh hấp tấp vay mượn', 'Không nên nóng giận khởi sự'],
        strategicTiming: 'Giai đoạn quý 3 và quý 4 là thời điểm vàng để hành động.',
        auspiciousElements: ['Màu sắc hợp mệnh: Trắng, Xanh Dương', 'Phương hướng: Chính Bắc'],
      },
    }),
  ].join('\n');

  return { systemPrompt, userPrompt };
}
