<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';

  export let data: PageData;
  $: logs = data.logs;

  let filterAction = $page.url.searchParams.get('action') || '';
  let startDate = $page.url.searchParams.get('startDate') || '';
  let endDate = $page.url.searchParams.get('endDate') || '';

  function applyFilters() {
    const url = new URL($page.url);
    url.searchParams.set('page', '1');
    
    if (filterAction) url.searchParams.set('action', filterAction);
    else url.searchParams.delete('action');
    
    if (startDate) url.searchParams.set('startDate', startDate);
    else url.searchParams.delete('startDate');
    
    if (endDate) url.searchParams.set('endDate', endDate);
    else url.searchParams.delete('endDate');
    
    goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  function clearFilters() {
    filterAction = '';
    startDate = '';
    endDate = '';
    const url = new URL($page.url);
    url.searchParams.delete('action');
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

<div class="header-section">
  <h3 class="page-title">Nhật ký hoạt động (Audit Logs)</h3>
  <p class="page-desc">Danh sách các hành động nhạy cảm của Admin.</p>
</div>

<div class="filter-bar">
  <div class="filter-group">
    <label for="filterAction" class="filter-label">Hành động:</label>
    <select id="filterAction" class="filter-input" bind:value={filterAction}>
      <option value="">Tất cả</option>
      <option value="TOPUP_XU">Nạp/Trừ XU (Admin)</option>
      <option value="BAN_USER">Ban User</option>
      <option value="UNBAN_USER">Unban User</option>
      <option value="UPDATE_CONFIG">Cập nhật cấu hình</option>
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
        <th>Email Admin</th>
        <th>Hành động</th>
        <th>Target</th>
        <th>Chi tiết (Metadata)</th>
      </tr>
    </thead>
    <tbody>
      {#each logs as log (log.id ?? log.created_at)}
        <tr>
          <td class="secondary-cell">
            {new Date(log.created_at).toLocaleString('vi-VN')}
          </td>
          <td class="primary-cell font-medium">
            {log.actor_email}
          </td>
          <td>
            <span class="badge badge-indigo">
              {log.action}
            </span>
          </td>
          <td class="secondary-cell">
            {log.target_id || '-'}
          </td>
          <td class="secondary-cell cell-truncate" title={JSON.stringify(log.metadata)}>
            {log.metadata ? JSON.stringify(log.metadata) : '-'}
          </td>
        </tr>
      {/each}
      {#if logs.length === 0}
        <tr>
          <td colspan="5" class="empty-cell">Chưa có nhật ký nào.</td>
        </tr>
      {/if}
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
    disabled={logs.length < 50} 
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


  .header-section {
    margin-bottom: var(--space-xl);
  }

  .page-title {
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    color: var(--color-text-primary);
    margin: 0;
    font-weight: 600;
  }

  .page-desc {
    margin: var(--space-xs) 0 0 0;
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
    color: var(--color-text-primary);
    font-size: var(--text-body);
  }

  .secondary-cell {
    color: var(--color-text-muted);
    font-size: var(--text-body-sm);
  }
  
  .font-medium {
    font-weight: 500;
  }

  .cell-truncate {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  .badge-indigo {
    background: #e0e7ff;
    color: #4338ca;
  }

  .empty-cell {
    text-align: center;
    padding: var(--space-xxl) !important;
    color: var(--color-text-muted);
    font-size: var(--text-body);
  }
</style>
