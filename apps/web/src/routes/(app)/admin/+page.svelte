<script lang="ts">
  import type { PageData } from './$types';
  import { adminTopupXU, adminBanUser, adminUnbanUser } from '$lib/api-client/admin';
  import { Coins, UserCheck, ShieldAlert, Sparkles, PlusCircle, MinusCircle, X, Search, CheckCircle2 } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();
  let topupAmount = $state(50);
  let selectedUserId = $state('');
  let isLoading = $state(false);
  let showModal = $state(false);
  let filterType = $state<'all' | 'registered'>('all');
  let searchQuery = $state('');

  let filteredUsers = $derived(
    data.users
      .filter((u: any) => {
        if (filterType === 'registered') {
          return Boolean(u.email && u.email.trim());
        }
        return true;
      })
      .filter((u: any) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const emailMatch = u.email ? u.email.toLowerCase().includes(q) : false;
        const idMatch = u.user_id ? u.user_id.toLowerCase().includes(q) : false;
        const nameMatch = u.full_name ? u.full_name.toLowerCase().includes(q) : false;
        return emailMatch || idMatch || nameMatch;
      })
  );

  function openTopupModal(userId: string) {
    selectedUserId = userId;
    topupAmount = 50;
    showModal = true;
  }

  function closeTopupModal() {
    showModal = false;
    selectedUserId = '';
  }

  async function handleTopup() {
    if (!selectedUserId || topupAmount <= 0 || !data.session) return;
    isLoading = true;
    try {
      const res = await adminTopupXU(data.session.token, selectedUserId, topupAmount);
      if (res.success) {
        const user = data.users.find((u: any) => u.user_id === selectedUserId);
        if (user) {
          user.xu_balance = (user.xu_balance || 0) + topupAmount;
          data.users = [...data.users];
        }
        closeTopupModal();
      }
    } catch (error) {
      console.error('Failed to topup:', error);
      alert('Nạp XU thất bại, vui lòng thử lại.');
    } finally {
      isLoading = false;
    }
  }

  async function handleDeduct() {
    if (!selectedUserId || topupAmount <= 0 || !data.session) return;
    isLoading = true;
    try {
      const res = await adminTopupXU(data.session.token, selectedUserId, -topupAmount);
      if (res.success) {
        const user = data.users.find((u: any) => u.user_id === selectedUserId);
        if (user) {
          user.xu_balance = (user.xu_balance || 0) - topupAmount;
          data.users = [...data.users];
        }
        closeTopupModal();
      } else {
        alert('Trừ XU thất bại, số dư không đủ hoặc có lỗi.');
      }
    } catch (error) {
      console.error('Failed to deduct:', error);
      alert('Trừ XU thất bại, vui lòng thử lại.');
    } finally {
      isLoading = false;
    }
  }

  let isBanning = $state(false);
  async function handleBan(userId: string, isBanned: boolean) {
    if (!confirm(isBanned ? 'Bạn có chắc chắn muốn KHÓA tài khoản này?' : 'Bạn có chắc chắn muốn MỞ KHÓA tài khoản này?')) return;
    if (!data.session) return;
    isBanning = true;
    try {
      const apiCall = isBanned ? adminBanUser : adminUnbanUser;
      const res = await apiCall(data.session.token, userId);
      if (res.success) {
        const user = data.users.find((u: any) => u.user_id === userId);
        if (user) {
          user.is_banned = isBanned;
          data.users = [...data.users];
        }
      }
    } catch (error) {
      console.error('Failed to toggle ban status:', error);
      alert('Thao tác thất bại, vui lòng thử lại.');
    } finally {
      isBanning = false;
    }
  }
</script>

<svelte:head>
  <title>Admin Dashboard - ViOS Control Center</title>
</svelte:head>

<div class="admin-overview">
  <!-- Stats Highlights -->
  <div class="overview-stats-grid">
    <div class="stat-card">
      <div class="stat-icon-wrap icon-gold">
        <Coins size={20} />
      </div>
      <div class="stat-info">
        <span class="stat-title">Tổng Người Dùng</span>
        <strong class="stat-num">{data.users.length}</strong>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrap icon-purple">
        <UserCheck size={20} />
      </div>
      <div class="stat-info">
        <span class="stat-title">Đã Đăng Ký Email</span>
        <strong class="stat-num">{data.users.filter((u: any) => Boolean(u.email)).length}</strong>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrap icon-emerald">
        <Sparkles size={20} />
      </div>
      <div class="stat-info">
        <span class="stat-title">Thành Viên VIP / Premium</span>
        <strong class="stat-num">{data.users.filter((u: any) => Boolean(u.is_premium)).length}</strong>
      </div>
    </div>
  </div>

  <!-- Filter & Search Toolbar -->
  <div class="admin-user-toolbar">
    <div class="filter-tabs">
      <button
        type="button"
        class="tab-btn"
        class:active={filterType === 'all'}
        onclick={() => (filterType = 'all')}
      >
        Tất cả ({data.users.length})
      </button>
      <button
        type="button"
        class="tab-btn"
        class:active={filterType === 'registered'}
        onclick={() => (filterType = 'registered')}
      >
        Có Email ({data.users.filter((u: any) => Boolean(u.email)).length})
      </button>
    </div>

    <div class="search-box">
      <Search size={16} class="search-icon" />
      <input
        type="text"
        placeholder="Tìm theo email, tên hoặc User ID..."
        bind:value={searchQuery}
        class="search-input"
      />
      {#if searchQuery}
        <button type="button" class="btn-clear" onclick={() => (searchQuery = '')}>
          <X size={14} />
        </button>
      {/if}
    </div>
  </div>

  <!-- Data Table with Mystical Glass styling -->
  <div class="data-table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Tên / Trạng thái</th>
          <th>Email / Định Danh</th>
          <th>Số Dư XU</th>
          <th>Hạng Hội Viên</th>
          <th class="actions-header">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredUsers.length === 0}
          <tr>
            <td colspan="5" class="empty-row">
              Không tìm thấy người dùng nào phù hợp với bộ lọc.
            </td>
          </tr>
        {:else}
          {#each filteredUsers as user (user.user_id)}
            <tr class="user-row">
              <td class="primary-cell">
                {#if user.full_name}
                  <span class="user-name">{user.full_name}</span>
                {:else}
                  <span class="badge badge-anon" title="Tài khoản tự động tạo cho khách vãng lai">Vãng lai</span>
                {/if}
                {#if user.is_banned}
                  <span class="badge badge-danger">
                    <ShieldAlert size={10} /> Banned
                  </span>
                {/if}
              </td>
              <td class="secondary-cell">
                {#if user.email}
                  <span class="email-text">{user.email}</span>
                {:else}
                  <span class="anon-text">{user.user_id ? `${user.user_id.slice(0, 16)}…` : 'Chưa liên kết'}</span>
                {/if}
              </td>
              <td class="highlight-cell">
                <span class="xu-pill">
                  <Coins size={13} />
                  {user.xu_balance || 0} XU
                </span>
              </td>
              <td class="secondary-cell">
                {#if user.is_premium}
                  <span class="badge badge-vip">
                    <CheckCircle2 size={10} /> Premium
                  </span>
                {:else}
                  <span class="badge badge-standard">Standard</span>
                {/if}
              </td>
              <td class="actions-cell">
                <button class="btn btn-action-xu" onclick={() => openTopupModal(user.user_id)}>
                  <PlusCircle size={14} /> XU +/-
                </button>
                {#if user.is_banned}
                  <button class="btn btn-action-unban" onclick={() => handleBan(user.user_id, false)} disabled={isBanning}>
                    Mở khoá
                  </button>
                {:else}
                  <button class="btn btn-action-ban" onclick={() => handleBan(user.user_id, true)} disabled={isBanning}>
                    Khoá
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

<!-- Modal Topup / Deduct XU with Frosted Glass -->
{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={closeTopupModal}></div>
  <div class="modal-wrapper">
    <div class="modal-dialog">
      <div class="modal-header">
        <div class="modal-title-wrap">
          <div class="icon-modal">
            <Coins size={18} />
          </div>
          <h3 class="modal-title">Cộng / Trừ XU Trực Tiếp</h3>
        </div>
        <button type="button" class="btn-modal-close" onclick={closeTopupModal}>
          <X size={16} />
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-subtitle">
          Điều chỉnh số dư XU cho User ID: <code>{selectedUserId}</code>
        </p>
        <label for="amount" class="form-label">Số lượng XU điều chỉnh</label>
        <div class="input-xu-wrapper">
          <Coins size={16} class="input-icon" />
          <input
            type="number"
            name="amount"
            id="amount"
            min="1"
            bind:value={topupAmount}
            class="form-input"
          />
        </div>
        <div class="quick-amounts">
          <button type="button" class="btn-quick" onclick={() => (topupAmount = 20)}>+20 XU</button>
          <button type="button" class="btn-quick" onclick={() => (topupAmount = 50)}>+50 XU</button>
          <button type="button" class="btn-quick" onclick={() => (topupAmount = 100)}>+100 XU</button>
          <button type="button" class="btn-quick" onclick={() => (topupAmount = 500)}>+500 XU</button>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" onclick={closeTopupModal}>Hủy</button>
        <button class="btn btn-danger-solid" onclick={handleDeduct} disabled={isLoading}>
          <MinusCircle size={15} /> Trừ {topupAmount} XU
        </button>
        <button class="btn btn-solid-gold" onclick={handleTopup} disabled={isLoading}>
          <PlusCircle size={15} /> Cộng {topupAmount} XU
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .admin-overview {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  /* Overview Stats Highlights */
  .overview-stats-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: var(--space-md);
  }

  @media (min-width: 640px) {
    .overview-stats-grid {
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
    font-size: 24px;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  /* Toolbar */
  .admin-user-toolbar {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    justify-content: space-between;
  }

  @media (min-width: 768px) {
    .admin-user-toolbar {
      flex-direction: row;
      align-items: center;
    }
  }

  .filter-tabs {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: var(--radius-md);
    border: 1px solid var(--overlay-border);
  }

  .tab-btn {
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tab-btn.active {
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 380px;
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
    align-items: center;
    padding: 2px;
  }

  /* Data Table */
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
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .user-name {
    font-size: 14px;
  }

  .secondary-cell {
    color: var(--color-text-secondary);
    font-size: 13px;
  }

  .email-text {
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .anon-text {
    font-family: monospace;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .highlight-cell {
    font-weight: 700;
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

  .actions-header {
    text-align: right;
  }

  .actions-cell {
    text-align: right;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--space-xs);
  }

  .empty-row {
    text-align: center;
    padding: 36px !important;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  /* Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .badge-anon {
    background: var(--overlay-ink-wash);
    color: var(--color-text-muted);
    border: 1px solid var(--overlay-border);
  }

  .badge-danger {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .badge-vip {
    background: rgba(192, 132, 252, 0.15);
    color: #c084fc;
    border: 1px solid rgba(192, 132, 252, 0.3);
  }

  .badge-standard {
    background: var(--overlay-ink-wash);
    color: var(--color-text-secondary);
    border: 1px solid var(--overlay-border);
  }

  /* Buttons */
  .btn {
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--duration-fast) ease;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-action-xu {
    background: rgba(212, 175, 55, 0.12);
    color: #d4af37;
    border: 1px solid rgba(212, 175, 55, 0.25);
  }

  .btn-action-xu:hover {
    background: rgba(212, 175, 55, 0.25);
    transform: translateY(-1px);
  }

  .btn-action-ban {
    background: transparent;
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .btn-action-ban:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  .btn-action-unban {
    background: transparent;
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .btn-action-unban:hover {
    background: rgba(16, 185, 129, 0.15);
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
    margin: 0 0 var(--space-md);
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .modal-subtitle code {
    color: var(--color-accent-primary);
    background: var(--overlay-ink-wash);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .form-label {
    display: block;
    font-size: var(--text-caption);
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-xs);
  }

  .input-xu-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: var(--space-md);
  }

  :global(.input-icon) {
    position: absolute;
    left: 12px;
    color: #d4af37;
  }

  .form-input {
    width: 100%;
    padding: 10px 14px 10px 38px;
    border: 1px solid var(--overlay-border-strong);
    border-radius: var(--radius-md);
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
    background: var(--color-bg-primary);
    outline: none;
    transition: border-color var(--duration-fast);
  }

  .form-input:focus {
    border-color: #d4af37;
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }

  .quick-amounts {
    display: flex;
    gap: 8px;
  }

  .btn-quick {
    flex: 1;
    padding: 6px;
    background: var(--overlay-ink-wash);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-quick:hover {
    background: rgba(212, 175, 55, 0.15);
    color: #d4af37;
    border-color: rgba(212, 175, 55, 0.3);
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
  }

  .btn-solid-gold:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(212, 175, 55, 0.35);
  }

  .btn-danger-solid {
    background: #ef4444;
    color: white;
  }

  .btn-danger-solid:hover:not(:disabled) {
    background: #dc2626;
  }

  .btn-outline {
    background: transparent;
    border: 1px solid var(--overlay-border-strong);
    color: var(--color-text-secondary);
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

