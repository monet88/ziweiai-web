import type { TarotSpread } from '@ziweiai/contracts';
import type { TarotCardDraw } from './tarot-deck';

// US-017i: prompt builder tiếng Việt cho luận giải Tarot bằng LLM.
//
// Nội dung phương pháp được CHƯNG CẤT (không sao chép) + dịch sang tiếng Việt từ
// `.ref/tarot-skill/references/*` (card meanings, card relations, spreads, combinations).
// Tuyệt đối 0 chữ Hán: deck (TAROT_DECK) đã dùng nhãn Việt + tên Rider-Waite Latin, system prompt
// EXPLANATION_SYSTEM_PROMPT + CJK guard ở provider chốt thêm bất biến ngôn ngữ. Builder này chỉ
// lo CẤU TRÚC bài đọc (khung "khởi điểm → căng thẳng → chuyển hóa → lối ra → dư âm") và quy tắc
// luận giải; phong cách + ngôn ngữ do system prompt quyết định.

type DrawnCard = TarotCardDraw & { position: number };

// Nhãn vị trí cho từng kiểu trải bài. Index = position của lá rút (0-based).
// three-card: Quá khứ / Hiện tại / Tương lai (đọc chung, phổ biến nhất).
// celtic-cross: 10 vị trí Celtic Cross kinh điển, dịch Việt.
const SPREAD_POSITIONS: Record<TarotSpread, readonly string[]> = {
  'three-card': ['Quá khứ', 'Hiện tại', 'Tương lai'],
  'celtic-cross': [
    'Cốt lõi vấn đề',
    'Thử thách đang cản trở',
    'Mục tiêu/ý thức hướng tới',
    'Nền tảng/quá khứ sâu xa',
    'Quá khứ gần',
    'Tương lai gần',
    'Bản thân bạn lúc này',
    'Môi trường/ảnh hưởng xung quanh',
    'Hy vọng và nỗi sợ',
    'Kết quả có thể tới',
  ],
} as const;

function spreadLabel(spread: TarotSpread): string {
  return spread === 'celtic-cross' ? 'trải bài Celtic Cross (10 lá)' : 'trải bài ba lá';
}

function describeCard(card: DrawnCard, spread: TarotSpread): string {
  const positions = SPREAD_POSITIONS[spread];
  const positionName = positions[card.position] ?? `Vị trí ${card.position + 1}`;
  const orientation = card.reversed ? 'ngược' : 'xuôi';
  return `${card.position + 1}. [${positionName}] ${card.name} — ${orientation}`;
}

/**
 * Dựng user-prompt tiếng Việt cho một lượt rút Tarot.
 *
 * Cung cấp cho LLM: câu hỏi, kiểu trải bài + ý nghĩa từng vị trí, danh sách lá đã rút (kèm
 * xuôi/ngược), và bộ quy tắc luận giải (đọc từng lá, quan hệ giữa các lá, chống Barnum, trao
 * quyền chủ động, ranh giới an toàn). System prompt lo phong cách + cấm chữ Hán + mục "## Tóm lại".
 */
export function buildTarotReadingPrompt(
  question: string,
  spread: TarotSpread,
  cards: ReadonlyArray<DrawnCard>,
): string {
  const cardLines = cards.map((card) => describeCard(card, spread));
  const majorCount = cards.filter((card) => card.id.startsWith('major_')).length;
  const majorRatio = cards.length > 0 ? Math.round((majorCount / cards.length) * 100) : 0;
  const isMultiCard = cards.length > 1;

  return [
    'Bạn đang đọc một quẻ Tarot cho người dùng. Tarot là tấm gương phản chiếu, không phải quả cầu tiên tri: hãy biến mỗi lá bài thành một góc tự quan sát và một bước đi có thể lựa chọn, tuyệt đối không tuyên một số phận cố định.',
    '',
    `Câu hỏi của người dùng: ${question}`,
    `Kiểu trải bài: ${spreadLabel(spread)}.`,
    `Tỉ lệ lá Ẩn Chính (Major Arcana): ${majorRatio}% (${majorCount}/${cards.length} lá).`,
    '',
    'Các lá đã rút (theo thứ tự vị trí, kèm xuôi/ngược):',
    ...cardLines,
    '',
    'QUY TẮC LUẬN GIẢI (bám sát):',
    '- Đọc từng lá theo đúng vị trí của nó trong bố cục: ý nghĩa lá phải gắn với vai trò vị trí (ví dụ lá ở "Thử thách" nói về điều đang cản trở).',
    '- Lá ngược KHÔNG mặc định là xấu: hãy đọc nó như năng lượng bị chặn lại, hướng vào trong, cần điều chỉnh hoặc chưa được nhận ra.',
    '- Lưu ý phân bố nguyên tố theo chất bài: Gậy (Lửa) = hành động/đam mê, Cốc (Nước) = cảm xúc/quan hệ, Kiếm (Khí) = suy nghĩ/giao tiếp, Tiền (Đất) = vật chất/công việc. Một chất bài chiếm đa số cho thấy chủ đề đang nổi trội; chất bài vắng mặt gợi ý mảng đang bị bỏ quên.',
    `- Tỉ lệ lá Ẩn Chính: trên 50% báo một bước ngoặt lớn; khoảng 30-50% là vận mệnh và lựa chọn đan xen; dưới 30% nghĩa là chuyện thường ngày, hãy nhấn mạnh quyền chủ động của người hỏi.`,
    ...(isMultiCard
      ? [
          '- Phân tích quan hệ GIỮA các lá kề nhau theo bốn kiểu: nhân-quả, đối thoại, tiến triển, chuyển hướng. Nêu kết luận rõ ràng, không viết "không áp dụng".',
        ]
      : []),
    '- Chống nói chung chung (Barnum): mọi gợi ý phải cụ thể về thời gian và hành động (ví dụ "trong tuần này hãy nhắn lại tin đó trước thứ Sáu"), tránh những câu vô thưởng vô phạt như "hãy giữ cân bằng, tin vào trực giác, rồi mọi chuyện sẽ ổn".',
    '- Trao quyền chủ động: không dùng "bạn chắc chắn sẽ"; nhắc rằng lá bài chỉ phản ánh năng lượng hiện tại, lựa chọn của người hỏi luôn có thể đổi hướng đi.',
    '- Ranh giới an toàn: không đưa chẩn đoán y tế, tư vấn pháp lý, khuyến nghị đầu tư mua bán, hay quyết định trọng đại thay người hỏi. Nếu câu hỏi lộ ý tự làm hại bản thân, hãy tạm dừng luận giải, nhẹ nhàng khuyên tìm tới người thân tin cậy hoặc đường dây nóng hỗ trợ tâm lý.',
    '',
    'CẤU TRÚC BÀI ĐỌC (Markdown, khoảng 350-650 từ):',
    '- Mở đầu: tổng quan năng lượng của quẻ và cách nó soi vào câu hỏi.',
    '- Đọc từng lá: tên lá, vị trí, xuôi/ngược, thông điệp cốt lõi gắn với đời sống thực.',
    ...(isMultiCard ? ['- Quan hệ giữa các lá: dòng chảy khởi điểm → căng thẳng → chuyển hóa → lối ra → dư âm.'] : []),
    '- Kết bài: dùng đúng tiêu đề "## Tóm lại" với 3-5 câu chốt ý + một hành động nhỏ, rõ ràng có thể làm ngay, và một câu hỏi mở trao lại quyền quyết định cho người hỏi.',
  ].join('\n');
}
