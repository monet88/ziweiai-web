<script lang="ts">
  import { getAuthStore } from '$lib/auth/auth-context';
  import { setWalletStore } from '$lib/features/payment/wallet-context';
  import {
    GlobalPaywallModal,
    GlobalAuthModal,
    MobileBottomNav,
    GlobalBottomSheet,
    AnonymousPreservationBanner,
  } from '$lib/components/ui';
  import NotificationDrawer from '$lib/features/notifications/NotificationDrawer.svelte';
  import { notificationStore } from '$lib/features/notifications/notification-store.svelte';
  import type { Snippet } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { sanitizeReferralCode } from '$lib/features/referral/append-referral-query';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  const auth = getAuthStore();
  const wallet = setWalletStore(auth);

  $effect(() => {
    if (browser && !auth.isAnonymous) {
      wallet.subscribe();
      return () => wallet.unsubscribe();
    }
  });

  $effect(() => {
    if (browser) {
      const refCode = sanitizeReferralCode($page.url.searchParams.get('ref'));
      if (refCode) {
        localStorage.setItem('ziweiai_ref_code', refCode);
      }
    }
  });

  $effect(() => {
    if (browser && !auth.isInitializing && !auth.session) {
      const pathname = $page.url.pathname;
      const isPublic =
        pathname === '/sign-in' ||
        pathname === '/terms' ||
        pathname === '/privacy' ||
        pathname.startsWith('/blog');
      if (!isPublic) {
        void goto('/sign-in');
      }
    }
  });

  $effect(() => {
    if (wallet.lastTopupEvent) {
      notificationStore.pushNotification({
        id: `topup-${Date.now()}`,
        type: 'topup_success',
        title: 'Nạp XU Hoàng Kim Thành Công',
        body: `+${wallet.lastTopupEvent.added} XU đã được cộng vào ví của bạn qua VietQR. Số dư mới: ${wallet.lastTopupEvent.newBalance} XU.`,
        amountXu: wallet.lastTopupEvent.added,
        link: '/wallet',
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    }
  });

  $effect(() => {
    if (wallet.lastReferralEvent) {
      const rewardXu = wallet.lastReferralEvent.rewardXu;
      notificationStore.pushNotification({
        id: `ref-honour-${Date.now()}`,
        type: 'referral_reward',
        title: 'Vinh Danh Sứ Giả Hoàng Triều',
        body: `Một đồng đạo vừa kích hoạt thành công qua mã giới thiệu của bạn! Thưởng nóng +${rewardXu} XU hoàng kim đã được trao vào ví.`,
        amountXu: rewardXu,
        link: '/wallet',
        createdAt: new Date().toISOString(),
        isRead: false,
      });
      wallet.clearReferralEvent();
    }
  });
</script>

{#if auth.isInitializing}
  <main class="state">
    <p>Đang chuẩn bị không gian tử vi của bạn…</p>
  </main>
{:else}
  <AnonymousPreservationBanner />
  <div class="app-content-wrapper">
    {@render children()}
  </div>
  <!-- Thanh điều hướng đáy chỉ xuất hiện trên thiết bị di động (<=768px) -->
  <MobileBottomNav />
{/if}

<NotificationDrawer />
<GlobalPaywallModal />
<GlobalAuthModal />
<GlobalBottomSheet />

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

  .app-content-wrapper {
    min-height: 100vh;
  }

  @media (max-width: 768px) {
    .app-content-wrapper {
      /* Tạo khoảng trống 64px ở đáy cho MobileBottomNav trên thiết bị di động */
      padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
    }
  }
</style>
