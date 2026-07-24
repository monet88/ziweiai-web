<script lang="ts">
  import { getAuthStore } from '$lib/auth/auth-context';
  import { GlobalPaywallModal } from '$lib/components/ui';
  import type { Snippet } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { sanitizeReferralCode } from '$lib/features/referral/append-referral-query';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  const auth = getAuthStore();

  $effect(() => {
    if (browser) {
      const refCode = sanitizeReferralCode($page.url.searchParams.get('ref'));
      if (refCode) {
        localStorage.setItem('ziweiai_ref_code', refCode);
      }
    }
  });

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

<GlobalPaywallModal />

<style>
  .state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: var(--space-lg);
    background: var(--color-bg-primary);
    color: var(--color-text-muted);
    font-size: 15px;
  }
</style>
