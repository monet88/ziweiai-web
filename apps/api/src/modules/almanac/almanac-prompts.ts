import type { AlmanacDayCandidate, AlmanacTopic } from '@ziweiai/contracts';

// US-040: prompt builder tiếng Việt cho luận giải Hoàng lịch (chọn ngày tốt) bằng LLM. Danh sách
// ngày ứng viên (đã là tiếng Việt qua bảng overlay B6-0, đã chấm điểm + sort) đưa vào prompt làm
// cứ liệu cố định; nhiệm vụ LLM là DẪN DẮT việc chọn ngày theo chủ đề người dùng, không đọc máy
// móc lại bảng lịch. Phong cách + cấm chữ Hán do EXPLANATION_SYSTEM_PROMPT + CJK guard ở provider
// chốt. Khớp khuôn tarot/lenormand/dream-prompts.

// Số ngày tốt nhất đưa vào prompt: giữ prompt gọn, ưu tiên các ngày điểm cao đã sort sẵn.
const MAX_DAYS_IN_PROMPT = 8;

function describeDay(day: AlmanacDayCandidate): string {
  const recommends = day.recommends.length > 0 ? day.recommends.slice(0, 8).join(', ') : 'không có ghi nhận';
  const avoids = day.avoids.length > 0 ? day.avoids.slice(0, 8).join(', ') : 'không có ghi nhận';
  const lines = [
    `- ${day.date} (${day.weekday}, ${day.lunarDate}) — điểm ${day.score}/100`,
    `  Can chi ngày: ${day.ganzhi.day}; trực: ${day.dayOfficer}; sao: ${day.twelveStar}/${day.twentyEightStar}; ${day.nineStar}.`,
    `  Nên: ${recommends}.`,
    `  Kỵ: ${avoids}.`,
    `  ${day.clash}.`,
  ];
  if (day.highlights.length > 0) {
    lines.push(`  Điểm cộng: ${day.highlights.join('; ')}.`);
  }
  if (day.cautions.length > 0) {
    lines.push(`  Lưu ý: ${day.cautions.join('; ')}.`);
  }
  return lines.join('\n');
}

export function buildAlmanacSelectionPrompt(params: {
  topic: AlmanacTopic;
  topicLabel: string;
  startDate: string;
  endDate: string;
  days: ReadonlyArray<AlmanacDayCandidate>;
}): string {
  const topDays = params.days.slice(0, MAX_DAYS_IN_PROMPT);

  return [
    'Bạn đang tư vấn chọn ngày tốt theo Hoàng lịch cho người dùng. Hoàng lịch là tham khảo văn hóa truyền thống về nghi/kỵ và thần sát theo ngày, không phải lời phán định đoạt; hãy giúp người dùng cân nhắc và tự quyết định.',
    '',
    `Việc cần chọn ngày: ${params.topicLabel}.`,
    `Khoảng ngày xem xét: ${params.startDate} đến ${params.endDate}.`,
    '',
    'Danh sách ngày ứng viên (đã chấm điểm phù hợp + sắp xếp từ cao xuống thấp, dùng làm cứ liệu, KHÔNG đọc lại máy móc toàn bộ):',
    ...topDays.map(describeDay),
    '',
    'QUY TẮC LUẬN GIẢI (bám sát):',
    '- Tập trung tư vấn cho ĐÚNG việc người dùng cần làm, nối nghi/kỵ của từng ngày với việc đó.',
    '- Tiến cử 2-3 ngày tốt nhất kèm lý do cụ thể (vì sao điểm cao, nên/kỵ gì hợp với việc), và nêu rõ ngày nên tránh nếu có.',
    '- Tôn trọng điểm số và nghi/kỵ đã cho; không tự bịa thêm thần sát hay quy tắc ngoài dữ liệu.',
    '- Chống nói chung chung (Barnum): gắn gợi ý với việc + khoảng thời gian cụ thể của người dùng.',
    '- Trao quyền chủ động: Hoàng lịch là tham khảo, người dùng cân nhắc cả điều kiện thực tế (lịch cá nhân, thời tiết, các bên liên quan) rồi tự quyết.',
    '- Ranh giới an toàn: không chẩn đoán y tế, tư vấn pháp lý, khuyến nghị đầu tư, hay quyết định trọng đại thay người dùng.',
    '',
    'CẤU TRÚC BÀI LUẬN (Markdown, khoảng 300-550 từ):',
    '- Mở đầu: nhận định chung về khoảng ngày cho việc cần làm.',
    '- Tiến cử ngày: nêu 2-3 ngày tốt nhất kèm lý do, và ngày nên tránh.',
    '- Kết bài: dùng đúng tiêu đề "## Tóm lại" với 3-5 câu chốt ý + một bước nhỏ làm được ngay (vd cách sắp lịch) + một câu hỏi mở trao lại quyền quyết định cho người dùng.',
  ].join('\n');
}
