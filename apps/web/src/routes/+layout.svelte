<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import '@fontsource-variable/inter/wght.css';
  import '@fontsource-variable/playfair-display/wght.css';
  import '@fontsource-variable/space-grotesk/wght.css';
  import '$lib/theme/tokens.css';
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';
  import { AuthStore } from '$lib/auth/auth-store.svelte';
  import { setAuthStore } from '$lib/auth/auth-context';
  import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

  interface Props {
    data: LayoutData;
    children: Snippet;
  }

  let { data, children }: Props = $props();

  // Auth store sống suốt vòng đời app, cấp xuống cây qua context.
  const auth = setAuthStore(new AuthStore());

  // Nạp session + subscribe onAuthStateChange; cleanup khi layout unmount.
  $effect(() => auth.init());
</script>

<svelte:head>
  <!-- Tiêu đề mặc định toàn app (WCAG 2.4.2): mọi route đều có <title>. Trang con có thể
       override bằng <svelte:head><title> riêng. -->
  <title>ViOS — Hệ Điều Hành Mệnh Lý & Thuật Số AI Hoàng Gia</title>
  <meta name="description" content="ViOS Tử Vi Toàn Tập — Nền tảng thuật số AI hoàng triều: Lập lá số Tử Vi chính tông, Bát Tự Tứ Trụ, Thần Số Học, Kinh Dịch Lục Hào, Xem Tướng AI. Trải nghiệm miễn phí 100%!" />
  <meta property="og:site_name" content="ViOS — Tử Vi Toàn Tập" />
  <meta property="og:image" content="https://tuvitoantap.vercel.app/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://tuvitoantap.vercel.app/og-image.png" />
</svelte:head>

<QueryClientProvider client={data.queryClient}>
  {@render children()}
  <ToastContainer />
</QueryClientProvider>
