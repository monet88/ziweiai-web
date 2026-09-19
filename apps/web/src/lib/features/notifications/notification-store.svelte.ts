import { browser } from '$app/environment';
import { inAppNotificationsResponseSchema, type InAppNotification } from '@ziweiai/contracts';
import { fetchJson } from '$lib/api-client/fetch-json';

const READ_STORAGE_KEY = 'vios_read_notifications';

function loadReadIds(): Set<string> {
  if (!browser) return new Set();
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return new Set();
}

function saveReadIds(readIds: Set<string>) {
  if (!browser) return;
  try {
    const arr = Array.from(readIds).slice(-100); // Keep last 100 read IDs
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // Ignore storage write error
  }
}

class NotificationStore {
  notifications = $state<InAppNotification[]>([]);
  readIds = $state<Set<string>>(new Set());
  isDrawerOpen = $state(false);
  isLoading = $state(false);
  lastFetchedAt = $state<number | null>(null);

  constructor() {
    if (browser) {
      this.readIds = loadReadIds();
    }
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !this.readIds.has(n.id) && !n.isRead).length;
  }

  openDrawer() {
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
  }

  toggleDrawer() {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

  async fetchNotifications(token?: string | null) {
    if (!browser || !token) return;
    this.isLoading = true;
    try {
      const response = await fetchJson('/notifications/in-app', inAppNotificationsResponseSchema, {
        method: 'GET',
        token,
      });

      if (response && Array.isArray(response.data)) {
        // Merge with existing real-time local notifications without duplicates
        const existingIds = new Set(this.notifications.map((n) => n.id));
        const newItems = response.data.filter((item) => !existingIds.has(item.id));
        this.notifications = [...newItems, ...this.notifications];
        this.lastFetchedAt = Date.now();
      }
    } catch (err) {
      // Graceful fallback: don't crash app if notifications endpoint is unreachable
      console.warn('Failed to fetch in-app notifications:', err);
    } finally {
      this.isLoading = false;
    }
  }

  markAsRead(id: string) {
    const updated = new Set(this.readIds);
    updated.add(id);
    this.readIds = updated;
    saveReadIds(updated);
  }

  markAllAsRead() {
    const updated = new Set(this.readIds);
    for (const item of this.notifications) {
      updated.add(item.id);
    }
    this.readIds = updated;
    saveReadIds(updated);
  }

  pushNotification(item: InAppNotification) {
    // Avoid duplicate IDs
    if (!this.notifications.some((n) => n.id === item.id)) {
      this.notifications = [item, ...this.notifications];
    }
  }

  clearNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.markAsRead(id);
  }
}

export const notificationStore = new NotificationStore();
