import type {
  XiaoLiuRenMethod,
  XiaoLiuRenPalace,
} from '@ziweiai/contracts';
import { Solar } from 'lunar-javascript';

export interface XiaoLiuRenCalculationResult {
  question: string;
  method: XiaoLiuRenMethod;
  numbers: [number, number, number];
  firstPalace: XiaoLiuRenPalace;
  secondPalace: XiaoLiuRenPalace;
  targetPalace: XiaoLiuRenPalace;
  flowDescription: string;
  lunarDateSummary?: string;
  deterministicNarrative: string;
}

export interface CalculateXiaoLiuRenInput {
  question: string;
  method?: XiaoLiuRenMethod;
  numbers?: [number, number, number];
  date?: Date;
}

export const XIAO_LIU_REN_PALACES: readonly XiaoLiuRenPalace[] = [
  {
    key: 'dai_an',
    index: 0,
    name: 'Đại An',
    element: 'Mộc',
    direction: 'Đông',
    auspice: 'dai_cat',
    auspiceLabel: 'Đại Cát',
    deity: 'Thanh Long',
    meaning: 'Thân tâm an định, mưu sự vững bền, cầu tài ở phương Đông. Mọi sự bình an, lấy tĩnh chế động.',
    poem: 'Đại An sự sự xương, cầu mưu tại đông phương. Thất vật khứ bất viễn, trạch xá bảo an khang. Hành nhân thân vị động, bệnh giả chủ vô phương.',
    advice: 'Giữ vững tâm thế tĩnh tại, kiên định với mục tiêu đã định. Thuận theo tự nhiên, không nên nóng vội thay đổi.',
  },
  {
    key: 'luu_nien',
    index: 1,
    name: 'Lưu Niên',
    element: 'Thủy',
    direction: 'Bắc',
    auspice: 'binh',
    auspiceLabel: 'Bình (Thứ Hung)',
    deity: 'Huyền Vũ',
    meaning: 'Dây dưa chậm trễ, sự việc kéo dài chưa rõ hồi kết. Việc quan nên hoãn, người đi xa chưa về.',
    poem: 'Lưu Niên sự nan thành, cầu mưu nhật vị minh. Quan sự phàm nghi hoãn, khứ giả vị hồi trình. Thất vật nam phương kiến, cấp thảo phương tâm xưng.',
    advice: 'Kiên nhẫn chờ thời, không nên cưỡng cầu đốt cháy giai đoạn. Kiểm tra kỹ kế hoạch, đề phòng khẩu thiệt thị phi.',
  },
  {
    key: 'toc_hy',
    index: 2,
    name: 'Tốc Hỷ',
    element: 'Hỏa',
    direction: 'Nam',
    auspice: 'cat',
    auspiceLabel: 'Cát',
    deity: 'Chu Tước',
    meaning: 'Niềm vui đến mau, tin mừng báo hỷ, mưu sự cầu tài hướng Nam có lộc. Diễn tiến nhanh chóng, khởi sắc.',
    poem: 'Tốc Hỷ hỷ lai lâm, cầu tài hướng nam hành. Thất vật thân mùi ngọ, phùng nhân lộ thượng tầm. Quan sự hữu phúc đức, bệnh giả vô họa xâm.',
    advice: 'Nắm bắt thời cơ chớp nhoáng, hành động quyết đoán không chần chừ. Lan tỏa tinh thần tích cực và chia sẻ niềm vui.',
  },
  {
    key: 'xich_khau',
    index: 3,
    name: 'Xích Khẩu',
    element: 'Kim',
    direction: 'Tây',
    auspice: 'hung',
    auspiceLabel: 'Hung',
    deity: 'Bạch Hổ',
    meaning: 'Chủ về khẩu thiệt tranh chấp, thị phi, kiện tụng hoặc bất hòa. Mưu sự dễ gặp trở ngại, kinh hoảng.',
    poem: 'Xích Khẩu chủ khẩu thiệt, quan phi thiết nghi phòng. Thất vật tốc tốc thảo, hành nhân hữu kinh hoang. Lục súc đa tác quái, bệnh giả xuất tây phương.',
    advice: 'Cẩn trọng lời ăn tiếng nói, nhẫn nhịn tránh đôi co tranh cãi. Giữ mình kín kẽ, phòng ngừa rủi ro tranh chấp pháp lý.',
  },
  {
    key: 'tieu_cat',
    index: 4,
    name: 'Tiểu Cát',
    element: 'Mộc',
    direction: 'Tây Nam',
    auspice: 'tieu_cat',
    auspiceLabel: 'Tiểu Cát',
    deity: 'Lục Hợp',
    meaning: 'Gặp điều tốt lành, hòa hợp, có quý nhân tương trợ. Mưu sự thuận hòa, đón nhận tin vui hoặc cơ hội hợp tác.',
    poem: 'Tiểu Cát tối cát xương, lộ thượng hảo thương lượng. Âm nhân lai báo hỷ, thất vật tại khôn phương. Hành nhân lập tiện chí, giao quan thậm thị cường.',
    advice: 'Tích cực giao lưu kết nối, tìm kiếm sự đồng thuận và hợp tác đôi bên cùng có lợi. Lấy chân thành làm gốc.',
  },
  {
    key: 'khong_vong',
    index: 5,
    name: 'Không Vong',
    element: 'Thổ',
    direction: 'Trung ương',
    auspice: 'dai_hung',
    auspiceLabel: 'Đại Hung',
    deity: 'Câu Trần',
    meaning: 'Trống rỗng, hư hao, mưu sự khó thành, tin tức bặt tăm. Tránh xuất tiền lớn hoặc khởi sự mạo hiểm.',
    poem: 'Không Vong sự bất tường, âm nhân đa quái trương. Cầu tài vô lợi ích, hành nhân hữu tai ương. Thất vật tầm bất kiến, quan sự hữu hình thương.',
    advice: 'Thu liễm phòng thủ, bảo toàn lực lượng. Không nên đầu tư mạo hiểm hay cưỡng cầu lúc này; hãy bình tâm tu dưỡng.',
  },
] as const;

export const SHICHEN_NAMES_VI = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
] as const;

/**
 * Quy đổi giờ dương lịch (0-23) sang chỉ số canh giờ âm lịch (1-12, Tý=1..Hợi=12).
 */
export function hourToShichenIndex(hour: number): number {
  if (hour >= 23 || hour < 1) return 1;
  return Math.floor((hour + 1) / 2) + 1;
}

/**
 * Phân tích tương tác ngũ hành giữa 2 cung (sinh, khắc, tị hòa).
 */
const ELEMENT_GENERATING_MAP: Readonly<Record<string, string>> = {
  Mộc: 'Hỏa',
  Hỏa: 'Thổ',
  Thổ: 'Kim',
  Kim: 'Thủy',
  Thủy: 'Mộc',
};

const ELEMENT_OVERCOMING_MAP: Readonly<Record<string, string>> = {
  Mộc: 'Thổ',
  Thổ: 'Thủy',
  Thủy: 'Hỏa',
  Hỏa: 'Kim',
  Kim: 'Mộc',
};

function getElementRelation(elem1: string, elem2: string): string {
  if (elem1 === elem2) return 'tị hòa (đồng hành)';
  if (ELEMENT_GENERATING_MAP[elem1] === elem2) return `${elem1} sinh ${elem2} (sinh xuất)`;
  if (ELEMENT_GENERATING_MAP[elem2] === elem1) return `${elem2} sinh ${elem1} (sinh nhập)`;
  if (ELEMENT_OVERCOMING_MAP[elem1] === elem2) return `${elem1} khắc ${elem2} (khắc xuất)`;
  if (ELEMENT_OVERCOMING_MAP[elem2] === elem1) return `${elem2} khắc ${elem1} (khắc nhập)`;
  return 'bình hòa';
}

/**
 * Thuật toán bấm độn Tiểu Lục Nhâm:
 * - Cung 1: (num1 - 1) % 6
 * - Cung 2: (cung1 + num2 - 1) % 6
 * - Cung 3 (chủ): (cung2 + num3 - 1) % 6
 */
export function calculateXiaoLiuRen(input: CalculateXiaoLiuRenInput): XiaoLiuRenCalculationResult {
  const method = input.method ?? 'time';
  let numbers: [number, number, number];
  let lunarDateSummary: string | undefined;

  if (method === 'numbers' && input.numbers && input.numbers.length === 3) {
    numbers = [input.numbers[0], input.numbers[1], input.numbers[2]];
  } else {
    const targetDate = input.date ?? new Date();
    const solar = Solar.fromYmdHms(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      targetDate.getDate(),
      targetDate.getHours(),
      targetDate.getMinutes(),
      targetDate.getSeconds(),
    );
    const lunar = solar.getLunar();
    const lunarMonth = Math.abs(lunar.getMonth());
    const lunarDay = lunar.getDay();
    const hour = targetDate.getHours();
    const shichenIdx = hourToShichenIndex(hour); // 1..12

    numbers = [lunarMonth, lunarDay, shichenIdx];
    const shichenName = SHICHEN_NAMES_VI[shichenIdx - 1];
    lunarDateSummary = `Tháng ${lunarMonth} ngày ${lunarDay} âm lịch, giờ ${shichenName} (${String(hour).padStart(2, '0')}:${String(targetDate.getMinutes()).padStart(2, '0')})`;
  }

  const [n1, n2, n3] = numbers;
  const idx1 = ((n1 - 1) % 6 + 6) % 6;
  const idx2 = ((idx1 + n2 - 1) % 6 + 6) % 6;
  const idx3 = ((idx2 + n3 - 1) % 6 + 6) % 6;

  const firstPalace = XIAO_LIU_REN_PALACES[idx1];
  const secondPalace = XIAO_LIU_REN_PALACES[idx2];
  const targetPalace = XIAO_LIU_REN_PALACES[idx3];

  const rel1to2 = getElementRelation(firstPalace.element, secondPalace.element);
  const rel2to3 = getElementRelation(secondPalace.element, targetPalace.element);

  const flowDescription =
    `Dòng khí chuyển hóa qua 3 cung: Cung đầu [${firstPalace.name} - ${firstPalace.element}] ` +
    `đến Cung giữa [${secondPalace.name} - ${secondPalace.element}] (${rel1to2}), ` +
    `rồi hội tụ tại Quẻ chủ [${targetPalace.name} - ${targetPalace.element}] (${rel2to3}).`;

  const deterministicNarrative =
    `Câu hỏi: ${input.question.trim()}.\n\n` +
    `Quẻ chủ bấm độn Tiểu Lục Nhâm được [${targetPalace.name}] (${targetPalace.auspiceLabel}).\n` +
    `- Ngũ hành & Phương vị: Hành ${targetPalace.element}, phương ${targetPalace.direction}, thần sát ${targetPalace.deity} chủ sự.\n` +
    `- Ý nghĩa: ${targetPalace.meaning}\n` +
    `- Thơ quyết: "${targetPalace.poem}"\n` +
    `- Lời khuyên: ${targetPalace.advice}\n` +
    `- Diễn biến: ${flowDescription}`;

  return {
    question: input.question.trim(),
    method,
    numbers,
    firstPalace,
    secondPalace,
    targetPalace,
    flowDescription,
    lunarDateSummary,
    deterministicNarrative,
  };
}
