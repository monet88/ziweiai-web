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
  <title>Tử Vi - Lập lá số và luận giải</title>
</svelte:head>

<QueryClientProvider client={data.queryClient}>
  {@render children()}
</QueryClientProvider>
