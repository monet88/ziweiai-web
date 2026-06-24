/**
 * QueryClient dùng chung cho TanStack svelte-query.
 *
 * staleTime: 30_000, retry: 1 (theo SPEC §7 + nguồn Expo thật; xem
 * docs/decisions/0006-spec-vs-code-naming.md — KHÔNG phải 3000).
 *
 * Hardening: phiên hết hạn (401) → chuyển hướng /sign-in. Anon session vẫn cấp JWT thật
 * nên 401 chỉ xảy ra khi token hết hạn VÀ refresh thất bại (không còn phiên hợp lệ); lúc đó
 * /sign-in là nơi AuthStore.init() tái lập phiên (anon hoặc đăng nhập lại). Gắn ở tầng cache
 * để mọi query + mutation đều được phủ, không phải vá từng màn. Bỏ qua khi đã ở /sign-in
 * (tránh vòng lặp). Query có retry: 1 nên nuốt được 401 thoáng qua lúc đang refresh; mutation
 * KHÔNG retry (tránh double-POST tạo lá số/luận giải trùng) — nhưng getAccessToken đọc token
 * tươi ngay trước mỗi request (invariants §3) nên 401 thoáng qua trên mutation rất khó xảy ra.
 */
import { QueryClient, QueryCache, MutationCache } from '@tanstack/svelte-query';
import { goto } from '$app/navigation';
import { base, resolve } from '$app/paths';
import { ApiError } from '$lib/api-client';

const SIGN_IN_PATH = '/sign-in';

export function redirectOnExpiredSession(error: unknown): void {
  if (!(error instanceof ApiError) || error.kind !== 'unauthorized') {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }
  // So khớp base-path-aware: pathname thật gồm cả base (`${base}/sign-in`), nên dùng base
  // để guard khớp với resolve() ở dòng dưới (tránh vòng lặp kể cả khi cấu hình paths.base).
  if (window.location.pathname.startsWith(`${base}${SIGN_IN_PATH}`)) {
    return;
  }
  void goto(resolve(SIGN_IN_PATH), { replaceState: true });
}

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
    queryCache: new QueryCache({ onError: redirectOnExpiredSession }),
    mutationCache: new MutationCache({ onError: redirectOnExpiredSession }),
  });
}
