/**
 * Client-side quick prompt registry for US-018.
 *
 * Chỉ chứa key + nhãn tiếng Việt để render UI. Nội dung prompt đầy đủ do server quản lý
 * (packages/contracts + apps/api/providers/ai/quick-prompts.ts). Web KHÔNG được gửi prompt text.
 *
 * Mọi key phải khớp enum quickPromptKeySchema ở contracts.
 */

export const QUICK_PROMPT_KEYS = ['overview', 'love', 'career', 'health', 'timing'] as const;

export type QuickPromptKey = (typeof QUICK_PROMPT_KEYS)[number];

export const QUICK_PROMPT_LABELS: Record<QuickPromptKey, string> = {
  overview: 'Tổng quan',
  love: 'Tình duyên',
  career: 'Sự nghiệp',
  health: 'Sức khỏe',
  timing: 'Thời vận',
};

export function isQuickPromptKey(value: unknown): value is QuickPromptKey {
  return typeof value === 'string' && (QUICK_PROMPT_KEYS as readonly string[]).includes(value);
}
