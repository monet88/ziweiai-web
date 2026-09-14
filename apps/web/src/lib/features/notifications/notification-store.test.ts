import { describe, it, expect, beforeEach } from 'vitest';
import { notificationStore } from './notification-store.svelte';
import type { InAppNotification } from '@ziweiai/contracts';

describe('NotificationStore', () => {
  beforeEach(() => {
    notificationStore.notifications = [];
    notificationStore.readIds = new Set();
    notificationStore.isDrawerOpen = false;
  });

  it('calculates unreadCount accurately based on readIds and isRead', () => {
    const mockItems: InAppNotification[] = [
      {
        id: 'n-1',
        type: 'topup_success',
        title: 'Nạp XU thành công',
        body: '+50 XU',
        createdAt: '2026-09-11T10:00:00Z',
        isRead: false,
      },
      {
        id: 'n-2',
        type: 'checkin_reward',
        title: 'Điểm danh',
        body: '+5 XU',
        createdAt: '2026-09-11T10:05:00Z',
        isRead: false,
      },
      {
        id: 'n-3',
        type: 'feature_spent',
        title: 'Mở khóa VIP',
        body: '-50 XU',
        createdAt: '2026-09-11T10:10:00Z',
        isRead: true, // Already read
      },
    ];

    notificationStore.notifications = mockItems;
    expect(notificationStore.unreadCount).toBe(2);

    notificationStore.markAsRead('n-1');
    expect(notificationStore.unreadCount).toBe(1);

    notificationStore.markAllAsRead();
    expect(notificationStore.unreadCount).toBe(0);
  });

  it('toggles drawer state', () => {
    expect(notificationStore.isDrawerOpen).toBe(false);

    notificationStore.openDrawer();
    expect(notificationStore.isDrawerOpen).toBe(true);

    notificationStore.closeDrawer();
    expect(notificationStore.isDrawerOpen).toBe(false);

    notificationStore.toggleDrawer();
    expect(notificationStore.isDrawerOpen).toBe(true);
  });

  it('pushes local notification and prevents duplicates with same id', () => {
    const item: InAppNotification = {
      id: 'unique-notif',
      type: 'topup_success',
      title: 'Nạp tiền',
      body: '+100 XU',
      createdAt: '2026-09-11T10:00:00Z',
      isRead: false,
    };

    notificationStore.pushNotification(item);
    expect(notificationStore.notifications.length).toBe(1);

    // Push duplicate
    notificationStore.pushNotification(item);
    expect(notificationStore.notifications.length).toBe(1);
  });

  it('clears notification by id', () => {
    const item: InAppNotification = {
      id: 'notif-to-remove',
      type: 'system_reminder',
      title: 'Nhắc nhở',
      body: 'Nội dung',
      createdAt: '2026-09-11T10:00:00Z',
      isRead: false,
    };

    notificationStore.pushNotification(item);
    expect(notificationStore.notifications.length).toBe(1);

    notificationStore.clearNotification('notif-to-remove');
    expect(notificationStore.notifications.length).toBe(0);
    expect(notificationStore.readIds.has('notif-to-remove')).toBe(true);
  });

  it('stores and tracks referral_reward honour notification correctly', () => {
    const item: InAppNotification = {
      id: 'ref-honour-1',
      type: 'referral_reward',
      title: 'Vinh Danh Sứ Giả Hoàng Triều',
      body: 'Một đồng đạo vừa gia nhập qua mã giới thiệu của bạn! Thưởng nóng +10 XU đã được trao vào ví.',
      amountXu: 10,
      link: '/wallet',
      createdAt: '2026-09-14T10:00:00Z',
      isRead: false,
    };

    notificationStore.pushNotification(item);
    expect(notificationStore.notifications.length).toBe(1);
    expect(notificationStore.unreadCount).toBe(1);
    expect(notificationStore.notifications[0].type).toBe('referral_reward');
    expect(notificationStore.notifications[0].title).toBe('Vinh Danh Sứ Giả Hoàng Triều');
  });
});
