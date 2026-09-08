<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import { Filter, Calendar, X, Shield, ArrowLeft, ArrowRight } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();
  let logs = $derived(data.logs);

  let filterAction = $state($page.url.searchParams.get('action') || '');
  let startDate = $state($page.url.searchParams.get('startDate') || '');
  let endDate = $state($page.url.searchParams.get('endDate') || '');

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

<svelte:head>
  <title>Nhật Ký Kiểm Toán (Audit Logs) - Admin ViOS</title>
</svelte:head>

<div class="audit-logs-page">
  <!-- Filter Glass Toolbar -->
  <div class="filter-glass-bar">
    <div class="filter-inputs">
      <div class="filter-group">
        <label for="filterAction" class="filter-label">
          <Shield size={13} />
          <span>Hành Động:</span>
        </label>
        <select id="filterAction" class="filter-select" bind:value={filterAction}>
          <option value="">Tất cả hành động</option>
          <option value="TOPUP_XU">Nạp / Trừ XU (Admin)</option>
          <option value="BAN_USER">Khóa Tài Khoản (Ban)</option>
          <option value="UNBAN_USER">Mở Khóa Tài Khoản</option>
          <option value="UPDATE_CONFIG">Cập Nhật Cấu Hình</option>
        </select>
      </div>

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
        <span>Lọc Nhật Ký</span>
      </button>
      {#if filterAction || startDate || endDate}
        <button class="btn btn-clear-filter" onclick={clearFilters}>
          <X size={14} />
          <span>Xóa Lọc</span>
        </button>
      {/if}
    </div>
  </div>

  <!-- Data Table -->
  <div class="data-table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Thời Gian</th>
          <th>Admin Thực Hiện</th>
          <th>Hành Động</th>
          <th>Target (User/ID)</th>
          <th>Chi Tiết (Metadata)</th>
        </tr>
      </thead>
      <tbody>
        {#each logs as log (log.id ?? log.created_at)}
          <tr class="log-row">
            <td class="date-cell">
              {new Date(log.created_at).toLocaleString('vi-VN')}
            </td>
            <td class="primary-cell">
              <span class="actor-email">{log.actor_email}</span>
            </td>
            <td>
              <span class="badge badge-{log.action.toLowerCase()}">
                {log.action}
              </span>
            </td>
            <td class="secondary-cell">
              <code class="id-code">{log.target_id || '-'}</code>
            </td>
            <td class="meta-cell" title={log.metadata ? JSON.stringify(log.metadata) : ''}>
              {log.metadata ? JSON.stringify(log.metadata) : '-'}
            </td>
          </tr>
        {/each}
        {#if logs.length === 0}
          <tr>
            <td colspan="5" class="empty-cell">Chưa có nhật ký kiểm toán nào.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  <div class="pagination-bar">
    <button 
      class="btn btn-page" 
      disabled={data.page <= 1} 
      onclick={() => changePage(data.page - 1)}
    >
      <ArrowLeft size={14} />
      <span>Trang trước</span>
    </button>
    <span class="page-info">Trang {data.page} (Tổng {data.count} bản ghi)</span>
    <button 
      class="btn btn-page" 
      disabled={logs.length < 50} 
      onclick={() => changePage(data.page + 1)}
    >
      <span>Trang sau</span>
      <ArrowRight size={14} />
    </button>
  </div>
</div>

<style>
  .audit-logs-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
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

  @media (min-width: 768px) {
    .filter-glass-bar {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
    }
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

  .filter-select,
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

  .filter-select:focus,
  .filter-input:focus {
    border-color: var(--color-accent-primary);
  }

  .filter-actions {
    display: flex;
    gap: var(--space-xs);
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
    color: var(--color-text-on-primary);
  }

  .btn-filter:hover {
    background: var(--color-accent-primary-pressed);
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
    min-width: 800px;
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

  .log-row:hover {
    background-color: var(--overlay-ink-wash);
  }

  .log-row:last-child td {
    border-bottom: none;
  }

  .date-cell {
    font-size: 12px;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .actor-email {
    font-weight: 600;
    font-size: 13px;
    color: var(--color-text-primary);
  }

  .id-code {
    background: var(--overlay-ink-wash);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .meta-cell {
    font-family: monospace;
    font-size: 12px;
    color: var(--color-text-muted);
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .badge-topup_xu {
    background: rgba(212, 175, 55, 0.15);
    color: #d4af37;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .badge-ban_user {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .badge-unban_user {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .badge-update_config {
    background: rgba(192, 132, 252, 0.15);
    color: #c084fc;
    border: 1px solid rgba(192, 132, 252, 0.3);
  }

  .empty-cell {
    text-align: center;
    padding: 32px !important;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  /* Pagination */
  .pagination-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .btn-page {
    background: var(--glass-bg);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-primary);
  }

  .btn-page:hover:not(:disabled) {
    background: var(--overlay-ink-wash);
    border-color: var(--overlay-border-strong);
  }

  .btn-page:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .page-info {
    font-size: 13px;
    color: var(--color-text-muted);
    font-weight: 500;
  }
</style>
