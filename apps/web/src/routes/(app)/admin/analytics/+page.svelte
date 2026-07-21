<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';

  export let data: PageData;
  $: analytics = data.analytics;

  let startDate = $page.url.searchParams.get('startDate') || '';
  let endDate = $page.url.searchParams.get('endDate') || '';

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
</script>

<svelte:head>
  <title>Thống kê - Admin Tử Vi Toàn Tập</title>
</svelte:head>



<div class="filter-bar">
  <div class="filter-group">
    <label for="startDate" class="filter-label">Từ ngày:</label>
    <input type="date" id="startDate" class="filter-input" bind:value={startDate} />
  </div>

  <div class="filter-group">
    <label for="endDate" class="filter-label">Đến ngày:</label>
    <input type="date" id="endDate" class="filter-input" bind:value={endDate} />
  </div>

  <div class="filter-actions">
    <button class="btn btn-primary" onclick={applyFilters}>Lọc</button>
    <button class="btn btn-outline" onclick={clearFilters}>Xoá</button>
  </div>
</div>

{#if !analytics}
  <div class="alert alert-danger">
    <div class="alert-content">
      <h3 class="alert-title">Lỗi tải dữ liệu</h3>
      <p class="alert-desc">Không thể lấy dữ liệu thống kê từ máy chủ.</p>
    </div>
  </div>
{:else}
  <div class="stats-grid">
    <!-- Total Users -->
    <div class="stat-card">
      <dt class="stat-label">Tổng người dùng</dt>
      <dd class="stat-value text-primary">{analytics.total_users}</dd>
    </div>

    <!-- Total XU Topup -->
    <div class="stat-card">
      <dt class="stat-label">XU nạp (trong kỳ)</dt>
      <dd class="stat-value text-success">{analytics.total_xu_topup}</dd>
    </div>

    <!-- Total XU Consumed -->
    <div class="stat-card">
      <dt class="stat-label">XU tiêu (trong kỳ)</dt>
      <dd class="stat-value text-warning">{analytics.total_xu_consumed}</dd>
    </div>
  </div>

  {#if analytics.feature_usage && analytics.feature_usage.length > 0}
  <div class="table-section">
    <h2 class="section-title">Tiêu thụ XU theo tính năng</h2>
    <div class="feature-usage-grid">
      {#each analytics.feature_usage as feature}
        <div class="feature-card">
          <div class="feature-name">
            {#if feature.feature === 'ai_usage'}
              Giải mã AI (Tử Vi)
            {:else if feature.feature === 'vision_tarot'}
              Tarot AI
            {:else if feature.feature === 'vision_face'}
              Xem Tướng Mặt AI
            {:else if feature.feature === 'vision_palm'}
              Chỉ Tay AI
            {:else}
              {feature.feature}
            {/if}
          </div>
          <div class="feature-value">{feature.consumed} XU</div>
        </div>
      {/each}
    </div>
  </div>
  {/if}

  <div class="table-section">
    <h2 class="section-title">Biến động 30 ngày gần nhất</h2>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Ngày</th>
            <th class="align-right">Đăng ký mới</th>
            <th class="align-right">XU Nạp</th>
            <th class="align-right">XU Tiêu Thụ</th>
          </tr>
        </thead>
        <tbody>
          {#each analytics.daily_stats as stat (stat.date)}
            <tr>
              <td class="primary-cell">{stat.date}</td>
              <td class="align-right secondary-cell">{stat.new_users}</td>
              <td class="align-right text-success font-medium">+{stat.xu_topup}</td>
              <td class="align-right text-warning font-medium">-{stat.xu_consumed}</td>
            </tr>
          {/each}
          {#if analytics.daily_stats.length === 0}
            <tr>
              <td colspan="4" class="empty-cell">Không có dữ liệu trong 30 ngày qua.</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
{/if}

<style>
  .alert {
    background: #fde8e8;
    border-radius: var(--radius-md);
    padding: var(--space-md);
    margin-top: var(--space-lg);
    display: flex;
  }

  .alert-danger {
    color: var(--color-accent-danger);
  }

  .alert-title {
    font-size: var(--text-body-sm);
    font-weight: 600;
    margin: 0;
  }

  .alert-desc {
    margin: var(--space-xs) 0 0 0;
    font-size: var(--text-body-sm);
    color: #9a3a3a;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
  }

  .feature-usage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-sm);
  }

  .feature-card {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: var(--shadow-card);
  }

  .feature-name {
    font-size: var(--text-body-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-xs);
    text-align: center;
  }

  .feature-value {
    font-size: var(--text-heading-3);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
    background: var(--color-bg-surface);
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-hairline);
    box-shadow: var(--shadow-card);
    align-items: flex-end;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .filter-label {
    font-size: var(--text-caption);
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .filter-input {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font-size: var(--text-body-sm);
    font-family: inherit;
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
  }

  .filter-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .btn {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    font-size: var(--text-body-sm);
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    border: 1px solid transparent;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--color-accent-primary);
    color: var(--color-text-on-primary);
  }

  .btn-outline {
    background: transparent;
    border-color: var(--color-border-strong);
    color: var(--color-text-primary);
  }

  @media (min-width: 640px) {
    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .stat-card {
    background: var(--color-bg-surface);
    border-radius: var(--radius-lg);
    padding: var(--space-xl) var(--space-lg);
    box-shadow: var(--shadow-card);
    border: 1px solid var(--color-border-hairline);
    overflow: hidden;
  }

  .stat-label {
    font-size: var(--text-caption);
    font-weight: 500;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stat-value {
    margin-top: var(--space-xs);
    font-size: var(--text-display);
    font-family: var(--font-serif);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .text-primary { color: var(--color-text-primary); }
  .text-success { color: var(--color-accent-green); }
  .text-warning { color: var(--color-accent-sienna); }
  .font-medium { font-weight: 500; }

  .table-section {
    margin-top: var(--space-xxl);
  }

  .section-title {
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    color: var(--color-text-primary);
    margin-bottom: var(--space-md);
  }

  /* Table Styles */
  .data-table-container {
    width: 100%;
    overflow-x: auto;
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
  }

  .data-table {
    width: 100%;
    min-width: 600px;
    border-collapse: collapse;
    text-align: left;
  }

  .data-table th,
  .data-table td {
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--color-border-hairline);
  }

  .data-table thead th {
    background: var(--color-bg-elevated);
    font-size: var(--text-caption);
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    border-bottom: 2px solid var(--color-border-strong);
  }

  .data-table tbody tr {
    transition: background-color var(--duration-fast);
  }

  .data-table tbody tr:hover {
    background-color: var(--overlay-ink-wash);
  }

  .data-table tbody tr:last-child td {
    border-bottom: none;
  }

  .primary-cell {
    font-weight: 500;
    color: var(--color-text-primary);
    font-size: var(--text-body);
  }

  .secondary-cell {
    color: var(--color-text-muted);
    font-size: var(--text-body-sm);
  }

  .align-right {
    text-align: right;
  }

  .empty-cell {
    text-align: center;
    padding: var(--space-xxl) !important;
    color: var(--color-text-muted);
    font-size: var(--text-body);
  }
</style>
