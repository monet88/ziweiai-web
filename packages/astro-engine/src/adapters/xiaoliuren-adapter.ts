import {
  XIAO_LIU_REN_PALACES,
  type XiaoLiuRenMethod,
  type XiaoLiuRenPalace,
} from '@ziweiai/contracts';
import { Solar } from 'lunar-javascript';

export { XIAO_LIU_REN_PALACES };

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
