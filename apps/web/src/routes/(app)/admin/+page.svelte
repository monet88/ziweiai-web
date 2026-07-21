<script lang="ts">
  import type { PageData } from './$types';
  import { adminTopupXU, adminBanUser, adminUnbanUser } from '$lib/api-client';

  export let data: PageData;
  let topupAmount = 50;
  let selectedUserId = '';
  let isLoading = false;
  let showModal = false;

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
        // Update user data locally
        const user = data.users.find((u: any) => u.user_id === selectedUserId);
        if (user) {
          user.xu_balance = (user.xu_balance || 0) + topupAmount;
          data.users = [...data.users]; // trigger reactivity
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

  let isBanning = false;
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
  <title>Admin Dashboard - Tử Vi Toàn Tập</title>
</svelte:head>



<div class="data-table-container">
  <table class="data-table">
    <thead>
      <tr>
        <th>Tên</th>
        <th>Email</th>
        <th>XU Balance</th>
        <th>Premium</th>
        <th class="actions-header">Nạp XU</th>
      </tr>
    </thead>
    <tbody>
      {#each data.users as user (user.user_id)}
        <tr>
          <td class="primary-cell">
            <span class="user-name">{user.full_name || 'N/A'}</span>
            {#if user.is_banned}
              <span class="badge badge-danger">Banned</span>
            {/if}
          </td>
          <td class="secondary-cell">{user.email || 'N/A'}</td>
          <td class="highlight-cell">{user.xu_balance || 0}</td>
          <td class="secondary-cell">{user.is_premium ? 'Có' : 'Không'}</td>
          <td class="actions-cell">
            <button class="btn btn-text btn-primary" onclick={() => openTopupModal(user.user_id)}>
              XU +/-
            </button>
            {#if user.is_banned}
              <button class="btn btn-text btn-success" onclick={() => handleBan(user.user_id, false)} disabled={isBanning}>
                Mở khoá
              </button>
            {:else}
              <button class="btn btn-text btn-danger" onclick={() => handleBan(user.user_id, true)} disabled={isBanning}>
                Khoá
              </button>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={closeTopupModal}></div>
  <div class="modal-wrapper">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">Thay đổi XU tài khoản</h3>
      </div>
      <div class="modal-body">
        <label for="amount" class="form-label">Số lượng XU</label>
        <input
          type="number"
          name="amount"
          id="amount"
          min="1"
          bind:value={topupAmount}
          class="form-input"
        />
      </div>
      <div class="modal-footer">
        <button class="btn btn-solid" onclick={handleTopup} disabled={isLoading}>Nạp XU</button>
        <button class="btn btn-solid btn-danger-solid" onclick={handleDeduct} disabled={isLoading}>Trừ XU</button>
        <button class="btn btn-outline" onclick={closeTopupModal}>Hủy</button>
      </div>
    </div>
  </div>
{/if}

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
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .user-name {
    font-size: var(--text-body);
  }

  .secondary-cell {
    color: var(--color-text-muted);
    font-size: var(--text-body-sm);
  }

  .highlight-cell {
    font-weight: 700;
    color: var(--color-accent-sienna);
    font-size: var(--text-body);
  }

  .actions-header {
    text-align: right;
  }

  .actions-cell {
    text-align: right;
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
  }

  /* Buttons */
  .btn {
    font-family: inherit;
    font-size: var(--text-body-sm);
    font-weight: 500;
    padding: var(--space-xs) var(--space-md);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--duration-fast);
    border: none;
    background: transparent;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-text {
    padding: var(--space-xs) var(--space-xs);
  }

  .btn-text:hover {
    background: var(--overlay-ink-wash);
  }

  .btn-primary {
    color: var(--color-accent-primary);
  }

  .btn-success {
    color: var(--color-accent-green);
  }

  .btn-danger {
    color: var(--color-accent-danger);
  }

  .btn-solid {
    background: var(--color-accent-primary);
    color: var(--color-text-on-primary);
  }

  .btn-solid:hover:not(:disabled) {
    background: var(--color-accent-primary-pressed);
  }

  .btn-danger-solid {
    background: var(--color-accent-danger);
    color: white;
  }

  .btn-outline {
    background: transparent;
    border: 1px solid var(--color-border-strong);
    color: var(--color-text-primary);
  }

  .btn-outline:hover {
    background: var(--overlay-ink-wash);
  }

  /* Badge */
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

  .badge-danger {
    background: #fde8e8;
    color: var(--color-accent-danger);
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--overlay-border-strong);
    backdrop-filter: blur(4px);
    z-index: 40;
    animation: fadeIn var(--duration-fast);
  }

  .modal-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl);
    pointer-events: none;
  }

  .modal-dialog {
    background: var(--color-bg-surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    width: 100%;
    max-width: 480px;
    pointer-events: auto;
    animation: slideUp var(--duration-fast);
    overflow: hidden;
  }

  .modal-header {
    padding: var(--space-lg) var(--space-lg) var(--space-md);
  }

  .modal-title {
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    color: var(--color-text-primary);
    margin: 0;
  }

  .modal-body {
    padding: 0 var(--space-lg) var(--space-xl);
  }

  .form-label {
    display: block;
    font-size: var(--text-caption);
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-xs);
  }

  .form-input {
    width: 100%;
    box-sizing: border-box;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font-size: var(--text-body);
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    background: var(--color-bg-surface);
    transition: border-color var(--duration-fast);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-accent-primary);
  }

  .modal-footer {
    padding: var(--space-md) var(--space-lg);
    background: var(--color-bg-elevated);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    border-top: 1px solid var(--color-border-hairline);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>
