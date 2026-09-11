<script lang="ts">
  import { onMount } from 'svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { NoticeBanner } from '$lib/components/ui';
  import { toast } from '$lib/stores/toast';
  import { sanitizeCsvCell } from '$lib/utils/csv-sanitizer';
  import { ArrowLeftRight, RefreshCw, Search, CheckCircle2, AlertTriangle, Coins, ShieldCheck, UserCheck, X, Link, Download, Activity, Clock } from 'lucide-svelte';

  interface Transaction {
    id: string;
    owner_user_id: string | null;
    amount_vnd: number;
    xu_added: number;
    sepay_transaction_id: string | null;
    created_at: string;
  }

  const auth = getAuthStore();
  let transactions = $state<Transaction[]>([]);
  let isLoading = $state(true);
  let errorMessage = $state<string | null>(null);
  let searchQuery = $state('');

  let targetTxId = $state<string | null>(null);
  let targetUserIdInput = $state('');
  let isReconciling = $state(false);

  let filteredTransactions = $derived(
    transactions.filter((tx) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const idMatch = tx.id.toLowerCase().includes(q);
      const sepayMatch = tx.sepay_transaction_id ? tx.sepay_transaction_id.toLowerCase().includes(q) : false;
      const userMatch = tx.owner_user_id ? tx.owner_user_id.toLowerCase().includes(q) : false;
      return idMatch || sepayMatch || userMatch;
    })
  );

  let totalVnd = $derived(transactions.reduce((sum, tx) => sum + (tx.amount_vnd || 0), 0));
  let totalXuAdded = $derived(transactions.reduce((sum, tx) => sum + (tx.xu_added || 0), 0));
  let unmatchedCount = $derived(transactions.filter((tx) => !tx.owner_user_id).length);

  // 24h Webhook Monitoring Metrics
  let tx24h = $derived(
    transactions.filter((tx) => {
      const created = new Date(tx.created_at).getTime();
      return Date.now() - created <= 24 * 60 * 60 * 1000;
    })
  );
  let total24hVnd = $derived(tx24h.reduce((sum, tx) => sum + (tx.amount_vnd || 0), 0));
  let total24hXu = $derived(tx24h.reduce((sum, tx) => sum + (tx.xu_added || 0), 0));
  let matched24hCount = $derived(tx24h.filter((tx) => Boolean(tx.owner_user_id)).length);
  let unmatched24hCount = $derived(tx24h.filter((tx) => !tx.owner_user_id).length);
  let latestTx = $derived(transactions[0] || null);

  function exportToCsv() {
    if (filteredTransactions.length === 0) {
      toast.show('Không có dữ liệu giao dịch để xuất file', 'info');
      return;
    }

    const headers = ['Mã Giao Dịch', 'Mã SePay', 'User ID Nhận', 'Số Tiền (VNĐ)', 'XU Quy Đổi', 'Thời Gian Tạo', 'Trạng Thái'];
    const rows = filteredTransactions.map((tx) => [
      sanitizeCsvCell(tx.id),
      sanitizeCsvCell(tx.sepay_transaction_id || ''),
      sanitizeCsvCell(tx.owner_user_id || 'Chưa gán'),
      sanitizeCsvCell(tx.amount_vnd || 0),
      sanitizeCsvCell(tx.xu_added || 0),
      sanitizeCsvCell(new Date(tx.created_at).toLocaleString('vi-VN')),
      sanitizeCsvCell(tx.owner_user_id ? 'Đã gán thành công' : 'Chờ gán thủ công'),
    ]);

    const csvContent = '\uFEFF' + [headers.map(sanitizeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `vios-sepay-transactions-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.show(`Đã xuất ${filteredTransactions.length} giao dịch ra file CSV!`, 'success');
  }

  async function loadTransactions() {
    isLoading = true;
    errorMessage = null;
    try {
      const res = await fetch('/api/admin/transactions', {
        headers: {
          Authorization: `Bearer ${auth.session?.access_token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      transactions = await res.json();
    } catch (err: any) {
      errorMessage = err.message || 'Không thể tải danh sách giao dịch';
    } finally {
      isLoading = false;
    }
  }

  async function handleReconcile() {
    if (!targetTxId || !targetUserIdInput.trim()) {
      alert('Vui lòng nhập User ID');
      return;
    }

    isReconciling = true;
    try {
      const res = await fetch('/api/admin/reconcile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.session?.access_token}`,
        },
        body: JSON.stringify({
          transactionId: targetTxId,
          targetUserId: targetUserIdInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi gán giao dịch');
      }

      toast.show(`🎉 Gán thành công +${data.xuAdded} XU cho user ${data.targetUserId}`, 'success');
      targetTxId = null;
      targetUserIdInput = '';
      await loadTransactions();
    } catch (err: any) {
      alert(err.message || 'Lỗi gán giao dịch');
    } finally {
      isReconciling = false;
    }
  }

  onMount(() => {
    loadTransactions();
  });
</script>

<svelte:head>
  <title>Admin - Tra Cứu Giao Dịch SePay | ViOS</title>
</svelte:head>

<div class="transactions-page">
  <!-- 24h Webhook Health & Monitoring Widget -->
  <div class="webhook-monitor-card">
    <div class="monitor-header">
      <div class="monitor-status-pill">
        <span class="status-dot pulsing"></span>
        <Activity size={14} class="text-emerald" />
        <span class="status-label">SePay Webhook: <strong>HOẠT ĐỘNG TỐT (ACTIVE)</strong></span>
      </div>
      <div class="monitor-last-ping">
        <Clock size={13} />
        <span>Giao dịch gần nhất: <strong>{latestTx ? new Date(latestTx.created_at).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}</strong></span>
      </div>
    </div>

    <div class="monitor-metrics-row">
      <div class="monitor-metric-item">
        <span class="metric-label">Giao dịch 24h qua</span>
        <strong class="metric-value text-gold">{tx24h.length} GD</strong>
      </div>
      <div class="monitor-metric-item">
        <span class="metric-label">Đã khớp tài khoản</span>
        <strong class="metric-value text-emerald">{matched24hCount} GD</strong>
      </div>
      <div class="monitor-metric-item">
        <span class="metric-label">Cần đối soát</span>
        <strong class="metric-value {unmatched24hCount > 0 ? 'text-amber' : 'text-muted'}">{unmatched24hCount} GD</strong>
      </div>
      <div class="monitor-metric-item">
        <span class="metric-label">Dòng tiền 24h qua</span>
        <strong class="metric-value text-primary">+{total24hVnd.toLocaleString('vi-VN')} đ <span class="metric-sub">(+{total24hXu.toLocaleString('vi-VN')} XU)</span></strong>
      </div>
    </div>
  </div>

  <!-- Highlights Stat Grid -->
  <div class="tx-stats-grid">
    <div class="stat-card">
      <div class="stat-icon-wrap icon-gold">
        <Coins size={20} />
      </div>
      <div class="stat-info">
        <span class="stat-title">Doanh Thu SePay</span>
        <strong class="stat-num">{totalVnd.toLocaleString('vi-VN')} đ</strong>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrap icon-purple">
        <ArrowLeftRight size={20} />
      </div>
      <div class="stat-info">
        <span class="stat-title">Tổng XU Đã Nạp</span>
        <strong class="stat-num">+{totalXuAdded.toLocaleString('vi-VN')} XU</strong>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrap {unmatchedCount > 0 ? 'icon-amber' : 'icon-emerald'}">
        {#if unmatchedCount > 0}
          <AlertTriangle size={20} />
        {:else}
          <CheckCircle2 size={20} />
        {/if}
      </div>
      <div class="stat-info">
        <span class="stat-title">Chờ Gán Thủ Công</span>
        <strong class="stat-num">{unmatchedCount} GD</strong>
      </div>
    </div>
  </div>

  <!-- Search & Action Toolbar -->
  <div class="tx-toolbar">
    <div class="search-box">
      <Search size={16} class="search-icon" />
      <input
        type="text"
        placeholder="Tìm theo mã giao dịch, SePay ID hoặc User ID..."
        bind:value={searchQuery}
        class="search-input"
      />
      {#if searchQuery}
        <button type="button" class="btn-clear" onclick={() => (searchQuery = '')}>
          <X size={14} />
        </button>
      {/if}
    </div>

    <div class="toolbar-actions">
      <button class="btn btn-export" onclick={exportToCsv} disabled={filteredTransactions.length === 0}>
        <Download size={15} />
        <span>Xuất File CSV</span>
      </button>

      <button class="btn btn-reload" onclick={loadTransactions} disabled={isLoading}>
        <RefreshCw size={15} class={isLoading ? 'spinning' : ''} />
        <span>Làm mới</span>
      </button>
    </div>
  </div>

  {#if errorMessage}
    <NoticeBanner tone="danger" message={errorMessage} />
  {/if}

  <!-- Data Table -->
  <div class="data-table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>ID Giao Dịch</th>
          <th>Mã SePay</th>
          <th>Số Tiền (VNĐ)</th>
          <th>XU Quy Đổi</th>
          <th>Tài Khoản Nhận</th>
          <th>Thời Gian Tạo</th>
          <th class="actions-header">Hành Động</th>
        </tr>
      </thead>
      <tbody>
        {#if isLoading}
          <tr>
            <td colspan="7" class="empty-row">
              <RefreshCw size={20} class="spinning" style="margin: 0 auto 8px;" />
              Đang tải danh sách giao dịch SePay...
            </td>
          </tr>
        {:else if filteredTransactions.length === 0}
          <tr>
            <td colspan="7" class="empty-row">
              Không tìm thấy giao dịch nào.
            </td>
          </tr>
        {:else}
          {#each filteredTransactions as tx (tx.id)}
            <tr class="tx-row" class:unmatched-row={!tx.owner_user_id}>
              <td class="primary-cell">
                <code class="tx-code">{tx.id.slice(0, 8)}…</code>
              </td>
              <td class="secondary-cell">
                <span class="sepay-id">{tx.sepay_transaction_id ?? '-'}</span>
              </td>
              <td class="amount-cell">
                <strong>{tx.amount_vnd?.toLocaleString('vi-VN')} đ</strong>
              </td>
              <td class="highlight-cell">
                <span class="xu-pill">
                  <Coins size={13} />
                  +{tx.xu_added} XU
                </span>
              </td>
              <td class="user-cell">
                {#if tx.owner_user_id}
                  <span class="user-pill" title={tx.owner_user_id}>
                    <UserCheck size={13} />
                    {tx.owner_user_id.slice(0, 10)}…
                  </span>
                {:else}
                  <span class="badge badge-unmatched">
                    <AlertTriangle size={11} /> Chưa Gán
                  </span>
                {/if}
              </td>
              <td class="date-cell">
                {new Date(tx.created_at).toLocaleString('vi-VN')}
              </td>
              <td class="actions-cell">
                <button
                  class="btn btn-action-reconcile"
                  onclick={() => {
                    targetTxId = tx.id;
                    targetUserIdInput = tx.owner_user_id ?? '';
                  }}
                >
                  <Link size={13} /> Gán User
                </button>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

<!-- Modal Reconcile with Frosted Glass -->
{#if targetTxId}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={() => (targetTxId = null)}></div>
  <div class="modal-wrapper">
    <div class="modal-dialog">
      <div class="modal-header">
        <div class="modal-title-wrap">
          <div class="icon-modal">
            <Link size={18} />
          </div>
          <h3 class="modal-title">Gán XU Thủ Công</h3>
        </div>
        <button type="button" class="btn-modal-close" onclick={() => (targetTxId = null)}>
          <X size={16} />
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-subtitle">
          Khắc phục khi người dùng chuyển khoản nhưng gõ sai cú pháp:
        </p>
        <p class="tx-ref">Mã giao dịch: <code>{targetTxId}</code></p>

        <label for="target-user-input" class="form-label">User ID (UUID) nhận XU</label>
        <input
          id="target-user-input"
          type="text"
          bind:value={targetUserIdInput}
          placeholder="Ví dụ: f4dcbc9c-a391-4fad-8408-e4ab7dadefe3"
          class="form-input"
        />
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" onclick={() => (targetTxId = null)}>Hủy</button>
        <button class="btn btn-solid-gold" onclick={handleReconcile} disabled={isReconciling}>
          <ShieldCheck size={15} />
          {isReconciling ? 'Đang gán...' : 'Cộng XU Ngay'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .transactions-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  /* 24h Webhook Health Monitor Widget */
  .webhook-monitor-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    background: var(--glass-bg);
    backdrop-filter: blur(18px) saturate(170%);
    -webkit-backdrop-filter: blur(18px) saturate(170%);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.08);
  }

  .monitor-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    justify-content: space-between;
    border-bottom: 1px solid var(--overlay-border);
    padding-bottom: var(--space-sm);
  }

  @media (min-width: 640px) {
    .monitor-header {
      flex-direction: row;
      align-items: center;
    }
  }

  .monitor-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
  }

  .pulsing {
    animation: pulseGlow 2s infinite ease-in-out;
  }

  @keyframes pulseGlow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }

  .monitor-last-ping {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .monitor-metrics-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm) var(--space-md);
  }

  @media (min-width: 768px) {
    .monitor-metrics-row {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .monitor-metric-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .metric-label {
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--color-text-muted);
  }

  .metric-value {
    font-size: 15px;
    font-weight: 700;
  }

  .metric-sub {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .text-emerald { color: #10b981; }
  .text-gold { color: #d4af37; }
  .text-amber { color: #f59e0b; }
  .text-muted { color: var(--color-text-muted); }
  .text-primary { color: var(--color-text-primary); }

  /* Stats Grid */
  .tx-stats-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: var(--space-md);
  }

  @media (min-width: 640px) {
    .tx-stats-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    border-color: var(--overlay-border-strong);
  }

  .stat-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }

  .icon-gold {
    background: rgba(212, 175, 55, 0.15);
    color: #d4af37;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .icon-purple {
    background: rgba(192, 132, 252, 0.15);
    color: #c084fc;
    border: 1px solid rgba(192, 132, 252, 0.3);
  }

  .icon-emerald {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .icon-amber {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-title {
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--color-text-muted);
  }

  .stat-num {
    font-family: var(--font-sans);
    font-size: 22px;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  /* Toolbar */
  .tx-toolbar {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    justify-content: space-between;
  }

  @media (min-width: 768px) {
    .tx-toolbar {
      flex-direction: row;
      align-items: center;
    }
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 420px;
  }

  :global(.search-icon) {
    position: absolute;
    left: 12px;
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 8px 34px 8px 36px;
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .search-input:focus {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }

  .btn-clear {
    position: absolute;
    right: 10px;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: padding;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .btn-export {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    color: #d4af37;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-export:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.15) 100%);
    border-color: #d4af37;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
  }

  .btn-export:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-reload {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-primary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-reload:hover:not(:disabled) {
    background: var(--overlay-ink-wash);
    border-color: var(--overlay-border-strong);
  }

  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
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
    min-width: 860px;
    border-collapse: collapse;
    text-align: left;
  }

  .data-table th,
  .data-table td {
    padding: 14px var(--space-lg);
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

  .tx-row {
    transition: background-color var(--duration-fast) ease;
  }

  .tx-row:hover {
    background-color: var(--overlay-ink-wash);
  }

  .unmatched-row {
    background-color: rgba(245, 158, 11, 0.04);
  }

  .tx-row:last-child td {
    border-bottom: none;
  }

  .tx-code {
    font-family: monospace;
    font-size: 12px;
    background: var(--overlay-ink-wash);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--color-text-primary);
  }

  .sepay-id {
    font-family: monospace;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .amount-cell {
    font-size: 14px;
    color: var(--color-text-primary);
  }

  .xu-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: var(--radius-pill);
    background: rgba(212, 175, 55, 0.12);
    color: #d4af37;
    border: 1px solid rgba(212, 175, 55, 0.25);
    font-size: 13px;
    font-weight: 700;
  }

  .user-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    background: var(--overlay-ink-wash);
    border: 1px solid var(--overlay-border);
    font-size: 12px;
    font-family: monospace;
    color: var(--color-text-secondary);
  }

  .badge-unmatched {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .date-cell {
    font-size: 12px;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .actions-header {
    text-align: right;
  }

  .actions-cell {
    text-align: right;
  }

  .btn-action-reconcile {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: var(--radius-sm);
    background: rgba(212, 175, 55, 0.12);
    color: #d4af37;
    border: 1px solid rgba(212, 175, 55, 0.25);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-action-reconcile:hover {
    background: rgba(212, 175, 55, 0.25);
    transform: translateY(-1px);
  }

  .empty-row {
    text-align: center;
    padding: 36px !important;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 90;
    animation: fadeIn var(--duration-fast);
  }

  .modal-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-lg);
    pointer-events: none;
  }

  .modal-dialog {
    background: var(--color-bg-surface);
    border: 1px solid var(--overlay-border-strong);
    border-radius: var(--radius-xl);
    box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
    width: 100%;
    max-width: 480px;
    pointer-events: auto;
    animation: slideUp var(--duration-fast);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg) var(--space-lg) var(--space-md);
    border-bottom: 1px solid var(--overlay-border);
  }

  .modal-title-wrap {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .icon-modal {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    background: rgba(212, 175, 55, 0.15);
    color: #d4af37;
  }

  .modal-title {
    font-family: var(--font-serif);
    font-size: var(--text-title);
    color: var(--color-text-primary);
    margin: 0;
    font-weight: 700;
  }

  .btn-modal-close {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 6px;
    border-radius: var(--radius-sm);
  }

  .btn-modal-close:hover {
    background: var(--overlay-ink-wash);
    color: var(--color-text-primary);
  }

  .modal-body {
    padding: var(--space-md) var(--space-lg) var(--space-lg);
  }

  .modal-subtitle {
    margin: 0 0 var(--space-xs);
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .tx-ref {
    font-size: 12px;
    color: var(--color-text-muted);
    margin-bottom: var(--space-md);
  }

  .tx-ref code {
    background: var(--overlay-ink-wash);
    color: var(--color-accent-primary);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }

  .form-label {
    display: block;
    font-size: var(--text-caption);
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-xs);
  }

  .form-input {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 14px;
    border: 1px solid var(--overlay-border-strong);
    border-radius: var(--radius-md);
    font-size: 14px;
    color: var(--color-text-primary);
    background: var(--color-bg-primary);
    outline: none;
    transition: border-color var(--duration-fast);
  }

  .form-input:focus {
    border-color: #d4af37;
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }

  .modal-footer {
    padding: var(--space-md) var(--space-lg);
    background: var(--overlay-ink-wash);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    border-top: 1px solid var(--overlay-border);
  }

  .btn-solid-gold {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, #fce99f 0%, #d4af37 100%);
    color: #0f0c1b;
    font-weight: 700;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
    cursor: pointer;
    font-size: 13px;
  }

  .btn-solid-gold:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(212, 175, 55, 0.35);
  }

  .btn-solid-gold:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-outline {
    background: transparent;
    border: 1px solid var(--overlay-border-strong);
    color: var(--color-text-secondary);
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-outline:hover {
    background: var(--overlay-ink-wash);
    color: var(--color-text-primary);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(16px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>

