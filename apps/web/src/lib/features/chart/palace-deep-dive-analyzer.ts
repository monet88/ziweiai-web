import type { PalaceView } from './palace-view-builder';
import type { PalaceDeepDiveAnalysis } from '@ziweiai/contracts';

export function analyzePalace360(
  targetPalace: PalaceView,
  allPalaces: PalaceView[],
): PalaceDeepDiveAnalysis {
  // Sắp xếp các cung theo thứ tự 12 địa chi hoặc index
  const sorted = [...allPalaces].sort((a, b) => a.index - b.index);
  const targetIdx = sorted.findIndex((p) => p.nameKey === targetPalace.nameKey);
  const safeIdx = targetIdx >= 0 ? targetIdx : 0;

  // 1. Tìm cung Xung Chiếu (cách 6 cung)
  const oppPalace = sorted[(safeIdx + 6) % 12] || targetPalace;

  // 2. Tìm 2 cung Tam Hợp (cách 4 và 8 cung)
  const trine1Palace = sorted[(safeIdx + 4) % 12] || targetPalace;
  const trine2Palace = sorted[(safeIdx + 8) % 12] || targetPalace;

  // 3. Tìm 2 cung Giáp sườn (cách -1 và +1 cung)
  const flank1Palace = sorted[(safeIdx + 11) % 12] || targetPalace;
  const flank2Palace = sorted[(safeIdx + 1) % 12] || targetPalace;

  // Rút trích Tứ Hóa
  const mutagens: string[] = [];
  targetPalace.majorStars.concat(targetPalace.minorStars).forEach((s) => {
    if (s.mutagen) mutagens.push(`${s.name} (${s.mutagen})`);
  });

  // Tính điểm Vượng Khí (vigorScore)
  let vigor = 60;
  targetPalace.majorStars.forEach((s) => {
    const b = s.brightness?.toLowerCase() || '';
    if (b.includes('miếu') || b.includes('vượng')) vigor += 10;
    else if (b.includes('đắc')) vigor += 5;
    else if (b.includes('hãm')) vigor -= 8;
  });

  targetPalace.minorStars.concat(targetPalace.adjectiveStars).forEach((s) => {
    const name = s.name.toLowerCase();
    if (
      name.includes('lộc') ||
      name.includes('khoa') ||
      name.includes('quyền') ||
      name.includes('tả phù') ||
      name.includes('hữu bật') ||
      name.includes('văn xương') ||
      name.includes('văn khúc')
    ) {
      vigor += 4;
    }
    if (
      name.includes('kình dương') ||
      name.includes('đà la') ||
      name.includes('hỏa tinh') ||
      name.includes('linh tinh') ||
      name.includes('địa không') ||
      name.includes('địa kiếp') ||
      name.includes('hóa kỵ')
    ) {
      vigor -= 6;
    }
  });

  const finalVigor = Math.max(25, Math.min(96, vigor));

  // Tạo lời khuyên Cải Vận & Phong Thủy theo cung vị
  const remedy = buildRemedyAdvice(targetPalace, finalVigor);

  // Soạn bài thính luận Audio Advisor
  const mainStarsText =
    targetPalace.majorStars.length > 0
      ? targetPalace.majorStars.map((s) => `${s.name} ${s.brightness ? `(${s.brightness})` : ''}`).join(', ')
      : 'Vô chính diệu, mượn chính tinh từ cung đối chiếu';

  const audioNarrativeScript = `Kính thưa quý nhân, đây là bản Thính Luận Hoàng Triều 360 độ cho cung ${targetPalace.name}. Cung vị an tại địa chi ${targetPalace.stemBranch}, nạp âm tương hợp. Về chính diệu: Cung hội tụ các đại tinh ${mainStarsText}. Về tam phương tứ chính: Cung xung chiếu là ${oppPalace.name} hội chiếu lực lượng hỗ trợ đối ngoại; hai cung tam hợp là ${trine1Palace.name} và ${trine2Palace.name} tạo thế kiềng ba chân vững chắc. Điểm vượng khí tổng hòa đạt ${finalVigor} điểm trên thang bách phân. Về phương diện hành động: ${remedy.energySummary} ${remedy.actionAdvice[0] || ''} Lời khuyên phong thủy: ${remedy.fengShuiTips[0] || ''}. Kính chúc quý nhân thuận thời đắc thế!`;

  return {
    palaceKey: targetPalace.nameKey,
    palaceNameVi: targetPalace.name,
    earthlyBranch: targetPalace.earthlyBranchKey,
    heavenlyStem: targetPalace.stemBranch,
    isBodyPalace: targetPalace.isBodyPalace,
    isOriginalPalace: targetPalace.isOriginalPalace,
    mutagensInPalace: mutagens,
    vigorScore: finalVigor,
    aspects: {
      opposite: {
        nameKey: oppPalace.nameKey,
        nameVi: oppPalace.name,
        earthlyBranch: oppPalace.earthlyBranchKey,
        mainStars: oppPalace.majorStars.map((s) => s.name),
      },
      trine1: {
        nameKey: trine1Palace.nameKey,
        nameVi: trine1Palace.name,
        earthlyBranch: trine1Palace.earthlyBranchKey,
        mainStars: trine1Palace.majorStars.map((s) => s.name),
      },
      trine2: {
        nameKey: trine2Palace.nameKey,
        nameVi: trine2Palace.name,
        earthlyBranch: trine2Palace.earthlyBranchKey,
        mainStars: trine2Palace.majorStars.map((s) => s.name),
      },
      flanking: [
        {
          nameKey: flank1Palace.nameKey,
          nameVi: flank1Palace.name,
          earthlyBranch: flank1Palace.earthlyBranchKey,
          keyStars: flank1Palace.majorStars.concat(flank1Palace.minorStars).slice(0, 3).map((s) => s.name),
        },
        {
          nameKey: flank2Palace.nameKey,
          nameVi: flank2Palace.name,
          earthlyBranch: flank2Palace.earthlyBranchKey,
          keyStars: flank2Palace.majorStars.concat(flank2Palace.minorStars).slice(0, 3).map((s) => s.name),
        },
      ],
    },
    remedy,
    audioNarrativeScript,
  };
}

function buildRemedyAdvice(palace: PalaceView, _vigor: number) {
  const pName = palace.name.toLowerCase();

  if (pName.includes('mệnh') || pName.includes('thân')) {
    return {
      energySummary: 'Bản cung chủ về định hướng khí chất, ý chí và nhân cách cốt lõi.',
      actionAdvice: [
        'Giữ tâm thế kiên định, phát huy triệt để ưu thế của bộ chính tinh thủ mệnh.',
        'Hạn chế bộc trực khi gặp sát tinh; trau dồi tri thức và mở rộng tầm nhìn đường dài.',
      ],
      fengShuiTips: [
        'Bố trí bàn làm việc nhìn về hướng cát khí, giữ không gian phía sau có điểm tựa vững chãi.',
        'Sử dụng các vật phẩm phong thủy trầm tích ngũ hành hòa hợp để định tâm an định.',
      ],
      luckyElements: {
        colors: ['Vàng kim hoàng gia', 'Xanh lam ngọc bích'],
        directions: ['Đông Nam', 'Chính Bắc'],
      },
    };
  }

  if (pName.includes('tài')) {
    return {
      energySummary: 'Bản cung quản lý dòng lưu chuyển tài lộc, tích lũy điền sản và phương thức giữ của.',
      actionAdvice: [
        'Ưu tiên đa dạng hóa nguồn thu, phân bổ tài sản thành các lớp phòng thủ an toàn.',
        'Tránh đầu tư mạo hiểm khi lưu niên gặp sát tinh xung chiếu; đề cao tích lũy dài hạn.',
      ],
      fengShuiTips: [
        'Đặt góc tài lộc (Tụ Bảo Bồn) tại cung Đông Nam hoặc Tây Bắc trong phòng khách.',
        'Giữ ví tiền và két sắt ngăn nắp, tránh để tiền tài ở vị trí ẩm thấp xung sát.',
      ],
      luckyElements: {
        colors: ['Vàng hổ phách', 'Xanh lục phỉ thúy'],
        directions: ['Đông Nam', 'Tây Nam'],
      },
    };
  }

  if (pName.includes('quan')) {
    return {
      energySummary: 'Bản cung chi phối đường công danh, vị thế xã hội và uy quyền sự nghiệp.',
      actionAdvice: [
        'Xây dựng thương hiệu cá nhân uy tín, tập trung vào kỹ năng chuyên sâu mang giá trị cốt lõi.',
        'Học cách điều phối đội ngũ và mở rộng mạng lưới quý nhân hỗ trợ trong công việc.',
      ],
      fengShuiTips: [
        'Bàn làm việc nên đặt tháp Văn Xương hoặc ấn rồng để tăng cường trường khí quyền lực.',
        'Ánh sáng khu vực làm việc phải đủ dương khí, tránh ngồi quay lưng ra cửa sổ.',
      ],
      luckyElements: {
        colors: ['Đỏ chu sa', 'Tím hoàng gia'],
        directions: ['Chính Nam', 'Chính Đông'],
      },
    };
  }

  if (pName.includes('phu') || pName.includes('thê')) {
    return {
      energySummary: 'Bản cung phản ánh nhân duyên, sự đồng hành tâm linh và hòa khí gia đạo.',
      actionAdvice: [
        'Lắng nghe và tôn trọng sự khác biệt của đối phương, lấy nhu thắng cương.',
        'Cùng chia sẻ mục tiêu tài chính và nuôi dạy con cái để tạo sợi dây gắn kết bền chặt.',
      ],
      fengShuiTips: [
        'Phòng ngủ giữ năng lượng êm dịu, sử dụng cặp đèn ngủ hoặc tranh uyên ương.',
        'Tránh gương chiếu thẳng vào đầu giường để tâm trí luôn an nhiên, hòa hợp.',
      ],
      luckyElements: {
        colors: ['Hồng phấn', 'Trắng ngà tinh khôi'],
        directions: ['Tây Nam', 'Chính Tây'],
      },
    };
  }

  // Mặc định cho các cung khác (Thiên Di, Tật Ách, Phúc Đức, Điền Trạch...)
  return {
    energySummary: `Bản cung ${palace.name} phản ánh trường khí chuyên biệt ảnh hưởng đến vận thế đương số.`,
    actionAdvice: [
      'Nắm bắt chu kỳ sinh khắc của tinh bàn, hành động thuận theo thời vận.',
      'Tích lũy phúc đức, hành thiện tích đức để chuyển hóa hung họa thành cát tường.',
    ],
    fengShuiTips: [
      'Duy trì không gian sống thông thoáng, đón ánh sáng tự nhiên đầy đủ.',
      'Sử dụng cây xanh phong thủy để thanh lọc trường năng lượng xung quanh.',
    ],
    luckyElements: {
      colors: ['Vàng hoàng thổ', 'Xanh lam ngọc'],
      directions: ['Đông Bắc', 'Chính Bắc'],
    },
  };
}
