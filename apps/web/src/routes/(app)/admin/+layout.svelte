<script lang="ts">
  import { page } from '$app/stores';
  import { resolve } from '$app/paths';
</script>

<div class="admin-container">
  <div class="admin-header">
    <div class="admin-title-group">
      <h1 class="admin-title">ViOS Admin Dashboard</h1>
      <p class="admin-subtitle">Quản lý hệ thống, người dùng, giao dịch và giới thiệu.</p>
    </div>
  </div>

  <div class="admin-nav-container">
    <nav class="admin-nav" aria-label="Tabs">
      <a
        href={resolve('/admin')}
        class="admin-tab {$page.url.pathname === '/admin' ? 'active' : ''}"
      >
        Tổng quan
      </a>
      <a
        href={resolve('/admin/transactions')}
        class="admin-tab {$page.url.pathname === '/admin/transactions' ? 'active' : ''}"
      >
        Giao dịch
      </a>
      <a
        href={resolve('/admin/users')}
        class="admin-tab {$page.url.pathname === '/admin/users' ? 'active' : ''}"
      >
        Người dùng
      </a>
      <a
        href={resolve('/admin/referrals')}
        class="admin-tab {$page.url.pathname === '/admin/referrals' ? 'active' : ''}"
      >
        Giới thiệu
      </a>
      <a
        href={resolve('/admin/analytics')}
        class="admin-tab {$page.url.pathname === '/admin/analytics' ? 'active' : ''}"
      >
        Thống kê
      </a>
      <a
        href={resolve('/admin/configs')}
        class="admin-tab {$page.url.pathname === '/admin/configs' ? 'active' : ''}"
      >
        Cấu hình
      </a>
    </nav>
  </div>

  <div class="admin-content">
    <slot />
  </div>
</div>

<style>
  .admin-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: var(--space-xl) var(--space-md);
    font-family: var(--font-sans);
  }

  @media (min-width: 640px) {
    .admin-container {
      padding: var(--space-xxl) var(--space-xl);
    }
  }

  .admin-header {
    display: flex;
    align-items: center;
    margin-bottom: var(--space-xl);
  }

  .admin-title-group {
    flex: 1;
  }

  .admin-title {
    font-family: var(--font-serif);
    font-size: var(--text-h2);
    line-height: var(--text-h2-line);
    color: var(--color-text-primary);
    margin: 0;
    font-weight: 700;
  }

  .admin-subtitle {
    margin-top: var(--space-xs);
    font-size: var(--text-body-sm);
    color: var(--color-text-secondary);
  }

  .admin-nav-container {
    margin-bottom: var(--space-xl);
    border-bottom: 1px solid var(--color-border-hairline);
  }

  .admin-nav {
    display: flex;
    gap: var(--space-xl);
    margin-bottom: -1px;
    overflow-x: auto;
  }

  .admin-tab {
    padding: var(--space-md) var(--space-xs);
    border-bottom: 2px solid transparent;
    font-size: var(--text-body-sm);
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    white-space: nowrap;
    transition: color var(--duration-fast), border-color var(--duration-fast);
  }

  .admin-tab:hover {
    color: var(--color-text-primary);
    border-bottom-color: var(--color-border-strong);
  }

  .admin-tab.active {
    color: var(--color-accent-primary);
    border-bottom-color: var(--color-accent-primary);
  }

  .admin-content {
    margin-top: var(--space-xl);
  }
</style>
