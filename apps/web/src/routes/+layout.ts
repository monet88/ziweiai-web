/**
 * Layout root: ép SPA client-only (ssr=false) + không prerender.
 * Khởi tạo QueryClient ở đây để mỗi tải trang có một instance sạch.
 */
import { browser } from '$app/environment';
import { createAppQueryClient } from '$lib/query-client';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;

export const load: LayoutLoad = () => {
  return {
    queryClient: createAppQueryClient(),
    browser,
  };
};
