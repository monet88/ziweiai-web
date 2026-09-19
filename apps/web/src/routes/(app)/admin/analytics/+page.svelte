<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import { BarChart3, Users, Coins, TrendingDown, TrendingUp, Sparkles, Filter, X, Calendar, Download } from 'lucide-svelte';
  import { sanitizeCsvCell } from '$lib/utils/csv-sanitizer';

  let { data }: { data: PageData } = $props();
  let analytics = $derived(data.analytics);

  let startDate = $state($page.url.searchParams.get('startDate') || '');
  let endDate = $state($page.url.searchParams.get('endDate') || '');

  function applyFilters() {
    const url = new URL($page.url);
    if (startDate) url.searchParams.set('startDate', startDate);
    else url.searchParams.delete('startDate');
    
    if (endDate) url.searchParams.set('endDate', endDate);
    else url.searchParams.delete('endDate');
    
    goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  function clearFilters() {
    startDate = '';
    endDate = '';
    const url = new URL($page.url);
    url.searchParams.delete('startDate');
    url.searchParams.delete('endDate');
    goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  function setPreset(days: number) {
    const endMs = Date.now();
    const startMs = endMs - days * 24 * 60 * 60 * 1000;
    startDate = new Date(startMs).toISOString().slice(0, 10);
    endDate = new Date(endMs).toISOString().slice(0, 10);
    applyFilters();
  }

  function setThisMonth() {
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    startDate = start.toISOString().slice(0, 10);
    endDate = now.toISOString().slice(0, 10);
    applyFilters();
  }

  function exportAnalyticsToCsv() {
    if (!analytics || !analytics.daily_stats || analytics.daily_stats.length === 0) {
      alert('Chưa có dữ liệu thống kê để xuất file');
      return;
    }

    const headers = ['Ngày', 'Đăng Ký Mới', 'XU Nạp (+)', 'XU Tiêu Thụ (-)'];
    const rows = analytics.daily_stats.map((stat) => [
      sanitizeCsvCell(stat.date),
      sanitizeCsvCell(stat.new_users || 0),
      sanitizeCsvCell(stat.xu_topup || 0),
      sanitizeCsvCell(stat.xu_consumed || 0),
    ]);

    // Section 2: Tiêu thụ theo tính năng AI
    const featureHeaders = ['', '', '', ''];
    const featureTitle = ['--- PHÂN PHỐI TIÊU THỤ THEO TÍNH NĂNG AI ---', '', '', ''];
    const featureColHeaders = ['Tính Năng AI', 'XU Tiêu Thụ', '', ''];
    const featureRows = (analytics.feature_usage || []).map((f) => [
      sanitizeCsvCell(f.feature),
      sanitizeCsvCell(f.consumed || 0),
      sanitizeCsvCell(''),
      sanitizeCsvCell(''),
    ]);

    const allLines = [
      headers.map(sanitizeCsvCell).join(','),
      ...rows.map((r) => r.join(',')),
      featureHeaders.join(','),
      featureTitle.map(sanitizeCsvCell).join(','),
      featureColHeaders.map(sanitizeCsvCell).join(','),
      ...featureRows.map((r) => r.join(',')),
    ];

    const csvContent = '\uFEFF' + allLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `vios-analytics-xu-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>Thống kê AI & Số Dư XU - Admin ViOS</title>
</svelte:head>

<div class="analytics-page">
  <!-- Filter Toolbar -->
  <div class="filter-glass-bar">
    <div class="filter-presets">
      <span class="preset-label">Xem nhanh:</span>
      <button type="button" class="btn-preset" onclick={() => setPreset(7)}>7 ngày</button>
      <button type="button" class="btn-preset" onclick={() => setPreset(30)}>30 ngày</button>
      <button type="button" class="btn-preset" onclick={setThisMonth}>Tháng này</button>
    </div>

    <div class="filter-inputs">
      <div class="filter-group">
        <label for="startDate" class="filter-label">
          <Calendar size={13} />
          <span>Từ ngày:</span>
        </label>
        <input type="date" id="startDate" class="filter-input" bind:value={startDate} />
      </div>

      <div class="filter-group">
        <label for="endDate" class="filter-label">
          <Calendar size={13} />
          <span>Đến ngày:</span>
        </label>
        <input type="date" id="endDate" class="filter-input" bind:value={endDate} />
      </div>
    </div>

    <div class="filter-actions">
      <button class="btn btn-filter" onclick={applyFilters}>
        <Filter size={14} />
        <span>Lọc Báo Cáo</span>
      </button>

      <button class="btn btn-export" onclick={exportAnalyticsToCsv} disabled={!analytics}>
        <Download size={14} />
        <span>Xuất CSV</span>
      </button>

      {#if startDate || endDate}
        <button class="btn btn-clear-filter" onclick={clearFilters}>
          <X size={14} />
          <span>Xóa Lọc</span>
        </button>
      {/if}
    </div>
  </div>

  {#if !analytics}
    <div class="alert-error">
      <strong>Lỗi tải dữ liệu:</strong> Không thể lấy dữ liệu thống kê từ máy chủ.
    </div>
  {:else}
    <!-- Top 4 Key KPI Cards -->
    <div class="stats-grid">
      <div class="stat-hud-card">
        <div class="stat-top">
          <span class="stat-label">Tổng Người Dùng</span>
          <div class="stat-icon icon-blue">
            <Users size={18} />
          </div>
        </div>
        <div class="stat-value">{analytics.total_users.toLocaleString('vi-VN')}</div>
        <div class="stat-sub">Thành viên hệ thống ViOS</div>
      </div>

      <div class="stat-hud-card">
        <div class="stat-top">
          <span class="stat-label">Doanh Thu Quy Đổi</span>
          <div class="stat-icon icon-gold">
            <Coins size={18} />
          </div>
        </div>
        <div class="stat-value text-gold">{(analytics.total_xu_topup * 1000).toLocaleString('vi-VN')} đ</div>
        <div class="stat-sub">+{analytics.total_xu_topup.toLocaleString('vi-VN')} XU nạp qua SePay</div>
      </div>

      <div class="stat-hud-card">
        <div class="stat-top">
          <span class="stat-label">XU Tiêu Thụ (Trong Kỳ)</span>
          <div class="stat-icon icon-purple">
            <TrendingDown size={18} />
          </div>
        </div>
        <div class="stat-value text-purple">-{analytics.total_xu_consumed.toLocaleString('vi-VN')} XU</div>
        <div class="stat-sub">Sử dụng cho tính năng AI luận giải</div>
      </div>

      <div class="stat-hud-card">
        <div class="stat-top">
          <span class="stat-label">Dòng Tiền Ròng XU</span>
          <div class="stat-icon {analytics.total_xu_topup - analytics.total_xu_consumed >= 0 ? 'icon-emerald' : 'icon-amber'}">
            <TrendingUp size={18} />
          </div>
        </div>
        <div class="stat-value {analytics.total_xu_topup - analytics.total_xu_consumed >= 0 ? 'text-emerald' : 'text-amber'}">
          {analytics.total_xu_topup - analytics.total_xu_consumed >= 0 ? '+' : ''}{(analytics.total_xu_topup - analytics.total_xu_consumed).toLocaleString('vi-VN')} XU
        </div>
        <div class="stat-sub">Số dư XU nạp ròng trong kỳ</div>
      </div>
    </div>

    <!-- Feature Usage Distribution -->
    {#if analytics.feature_usage && analytics.feature_usage.length > 0}
      <div class="section-container">
        <div class="section-header">
          <Sparkles size={18} class="section-icon text-gold" />
          <h2 class="section-title">Tiêu Thụ XU Theo Tính Năng AI</h2>
        </div>
        <div class="feature-usage-grid">
          {#each analytics.feature_usage as feature (feature.feature)}
            <div class="feature-card">
              <div class="feature-name">
                {#if feature.feature === 'ai_usage'}
                  Giải mã AI Tử Vi
                {:else if feature.feature === 'vision_tarot'}
                  Tarot AI Trải Bài
                {:else if feature.feature === 'vision_face'}
                  Xem Tướng Mặt AI
                {:else if feature.feature === 'vision_palm'}
                  Xem Chỉ Tay AI
                {:else if feature.feature === 'numerology_ai'}
                  Thần Số Học AI
                {:else}
                  {feature.feature}
                {/if}
              </div>
              <div class="feature-value">
                <Coins size={14} class="text-gold" />
                <span>{feature.consumed.toLocaleString('vi-VN')} XU</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 30-Day Daily Trends Table -->
    <div class="section-container">
      <div class="section-header">
        <BarChart3 size={18} class="section-icon text-purple" />
        <h2 class="section-title">Biến Động Dòng Tiền & Người Dùng (30 Ngày)</h2>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th class="align-right">Đăng Ký Mới</th>
              <th class="align-right">XU Nạp</th>
              <th class="align-right">XU Tiêu Thụ</th>
            </tr>
          </thead>
          <tbody>
            {#each analytics.daily_stats as stat (stat.date)}
              <tr class="data-row">
                <td class="primary-cell">
                  <span class="date-tag">{stat.date}</span>
                </td>
                <td class="align-right secondary-cell">
                  <span class="num-badge">+{stat.new_users}</span>
                </td>
                <td class="align-right text-success">
                  <strong>+{(stat.xu_topup ?? 0).toLocaleString('vi-VN')}</strong>
                </td>
                <td class="align-right text-warning">
                  <strong>-{(stat.xu_consumed ?? 0).toLocaleString('vi-VN')}</strong>
                </td>
              </tr>
            {/each}
            {#if analytics.daily_stats.length === 0}
              <tr>
                <td colspan="4" class="empty-cell">Không có dữ liệu trong khoảng thời gian đã chọn.</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<style>
  .analytics-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  /* Filter Toolbar */
  .filter-glass-bar {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
  }

  @media (min-width: 1024px) {
    .filter-glass-bar {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
    }
  }

  .filter-presets {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: var(--space-xs);
  }

  .preset-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-muted);
    margin-right: 2px;
  }

  .btn-preset {
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    background: var(--glass-bg);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-preset:hover {
    background: var(--color-accent-primary);
    color: #000;
    border-color: var(--color-accent-primary);
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.25);
  }

  .filter-inputs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .filter-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-caption);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .filter-input {
    padding: 8px 12px;
    border-radius: var(--radius-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--overlay-border-strong);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .filter-input:focus {
    border-color: var(--color-accent-primary);
  }

  .filter-actions {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }

  .btn-filter {
    background: var(--color-accent-primary);
    color: #000;
    font-weight: 700;
  }

  .btn-filter:hover {
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    transform: translateY(-1px);
  }

  .btn-export {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    color: #d4af37;
    font-weight: 700;
  }

  .btn-export:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.15) 100%);
    border-color: #d4af37;
    transform: translateY(-1px);
  }

  .btn-export:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-clear-filter {
    background: transparent;
    border: 1px solid var(--overlay-border-strong);
    color: var(--color-text-secondary);
  }

  .btn-clear-filter:hover {
    background: var(--overlay-ink-wash);
    color: var(--color-text-primary);
  }

  /* Stat HUD Cards */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: var(--space-md);
  }

  @media (min-width: 640px) {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .stat-hud-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-lg);
    background: var(--glass-bg);
    backdrop-filter: blur(18px) saturate(170%);
    -webkit-backdrop-filter: blur(18px) saturate(170%);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card), inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .stat-hud-card:hover {
    transform: translateY(-2px);
    border-color: var(--overlay-border-strong);
  }

  .stat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .stat-label {
    font-size: var(--text-eyebrow);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--color-text-muted);
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
  }

  .icon-blue {
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
  }

  .icon-gold {
    background: rgba(212, 175, 55, 0.15);
    color: #d4af37;
  }

  .icon-purple {
    background: rgba(192, 132, 252, 0.15);
    color: #c084fc;
  }

  .icon-emerald {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .icon-amber {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }

  .text-emerald {
    color: #10b981;
  }

  .text-amber {
    color: #f59e0b;
  }

  .stat-value {
    font-family: var(--font-sans);
    font-size: 28px;
    font-weight: 800;
    color: var(--color-text-primary);
    line-height: 1.1;
  }

  .text-gold {
    color: #d4af37;
  }

  .text-purple {
    color: #c084fc;
  }

  .text-success {
    color: #10b981;
  }

  .text-warning {
    color: #f59e0b;
  }

  .stat-sub {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  /* Section Containers */
  .section-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .section-title {
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    color: var(--color-text-primary);
    margin: 0;
    font-weight: 700;
  }

  /* Feature Usage Grid */
  .feature-usage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--space-md);
  }

  .feature-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-md) var(--space-lg);
    background: var(--glass-bg);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
    transition: transform 0.15s ease;
  }

  .feature-card:hover {
    transform: translateY(-2px);
    border-color: var(--overlay-border-strong);
  }

  .feature-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .feature-value {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 18px;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  /* Table */
  .data-table-container {
    width: 100%;
    overflow-x: auto;
    background: var(--glass-bg);
    backdrop-filter: blur(18px) saturate(170%);
    -webkit-backdrop-filter: blur(18px) saturate(170%);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
  }

  .data-table {
    width: 100%;
    min-width: 640px;
    border-collapse: collapse;
    text-align: left;
  }

  .data-table th,
  .data-table td {
    padding: 12px var(--space-lg);
    border-bottom: 1px solid var(--overlay-border);
  }

  .data-table thead th {
    background: var(--overlay-ink-wash);
    font-size: var(--text-eyebrow);
    font-weight: 700;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
  }

  .align-right {
    text-align: right;
  }

  .data-row:hover {
    background-color: var(--overlay-ink-wash);
  }

  .data-row:last-child td {
    border-bottom: none;
  }

  .date-tag {
    font-family: monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .num-badge {
    background: var(--overlay-ink-wash);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .empty-cell {
    text-align: center;
    padding: 32px !important;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  .alert-error {
    padding: var(--space-md);
    border-radius: var(--radius-md);
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    font-size: 14px;
  }
</style>
