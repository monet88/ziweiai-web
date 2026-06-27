// Lớp gọi LLM thật cho pipeline dịch (backlog #41 / US-033). Tách khỏi core.ts để
// core test được không cần network. Đọc cấu hình từ biến môi trường giống provider
// OpenAI-compatible của apps/api: OPENAI_COMPAT_API_KEY / _BASE_URL / _MODEL.
//
// Đây là script tooling chạy offline (qua tsx), KHÔNG phải code runtime của app:
// nó dịch dữ liệu MỘT LẦN lúc port rồi ghi ra file tĩnh để commit. App runtime
// không bao giờ gọi hàm ở đây.

import type { BatchTranslator, TranslationUnit } from './core';
import { TranslationError } from './core';
import { renderGlossary } from './glossary';

type OpenAiCompatibleResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export type TranslateClientConfig = {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly timeoutMs?: number;
};

// Đọc config từ process.env. Ném lỗi rõ ràng khi thiếu để người chạy biết phải set
// gì trong .env trước. KHÔNG in giá trị key ra log.
export function loadConfigFromEnv(env: NodeJS.ProcessEnv = process.env): TranslateClientConfig {
  const apiKey = env.OPENAI_COMPAT_API_KEY?.trim() ?? '';
  const baseUrl = env.OPENAI_COMPAT_BASE_URL?.trim() ?? '';
  const model = env.OPENAI_COMPAT_MODEL?.trim() ?? '';
  const missing: string[] = [];
  if (apiKey.length === 0) missing.push('OPENAI_COMPAT_API_KEY');
  if (baseUrl.length === 0) missing.push('OPENAI_COMPAT_BASE_URL');
  if (model.length === 0) missing.push('OPENAI_COMPAT_MODEL');
  if (missing.length > 0) {
    throw new TranslationError(`Thiếu biến môi trường: ${missing.join(', ')}. Set trong .env trước khi chạy.`);
  }
  return { apiKey, baseUrl, model };
}

// Chuẩn hóa base URL giống openai-compatible-explanation-provider.ts: bỏ "/" cuối
// và hậu tố "/v1" để tránh lặp "/v1/v1" khi operator cấu hình base đã có "/v1".
export function buildChatCompletionsEndpoint(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, '').replace(/\/v1$/i, '');
  return `${normalized}/v1/chat/completions`;
}

const SYSTEM_PROMPT =
  'Bạn là dịch giả thuật ngữ tử vi / bói toán Trung - Việt. Dịch sang tiếng Việt tự nhiên, ' +
  'giữ nguyên ý nghĩa chuyên môn. TUYỆT ĐỐI không để sót bất kỳ chữ Hán / Trung / Nhật / Hàn nào ' +
  'trong bản dịch; phiên âm Hán Việt khi cần (ví dụ tên quẻ, tên sao). Chỉ trả về JSON hợp lệ.';

// Dựng prompt cho một batch: yêu cầu trả JSON {id: ban_dich}. Glossary nhúng vào để
// ép thuật ngữ nhất quán. Giữ id nguyên văn để re-assemble không lệch.
export function buildBatchPrompt(units: readonly TranslationUnit[]): string {
  const payload = units.map((unit) => ({ id: unit.id, text: unit.text }));
  return [
    `Thuật ngữ chuẩn (BẮT BUỘC theo): ${renderGlossary()}.`,
    '',
    'Dịch trường "text" của từng phần tử sang tiếng Việt. Trả về DUY NHẤT một object JSON',
    'dạng {"<id>": "<bản dịch>"}, đúng và đủ mọi id dưới đây, không thêm chú thích:',
    '',
    JSON.stringify(payload, null, 2),
  ].join('\n');
}

// Bóc JSON object {id: vi} từ nội dung trả về. Mô hình đôi khi bọc trong ```json
// fence hoặc thêm chữ thừa; cắt từ "{" đầu đến "}" cuối cho chắc.
export function parseBatchResponse(content: string): ReadonlyMap<string, string> {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new TranslationError('Phản hồi LLM không chứa JSON object.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content.slice(start, end + 1));
  } catch {
    throw new TranslationError('Không parse được JSON từ phản hồi LLM.');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new TranslationError('JSON phản hồi LLM không phải object {id: vi}.');
  }
  const map = new Map<string, string>();
  for (const [id, vi] of Object.entries(parsed)) {
    if (typeof vi === 'string') {
      map.set(id, vi.trim());
    }
  }
  return map;
}

// Tạo BatchTranslator thật gọi endpoint OpenAI-compatible. Trả hàm để core dùng.
export function createOpenAiCompatibleTranslator(config: TranslateClientConfig): BatchTranslator {
  const endpoint = buildChatCompletionsEndpoint(config.baseUrl);
  const timeoutMs = config.timeoutMs ?? 120_000;

  return async (units) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildBatchPrompt(units) },
        ],
        stream: false,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const rawBody = await response.text();
    let body: OpenAiCompatibleResponse = {};
    if (rawBody.trim().length > 0) {
      try {
        body = JSON.parse(rawBody) as OpenAiCompatibleResponse;
      } catch {
        // Giữ body rỗng; dùng HTTP status bên dưới để báo lỗi.
      }
    }
    if (!response.ok) {
      const upstream = body.error?.message?.trim();
      throw new TranslationError(
        upstream
          ? `LLM trả lỗi: ${upstream}`
          : `LLM trả lỗi: HTTP ${response.status} ${response.statusText}.`,
      );
    }
    const content = body.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new TranslationError('LLM không trả về nội dung.');
    }
    return parseBatchResponse(content);
  };
}
