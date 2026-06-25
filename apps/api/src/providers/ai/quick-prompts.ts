import { type QuickPromptKey } from '@ziweiai/contracts';

export const QUICK_PROMPT_LABELS: Record<QuickPromptKey, string> = {
  overview: 'Tóm tắt điểm nổi bật của lá số',
  love: 'Hỏi về tình cảm và các mối quan hệ',
  career: 'Hỏi về công việc và định hướng nghề nghiệp',
  health: 'Hỏi về sức khỏe và nhịp sống',
  timing: 'Hỏi về vận hạn và thời điểm cần lưu ý',
};

const QUICK_PROMPT_TEMPLATES: Record<QuickPromptKey, string> = {
  overview:
    'Hãy tóm tắt các điểm nổi bật nhất trong lá số này theo thứ tự: tính cách cốt lõi, điểm mạnh, điểm cần thận trọng và một lời khuyên thực tế.',
  love:
    'Hãy tập trung luận về tình cảm và các mối quan hệ: nhu cầu cảm xúc, cách giao tiếp phù hợp, rủi ro dễ lặp lại và lời khuyên ứng xử.',
  career:
    'Hãy tập trung luận về công việc và định hướng nghề nghiệp: kiểu môi trường phù hợp, thế mạnh nên phát triển, điểm nghẽn và bước đi gần nhất.',
  health:
    'Hãy tập trung luận về sức khỏe và nhịp sống: khuynh hướng cần chú ý, thói quen nên duy trì và dấu hiệu nên theo dõi. Không đưa chẩn đoán y khoa.',
  timing:
    'Hãy tập trung luận về vận hạn và thời điểm: giai đoạn thuận lợi, giai đoạn nên thận trọng và cách ra quyết định an toàn trong năm đang xem.',
};

export function resolveQuickPrompt(key: QuickPromptKey): string {
  return QUICK_PROMPT_TEMPLATES[key];
}
