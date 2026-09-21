import {
  b2bInquiryResponseSchema,
  type B2bInquiryRequest,
  type B2bInquiryResponse,
} from '@ziweiai/contracts';
import { fetchJson } from './fetch-json';

/**
 * Gửi yêu cầu tư vấn phong thủy & đối tác B2B (ADR-0009).
 * Endpoint public không bắt buộc token đăng nhập.
 */
export async function submitB2bInquiry(
  payload: B2bInquiryRequest,
  token?: string,
): Promise<B2bInquiryResponse> {
  return fetchJson<B2bInquiryResponse>('/b2b/inquiry', b2bInquiryResponseSchema, {
    method: 'POST',
    body: payload,
    token,
  });
}
