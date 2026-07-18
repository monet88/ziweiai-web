import { divinationChartSystems, type DivinationContextRecord, type DivinationPurposeKey } from '@ziweiai/contracts';

// Canonical shape for the stored divination question + purpose threaded into the
// per-system prompt (explanation AND conversation). Both ExplanationPromptPayload and
// ConversationPromptPayload reference this so the shape stays single-sourced.
export interface DivinationInquiry {
  question: string;
  purposeLabel: string;
}

// Minimal structural source so both ExplanationsService and ConversationsService can
// resolve the inquiry without this provider-layer module importing the concrete gateway.
export interface DivinationContextSource {
  findDivinationContextBySnapshotId(
    ownerUserId: string,
    chartSnapshotId: string,
  ): Promise<DivinationContextRecord | null>;
}

const DIVINATION_SYSTEM_SET = new Set<string>(divinationChartSystems);

export function isDivinationChartSystem(chartSystem: string): boolean {
  return DIVINATION_SYSTEM_SET.has(chartSystem);
}

// US-025 (decision 0021): for the four time-based divination systems, load the stored
// question + purpose so the per-system prompt (explanation OR conversation) can target
// the inquiry. Other systems (natal Tu Vi, Bat Tu, Mangpai...) have no context row ->
// undefined, leaving older prompts unchanged.
export async function resolveDivinationInquiry(
  source: DivinationContextSource,
  ownerUserId: string,
  chartSnapshotId: string,
  chartSystem: string,
): Promise<DivinationInquiry | undefined> {
  if (!isDivinationChartSystem(chartSystem)) {
    return undefined;
  }
  const context = await source.findDivinationContextBySnapshotId(ownerUserId, chartSnapshotId);
  if (!context) {
    return undefined;
  }
  return {
    question: context.question,
    purposeLabel: resolveDivinationPurposeLabel(context.purposeKey, context.purposeCustom),
  };
}

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
