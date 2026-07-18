import { containsCjkText } from '@ziweiai/core';
import { ProviderUnavailableError } from './provider-errors';

/**
 * REFACTOR-007 (decision 0030): seam dùng chung cho cụm AI provider non-stream.
 *
 * Trước đây ba provider (DeepSeek, OpenAI-compatible, Gemini) lặp lại gần nguyên một khối glue:
 * dựng timeout signal → fetch → parse → guard text rỗng → CJK guard → dựng providerMetadata → map
 * lỗi ngoài cùng. Khối glue đó nay sống một nơi (LlmExchange); phần THẬT SỰ khác nhau giữa provider
 * (URL/headers/body shape, cách đọc usage, thông điệp lỗi đặc thù) được khai báo qua LlmChatAdapter.
 */

// Usage đã chuẩn hóa: mỗi adapter tự map shape upstream (usage vs usageMetadata) về đây.
export interface LlmUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface LlmChatRequest {
  url: string;
  init: RequestInit;
}

export interface LlmParsedResult {
  text: string;
  usage?: LlmUsage;
}

export interface LlmChatAdapterBuildParams {
  prompt: string;
  imageInput?: { base64: string; mimeType: string };
  model: string;
  // signal mang theo timeout (AbortSignal.timeout) do LlmExchange dựng; adapter chỉ gắn vào init.signal.
  signal: AbortSignal;
}

/**
 * Seam đặt ở Response THÔ: adapter dựng request đặc thù provider và tự đọc kết quả (kể cả xử
 * !response.ok + thông điệp lỗi đặc thù). LlmExchange lo phần còn lại (timeout, text rỗng, CJK guard,
 * metadata, map lỗi ngoài cùng).
 */
export interface LlmChatAdapter {
  readonly providerName: string;
  // Hằng số: provider+model có đọc được ảnh không. DeepSeek = false (API chưa hỗ trợ vision).
  readonly visionCapable: boolean;
  // Thông điệp khi provider chưa cấu hình key (ném trước khi gọi fetch).
  readonly notConfiguredMessage: string;
  // Thông điệp khi request quá thời gian chờ (TimeoutError/AbortError → ProviderTimeoutError).
  readonly timeoutMessage: string;
  // Thông điệp lỗi chung ngoài cùng (mọi lỗi không phải ProviderUnavailableError/timeout).
  readonly unavailableMessage: string;
  isAvailable(): boolean;
  resolveModel(modelOverride?: string): string;
  buildRequest(params: LlmChatAdapterBuildParams): LlmChatRequest;
  // Đọc Response upstream. Tự ném ProviderUnavailableError khi !response.ok hoặc phản hồi rỗng đặc thù
  // (với thông điệp lỗi riêng từng provider). Trả { text, usage } khi thành công; text có thể rỗng để
  // LlmExchange áp emptyMessage chung.
  parseResult(response: Response): Promise<LlmParsedResult>;
}

// Thông điệp CJK guard dùng chung cho cả đường non-stream lẫn streaming. CJK guard KHÔNG được failover
// (xem provider-router-base): router rethrow ngay khi gặp thông điệp này.
export const CJK_REJECTION_MESSAGE = 'Nhà cung cấp trả về nội dung không hợp lệ (chứa chữ Hán).';

/**
 * Hàm thuần dùng chung: ném ProviderUnavailableError nếu text chứa chữ Hán. Caller tự lo logger.warn
 * (LlmExchange log qua catch ProviderUnavailableError; streaming tự warn trước khi gọi).
 */
export function assertNoCjk(text: string): void {
  if (containsCjkText(text)) {
    throw new ProviderUnavailableError(CJK_REJECTION_MESSAGE);
  }
}

/**
 * Hàm thuần dùng chung: dựng providerMetadata. `kind` là optional — DeepSeek/Gemini set kind
 * (explanation/conversation), OpenAI-compatible KHÔNG set (giữ đúng bất biến JSON persisted cũ).
 */
export function buildProviderMetadata(
  providerName: string,
  model: string,
  usage: LlmUsage | undefined,
  kind?: 'explanation' | 'conversation',
): Record<string, string> {
  return {
    provider: providerName,
    model,
    ...(kind ? { kind } : {}),
    totalTokens: String(usage?.totalTokens ?? 0),
    promptTokens: String(usage?.promptTokens ?? 0),
    completionTokens: String(usage?.completionTokens ?? 0),
  };
}
