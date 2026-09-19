<script lang="ts">
  import { getAuthStore } from '$lib/auth/auth-context';
  import { authModalStore } from '$lib/stores/auth-modal.svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { ShieldAlert, ArrowRight, X } from 'lucide-svelte';

  const auth = getAuthStore();
  let dismissed = $state(false);

  $effect(() => {
    if (browser) {
      dismissed = sessionStorage.getItem('vios_hide_anon_banner') === 'true';
    }
  });

  const shouldShow = $derived.by(() => {
    if (!browser || dismissed || !auth.session || !auth.isAnonymous) return false;
    const pathname = $page.url.pathname;
    const isExcluded = pathname === '/sign-in' || pathname === '/terms' || pathname === '/privacy' || pathname === '/privacy-policy';
    return !isExcluded;
  });

  function handleDismiss() {
    dismissed = true;
    if (browser) {
      sessionStorage.setItem('vios_hide_anon_banner', 'true');
    }
  }

  function handleOpenAuth() {
    authModalStore.open('Liên kết tài khoản email hoặc đăng nhập để bảo toàn lá số và số dư XU vĩnh cửu trên mọi thiết bị.');
  }
</script>

{#if shouldShow}
  <aside class="anon-banner" role="status" aria-label="Bảo toàn tài khoản">
    <div class="banner-inner">
      <div class="banner-content">
        <div class="icon-wrap">
          <ShieldAlert class="shield-icon" size={16} />
        </div>
        <p class="banner-text">
          <span class="highlight">Khách vãng lai:</span> Dữ liệu lá số và XU tạm thời có thể bị xóa khi xóa trình duyệt.
        </p>
      </div>

      <div class="banner-actions">
        <button type="button" class="btn-preserve" onclick={handleOpenAuth}>
          <span>Bảo Toàn Lá Số</span>
          <ArrowRight size={13} />
        </button>
        <button type="button" class="btn-close" aria-label="Tạm ẩn" onclick={handleDismiss}>
          <X size={14} />
        </button>
      </div>
    </div>
  </aside>
{/if}

<style>
  .anon-banner {
    width: 100%;
    background: linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.08) 100%);
    border-bottom: 1px solid rgba(245, 158, 11, 0.22);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 40;
    font-family: inherit;
    transition: all 0.3s ease;
  }

  .banner-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .banner-content {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f59e0b;
    flex-shrink: 0;
  }

  .banner-text {
    font-size: 13px;
    color: var(--color-text-secondary, #cbd5e1);
    margin: 0;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .highlight {
    font-weight: 700;
    color: #fbbf24;
  }

  .banner-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .btn-preserve {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: #0f172a;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .btn-preserve:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
  }

  .btn-close {
    background: transparent;
    border: none;
    color: var(--color-text-muted, #94a3b8);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s ease;
  }

  .btn-close:hover {
    color: #f8fafc;
  }

  @media (max-width: 640px) {
    .banner-inner {
      padding: 6px 12px;
    }
    .banner-text {
      font-size: 11px;
    }
    .btn-preserve {
      font-size: 11px;
      padding: 3px 8px;
    }
  }

  :global([data-theme="light"]) .anon-banner {
    background: linear-gradient(90deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.12) 100%);
    border-bottom: 1px solid rgba(217, 119, 6, 0.28);
  }

  :global([data-theme="light"]) .banner-text {
    color: #334155;
  }

  :global([data-theme="light"]) .highlight {
    color: #b45309;
  }
</style>
