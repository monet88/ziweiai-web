<script lang="ts">
  import { getAuthStore } from '$lib/auth/auth-context';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  const auth = getAuthStore();

  // Không còn tường đăng nhập (decision 0009 / US-009): AuthStore.init() cấp phiên ẩn
  // danh khi chưa có session, nên sau init mọi khách đều có JWT thật → dashboard + lập +
  // xem lá số chạy dưới phiên ẩn danh. Guard chỉ còn nhiệm vụ CHỜ init xong, không đá ai
  // về /sign-in. (Trường hợp anonymous sign-in chưa bật → session null; vẫn render để UI
  // báo lỗi tại tầng request thay vì redirect mù.)
</script>

{#if auth.isInitializing}
  <main class="state">
    <p>Đang chuẩn bị không gian tử vi của bạn…</p>
  </main>
{:else}
  {@render children()}
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
