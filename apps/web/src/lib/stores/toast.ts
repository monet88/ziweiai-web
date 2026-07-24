import { writable } from 'svelte/store';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'danger';
  durationMs?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<ToastMessage[]>([]);

  return {
    subscribe,
    show(message: string, type: ToastMessage['type'] = 'success', durationMs = 4500) {
      const id = Math.random().toString(36).substring(2, 9);
      update((toasts) => [...toasts, { id, message, type, durationMs }]);

      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    },
    dismiss(id: string) {
      update((toasts) => toasts.filter((t) => t.id !== id));
    },
  };
}

export const toast = createToastStore();
