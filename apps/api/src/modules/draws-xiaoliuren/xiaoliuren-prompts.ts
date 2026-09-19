import type { XiaoLiuRenCalculationResult } from '@ziweiai/astro-engine';

/**
 * Xây dựng user prompt tiếng Việt cho LLM luận giải quẻ Tiểu Lục Nhâm.
 * Tuyệt đối 0 chữ Hán.
 */
export function buildXiaoLiuRenPrompt(result: XiaoLiuRenCalculationResult): string {
  const methodLabel = result.method === 'time' ? 'Bấm độn theo thời khắc (Lục Nhâm thời khóa)' : 'Bấm độn theo ba con số';
  const { firstPalace, secondPalace, targetPalace } = result;

  return [
    'Bạn đang luận giải một quẻ bấm độn Tiểu Lục Nhâm (phương pháp bấm quẻ trên bàn tay truyền thống) cho người dùng.',
    'Nguyên tắc: Tiểu Lục Nhâm quyết việc mau lẹ, trực chỉ cát hung, lấy Quẻ Chủ (Cung thứ ba) làm kết quả then chốt; hai cung đầu là dòng chuyển biến của khí.',
    '',
    `Câu hỏi của người dùng: ${result.question}`,
    `Phương pháp gieo: ${methodLabel}.`,
    result.lunarDateSummary ? `Thời điểm: ${result.lunarDateSummary}.` : `Ba số gieo: ${result.numbers.join(' - ')}.`,
    '',
    'Diễn biến ba cung vị:',
    `1. Cung khởi điểm: [${firstPalace.name}] (${firstPalace.auspiceLabel}) — Hành ${firstPalace.element}, phương ${firstPalace.direction}, thần sát ${firstPalace.deity}.`,
    `   Ý nghĩa: ${firstPalace.meaning}`,
    `2. Cung chuyển hóa: [${secondPalace.name}] (${secondPalace.auspiceLabel}) — Hành ${secondPalace.element}, phương ${secondPalace.direction}, thần sát ${secondPalace.deity}.`,
    `   Ý nghĩa: ${secondPalace.meaning}`,
    `3. Quẻ Chủ (Kết quả cuối cùng): [${targetPalace.name}] (${targetPalace.auspiceLabel}) — Hành ${targetPalace.element}, phương ${targetPalace.direction}, thần sát ${targetPalace.deity}.`,
    `   Ý nghĩa: ${targetPalace.meaning}`,
    `   Thơ quyết: "${targetPalace.poem}"`,
    `   Lời khuyên: ${targetPalace.advice}`,
    '',
    `Dòng khí ngũ hành: ${result.flowDescription}`,
    '',
    'QUY TẮC LUẬN GIẢI:',
    '- Trực diện: Trả lời thẳng vào câu hỏi của người dùng (thuận hay nghịch, nhanh hay chậm, nên làm hay nên hoãn).',
    '- Phân tích Quẻ Chủ: Khai thác ý nghĩa của quẻ chủ kết hợp phương hướng và thần sát (ví dụ: Thanh Long = hỷ khánh, Bạch Hổ = cẩn trọng thị phi...).',
    '- Luận dòng chuyển biến: Từ cung đầu qua cung giữa tới quẻ kết quả để người hỏi thấy được xu hướng phát triển sự việc.',
    '- Lời khuyên hành động rõ ràng, thiết thực, tránh lời mơ hồ vô nghĩa.',
    '- Kết cấu bài đọc (khoảng 300-500 từ):',
    '  + Phán đoán tổng quan cát hung',
    '  + Luận giải chi tiết sự vụ theo câu hỏi',
    '  + Diễn biến và ứng kỳ / thời cơ',
    '  + ## Tóm lại: Lời khuyên trọng tâm và 1 hành động có thể làm ngay',
  ].join('\n');
}
