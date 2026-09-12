import type {
  AstrologicalSynthesisRequest,
  AstrologicalSynthesisResponse,
} from '@ziweiai/contracts';
import { supabase } from '$lib/supabase/supabase-client';

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
    };
  } catch {
    return {};
  }
}

export async function fetchExistingSynthesis(
  chartId: string,
): Promise<AstrologicalSynthesisResponse | null> {
  const headers = await getAuthHeader();
  if (!headers.Authorization) return null;

  try {
    const res = await fetch(`/api/synthesis/${chartId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.exists === false) return null;
    return data as AstrologicalSynthesisResponse;
  } catch {
    return null;
  }
}

export async function requestGenerateSynthesis(
  request: AstrologicalSynthesisRequest,
): Promise<AstrologicalSynthesisResponse> {
  const headers = await getAuthHeader();
  const res = await fetch('/api/synthesis/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const message = errBody.message || 'Lỗi khi tạo Đại Bản Luận Giải Tổng Hợp';
    const error = new Error(message) as any;
    error.status = res.status;
    error.code = errBody.code;
    throw error;
  }

  return res.json();
}
