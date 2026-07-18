import type { LenormandSpread } from '@ziweiai/contracts';
import type { LenormandCardDraw } from './lenormand-deck';

// US-037: prompt builder tiếng Việt cho bài đọc Lenormand bằng LLM. Lá + bố cục đã là tiếng Việt
// (dataset B6-0); builder lo CẤU TRÚC bài đọc + quy tắc luận giải, phong cách + cấm chữ Hán do
// EXPLANATION_SYSTEM_PROMPT + CJK guard ở provider chốt. Khớp khuôn tarot-prompts.

type DrawnCard = LenormandCardDraw & { position: number; positionLabel: string };

export const LENORMAND_SPREAD_LABELS_VI: Record<LenormandSpread, string> = {
  single: 'trải bài một lá',
  three: 'trải bài ba lá (chuỗi sự kiện)',
  relationship: 'trải bài mối quan hệ (5 lá)',
  decision: 'trải bài lựa chọn (6 lá)',
  nine: 'trải bài Cửu cung (9 lá)',
};

function describeCard(card: DrawnCard): string {
  const orientation = card.reversed ? 'ngược' : 'xuôi';
  return `${card.position + 1}. [${card.positionLabel}] ${card.name} (${card.keywords.join(', ')}) — ${orientation}: ${card.meaning}`;
}

/**
 * Dựng user-prompt tiếng Việt cho một lượt rút Lenormand. Lenormand đọc theo cụm/cặp lá kề nhau
 * (không đơn lẻ như Tarot); prompt nhấn mạnh quy tắc ghép lá + bám bố cục.
 */
export function buildLenormandReadingPrompt(
  question: string,
  spread: LenormandSpread,
  cards: ReadonlyArray<DrawnCard>,
): string {
  const cardLines = cards.map(describeCard);
  const isMultiCard = cards.length > 1;

  return [
    'Bạn đang đọc một quẻ Lenormand cho người dùng. Lenormand là hệ bói bài thực tế, đọc theo cụm lá kề nhau và bám sát đời sống cụ thể, không tiên tri số phận cố định.',
    '',
    `Câu hỏi của người dùng: ${question}`,
    `Kiểu trải bài: ${LENORMAND_SPREAD_LABELS_VI[spread]}.`,
    '',
    'Các lá đã rút (theo thứ tự vị trí, kèm từ khóa + xuôi/ngược + nghĩa nền):',
    ...cardLines,
    '',
    'QUY TẮC LUẬN GIẢI (bám sát):',
    '- Đọc mỗi lá theo đúng vai trò vị trí của nó trong bố cục, gắn nghĩa nền của lá với câu hỏi.',
    '- Lá ngược đọc như năng lượng bị chặn/hướng vào trong/cần điều chỉnh, KHÔNG mặc định là xấu.',
    ...(isMultiCard
      ? ['- Lenormand đọc theo CỤM: ghép nghĩa các lá kề nhau thành câu chuyện liền mạch, nêu rõ quan hệ nhân-quả giữa chúng.']
      : []),
    '- Chống nói chung chung (Barnum): mọi gợi ý phải cụ thể về thời gian + hành động.',
    '- Trao quyền chủ động: lá bài phản ánh năng lượng hiện tại, lựa chọn của người hỏi luôn đổi được hướng.',
    '- Ranh giới an toàn: không chẩn đoán y tế, tư vấn pháp lý, khuyến nghị đầu tư, hay quyết định trọng đại thay người hỏi.',
    '',
    'CẤU TRÚC BÀI ĐỌC (Markdown, khoảng 300-600 từ):',
    '- Mở đầu: tổng quan năng lượng của quẻ và cách nó soi vào câu hỏi.',
    '- Đọc từng lá theo vị trí, gắn với đời sống thực.',
    ...(isMultiCard ? ['- Ghép cụm lá: dòng chảy câu chuyện từ lá đầu tới lá cuối.'] : []),
    '- Kết bài: dùng đúng tiêu đề "## Tóm lại" với 3-5 câu chốt ý + một hành động nhỏ rõ ràng làm được ngay + một câu hỏi mở trao lại quyền quyết định.',
  ].join('\n');
}
