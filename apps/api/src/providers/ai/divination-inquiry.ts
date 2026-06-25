import type { ExplanationPromptPayload } from './ai-explanation-provider';
import type { DivinationPurposeKey } from '@ziweiai/contracts';

export type DivinationInquiry = NonNullable<ExplanationPromptPayload['divinationInquiry']>;

// Vietnamese labels for the fixed purpose presets. 'custom' has no fixed label;
// callers pass the user's free-text purposeCustom instead.
const DIVINATION_PURPOSE_LABELS_VI: Record<Exclude<DivinationPurposeKey, 'custom'>, string> = {
  career: 'Sự nghiệp - công việc',
  love: 'Tình cảm - hôn nhân',
  wealth: 'Tài lộc - tiền bạc',
  health: 'Sức khỏe',
  decision: 'Quyết định - lựa chọn',
};

export function resolveDivinationPurposeLabel(
  purposeKey: DivinationPurposeKey,
  purposeCustom: string | null,
): string {
  if (purposeKey === 'custom') {
    return purposeCustom?.trim() || 'Việc riêng';
  }
  return DIVINATION_PURPOSE_LABELS_VI[purposeKey];
}

/**
 * US-025 (decision 0021): build the per-system inquiry block injected into the
 * four time-based divination prompts. The question + purpose are shared, but each
 * system passes its own `framing` line so the model targets the inquiry in that
 * system's terms (Mai Hoa -> the/dung, Luc Hao -> the/ung + dung than, etc.).
 * Returns [] when there is no inquiry so older callers stay unchanged.
 */
export function buildDivinationInquiryLines(
  inquiry: DivinationInquiry | undefined,
  framing: string,
): string[] {
  if (!inquiry) {
    return [];
  }
  return [
    'NGƯỜI GIEO ĐÃ NÊU MỘT CÂU HỎI CỤ THỂ — phải luận đúng vào việc này, không mô tả quẻ chung chung.',
    `Câu hỏi của người gieo: "${inquiry.question}"`,
    `Lĩnh vực quan tâm: ${inquiry.purposeLabel}`,
    framing,
    'Kết bài bằng một đoạn trả lời trực tiếp, rõ ràng cho đúng câu hỏi trên.',
  ];
}
