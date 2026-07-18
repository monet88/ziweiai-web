import {
  translateBaziKey,
  type BaziChart,
  type BaziFiveElementKey,
  type BaziHeavenlyStemKey,
  type MangpaiChart,
} from '@ziweiai/contracts';
import { baziBranchElementByKey, baziStemElementByKey } from './adapters/bazi-maps';

// Lớp luận giải Mạnh Phái (US-017d, decision 0012) đặt trên Bát Tự, "trọng nhật chủ": lấy
// nhật can làm trục, đối chiếu với hành lệnh tháng (nguyệt lệnh) để định cường/nhược rồi gợi ý
// dụng thần. Toàn bộ là tiếng Việt deterministic — KHÔNG dịch verbatim khẩu quyết Hán của taibu
// (tránh rò chữ Hán + sai nghĩa), thay vào đó suy luận từ cấu trúc can-chi đã chuẩn hóa. Cùng
// input → cùng kết quả (thuần hàm, không thời gian/ngẫu nhiên).

// Ngũ hành tương sinh: mộc→hỏa→thổ→kim→thủy→mộc.
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

// Hành sinh ra hành đích (nghịch của ELEMENT_SHENG) — dùng tìm "ấn" (hành sinh phù nhật chủ).
const ELEMENT_GENERATED_BY: Record<BaziFiveElementKey, BaziFiveElementKey> = {
  fire: 'wood',
  earth: 'fire',
  metal: 'earth',
  water: 'metal',
  wood: 'water',
};

// Bản chất nhật chủ theo từng thiên can (âm/dương + ngũ hành), diễn đạt theo lối Mạnh Phái.
const DAY_MASTER_NATURE_VI: Record<BaziHeavenlyStemKey, string> = {
  jiaHeavenly: 'Dương Mộc như cây cổ thụ vươn thẳng — chí tiến thủ, cương trực, ưa dẫn dắt.',
  yiHeavenly: 'Âm Mộc như hoa cỏ dây leo — mềm dẻo, thích nghi, bền bỉ trước nghịch cảnh.',
  bingHeavenly: 'Dương Hỏa như mặt trời — nhiệt thành, lan tỏa, hào sảng và thẳng thắn.',
  dingHeavenly: 'Âm Hỏa như ngọn đèn — tinh tế, ấm áp, chuyên chú và sâu sắc.',
  wuHeavenly: 'Dương Thổ như núi đồi — vững chãi, bao dung, đáng tin và điềm tĩnh.',
  jiHeavenly: 'Âm Thổ như ruộng vườn — nuôi dưỡng, khéo léo, thực tế và nhẫn nại.',
  gengHeavenly: 'Dương Kim như kim loại thô — quả quyết, mạnh mẽ, trọng nghĩa khí.',
  xinHeavenly: 'Âm Kim như ngọc trang sức — sắc bén, cầu toàn, coi trọng danh dự.',
  renHeavenly: 'Dương Thủy như sông biển — linh hoạt, bao quát, giàu mưu lược.',
  guiHeavenly: 'Âm Thủy như mưa sương — thầm lặng, nhạy bén, kiên nhẫn và tinh tường.',
};

function elementLabel(element: BaziFiveElementKey): string {
  return translateBaziKey(element);
}

type StrengthRelation = 'same' | 'generated' | 'leaking' | 'controllingOut' | 'controlledBy';

// Quan hệ giữa hành lệnh tháng (month) và nhật chủ (day) quyết định nhật chủ vượng hay nhược.
function strengthRelation(monthElement: BaziFiveElementKey, dayElement: BaziFiveElementKey): StrengthRelation {
  if (monthElement === dayElement) return 'same'; // đắc lệnh (tỷ kiếp)
  if (ELEMENT_SHENG[monthElement] === dayElement) return 'generated'; // được nguyệt lệnh sinh (ấn)
  if (ELEMENT_SHENG[dayElement] === monthElement) return 'leaking'; // nhật chủ sinh lệnh (thực thương, tiết khí)
  if (ELEMENT_KE[dayElement] === monthElement) return 'controllingOut'; // nhật chủ khắc lệnh (tài)
  return 'controlledBy'; // lệnh khắc nhật chủ (quan sát)
}

interface StrengthVerdict {
  isStrong: boolean;
  heading: string;
  detail: string;
}

function assessStrength(
  relation: StrengthRelation,
  monthElement: BaziFiveElementKey,
  dayElement: BaziFiveElementKey,
): StrengthVerdict {
  const monthLabel = elementLabel(monthElement);
  const dayLabel = elementLabel(dayElement);
  switch (relation) {
    case 'same':
      return {
        isStrong: true,
        heading: 'Cường nhược: thân vượng (đắc lệnh)',
        detail: `Nhật chủ ${dayLabel} cùng hành với lệnh tháng ${monthLabel}, được nguyệt lệnh trợ lực nên thân vượng, chủ động và có sức bền.`,
      };
    case 'generated':
      return {
        isStrong: true,
        heading: 'Cường nhược: thân vượng (được sinh phù)',
        detail: `Lệnh tháng ${monthLabel} sinh cho nhật chủ ${dayLabel}, nguồn lực dồi dào nên thân tương đối vượng, dễ được nâng đỡ.`,
      };
    case 'leaking':
      return {
        isStrong: false,
        heading: 'Cường nhược: thân nhược (tiết khí)',
        detail: `Nhật chủ ${dayLabel} sinh xuất cho lệnh tháng ${monthLabel}, khí lực bị hao tiết nên thân thiên nhược, cần được bồi bổ.`,
      };
    case 'controllingOut':
      return {
        isStrong: false,
        heading: 'Cường nhược: thân nhược (hao vì khắc xuất)',
        detail: `Nhật chủ ${dayLabel} khắc lệnh tháng ${monthLabel}, phải hao sức điều khiển nên thân thiên nhược nếu thiếu trợ lực.`,
      };
    default:
      return {
        isStrong: false,
        heading: 'Cường nhược: thân nhược (bị chế)',
        detail: `Lệnh tháng ${monthLabel} khắc nhật chủ ${dayLabel}, chịu áp lực từ nguyệt lệnh nên thân nhược, cần ấn tỷ hóa giải.`,
      };
  }
}

// Gợi ý dụng thần: thân nhược ưa hành sinh phù (ấn) và hành đồng loại (tỷ kiếp); thân vượng ưa
// hành tiết tú (thực thương), hành nhật chủ khắc (tài) và hành khắc nhật chủ (quan sát).
function suggestFavorable(isStrong: boolean, dayElement: BaziFiveElementKey): string {
  if (!isStrong) {
    const resourceElement = elementLabel(ELEMENT_GENERATED_BY[dayElement]);
    const peerElement = elementLabel(dayElement);
    return `Thân nhược nên lấy ${resourceElement} (ấn, sinh phù) và ${peerElement} (tỷ kiếp, đồng loại) làm hỷ dụng để củng cố gốc.`;
  }
  const outputElement = elementLabel(ELEMENT_SHENG[dayElement]);
  const wealthElement = elementLabel(ELEMENT_KE[dayElement]);
  return `Thân vượng nên dùng ${outputElement} (thực thương, tiết tú) và ${wealthElement} (tài, để nhật chủ phát huy) làm hỷ dụng, tránh trợ thêm cho thân.`;
}

/**
 * Suy ra luận giải Mạnh Phái từ tứ trụ đã tính. Nhật trụ là trụ thứ 3 (slot 'day'); nguyệt
 * lệnh lấy hành của địa chi tháng (trụ thứ 2). Hàm thuần, deterministic theo `bazi`.
 */
export function analyzeMangpaiReading(bazi: BaziChart): MangpaiChart {
  const dayPillar = bazi.pillars[2];
  const monthPillar = bazi.pillars[1];
  const dayStemKey = dayPillar.heavenlyStemKey;
  const dayBranchKey = dayPillar.earthlyBranchKey;
  const dayMasterElement = baziStemElementByKey[dayStemKey];
  const monthCommandElement = baziBranchElementByKey[monthPillar.earthlyBranchKey];

  const relation = strengthRelation(monthCommandElement, dayMasterElement);
  const verdict = assessStrength(relation, monthCommandElement, dayMasterElement);

  const stemLabel = translateBaziKey(dayStemKey);
  const branchLabel = translateBaziKey(dayBranchKey);
  const dayElementLabel = elementLabel(dayMasterElement);

  const title = `Nhật chủ ${stemLabel} ${dayElementLabel} tọa chi ${branchLabel}`;
  const natureDetail = DAY_MASTER_NATURE_VI[dayStemKey];
  const favorableDetail = suggestFavorable(verdict.isStrong, dayMasterElement);

  const narrative =
    `Theo phép Mạnh Phái lấy nhật chủ làm trọng, lá số này luận quanh ${stemLabel} ${dayElementLabel}. ` +
    `${natureDetail} ${verdict.detail} ${favorableDetail}`;

  return {
    dayPillarHeavenlyStemKey: dayStemKey,
    dayPillarEarthlyBranchKey: dayBranchKey,
    dayMasterElementKey: dayMasterElement,
    monthCommandElementKey: monthCommandElement,
    title,
    narrative,
    insights: [
      { heading: 'Nhật chủ', detail: `${stemLabel} ${dayElementLabel}: ${natureDetail}` },
      { heading: verdict.heading, detail: verdict.detail },
      { heading: 'Dụng thần gợi ý', detail: favorableDetail },
    ],
  };
}
