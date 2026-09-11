<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { AdminUser } from '@ziweiai/contracts';
  import { adminGetUsers } from '$lib/api-client/admin';
  import { Coins, Search, UserCheck, Trash2, X, RefreshCw, PlusCircle } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();
  let token = $derived(data.session?.token || '');

  let users = $state<AdminUser[]>([]);
  let filterAnon = $state<'all' | 'registered' | 'anon'>('all');
  let search = $state('');
  let loading = $state(true);
  let isSearching = $state(false);
  let errorMsg = $state('');
  let isCleaning = $state(false);

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  function handleSearchInput(e: Event) {
    const target = e.target as HTMLInputElement;
    search = target.value;
    if (searchTimeout) clearTimeout(searchTimeout);
    isSearching = true;
    searchTimeout = setTimeout(() => {
      isSearching = false;
      void loadUsers();
    }, 350);
  }

  function clearSearch() {
    search = '';
    if (searchTimeout) clearTimeout(searchTimeout);
    isSearching = false;
    void loadUsers();
  }

  let filteredUsers = $derived(users.filter(u => {
    if (filterAnon === 'registered') return !u.is_anonymous;
    if (filterAnon === 'anon') return u.is_anonymous;
    return true;
  }));

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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      const res = await fetch('/api/admin/users/cleanup-anon', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Dọn dẹp thất bại');
      const resData = await res.json();
      alert(`Đã dọn dẹp thành công ${resData.deletedCount || 0} tài khoản Vãng lai!`);
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
  <title>Quản lý Người dùng & Số Dư XU - Admin ViOS</title>
</svelte:head>

<div class="users-page">
  <!-- Toolbar Header -->
  <div class="users-toolbar">
    <div class="search-group">
      <select bind:value={filterAnon} class="filter-select">
        <option value="all">Tất cả tài khoản</option>
        <option value="registered">Đã đăng ký (Thật)</option>
        <option value="anon">Khách vãng lai (Anon)</option>
      </select>
      <div class="input-wrap">
        <Search size={15} class="search-icon" />
        <input
          type="text"
          value={search}
          oninput={handleSearchInput}
          placeholder="Tìm theo Email, Tên hoặc User ID..."
          class="search-input"
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              if (searchTimeout) clearTimeout(searchTimeout);
              isSearching = false;
              void loadUsers();
            }
          }}
        />
        {#if search}
          <button type="button" class="btn-clear-search" onclick={clearSearch} aria-label="Xóa tìm kiếm">
            <X size={14} />
          </button>
        {/if}
      </div>
      <button class="btn btn-search" onclick={loadUsers} disabled={loading || isSearching}>
        <RefreshCw size={14} class={loading || isSearching ? 'spinning' : ''} />
        <span>{isSearching ? 'Đang tìm...' : 'Làm mới'}</span>
      </button>
    </div>

    <button class="btn btn-cleanup" onclick={handleCleanupAnon} disabled={isCleaning}>
      <Trash2 size={14} />
      <span>{isCleaning ? 'Đang dọn dẹp...' : 'Dọn dẹp User Vãng Lai'}</span>
    </button>
  </div>

  {#if errorMsg}
    <div class="alert-error">{errorMsg}</div>
  {/if}

  <!-- Data Table -->
  <div class="data-table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Tài Khoản / Email</th>
          <th>User ID</th>
          <th>Số Dư XU</th>
          <th>Loại Tài Khoản</th>
          <th>Ngày Đăng Ký</th>
          <th class="actions-header">Thao Tác</th>
        </tr>
      </thead>
      <tbody>
        {#if loading}
          <tr>
            <td colspan="6" class="empty-row">
              <RefreshCw size={20} class="spinning" style="margin: 0 auto 8px;" />
              Đang tải danh sách người dùng...
            </td>
          </tr>
        {:else if filteredUsers.length === 0}
          <tr>
            <td colspan="6" class="empty-row">
              Không tìm thấy người dùng nào phù hợp.
            </td>
          </tr>
        {:else}
          {#each filteredUsers as u (u.user_id)}
            <tr class="user-row">
              <td class="primary-cell">
                <span class="user-name">{u.email || u.display_name || 'Khách vãng lai'}</span>
              </td>
              <td class="id-cell">
                <code class="id-code">{u.user_id.substring(0, 8)}…</code>
              </td>
              <td class="highlight-cell">
                <span class="xu-pill">
                  <Coins size={13} />
                  {u.xu_balance ?? 0} XU
                </span>
              </td>
              <td>
                {#if u.is_anonymous}
                  <span class="badge badge-anon">Vãng Lai</span>
                {:else}
                  <span class="badge badge-real">
                    <UserCheck size={11} /> Thành Viên
                  </span>
                {/if}
              </td>
              <td class="date-cell">{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
              <td class="actions-cell">
                <button class="btn btn-action-topup" onclick={() => openTopupModal(u)}>
                  <PlusCircle size={13} /> XU +/-
                </button>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

<!-- Modal Topup/Deduct with Frosted Glass -->
{#if showModal && selectedUser}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={() => (showModal = false)}></div>
  <div class="modal-wrapper">
    <div class="modal-dialog">
      <div class="modal-header">
        <div class="modal-title-wrap">
          <div class="icon-modal">
            <Coins size={18} />
          </div>
          <h3 class="modal-title">Cộng / Trừ XU Trực Tiếp</h3>
        </div>
        <button type="button" class="btn-modal-close" onclick={() => (showModal = false)}>
          <X size={16} />
        </button>
      </div>

      <div class="modal-body">
        <p class="target-name">
          Tài khoản: <strong>{selectedUser.email || selectedUser.user_id}</strong>
        </p>

        <div class="form-group">
          <label for="amount" class="form-label">Số XU (Số dương = Cộng, Số âm = Trừ):</label>
          <input id="amount" type="number" bind:value={topupAmount} class="form-input" />
        </div>

        <div class="form-group">
          <label for="reason" class="form-label">Lý do điều chỉnh:</label>
          <input id="reason" type="text" bind:value={topupReason} class="form-input" />
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" onclick={() => (showModal = false)}>Hủy</button>
        <button class="btn btn-solid-gold" onclick={handleTopup} disabled={isSubmitting}>
          {isSubmitting ? 'Đang thực hiện...' : 'Xác Nhận'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .users-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  /* Toolbar */
  .users-toolbar {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    justify-content: space-between;
  }

  @media (min-width: 768px) {
    .users-toolbar {
      flex-direction: row;
      align-items: center;
    }
  }

  .search-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
  }

  .filter-select {
    padding: 8px 12px;
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-primary);
    font-size: 13px;
    font-weight: 500;
    outline: none;
    cursor: pointer;
  }

  .input-wrap {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 260px;
  }

  :global(.search-icon) {
    position: absolute;
    left: 12px;
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 8px 32px 8px 34px;
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .btn-clear-search {
    position: absolute;
    right: 10px;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 2px;
    transition: color 0.2s ease;
  }

  .btn-clear-search:hover {
    color: var(--color-text-primary);
  }

  .search-input:focus {
    border-color: var(--color-accent-primary);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 14px;
    border-radius: var(--radius-md);
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }

  .btn-search {
    background: var(--glass-bg);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-primary);
  }

  .btn-search:hover {
    background: var(--overlay-ink-wash);
    border-color: var(--overlay-border-strong);
  }

  .btn-cleanup {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.25);
  }

  .btn-cleanup:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.2);
  }

  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .alert-error {
    padding: var(--space-md);
    border-radius: var(--radius-md);
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    font-size: 14px;
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

  .user-row {
    transition: background-color var(--duration-fast) ease;
  }

  .user-row:hover {
    background-color: var(--overlay-ink-wash);
  }

  .user-row:last-child td {
    border-bottom: none;
  }

  .primary-cell {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .user-name {
    font-size: 14px;
  }

  .id-cell {
    font-size: 12px;
  }

  .id-code {
    background: var(--overlay-ink-wash);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    color: var(--color-text-muted);
  }

  .highlight-cell {
    font-size: 14px;
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

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .badge-anon {
    background: var(--overlay-ink-wash);
    color: var(--color-text-muted);
    border: 1px solid var(--overlay-border);
  }

  .badge-real {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .date-cell {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .actions-header {
    text-align: right;
  }

  .actions-cell {
    text-align: right;
  }

  .btn-action-topup {
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

  .btn-action-topup:hover {
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

  .modal-body {
    padding: var(--space-md) var(--space-lg) var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .target-name {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .form-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
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
  }

  .form-input:focus {
    border-color: #d4af37;
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
    background: linear-gradient(135deg, #fce99f 0%, #d4af37 100%);
    color: #0f0c1b;
    font-weight: 700;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
    padding: 8px 16px;
    border-radius: var(--radius-sm);
  }

  .btn-outline {
    background: transparent;
    border: 1px solid var(--overlay-border-strong);
    color: var(--color-text-secondary);
    padding: 8px 16px;
    border-radius: var(--radius-sm);
  }
</style>
