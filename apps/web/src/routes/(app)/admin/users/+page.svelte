<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { AdminUser } from '@ziweiai/contracts';
  import { adminGetUsers } from '$lib/api-client/admin';;

  let { data }: { data: PageData } = $props();
  const token = data.session?.token || '';

  let users = $state<AdminUser[]>([]);
  let filteredUsers = $derived(users.filter(u => {
    if (filterAnon === 'registered') return !u.is_anonymous;
    if (filterAnon === 'anon') return u.is_anonymous;
    return true;
  }));

  let loading = $state(true);
  let errorMsg = $state('');
  let search = $state('');
  let filterAnon = $state<'all' | 'registered' | 'anon'>('all');
  let isCleaning = $state(false);

  // Modal Topup
  let showModal = $state(false);
  let selectedUser = $state<AdminUser | null>(null);
  let topupAmount = $state(50);
  let topupReason = $state('Admin tặng XU');
  let isSubmitting = $state(false);

  async function loadUsers() {
    loading = true;
    errorMsg = '';
    try {
      users = await adminGetUsers(token, search.trim());
    } catch (err: any) {
      errorMsg = err.message || 'Lỗi kết nối';
    } finally {
      loading = false;
    }
  }

  async function handleTopup() {
    if (!selectedUser || !topupAmount) return;
    isSubmitting = true;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.user_id}/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: topupAmount, reason: topupReason }),
      });

      if (!res.ok) throw new Error('Cộng/Trừ XU thất bại');
      alert(`Đã ${topupAmount > 0 ? 'cộng' : 'trừ'} ${Math.abs(topupAmount)} XU cho user!`);
      showModal = false;
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Lỗi thao tác');
    } finally {
      isSubmitting = false;
    }
  }

  async function handleCleanupAnon() {
    if (!confirm('Bạn có chắc muốn dọn dẹp các tài khoản Vãng lai rác cũ?')) return;
    isCleaning = true;
    try {
      const res = await fetch('/api/admin/users/cleanup-anon', { method: 'POST' });
      if (!res.ok) throw new Error('Dọn dẹp thất bại');
      const data = await res.json();
      alert(`Đã dọn dẹp thành công ${data.deletedCount || 0} tài khoản Vãng lai!`);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Lỗi dọn dẹp');
    } finally {
      isCleaning = false;
    }
  }

  function openTopupModal(user: AdminUser) {
    selectedUser = user;
    topupAmount = 50;
    topupReason = 'Admin tặng XU';
    showModal = true;
  }

  onMount(() => {
    void loadUsers();
  });
</script>

<svelte:head>
  <title>Quản lý Người dùng - Admin ViOS</title>
</svelte:head>

<div class="users-header">
  <div class="search-box">
    <select bind:value={filterAnon} class="filter-select">
      <option value="all">Tất cả tài khoản</option>
      <option value="registered">Đã đăng ký (Thật)</option>
      <option value="anon">Vãng lai (Anon)</option>
    </select>
    <input
      type="text"
      bind:value={search}
      placeholder="Tìm theo Email, Display Name hoặc User ID..."
      onkeydown={(e) => e.key === 'Enter' && loadUsers()}
    />
    <button class="btn-search" onclick={loadUsers}>Tìm kiếm</button>
  </div>

  <button class="btn-cleanup" onclick={handleCleanupAnon} disabled={isCleaning}>
    {isCleaning ? 'Đang dọn dẹp...' : '🧹 Dọn dẹp User Vãng Lai Rác'}
  </button>
</div>

{#if errorMsg}
  <div class="alert-error">{errorMsg}</div>
{/if}

{#if loading}
  <div class="loading-state">Đang tải danh sách người dùng...</div>
{:else if filteredUsers.length === 0}
  <div class="empty-state">Không tìm thấy người dùng nào.</div>
{:else}
  <div class="table-card">
    <table class="user-table">
      <thead>
        <tr>
          <th>Tài khoản / Email</th>
          <th>User ID</th>
          <th>Số dư XU</th>
          <th>Loại TK</th>
          <th>Ngày tạo</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredUsers as u (u.user_id)}
          <tr>
            <td class="user-email">
              {u.email || u.display_name || 'Khách vãng lai'}
            </td>
            <td class="user-id"><code>{u.user_id.substring(0, 8)}...</code></td>
            <td class="xu-badge">{u.xu_balance ?? 0} XU</td>
            <td>
              {#if u.is_anonymous}
                <span class="tag tag-anon">Vãng Lai</span>
              {:else}
                <span class="tag tag-real">Thật</span>
              {/if}
            </td>
            <td class="date-col">{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
            <td>
              <button class="btn-action" onclick={() => openTopupModal(u)}>⚡ Cộng / Trừ XU</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

{#if showModal && selectedUser}
  <div class="modal-backdrop" onclick={() => (showModal = false)} onkeydown={(e) => e.key === 'Escape' && (showModal = false)} role="dialog" tabindex="0">
    <div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="document" tabindex="0">
      <h3>Cộng / Trừ XU Direct</h3>
      <p class="target-name">Tài khoản: <strong>{selectedUser.email || selectedUser.user_id}</strong></p>

      <div class="form-group">
        <label for="amount">Số XU (Số dương = Cộng, Số âm = Trừ):</label>
        <input id="amount" type="number" bind:value={topupAmount} />
      </div>

      <div class="form-group">
        <label for="reason">Lý do điều chỉnh:</label>
        <input id="reason" type="text" bind:value={topupReason} />
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" onclick={() => (showModal = false)}>Hủy</button>
        <button class="btn-confirm" onclick={handleTopup} disabled={isSubmitting}>
          {isSubmitting ? 'Đang thực hiện...' : 'Xác nhận'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .users-header {
    display: flex;
    justify-content: space-between;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
    flex-wrap: wrap;
  }

  .search-box {
    display: flex;
    gap: 12px;
    flex: 1;
    max-width: 600px;
  }

  .filter-select {
    padding: 10px 16px;
    border: 1px solid var(--overlay-border-subtle);
    border-radius: 8px;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: 14px;
    outline: none;
    transition: all 0.2s ease;
  }
  .filter-select:focus {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 2px var(--color-accent-primary-alpha);
  }

  .search-box input {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
  }

  .btn-search, .btn-cleanup, .btn-action, .btn-confirm {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    border: none;
  }

  .btn-search {
    background: var(--color-accent-primary);
    color: white;
  }

  .btn-cleanup {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .alert-error {
    padding: var(--space-md);
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-radius: var(--radius-md);
    margin-bottom: var(--space-md);
  }

  .table-card {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-lg);
    overflow-x: auto;
  }

  .user-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: var(--text-body-sm);
  }

  .user-table th, .user-table td {
    padding: var(--space-md);
    border-bottom: 1px solid var(--color-border-hairline);
  }

  .user-email {
    font-weight: 600;
  }

  .user-id code {
    font-family: var(--font-mono);
    color: var(--color-text-muted);
  }

  .xu-badge {
    font-weight: 700;
    color: var(--color-accent-gold, #d97706);
  }

  .tag {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .tag-anon { background: rgba(156, 163, 175, 0.2); color: #9ca3af; }
  .tag-real { background: rgba(34, 197, 94, 0.2); color: #22c55e; }

  .btn-action {
    background: rgba(56, 189, 248, 0.15);
    color: #0284c7;
    font-size: 13px;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--color-bg-surface);
    padding: var(--space-xl);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 440px;
    box-shadow: var(--shadow-lg);
  }

  .form-group {
    margin-top: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .form-group input {
    padding: var(--space-sm);
    border: 1px solid var(--color-border-hairline);
    border-radius: var(--radius-md);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .modal-actions {
    margin-top: var(--space-xl);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-md);
  }

  .btn-cancel {
    background: transparent;
    border: 1px solid var(--color-border-hairline);
    color: var(--color-text-secondary);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
  }

  .btn-confirm {
    background: var(--color-accent-primary);
    color: white;
  }
</style>
