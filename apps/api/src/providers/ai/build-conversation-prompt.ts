import type { ConversationMessageRecord } from '@ziweiai/contracts';
import { buildExplanationPrompt, type ConversationPromptPayload } from './ai-explanation-provider';

export const CONVERSATION_LANGUAGE_INVARIANT = [
  'Bạn là Khâm Thiên Giám Đại Sư — Trợ lý AI Cố Vấn Tối Cao của ViOS (Tử Vi Toàn Tập).',
  'Vai trò của bạn là một bậc thầy uyên bác về Tử Vi Đẩu Số và Huyền học Á Đông, thấu tỏ cơ chế vận hành của 12 cung, chính phụ tinh, tứ hóa và lưu niên.',
  'Phong thái: Điềm đạm, uyên bác, thấu cảm và tinh tế. Xưng hô tự nhiên, tôn trọng (tôi/bạn hoặc Trợ lý ViOS/quý bạn).',
  'Phương pháp giải đoán: Luôn bám sát tinh bàn lá số, chỉ rõ sự tương tác giữa các sao và cung vị cụ thể (Mệnh, Thân, Quan, Tài, Phối, Vận hạn) liên quan tới câu hỏi.',
  'Định hướng Dịch lý: Luôn đưa ra lời khuyên thực tế để đương số tu dưỡng, hóa giải thế bất lợi và nắm bắt thời cơ thuận lợi.',
  'BẮT BUỘC: viết hoàn toàn bằng tiếng Việt, TUYỆT ĐỐI không dùng ký tự chữ Hán/Trung/Nhật/Hàn.',
  'Thuật ngữ Tử Vi dùng dạng Hán-Việt phiên âm Latin (ví dụ: "Tử Vi", "Thiên Phủ", "Hóa Lộc", "Hóa Kỵ", "Mệnh", "Thân", "Quan Lộc").',
  'Không đưa chẩn đoán y khoa, pháp lý hoặc tài chính chắc chắn. Khi cần, hãy khuyên người dùng tham khảo chuyên gia phù hợp.',
].join('\n');

function formatMessageForPrompt(message: ConversationMessageRecord): string {
  const role = message.role === 'assistant' ? 'Khâm Thiên Giám AI' : 'Đương số';
  return `${role}: ${message.content}`;
}

export function selectConversationPromptMessages(
  messages: readonly ConversationMessageRecord[],
  limit: number,
): ConversationMessageRecord[] {
  // Drop "dangling" user turns — a user message with no following assistant reply. These occur when
  // a previous generation failed after the user row was persisted (the user row is durable, the
  // assistant row never gets written). Feeding them back would replay an unanswered question as
  // historical context and skew the prompt. Keep all assistant turns and only the answered user turns.
  const completed: ConversationMessageRecord[] = [];
  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    if (message.role === 'user') {
      if (messages[i + 1]?.role === 'assistant') {
        completed.push(message);
      }
      continue;
    }
    completed.push(message);
  }
  return completed.slice(Math.max(0, completed.length - Math.max(0, limit)));
}

export function buildConversationPrompt(payload: ConversationPromptPayload, historyLimit = 12): string {
  const recentMessages = selectConversationPromptMessages(payload.messages, historyLimit);
  const chartPrompt = buildExplanationPrompt({
    chartSnapshot: payload.chartSnapshot,
    explanationKind: 'overview',
    explanationContext: payload.explanationContext,
    // Thread the stored divination question/purpose so the per-system builder frames
    // the chart context around the original inquiry, not a generic reading. No-op for
    // natal/other systems where divinationInquiry is undefined.
    divinationInquiry: payload.divinationInquiry,
  });

  return [
    CONVERSATION_LANGUAGE_INVARIANT,
    'Ngữ cảnh tinh bàn và lá số dùng để giải đoán:',
    chartPrompt,
    'Lịch sử đàm đạo gần nhất:',
    recentMessages.map(formatMessageForPrompt).join('\n') || 'Chưa có lịch sử.',
    'Câu hỏi của đương số:',
    payload.userMessage,
    'Yêu cầu trình bày: Trả lời có cấu trúc Markdown rõ ràng (tiêu đề ngắn, gạch đầu dòng, in đậm sao/cung vị then chốt). Phân tích sâu sắc, điềm đạm, có tính cố vấn hành động thiết thực. Ở cuối câu trả lời, có thể gợi mở 1-2 khía cạnh liên quan nếu đương số muốn tìm hiểu thêm.',
  ].join('\n\n');
}
