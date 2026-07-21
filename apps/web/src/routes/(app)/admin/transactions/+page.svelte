<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>Lịch sử giao dịch - Admin - Tử Vi Toàn Tập</title>
</svelte:head>



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

<style>
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
