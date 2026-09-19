<script lang="ts">
  import { page } from '$app/stores';
  import { resolve } from '$app/paths';
  import { ShieldCheck, LayoutDashboard, ArrowLeftRight, Users, UserPlus, BarChart3, Sliders, ScrollText, Sparkles, BookOpen } from 'lucide-svelte';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
</script>

<div class="admin-wrapper">
  <div class="admin-ambient-glow-1"></div>
  <div class="admin-ambient-glow-2"></div>

  <div class="admin-container">
    <header class="admin-header">
      <div class="admin-title-group">
        <div class="badge-super-admin">
          <ShieldCheck size={14} class="badge-icon" />
          <span>Hệ Thống Quản Trị ViOS</span>
          <span class="pulse-dot"></span>
        </div>
        <h1 class="admin-title">ViOS Admin Control Center</h1>
        <p class="admin-subtitle">Quản lý tổng quan hệ thống, người dùng, dòng tiền XU, cấu hình AI và nhật ký kiểm toán.</p>
      </div>

      <div class="admin-header-actions">
        <ThemeToggle />
        <a href={resolve('/')} class="btn-return-home">
          <Sparkles size={14} />
          <span>Về trang chủ</span>
        </a>
      </div>
    </header>

    <div class="admin-nav-wrapper">
      <nav class="admin-nav-glass" aria-label="Admin Navigation Tabs">
        <a
          href={resolve('/admin')}
          class="admin-tab {$page.url.pathname === '/admin' ? 'active' : ''}"
        >
          <LayoutDashboard size={16} />
          <span>Tổng quan</span>
        </a>
        <a
          href={resolve('/admin/transactions')}
          class="admin-tab {$page.url.pathname === '/admin/transactions' ? 'active' : ''}"
        >
          <ArrowLeftRight size={16} />
          <span>Giao dịch SePay</span>
        </a>
        <a
          href={resolve('/admin/users')}
          class="admin-tab {$page.url.pathname === '/admin/users' ? 'active' : ''}"
        >
          <Users size={16} />
          <span>Người dùng & XU</span>
        </a>
        <a
          href={resolve('/admin/referrals')}
          class="admin-tab {$page.url.pathname === '/admin/referrals' ? 'active' : ''}"
        >
          <UserPlus size={16} />
          <span>Giới thiệu</span>
        </a>
        <a
          href={resolve('/admin/analytics')}
          class="admin-tab {$page.url.pathname === '/admin/analytics' ? 'active' : ''}"
        >
          <BarChart3 size={16} />
          <span>Thống kê AI & XU</span>
        </a>
        <a
          href={resolve('/admin/configs')}
          class="admin-tab {$page.url.pathname === '/admin/configs' ? 'active' : ''}"
        >
          <Sliders size={16} />
          <span>Cấu hình Cờ AI</span>
        </a>
        <a
          href={resolve('/admin/blog')}
          class="admin-tab {$page.url.pathname.startsWith('/admin/blog') ? 'active' : ''}"
        >
          <BookOpen size={16} />
          <span>Cẩm Nang</span>
        </a>
        <a
          href={resolve('/admin/audit-logs')}
          class="admin-tab {$page.url.pathname.startsWith('/admin/audit-logs') ? 'active' : ''}"
        >
          <ScrollText size={16} />
          <span>Audit Logs</span>
        </a>
      </nav>
    </div>

    <main class="admin-content">
      <slot />
    </main>
  </div>
</div>

<style>
  .admin-wrapper {
    position: relative;
    min-height: 100vh;
    background: var(--color-bg-primary);
    overflow-x: hidden;
  }

  .admin-ambient-glow-1 {
    position: absolute;
    top: -120px;
    left: 10%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, var(--mystical-glow-a) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
    opacity: 0.6;
    filter: blur(80px);
  }

  .admin-ambient-glow-2 {
    position: absolute;
    top: 100px;
    right: 5%;
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, var(--mystical-glow-b) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
    opacity: 0.5;
    filter: blur(90px);
  }

  .admin-container {
    position: relative;
    z-index: 1;
    max-width: 1320px;
    margin: 0 auto;
    padding: var(--space-lg) var(--space-md) var(--space-xxl);
    font-family: var(--font-sans);
  }

  @media (min-width: 640px) {
    .admin-container {
      padding: var(--space-xl) var(--space-xl) 80px;
    }
  }

  .admin-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
    padding-bottom: var(--space-lg);
    border-bottom: 1px solid var(--overlay-border);
  }

  @media (min-width: 768px) {
    .admin-header {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
    }
  }

  .admin-title-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .badge-super-admin {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    background: var(--color-accent-primary-soft);
    border: 1px solid var(--overlay-border-strong);
    color: var(--color-accent-primary);
    font-size: var(--text-eyebrow);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent-green, #10b981);
    box-shadow: 0 0 8px var(--color-accent-green, #10b981);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.85); }
  }

  .admin-title {
    font-family: var(--font-serif);
    font-size: var(--text-h1);
    line-height: var(--text-h1-line);
    color: var(--color-text-primary);
    margin: 0;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .admin-subtitle {
    margin: 0;
    font-size: var(--text-body-sm);
    color: var(--color-text-muted);
    max-width: 650px;
    line-height: 1.5;
  }

  .admin-header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .btn-return-home {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-secondary);
    font-size: var(--text-caption);
    font-weight: 600;
    text-decoration: none;
    transition: all var(--duration-fast) ease;
  }

  .btn-return-home:hover {
    background: var(--glass-bg-strong);
    color: var(--color-text-primary);
    border-color: var(--overlay-border-strong);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  /* Floating Glass Tabs Navigation */
  .admin-nav-wrapper {
    margin-bottom: var(--space-xl);
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .admin-nav-glass {
    display: inline-flex;
    gap: 6px;
    padding: 6px;
    background: var(--glass-bg);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card), inset 0 1px 0 0 rgba(255, 255, 255, 0.06);
  }

  .admin-tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-size: var(--text-caption);
    font-weight: 600;
    color: var(--color-text-muted);
    text-decoration: none;
    white-space: nowrap;
    transition: all var(--duration-fast) cubic-bezier(0.16, 1, 0.3, 1);
  }

  .admin-tab:hover {
    color: var(--color-text-primary);
    background: var(--overlay-ink-wash);
  }

  .admin-tab.active {
    color: var(--color-text-on-primary);
    background: var(--color-accent-primary);
    box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
  }

  :global([data-theme="dark"]) .admin-tab.active {
    color: #0f0c1b;
    background: linear-gradient(135deg, #fce99f 0%, #d4af37 100%);
    box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
  }

  .admin-content {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>

