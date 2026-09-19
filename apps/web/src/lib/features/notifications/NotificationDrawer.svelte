<script lang="ts">
  import { notificationStore } from './notification-store.svelte';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import {
    X,
    CheckCheck,
    Coins,
    Gift,
    Sparkles,
    Users,
    Zap,
    Flame,
    Compass,
    Bell,
    ExternalLink
  } from 'lucide-svelte';
  import type { InAppNotification } from '@ziweiai/contracts';

  const auth = getAuthStore();

  let activeTab = $state<'all' | 'xu' | 'system'>('all');

  // Fetch notifications on mount / when auth is ready
  $effect(() => {
    if (auth.session?.access_token && !notificationStore.lastFetchedAt) {
      notificationStore.fetchNotifications(auth.session.access_token);
    }
  });

  let filteredNotifications = $derived.by(() => {
    const list = notificationStore.notifications;
    if (activeTab === 'xu') {
      return list.filter((n) =>
        n.type === 'topup_success' ||
        n.type === 'checkin_reward' ||
        n.type === 'referral_reward' ||
        n.type === 'feature_spent'
      );
    }
    if (activeTab === 'system') {
      return list.filter((n) =>
        n.type === 'system_reminder' ||
        n.type === 'ai_ready'
      );
    }
    return list;
  });

  function formatRelativeTime(dateStr: string): string {
    try {
      const now = Date.now();
      const past = new Date(dateStr).getTime();
      const diffMs = now - past;
      if (Number.isNaN(diffMs) || diffMs < 0) return 'Vừa xong';

      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 60) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return 'Hôm qua';
      if (diffDays < 7) return `${diffDays} ngày trước`;

      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return 'Gần đây';
    }
  }

  function handleItemClick(item: InAppNotification) {
    notificationStore.markAsRead(item.id);
    if (item.link) {
      notificationStore.closeDrawer();
      goto(resolve(item.link as any));
    }
  }

  function getIconForType(type: string) {
    switch (type) {
      case 'topup_success':
        return Zap;
      case 'checkin_reward':
        return Gift;
      case 'referral_reward':
        return Users;
      case 'feature_spent':
        return Sparkles;
      case 'ai_ready':
        return Compass;
      case 'system_reminder':
      default:
        return Flame;
    }
  }
</script>

{#if notificationStore.isDrawerOpen}
  <div
    class="drawer-backdrop"
    onclick={() => notificationStore.closeDrawer()}
    aria-hidden="true"
  ></div>

  <aside class="notification-drawer" aria-label="Trung tâm thông báo hoàng gia">
    <!-- Header -->
    <div class="drawer-header">
      <div class="header-title-box">
        <div class="icon-ring">
          <Bell size={18} class="text-gold" />
        </div>
        <div>
          <h2 class="drawer-title">Thông Báo Hoàng Triều</h2>
          <span class="drawer-subtitle">
            {notificationStore.unreadCount > 0
              ? `${notificationStore.unreadCount} thông báo chưa đọc`
              : 'Đã cập nhật toàn bộ'}
          </span>
        </div>
      </div>

      <div class="header-actions">
        {#if notificationStore.unreadCount > 0}
          <button
            type="button"
            class="btn-mark-all"
            onclick={() => notificationStore.markAllAsRead()}
            title="Đánh dấu tất cả là đã đọc"
          >
            <CheckCheck size={16} />
            <span class="btn-text">Đã đọc hết</span>
          </button>
        {/if}
        <button
          type="button"
          class="btn-close"
          onclick={() => notificationStore.closeDrawer()}
          aria-label="Đóng thông báo"
        >
          <X size={18} />
        </button>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        type="button"
        class="filter-tab"
        class:active={activeTab === 'all'}
        onclick={() => activeTab = 'all'}
      >
        Tất Cả ({notificationStore.notifications.length})
      </button>
      <button
        type="button"
        class="filter-tab"
        class:active={activeTab === 'xu'}
        onclick={() => activeTab = 'xu'}
      >
        Biến Động XU
      </button>
      <button
        type="button"
        class="filter-tab"
        class:active={activeTab === 'system'}
        onclick={() => activeTab = 'system'}
      >
        Khí Vận & Nhắc Nhở
      </button>
    </div>

    <!-- Notification List -->
    <div class="notifications-list">
      {#if filteredNotifications.length === 0}
        <div class="empty-state">
          <div class="empty-icon-box">
            <Coins size={36} class="text-gold" />
          </div>
          <h3>Không Có Thông Báo Nào</h3>
          <p>Mọi biến động nạp XU, thưởng điểm danh và luận giải mới sẽ được ghi nhận tại đây.</p>
        </div>
      {:else}
        {#each filteredNotifications as item (item.id)}
          {@const isRead = notificationStore.readIds.has(item.id) || item.isRead}
          {@const IconComponent = getIconForType(item.type)}
          <div
            class="notification-item"
            class:unread={!isRead}
            onclick={() => handleItemClick(item)}
            onkeydown={(e) => { if (e.key === 'Enter') handleItemClick(item); }}
            role="button"
            tabindex="0"
          >
            <div class="item-icon-box type-{item.type}">
              <IconComponent size={18} />
            </div>

            <div class="item-body">
              <div class="item-header-row">
                <h4 class="item-title">{item.title}</h4>
                <span class="item-time">{formatRelativeTime(item.createdAt)}</span>
              </div>
              <p class="item-desc">{item.body}</p>
              {#if item.amountXu !== undefined}
                <div class="item-meta">
                  <span class="xu-pill" class:xu-positive={item.amountXu > 0} class:xu-negative={item.amountXu < 0}>
                    {item.amountXu > 0 ? `+${item.amountXu}` : item.amountXu} XU
                  </span>
                  {#if item.link}
                    <span class="link-hint">
                      <span>Xem ngay</span>
                      <ExternalLink size={11} />
                    </span>
                  {/if}
                </div>
              {/if}
            </div>

            {#if !isRead}
              <span class="unread-dot" title="Chưa đọc"></span>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </aside>
{/if}

<style>
  .drawer-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(5, 3, 15, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 10000;
    animation: fadeIn 0.25s ease-out;
  }

  .notification-drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 420px;
    background: linear-gradient(180deg, #130c2b 0%, #090615 100%);
    border-left: 1px solid rgba(212, 175, 55, 0.3);
    box-shadow: -10px 0 40px rgba(0, 0, 0, 0.7);
    z-index: 10001;
    display: flex;
    flex-direction: column;
    color: #f7eed8;
    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Header */
  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    background: rgba(22, 16, 42, 0.6);
  }

  .header-title-box {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .icon-ring {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .drawer-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 17px;
    font-weight: 700;
    color: #f7eed8;
  }

  .drawer-subtitle {
    font-size: 11.5px;
    color: rgba(232, 220, 196, 0.75);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-mark-all {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: #ffd700;
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-mark-all:hover {
    background: rgba(212, 175, 55, 0.25);
    border-color: #ffd700;
  }

  .btn-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e8dcc4;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-close:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    color: #f87171;
  }

  /* Filter Tabs */
  .filter-tabs {
    display: flex;
    padding: 10px 16px;
    gap: 8px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.12);
    background: rgba(0, 0, 0, 0.2);
    overflow-x: auto;
  }

  .filter-tab {
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(232, 220, 196, 0.8);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .filter-tab:hover {
    background: rgba(212, 175, 55, 0.1);
    color: #ffd700;
  }

  .filter-tab.active {
    background: rgba(212, 175, 55, 0.2);
    border-color: #ffd700;
    color: #ffd700;
  }

  /* Notifications List */
  .notifications-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .notification-item {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .notification-item:hover {
    background: rgba(212, 175, 55, 0.08);
    border-color: rgba(212, 175, 55, 0.3);
    transform: translateX(-2px);
  }

  .notification-item.unread {
    background: rgba(212, 175, 55, 0.09);
    border-color: rgba(212, 175, 55, 0.35);
  }

  .unread-dot {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ffd700;
    box-shadow: 0 0 8px #ffd700;
  }

  .item-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .type-topup_success {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #34d399;
  }

  .type-checkin_reward {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fbbf24;
  }

  .type-referral_reward {
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.4);
    color: #60a5fa;
  }

  .type-feature_spent {
    background: rgba(168, 85, 247, 0.15);
    border: 1px solid rgba(168, 85, 247, 0.4);
    color: #c084fc;
  }

  .type-system_reminder, .type-ai_ready {
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.4);
    color: #ffd700;
  }

  .item-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .item-header-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    padding-right: 12px;
  }

  .item-title {
    margin: 0;
    font-size: 13.5px;
    font-weight: 700;
    color: #f7eed8;
    line-height: 1.3;
  }

  .item-time {
    font-size: 11px;
    color: rgba(232, 220, 196, 0.55);
    white-space: nowrap;
  }

  .item-desc {
    margin: 0;
    font-size: 12.5px;
    color: rgba(232, 220, 196, 0.85);
    line-height: 1.45;
  }

  .item-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 4px;
  }

  .xu-pill {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
  }

  .xu-positive {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.35);
    color: #34d399;
  }

  .xu-negative {
    background: rgba(168, 85, 247, 0.15);
    border: 1px solid rgba(168, 85, 247, 0.35);
    color: #c084fc;
  }

  .link-hint {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #ffd700;
    opacity: 0.9;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 60px 24px;
    gap: 12px;
    color: rgba(232, 220, 196, 0.7);
  }

  .empty-icon-box {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-state h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #f7eed8;
  }

  .empty-state p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
  }

  .text-gold {
    color: #ffd700;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
</style>
