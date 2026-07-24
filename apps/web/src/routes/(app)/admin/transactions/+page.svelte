<script lang="ts">
  import { onMount } from 'svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { AppScaffold, PrimaryButton, NoticeBanner } from '$lib/components/ui';
  import { toast } from '$lib/stores/toast';

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

  let targetTxId = $state<string | null>(null);
  let targetUserIdInput = $state('');
  let isReconciling = $state(false);

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
  <title>Admin - Tra Cứu Giao Dịch | Tử Vi Toàn Tập</title>
</svelte:head>

<AppScaffold
  title="Tra Cứu & Gán Giao Dịch SePay"
  subtitle="Quản lý các giao dịch nạp tiền, hỗ trợ gán XU thủ công khi user gõ sai cú pháp chuyển khoản"
  tone="mystical"
>
  <div class="admin-page">
    <div class="actions-bar">
      <PrimaryButton label="Tải lại danh sách" onclick={loadTransactions} disabled={isLoading} />
    </div>

    {#if errorMessage}
      <NoticeBanner tone="danger" message={errorMessage} />
    {/if}

    {#if isLoading}
      <p class="loading">Đang tải danh sách giao dịch...</p>
    {:else if transactions.length === 0}
      <p class="empty">Chưa có giao dịch nào.</p>
    {:else}
      <div class="table-wrapper surface-glass">
        <table class="tx-table">
          <thead>
            <tr>
              <th>ID Giao Dịch</th>
              <th>Mã SePay</th>
              <th>Số tiền (VNĐ)</th>
              <th>XU Quy Đổi</th>
              <th>User ID</th>
              <th>Ngày Tạo</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {#each transactions as tx (tx.id)}
              <tr class:unmatched={!tx.owner_user_id}>
                <td class="code">{tx.id.slice(0, 8)}...</td>
                <td>{tx.sepay_transaction_id ?? '-'}</td>
                <td>{tx.amount_vnd?.toLocaleString('vi-VN')} đ</td>
                <td class="xu">+{tx.xu_added} XU</td>
                <td>
                  {#if tx.owner_user_id}
                    <span class="user-id">{tx.owner_user_id.slice(0, 8)}...</span>
                  {:else}
                    <span class="badge-unmatched">Chưa Gán</span>
                  {/if}
                </td>
                <td>{new Date(tx.created_at).toLocaleString('vi-VN')}</td>
                <td>
                  <button
                    class="btn-reconcile"
                    onclick={() => {
                      targetTxId = tx.id;
                      targetUserIdInput = tx.owner_user_id ?? '';
                    }}
                  >
                    Gán User
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    {#if targetTxId}
      <div class="modal-overlay" role="presentation" onclick={() => (targetTxId = null)}>
        <div class="modal-card surface-glass" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()}>
          <h3>Gán XU Thủ Công Cho Giao Dịch</h3>
          <p class="tx-ref">Mã giao dịch: <code>{targetTxId}</code></p>

          <div class="form-group">
            <label for="target-user-input">User ID Nhận XU:</label>
            <input
              id="target-user-input"
              type="text"
              bind:value={targetUserIdInput}
              placeholder="Nhập UUID của user (vd: f4dcbc9c-a391-4fad-8408-e4ab7dadefe3)"
            />
          </div>

          <div class="modal-actions">
            <PrimaryButton label="Hủy" variant="surface" onclick={() => (targetTxId = null)} />
            <PrimaryButton label="Cộng XU Ngay" loading={isReconciling} onclick={handleReconcile} />
          </div>
        </div>
      </div>
    {/if}
  </div>
</AppScaffold>

<style>
  .admin-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .actions-bar {
    display: flex;
    justify-content: flex-end;
  }

  .loading,
  .empty {
    color: var(--color-text-muted);
    font-size: 14px;
    padding: var(--space-md) 0;
  }

  .table-wrapper {
    overflow-x: auto;
    border-radius: var(--radius-xl);
    border: 1px solid var(--overlay-border);
  }

  .tx-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    text-align: left;
  }

  .tx-table th,
  .tx-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--overlay-border);
  }

  .tx-table th {
    color: var(--color-text-secondary);
    font-weight: 600;
    background: rgba(255, 255, 255, 0.03);
  }

  .unmatched {
    background: rgba(245, 158, 11, 0.05);
  }

  .code {
    font-family: monospace;
    font-size: 12px;
  }

  .xu {
    color: var(--color-gold-400, #f59e0b);
    font-weight: 600;
  }

  .badge-unmatched {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    font-size: 12px;
  }

  .btn-reconcile {
    background: var(--color-bg-surface);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-primary);
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
  }

  .btn-reconcile:hover {
    border-color: var(--color-gold-400, #f59e0b);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-card {
    width: 100%;
    max-width: 480px;
    padding: var(--space-xl);
    border-radius: var(--radius-xl);
    border: 1px solid var(--overlay-border);
    background: var(--color-bg-surface);
  }

  .modal-card h3 {
    margin-top: 0;
    color: var(--color-text-primary);
  }

  .tx-ref {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin: var(--space-md) 0;
  }

  .form-group label {
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .form-group input {
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--overlay-border);
    background: rgba(0, 0, 0, 0.3);
    color: #ffffff;
    font-size: 14px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    margin-top: var(--space-lg);
  }
</style>
