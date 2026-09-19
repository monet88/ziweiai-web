<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/stores';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { Home, Clock, WalletCards, Settings, LogIn } from 'lucide-svelte';
  import WalletIndicator from '$lib/features/payment/WalletIndicator.svelte';

  const auth = getAuthStore();
  const currentPath = $derived($page.url.pathname);
  const isMember = $derived(auth.isAuthenticated && !auth.isAnonymous && Boolean(auth.user?.email));
</script>

<div class="bottom-nav-mobile">
  <a href={resolve('/')} class="nav-item {currentPath === resolve('/') ? 'active' : ''}">
    <div class="icon-wrap {currentPath === resolve('/') ? 'active-pill' : ''}">
      <Home size={20} />
    </div>
    <span>Trang chủ</span>
  </a>
  
  {#if isMember}
    <a href={resolve('/history')} class="nav-item {currentPath.startsWith(resolve('/history')) ? 'active' : ''}">
      <div class="icon-wrap {currentPath.startsWith(resolve('/history')) ? 'active-pill' : ''}">
        <Clock size={20} />
      </div>
      <span>Lịch sử</span>
    </a>
  {/if}

  <a href={resolve('/wallet')} class="nav-item {currentPath.startsWith(resolve('/wallet')) ? 'active' : ''}">
    <div class="icon-wrap {currentPath.startsWith(resolve('/wallet')) ? 'active-pill' : ''} relative">
      <WalletCards size={20} />
      {#if isMember}
        <div class="wallet-badge">
          <WalletIndicator />
        </div>
      {/if}
    </div>
    <span>Ví & Điểm danh</span>
  </a>
  
  {#if isMember}
    <a href={resolve('/settings')} class="nav-item {currentPath.startsWith(resolve('/settings')) ? 'active' : ''}">
      <div class="icon-wrap {currentPath.startsWith(resolve('/settings')) ? 'active-pill' : ''}">
        <Settings size={20} />
      </div>
      <span>Cài đặt</span>
    </a>
  {:else}
    <a href={resolve('/sign-in')} class="nav-item {currentPath.startsWith(resolve('/sign-in')) ? 'active' : ''}">
      <div class="icon-wrap {currentPath.startsWith(resolve('/sign-in')) ? 'active-pill' : ''}">
        <LogIn size={20} />
      </div>
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
    background: var(--glass-bg-strong);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-top: 1px solid var(--overlay-border);
    padding: 6px var(--space-md) calc(env(safe-area-inset-bottom, 12px) + 4px);
    z-index: 50;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.2);
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    color: var(--color-text-muted);
    text-decoration: none;
    flex: 1;
    min-height: 44px;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 3px 14px;
    border-radius: var(--radius-pill);
    transition: all 0.2s ease;
  }

  .icon-wrap.active-pill {
    background: var(--overlay-ink-wash);
    color: var(--color-accent-primary);
  }

  :global([data-theme="dark"]) .icon-wrap.active-pill {
    background: rgba(212, 175, 55, 0.15);
    color: #d4af37;
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
  }

  .nav-item span {
    font-size: 11px;
    font-weight: 600;
  }

  .nav-item.active {
    color: var(--color-accent-primary);
  }

  :global([data-theme="dark"]) .nav-item.active {
    color: #d4af37;
  }

  .relative {
    position: relative;
  }

  .wallet-badge {
    position: absolute;
    top: -4px;
    right: -4px;
  }

  @media (max-width: 768px) {
    .bottom-nav-mobile {
      display: flex;
      justify-content: space-around;
      align-items: center;
    }
  }
</style>
