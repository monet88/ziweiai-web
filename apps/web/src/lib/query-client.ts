/**
 * QueryClient dùng chung cho TanStack svelte-query.
 *
 * staleTime: 30_000, retry: 1 (theo SPEC §7 + nguồn Expo thật; xem
 * docs/decisions/0006-spec-vs-code-naming.md — KHÔNG phải 3000).
 */
import { QueryClient } from '@tanstack/svelte-query';

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}
