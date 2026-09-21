import type { ChuVanVuongCalculationResult } from '@ziweiai/astro-engine';

/**
 * Xây dựng prompt luận giải quẻ Chu Văn Vương (64 quẻ thần đoán).
 * Tuân thủ bất biến tiếng Việt thuần túy, 0 chữ Hán.
 */
export function buildChuVanVuongPrompt(result: ChuVanVuongCalculationResult): string {
  const { hexagram, question, method } = result;
  const methodLabel =
    method === 'coins'
      ? 'Gieo tiền xu truyền thống (6 lần tung đồng xu)'
      : method === 'numbers'
        ? 'Chọn hai số thượng hạ quẻ'
        : 'Chọn quẻ trực tiếp';

  return [
    'Bạn đang luận giải một quẻ Chu Văn Vương (64 quẻ thần đoán Kinh Dịch truyền thống) cho người dùng.',
    'Nguyên tắc: Chu Văn Vương quẻ dịch dự đoán cát hung sự vụ rõ ràng, thấu suốt lý lẽ âm dương, chỉ rõ cơ hội và rủi ro trên 4 bình diện then chốt: Tài lộc, Công danh, Gia đạo, Sức khỏe.',
    '',
    `Câu hỏi của người dùng: "${question}"`,
    `Phương pháp gieo: ${methodLabel}`,
    `Quẻ gieo được: Quẻ số ${hexagram.id} - ${hexagram.name} (${hexagram.nature})`,
    `Điềm quẻ: ${hexagram.omenLabel}`,
    `Cấu trúc quái: Thượng quái ${hexagram.upperTrigram} • Hạ quái ${hexagram.lowerTrigram}`,
    `Ý nghĩa quẻ: ${hexagram.meaning}`,
    `Thi ca chiêm đoán: "${hexagram.poem}"`,
    '',
    'Chỉ dẫn truyền thống theo từng bình diện:',
    `- Tài Lộc: ${hexagram.domains.taiLoc}`,
    `- Công Danh: ${hexagram.domains.congDanh}`,
    `- Gia Đạo: ${hexagram.domains.giaDao}`,
    `- Sức Khỏe: ${hexagram.domains.sucKhoe}`,
    `- Lời khuyên hành động cốt lõi: ${hexagram.advice}`,
    '',
    'QUY TẮC LUẬN GIẢI CHO BẠN:',
    '1. Trực diện: Trả lời thẳng vào câu hỏi của người dùng dựa trên điềm quẻ (Đại Cát, Cát, Bình Hòa, Hung, Đại Hung) và cấu trúc thượng/hạ quái.',
    '2. Thấu tình đạt lý: Kết hợp ý nghĩa quẻ và thi ca chiêm đoán để phân tích cội nguồn vấn đề, xu hướng biến chuyển và những yếu tố ẩn giấu.',
    '3. Chi tiết theo 4 phương diện nhưng tập trung sâu nhất vào phương diện liên quan đến câu hỏi của người hỏi.',
    '4. Hành động cụ thể: Đưa ra lời khuyên thực tế, tỉnh táo, tránh ngôn từ thần bí hù dọa hoặc hứa hẹn viển vông.',
    '5. Định dạng Markdown rõ ràng, hành văn trong sáng, dễ đọc (khoảng 350-500 từ).',
  ].join('\n');
}
