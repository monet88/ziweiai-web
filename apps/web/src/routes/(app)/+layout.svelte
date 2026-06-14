<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  const auth = getAuthStore();

  // Guard: chỉ quyết định redirect SAU khi init xong (isInitializing=false) để tránh
  // vòng lặp redirect khi session đang được nạp lại từ localStorage.
  $effect(() => {
    if (!auth.isInitializing && !auth.isAuthenticated) {
      void goto(resolve('/sign-in'), { replaceState: true });
    }
  });
</script>

{#if auth.isInitializing}
  <main class="state">
    <p>Đang kiểm tra phiên đăng nhập…</p>
  </main>
{:else if auth.isAuthenticated}
  {@render children()}
{:else}
  <main class="state">
    <p>Đang chuyển tới trang đăng nhập…</p>
  </main>
{/if}

<style>
  .state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    color: #6b7280;
    font-family: system-ui, sans-serif;
  }
</style>
