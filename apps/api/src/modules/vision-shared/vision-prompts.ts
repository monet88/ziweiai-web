import type { VisionKind } from '@ziweiai/contracts';

/**
 * US-017e/f: prompt người dùng (promptOverride) cho luận giải vision Xem Tướng / Xem Tay.
 *
 * Port phần CỐT LÕI prompt từ .ref/taibu/src/lib/divination/{face,palm}.ts nhưng viết hoàn toàn bằng
 * tiếng Việt (bất biến 0 chữ Hán — system prompt EXPLANATION_SYSTEM_PROMPT đã ép tiếng Việt + chốt
 * giọng + mục "## Tóm lại"; CJK guard ở provider từ chối nếu lọt chữ Hán). Chỉ port luận giải, KHÔNG
 * port annual-report/share/history nâng cao (Non-Goals E17).
 *
 * Lưu ý đạo đức (giữ từ taibu): không chẩn đoán y tế, không phán xét ngoại hình, giọng tham khảo -
 * tích cực. Đường vision đặt persona + nhiệm vụ vào user prompt; ảnh đính kèm qua imageInput.
 */

const FACE_PERSONA = [
  'Bạn là chuyên gia nhân tướng học, đọc nét mặt theo tướng pháp phương Đông truyền thống.',
  'Phân tích dựa trên đặc điểm khuôn mặt thấy được trong ảnh; diễn giải tính cách và vận thế một cách gợi mở.',
  'Nguyên tắc: KHÔNG chẩn đoán bệnh tật hay sức khỏe; KHÔNG bình phẩm đẹp/xấu; tôn trọng người trong ảnh.',
  'Nếu thấy thuận lợi hay bất lợi đều nêu kèm gợi ý cải thiện tích cực; nhấn mạnh "tướng tùy tâm sinh".',
].join(' ');

const PALM_PERSONA = [
  'Bạn là chuyên gia xem chỉ tay, kết hợp thủ tướng học phương Đông và phương Tây.',
  'Phân tích dựa trên các đường chỉ tay và gò bàn tay thấy được trong ảnh; diễn giải một cách gợi mở.',
  'Nguyên tắc: KHÔNG chẩn đoán bệnh tật; giọng tham khảo - tích cực; chỉ tay thay đổi theo thời gian, phản ánh trạng thái hiện tại.',
].join(' ');

const FACE_STRUCTURE = [
  'Hãy phân tích theo cấu trúc sau, mỗi mục một đoạn ngắn dễ hiểu:',
  '1. Ấn tượng tổng thể.',
  '2. Tam đình (vùng trán, vùng giữa mặt, vùng cằm) và ngũ quan (lông mày, mắt, mũi, miệng, tai).',
  '3. Luận về tính cách và xu hướng vận thế (sự nghiệp, tình cảm, tài lộc) ở mức gợi mở.',
  '4. Gợi ý điều chỉnh tích cực.',
].join('\n');

const PALM_STRUCTURE = [
  'Hãy phân tích theo cấu trúc sau, mỗi mục một đoạn ngắn dễ hiểu:',
  '1. Ấn tượng tổng thể về dáng tay.',
  '2. Ba đường chính (đường sinh đạo, đường trí đạo, đường tâm đạo) và các đường phụ thấy được.',
  '3. Luận về tính cách và xu hướng vận thế (sức khỏe tổng quát ở mức gợi mở, sự nghiệp, tình cảm).',
  '4. Gợi ý điều chỉnh tích cực.',
].join('\n');

/** Dựng user prompt cho luận giải vision theo loại (face/palm) + câu hỏi tuỳ chọn của người dùng. */
export function buildVisionUserPrompt(kind: VisionKind, question?: string): string {
  const persona = kind === 'face' ? FACE_PERSONA : PALM_PERSONA;
  const structure = kind === 'face' ? FACE_STRUCTURE : PALM_STRUCTURE;
  const subject = kind === 'face' ? 'khuôn mặt' : 'lòng bàn tay';

  const lines = [
    persona,
    '',
    `Hãy phân tích tấm ảnh ${subject} được đính kèm.`,
    structure,
  ];

  const trimmedQuestion = question?.trim();
  if (trimmedQuestion) {
    lines.push('', `Câu hỏi người dùng đặc biệt quan tâm: ${trimmedQuestion}`);
  }

  lines.push(
    '',
    'Nếu ảnh không đủ rõ hoặc góc chụp không phù hợp, hãy nói rõ cần tấm ảnh như thế nào thay vì suy đoán.',
  );

  return lines.join('\n');
}
