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
 * (tránh vòng lặp) và khi retry chưa cạn (retry: 1 nuốt 401 thoáng qua lúc đang refresh).
 */
import { QueryClient, QueryCache, MutationCache } from '@tanstack/svelte-query';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { ApiError } from '$lib/api-client';

function redirectOnExpiredSession(error: unknown): void {
  if (!(error instanceof ApiError) || error.kind !== 'unauthorized') {
    return;
  }
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/sign-in')) {
    return;
  }
  void goto(resolve('/sign-in'), { replaceState: true });
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
