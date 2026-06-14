<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
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

<QueryClientProvider client={data.queryClient}>
  {@render children()}
</QueryClientProvider>
