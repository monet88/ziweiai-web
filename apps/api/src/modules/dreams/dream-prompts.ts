import type { DreamSymbolData } from './dream-symbol-matcher';

// US-038: prompt builder tiếng Việt cho luận giải giấc mơ bằng LLM. Biểu tượng khớp được (đã là
// tiếng Việt từ dataset B6-0) đưa vào prompt làm cứ liệu; nếu không khớp biểu tượng nào, prompt
// hướng LLM luận giải tự do dựa trên mô tả. Phong cách + cấm chữ Hán do EXPLANATION_SYSTEM_PROMPT
// + CJK guard ở provider chốt. Khớp khuôn tarot-prompts/lenormand-prompts.

function describeSymbol(symbol: DreamSymbolData): string {
  const parts = [
    `- ${symbol.keywords.join(' / ')} (${symbol.category}): ${symbol.meaning}`,
  ];
  if (symbol.positive) {
    parts.push(`  Tích cực: ${symbol.positive}`);
  }
  if (symbol.negative) {
    parts.push(`  Cảnh báo: ${symbol.negative}`);
  }
  if (symbol.advice) {
    parts.push(`  Lời khuyên: ${symbol.advice}`);
  }
  return parts.join('\n');
}

export function buildDreamInterpretationPrompt(
  dream: string,
  symbols: ReadonlyArray<DreamSymbolData>,
): string {
  const hasSymbols = symbols.length > 0;

  return [
    'Bạn đang giải mã một giấc mơ cho người dùng. Giải mộng là cách soi vào tâm lý và cảm xúc tiềm ẩn, không phải lời tiên tri điềm gở; hãy đọc giấc mơ như một tấm gương phản chiếu trạng thái bên trong và gợi mở hướng đi.',
    '',
    `Mô tả giấc mơ: ${dream}`,
    '',
    hasSymbols
      ? 'Các biểu tượng nhận diện được trong giấc mơ (dùng làm cứ liệu, KHÔNG đọc máy móc):'
      : 'Không nhận diện được biểu tượng quen thuộc nào trong cơ sở dữ liệu; hãy luận giải dựa trên chính nội dung và cảm xúc của giấc mơ.',
    ...(hasSymbols ? symbols.map(describeSymbol) : []),
    '',
    'QUY TẮC LUẬN GIẢI (bám sát):',
    '- Gắn ý nghĩa biểu tượng với bối cảnh và cảm xúc cụ thể trong giấc mơ, không chỉ liệt kê nghĩa chung.',
    '- Coi trọng cảm xúc người mơ trải qua: cùng một biểu tượng mang nghĩa khác nhau tùy cảm giác vui/sợ/lo.',
    '- Chống nói chung chung (Barnum): tránh những câu đúng-với-ai-cũng-được; gợi ý phải nối với đời sống thực của người mơ.',
    '- Trao quyền chủ động: giấc mơ phản ánh nội tâm hiện tại, không định đoạt tương lai; người mơ luôn có thể chọn cách hành động.',
    '- Ranh giới an toàn: không chẩn đoán y tế/tâm thần, không tư vấn pháp lý hay tài chính. Nếu giấc mơ lộ dấu hiệu sang chấn nặng, nhẹ nhàng khuyên tìm người thân tin cậy hoặc chuyên gia tâm lý.',
    '',
    'CẤU TRÚC BÀI GIẢI (Markdown, khoảng 300-550 từ):',
    '- Mở đầu: tổng quan cảm xúc và chủ đề chính của giấc mơ.',
    '- Phân tích biểu tượng: đọc từng biểu tượng chính gắn với bối cảnh giấc mơ và đời sống.',
    '- Kết bài: dùng đúng tiêu đề "## Tóm lại" với 3-5 câu chốt ý + một gợi ý nhỏ để chiêm nghiệm hoặc hành động, và một câu hỏi mở trao lại quyền suy ngẫm cho người mơ.',
  ].join('\n');
}
