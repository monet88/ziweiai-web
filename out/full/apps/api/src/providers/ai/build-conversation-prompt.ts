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
    'Ngữ cảnh lá số dùng để trả lời:',
    chartPrompt,
    'Lịch sử hội thoại gần nhất:',
    recentMessages.map(formatMessageForPrompt).join('\n') || 'Chưa có lịch sử.',
    'Câu hỏi hiện tại:',
    payload.userMessage,
    'Hãy trả lời ngắn gọn, có cấu trúc Markdown và bám sát ngữ cảnh lá số ở trên.',
  ].join('\n\n');
}
