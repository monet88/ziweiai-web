<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';

  export let data: PageData;

  let filterType = $page.url.searchParams.get('type') || '';
  let startDate = $page.url.searchParams.get('startDate') || '';
  let endDate = $page.url.searchParams.get('endDate') || '';

  function applyFilters() {
    const url = new URL($page.url);
    url.searchParams.set('page', '1');
    
    if (filterType) url.searchParams.set('type', filterType);
    else url.searchParams.delete('type');
    
    if (startDate) url.searchParams.set('startDate', startDate);
    else url.searchParams.delete('startDate');
    
    if (endDate) url.searchParams.set('endDate', endDate);
    else url.searchParams.delete('endDate');
    
    goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  function clearFilters() {
    filterType = '';
    startDate = '';
    endDate = '';
    const url = new URL($page.url);
    url.searchParams.delete('type');
    url.searchParams.delete('startDate');
    url.searchParams.delete('endDate');
    url.searchParams.set('page', '1');
    goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  function changePage(newPage: number) {
    if (newPage < 1) return;
    const url = new URL($page.url);
    url.searchParams.set('page', newPage.toString());
    goto(url.toString(), { keepFocus: true });
  }
</script>

<svelte:head>
  <title>Lịch sử giao dịch - Admin - Tử Vi Toàn Tập</title>
</svelte:head>

<div class="filter-bar">
  <div class="filter-group">
    <label for="filterType" class="filter-label">Loại GD:</label>
    <select id="filterType" class="filter-input" bind:value={filterType}>
      <option value="">Tất cả</option>
      <option value="topup">Nạp XU (&gt;0)</option>
      <option value="consume">Tiêu XU (&lt;0)</option>
      <option value="admin_topup">Admin Nạp/Trừ</option>
      <option value="ai_usage">AI Usage</option>
      <option value="sepay_topup">Nạp qua SePay</option>
      <option value="revenuecat_topup">Nạp qua In-App</option>
    </select>
  </div>
  
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

<div class="data-table-container">
  <table class="data-table">
    <thead>
      <tr>
        <th>Thời gian</th>
        <th>Người dùng</th>
        <th>Loại GD</th>
        <th class="align-right">Biến động</th>
        <th class="align-right">Số dư cuối</th>
        <th>Thực hiện bởi</th>
      </tr>
    </thead>
    <tbody>
      {#each data.transactions as tx (tx.id)}
        <tr>
          <td class="secondary-cell">
            {new Date(tx.created_at).toLocaleString('vi-VN')}
          </td>
          <td class="primary-cell">
            {tx.profiles?.full_name || tx.profiles?.email || 'N/A'}
          </td>
          <td>
            <span class="badge badge-info">
              {tx.transaction_type}
            </span>
          </td>
          <td class="align-right highlight-cell {tx.amount > 0 ? 'text-success' : 'text-danger'}">
            {tx.amount > 0 ? '+' : ''}{tx.amount}
          </td>
          <td class="align-right secondary-cell font-bold">
            {tx.balance_after}
          </td>
          <td class="secondary-cell">
            {tx.actor_email || 'Hệ thống'}
          </td>
        </tr>
      {:else}
        <tr>
          <td colspan="6" class="empty-cell">
            Chưa có giao dịch nào.
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<div class="pagination">
  <button 
    class="btn btn-outline" 
    disabled={data.page <= 1} 
    onclick={() => changePage(data.page - 1)}
  >
    Trang trước
  </button>
  <span class="page-info">Trang {data.page} (Tổng: {data.count} GD)</span>
  <button 
    class="btn btn-outline" 
    disabled={data.transactions.length < 50} 
    onclick={() => changePage(data.page + 1)}
  >
    Trang sau
  </button>
</div>

<style>
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

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--space-lg);
  }

  .page-info {
    font-size: var(--text-body-sm);
    color: var(--color-text-secondary);
  }

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
    min-width: 800px;
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

  .highlight-cell {
    font-weight: 700;
    font-size: var(--text-body);
  }
  
  .font-bold {
    font-weight: 700;
  }

  .text-success {
    color: var(--color-accent-green);
  }

  .text-danger {
    color: var(--color-accent-danger);
  }

  .align-right {
    text-align: right;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
  }

  .badge-info {
    background: #e0f2fe;
    color: #0369a1;
  }

  .empty-cell {
    text-align: center;
    padding: var(--space-xxl) !important;
    color: var(--color-text-muted);
    font-size: var(--text-body);
  }
</style>
