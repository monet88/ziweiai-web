<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/stores';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { Home, Clock, WalletCards, Settings } from 'lucide-svelte';
  import WalletIndicator from '$lib/features/payment/WalletIndicator.svelte';

  const auth = getAuthStore();
  const currentPath = $derived($page.url.pathname);
  const isMember = $derived(auth.isAuthenticated && !auth.isAnonymous && Boolean(auth.user?.email));
</script>

<div class="bottom-nav-mobile">
  <a href={resolve('/')} class="nav-item {currentPath === resolve('/') ? 'active' : ''}">
    <Home size={22} />
    <span>Trang chủ</span>
  </a>
  
  {#if isMember}
    <a href={resolve('/history')} class="nav-item {currentPath.startsWith(resolve('/history')) ? 'active' : ''}">
      <Clock size={22} />
      <span>Lịch sử</span>
    </a>
  {/if}

  <a href={resolve('/wallet')} class="nav-item {currentPath.startsWith(resolve('/wallet')) ? 'active' : ''}">
    <div class="relative">
      <WalletCards size={22} />
      {#if isMember}
        <div class="absolute -top-1 -right-1">
          <WalletIndicator />
        </div>
      {/if}
    </div>
    <span>Ví XU</span>
  </a>
  
  {#if isMember}
    <a href={resolve('/settings')} class="nav-item {currentPath.startsWith(resolve('/settings')) ? 'active' : ''}">
      <Settings size={22} />
      <span>Cài đặt</span>
    </a>
  {:else}
    <a href={resolve('/sign-in')} class="nav-item {currentPath.startsWith(resolve('/sign-in')) ? 'active' : ''}">
      <Settings size={22} />
      <span>Đăng nhập</span>
    </a>
  {/if}
</div>

<style>
  .bottom-nav-mobile {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid var(--overlay-hairline);
    padding: calc(var(--space-sm) + 2px) var(--space-md) calc(env(safe-area-inset-bottom, 16px) + var(--space-xs));
    z-index: 50;
  }

  :global([data-theme="dark"]) .bottom-nav-mobile {
    background: rgba(15, 17, 23, 0.85);
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: var(--color-text-secondary);
    text-decoration: none;
    flex: 1;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-item span {
    font-size: 11px;
    font-weight: 600;
  }

  .nav-item.active {
    color: var(--color-accent-primary);
  }

  .nav-item.active :global(svg) {
    stroke-width: 2.5px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  @media (max-width: 768px) {
    .bottom-nav-mobile {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
    }
  }
</style>
