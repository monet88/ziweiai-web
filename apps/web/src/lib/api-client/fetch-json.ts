/**
 * Lõi gọi backend + map lỗi HTTP → lỗi UI (api-contract.md §"Map lỗi → UI").
 *
 * Không hiển thị raw backend exception cho user. Token = session.access_token
 * (Supabase JWT) đọc ngay trước mỗi request, KHÔNG snapshot lúc mount.
 */
import type { ZodType } from 'zod';
import { env } from '$lib/env';

export type ApiErrorKind =
  | 'unauthorized' // 401
  | 'forbidden' // 403
  | 'not-found' // 404
  | 'validation' // 422
  | 'server' // 500
  | 'network' // fetch thất bại
  | 'parse' // Zod parse fail
  | 'payment-required'; // 402

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

function mapStatusToKind(status: number): ApiErrorKind {
  switch (status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not-found';
    case 402:
      return 'payment-required';
    case 422:
      return 'validation';
    default:
      return 'server';
  }
}

export interface FetchJsonOptions {
  method?: 'GET' | 'POST';
  /** Bearer token (session.access_token). Bỏ qua cho endpoint public. */
  token?: string;
  body?: unknown;
}

export function createHeaders(token?: string, hasBody = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Xử lý CHUNG cho mọi response backend: map lỗi HTTP → ApiError (ưu tiên message tiếng Việt từ
 * apiErrorSchema), rồi parse JSON qua schema contracts (không trust raw). fetchJson và fetchMultipart
 * cùng gọi hàm này để mọi sửa đổi (thêm mã lỗi, đổi cách trích message...) chỉ nằm một chỗ.
 */
async function parseResponseOrThrow<T>(response: Response, schema: ZodType<T>): Promise<T> {
  if (!response.ok) {
    const kind = mapStatusToKind(response.status);
    // Ưu tiên message tiếng Việt từ backend (apiErrorSchema: { code, message, requestId }).
    // Đọc body một lần ở đây; nếu không phải JSON hợp lệ thì rơi về message generic.
    let message = `Yêu cầu thất bại (${response.status}).`;
    try {
      const errorBody: unknown = await response.json();
      if (
        errorBody !== null &&
        typeof errorBody === 'object' &&
        'message' in errorBody &&
        typeof (errorBody as { message: unknown }).message === 'string' &&
        (errorBody as { message: string }).message.length > 0
      ) {
        message = (errorBody as { message: string }).message;
      }
    } catch {
      // Body không phải JSON (ví dụ 500 trả HTML) → giữ message generic.
    }
    throw new ApiError(kind, message, response.status);
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new ApiError('parse', 'Phản hồi máy chủ không hợp lệ.');
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    if (import.meta.env.DEV) {
      console.error('[api] Zod parse error:', parsed.error.issues);
    }
    throw new ApiError('parse', 'Lỗi tích hợp dữ liệu. Vui lòng thử lại.');
  }

  return parsed.data;
}

/**
 * Gọi backend và parse response bằng schema từ @ziweiai/contracts.
 * Mọi response UI dùng đều phải đi qua đây — không trust raw JSON.
 */
export async function fetchJson<T>(
  path: string,
  schema: ZodType<T>,
  options: FetchJsonOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const hasBody = options.body !== undefined;

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers: createHeaders(options.token, hasBody),
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('network', 'Không kết nối được máy chủ. Thử lại sau.');
  }

  return parseResponseOrThrow(response, schema);
}

/**
 * Gọi backend với multipart/form-data (US-017e/f: upload ảnh vision). Tách khỏi fetchJson vì:
 * - body là FormData, KHÔNG set Content-Type thủ công (browser tự thêm boundary).
 * - dùng chung parseResponseOrThrow (map lỗi → UI + parse schema) với fetchJson, không nhân đôi logic.
 */
export async function fetchMultipart<T>(
  path: string,
  schema: ZodType<T>,
  form: FormData,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, { method: 'POST', headers, body: form });
  } catch {
    throw new ApiError('network', 'Không kết nối được máy chủ. Thử lại sau.');
  }

  return parseResponseOrThrow(response, schema);
}
