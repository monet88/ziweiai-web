import type { ConversationMessageRecord } from '@ziweiai/contracts';
import { buildExplanationPrompt, type ConversationPromptPayload } from './ai-explanation-provider';

export const CONVERSATION_LANGUAGE_INVARIANT = [
  'Bạn là trợ lý AI hội thoại của ZIWEI AI.',
  'BẮT BUỘC: viết hoàn toàn bằng tiếng Việt, TUYỆT ĐỐI không dùng ký tự chữ Hán/Trung/Nhật/Hàn.',
  'Không đưa chẩn đoán y khoa, pháp lý hoặc tài chính chắc chắn. Khi cần, hãy khuyên người dùng tham khảo chuyên gia phù hợp.',
].join('\n');

function formatMessageForPrompt(message: ConversationMessageRecord): string {
  const role = message.role === 'assistant' ? 'Trợ lý' : 'Người dùng';
  return `${role}: ${message.content}`;
}

export function selectConversationPromptMessages(
  messages: readonly ConversationMessageRecord[],
  limit: number,
): ConversationMessageRecord[] {
  return messages.slice(Math.max(0, messages.length - Math.max(0, limit)));
}

export function buildConversationPrompt(payload: ConversationPromptPayload, historyLimit = 12): string {
  const recentMessages = selectConversationPromptMessages(payload.messages, historyLimit);
  const chartPrompt = buildExplanationPrompt({
    chartSnapshot: payload.chartSnapshot,
    explanationKind: 'overview',
    explanationContext: payload.explanationContext,
  });

  return [
    CONVERSATION_LANGUAGE_INVARIANT,
    'Ngữ cảnh lá số dùng để trả lời:',
    chartPrompt,
    'Lịch sử hội thoại gần nhất:',
    recentMessages.map(formatMessageForPrompt).join('\n') || 'Chưa có lịch sử.',
    'Câu hỏi hiện tại:',
    payload.userMessage,
    'Hãy trả lời ngắn gọn, có cấu trúc Markdown và bám sát ngữ cảnh lá số ở trên.',
  ].join('\n\n');
}
