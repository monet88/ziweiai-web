<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
  let logs = data.logs;
</script>

<div class="header-section">
  <h3 class="page-title">Nhật ký hoạt động (Audit Logs)</h3>
  <p class="page-desc">Danh sách các hành động nhạy cảm của Admin.</p>
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
      {#each logs as log}
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

<style>
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
