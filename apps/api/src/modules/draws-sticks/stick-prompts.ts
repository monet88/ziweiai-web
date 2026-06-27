import type { DivinationStick } from '@ziweiai/contracts';

// US-039: prompt builder tiếng Việt cho luận giải Xin xăm bằng LLM. Quẻ xăm (đã là tiếng Việt từ
// dataset B6-0) đưa vào prompt làm cứ liệu cố định: thơ quẻ + nghĩa nền + lời khuyên + giải theo
// lĩnh vực. Nhiệm vụ LLM là DẪN DẮT quẻ theo câu hỏi cụ thể của người xin, KHÔNG đọc máy móc lại
// nội dung quẻ. Phong cách + cấm chữ Hán do EXPLANATION_SYSTEM_PROMPT + CJK guard ở provider chốt.

function describeFields(stick: DivinationStick): string[] {
  const detail = stick.detailedInterpretations;
  if (!detail) {
    return [];
  }
  const labels: Array<[keyof NonNullable<DivinationStick['detailedInterpretations']>, string]> = [
    ['career', 'Công danh'],
    ['wealth', 'Cầu tài'],
    ['marriage', 'Hôn nhân'],
    ['health', 'Sức khỏe'],
    ['business', 'Kinh doanh'],
    ['travel', 'Xuất hành'],
    ['lawsuit', 'Kiện tụng'],
  ];
  return labels
    .map(([key, label]) => (detail[key] ? `  ${label}: ${detail[key]}` : null))
    .filter((line): line is string => line !== null);
}

export function buildStickReadingPrompt(question: string, stick: DivinationStick): string {
  return [
    'Bạn đang luận giải một quẻ xăm cho người xin. Xin xăm là cách gợi mở hướng suy ngẫm dựa trên lời quẻ cổ, không phải lời phán số phận cố định; hãy dẫn dắt lời quẻ vào đúng câu hỏi của người xin và trao lại quyền lựa chọn cho họ.',
    '',
    `Câu hỏi của người xin: ${question}`,
    '',
    `Quẻ rút được: số ${stick.id} — ${stick.title} (mức ${stick.level}).`,
    `Thơ quẻ: ${stick.poem}`,
    `Nghĩa nền: ${stick.interpretation}`,
    `Lời khuyên gốc của quẻ: ${stick.advice}`,
    ...(stick.story ? [`Tích quẻ: ${stick.story}`] : []),
    ...(describeFields(stick).length > 0 ? ['Giải theo lĩnh vực (tham khảo):', ...describeFields(stick)] : []),
    '',
    'QUY TẮC LUẬN GIẢI (bám sát):',
    '- Dẫn lời quẻ vào ĐÚNG câu hỏi cụ thể của người xin, không đọc lại máy móc toàn bộ nội dung quẻ.',
    '- Tôn trọng mức xếp hạng của quẻ (thượng/trung/hạ) nhưng luôn diễn giải theo hướng xây dựng: quẻ tốt nhắc giữ khiêm nhường, quẻ xấu nhắc cách hóa giải và chuẩn bị.',
    '- Chống nói chung chung (Barnum): gợi ý phải cụ thể về thời gian + hành động, nối với câu hỏi thực.',
    '- Trao quyền chủ động: quẻ phản ánh xu thế hiện tại, không định đoạt; lựa chọn của người xin luôn đổi được hướng.',
    '- Ranh giới an toàn: không chẩn đoán y tế, tư vấn pháp lý, khuyến nghị đầu tư, hay quyết định trọng đại thay người xin.',
    '',
    'CẤU TRÚC BÀI LUẬN (Markdown, khoảng 300-550 từ):',
    '- Mở đầu: ý nghĩa tổng quan của quẻ và cách nó soi vào câu hỏi.',
    '- Diễn giải: dẫn thơ quẻ + nghĩa nền vào hoàn cảnh câu hỏi của người xin.',
    '- Kết bài: dùng đúng tiêu đề "## Tóm lại" với 3-5 câu chốt ý + một hành động nhỏ rõ ràng làm được ngay + một câu hỏi mở trao lại quyền quyết định cho người xin.',
  ].join('\n');
}
