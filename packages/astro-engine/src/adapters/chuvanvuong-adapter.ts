import {
  CHU_VAN_VUONG_HEXAGRAMS,
  type ChuVanVuongHexagram,
  type ChuVanVuongMethod,
} from '@ziweiai/contracts';

export interface CalculateChuVanVuongInput {
  question: string;
  method?: ChuVanVuongMethod;
  numbers?: [number, number];
  coins?: number[];
  hexagramId?: number;
  date?: Date;
}

export interface ChuVanVuongCalculationResult {
  question: string;
  method: ChuVanVuongMethod;
  hexagram: ChuVanVuongHexagram;
  numbers?: [number, number];
  coins?: number[];
  deterministicNarrative: string;
  summary: string;
}

/**
 * Ma trận 64 quẻ Kinh Dịch theo thứ tự Chu Văn Vương (King Wen Sequence).
 * Hàng = Thượng quái, Cột = Hạ quái.
 * Thứ tự quái 0..7: Càn (0), Đoài (1), Ly (2), Chấn (3), Tốn (4), Khảm (5), Cấn (6), Khôn (7).
 */
export const KING_WEN_HEXAGRAM_MATRIX: readonly (readonly number[])[] = [
  // Càn, Đoài, Ly, Chấn, Tốn, Khảm, Cấn, Khôn
  [1, 10, 13, 25, 44, 6, 33, 12],   // Càn (0)
  [43, 58, 49, 17, 28, 47, 31, 45],  // Đoài (1)
  [14, 38, 30, 21, 50, 64, 56, 35],  // Ly (2)
  [34, 54, 55, 51, 32, 40, 62, 16],  // Chấn (3)
  [9, 61, 37, 42, 57, 59, 53, 20],   // Tốn (4)
  [5, 60, 63, 3, 48, 29, 39, 8],     // Khảm (5)
  [26, 41, 22, 27, 18, 4, 52, 23],   // Cấn (6)
  [11, 19, 36, 24, 46, 7, 15, 2],    // Khôn (7)
] as const;

export function getHexagramIdFromTrigrams(upperIndex: number, lowerIndex: number): number {
  const normUpper = ((upperIndex % 8) + 8) % 8;
  const normLower = ((lowerIndex % 8) + 8) % 8;
  return KING_WEN_HEXAGRAM_MATRIX[normUpper][normLower];
}

export function calculateChuVanVuong(input: CalculateChuVanVuongInput): ChuVanVuongCalculationResult {
  const question = input.question.trim();
  const method: ChuVanVuongMethod = input.method ?? 'coins';

  let hexagramId = 1;
  let finalNumbers: [number, number] | undefined = input.numbers;
  let finalCoins: number[] | undefined = input.coins;

  if (input.hexagramId && input.hexagramId >= 1 && input.hexagramId <= 64) {
    hexagramId = input.hexagramId;
  } else if (method === 'numbers' && input.numbers && input.numbers.length === 2) {
    const [upperNum, lowerNum] = input.numbers;
    // Bát Quái Tiên Thiên: 1 Càn, 2 Đoài, 3 Ly, 4 Chấn, 5 Tốn, 6 Khảm, 7 Cấn, 8 Khôn
    const upperTrigramIndex = ((upperNum - 1) % 8 + 8) % 8;
    const lowerTrigramIndex = ((lowerNum - 1) % 8 + 8) % 8;
    hexagramId = getHexagramIdFromTrigrams(upperTrigramIndex, lowerTrigramIndex);
    finalNumbers = [upperNum, lowerNum];
  } else if (method === 'coins' && input.coins && input.coins.length === 6) {
    // 6 lần gieo xu: hào 1-3 tạo hạ quái, hào 4-6 tạo thượng quái
    const lowerSum = (input.coins[0] + input.coins[1] + input.coins[2]) % 8;
    const upperSum = (input.coins[3] + input.coins[4] + input.coins[5]) % 8;
    hexagramId = getHexagramIdFromTrigrams(upperSum, lowerSum);
    finalCoins = input.coins;
  } else {
    // Mặc định gieo ngẫu nhiên tất định từ câu hỏi và thời gian
    const now = input.date ?? new Date();
    const seedStr = `${question}_${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}${now.getHours()}${now.getMinutes()}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash);
    hexagramId = (positiveHash % 64) + 1;

    if (method === 'coins') {
      finalCoins = Array.from({ length: 6 }, (_, i) => ((positiveHash >> (i * 2)) & 3) % 4);
    } else if (method === 'numbers') {
      const u = (positiveHash % 8) + 1;
      const l = ((positiveHash >> 3) % 8) + 1;
      finalNumbers = [u, l];
    }
  }

  const hexagram = CHU_VAN_VUONG_HEXAGRAMS[hexagramId - 1] ?? CHU_VAN_VUONG_HEXAGRAMS[0];

  const deterministicNarrative = [
    `### Quẻ Số ${hexagram.id}: ${hexagram.name} (${hexagram.nature})`,
    `**Điềm Quẻ:** ${hexagram.omenLabel}`,
    `**Cấu Trúc Quái:** Thượng quái ${hexagram.upperTrigram} • Hạ quái ${hexagram.lowerTrigram}`,
    '',
    `**Ý Nghĩa:** ${hexagram.meaning}`,
    '',
    '**Thi Ca Chiêm Đoán:**',
    `> *${hexagram.poem}*`,
    '',
    '**Phán Đoán Chi Tiết Theo Bình Diện:**',
    `- **Tài Lộc & Kinh Doanh:** ${hexagram.domains.taiLoc}`,
    `- **Công Danh & Sự Nghiệp:** ${hexagram.domains.congDanh}`,
    `- **Gia Đạo & Tình Duyên:** ${hexagram.domains.giaDao}`,
    `- **Sức Khỏe & Bình An:** ${hexagram.domains.sucKhoe}`,
    '',
    `**Lời Khuyên Hành Động:** ${hexagram.advice}`,
  ].join('\n');

  const summary = `Quẻ số ${hexagram.id} - ${hexagram.name}: ${hexagram.omenLabel}. ${hexagram.meaning}`;

  return {
    question,
    method,
    hexagram,
    numbers: finalNumbers,
    coins: finalCoins,
    deterministicNarrative,
    summary,
  };
}
