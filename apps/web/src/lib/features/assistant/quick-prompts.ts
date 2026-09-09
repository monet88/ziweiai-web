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

export interface SmartAstroPrompt {
  id: string;
  icon: string;
  badge: string;
  title: string;
  query: string;
}

export const SMART_ASTRO_PROMPTS: readonly SmartAstroPrompt[] = [
  {
    id: 'timing-2026',
    icon: '🌟',
    badge: 'Năm 2026',
    title: 'Thời vận Bính Ngọ 2026',
    query: 'Xin Khâm Thiên Giám Đại Sư luận giải chi tiết thời vận năm 2026 (Bính Ngọ) của tôi: Lưu Thái Tuế, cơ hội tài lộc, biến động công danh và những tháng cần cẩn trọng.',
  },
  {
    id: 'wealth-career',
    icon: '💰',
    badge: 'Tài Bạch',
    title: 'Tài lộc & Kinh doanh',
    query: 'Phân tích giúp tôi cung Tài Bạch và Quan Lộc: Khả năng tích lũy tiền bạc, thời điểm bứt phá đại vận và tôi hợp mô hình kinh doanh hay công sở hơn?',
  },
  {
    id: 'love-spouse',
    icon: '💖',
    badge: 'Phu Thê',
    title: 'Tình duyên & Hôn phối',
    query: 'Xem giúp tôi cung Phu Thê: Xu hướng bạn đời, hòa hợp tính cách, thời điểm kết duyên cát lợi và cách hóa giải nếu có sao xung khắc.',
  },
  {
    id: 'remedy-stars',
    icon: '🛡️',
    badge: 'Hóa Giải',
    title: 'Hóa giải sát tinh & Tu dưỡng',
    query: 'Lá số của tôi có những hung sát tinh hay thế hãm địa nào đáng chú ý? Cần tu dưỡng tâm tính, hướng thiện và hành động ra sao để chuyển họa thành phúc?',
  },
] as const;

