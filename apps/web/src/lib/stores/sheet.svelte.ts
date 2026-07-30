import type { Component } from 'svelte';

export class SheetStore {
  isOpen = $state(false);
  component = $state<Component<any> | null>(null);
  props = $state<Record<string, any>>({});
  title = $state<string>('');

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', (event) => {
        // If the sheet is open and the current history state is NOT our dummy sheetOpen state
        if (this.isOpen && !event.state?.sheetOpen) {
          this.close(true); // close without calling history.back()
        }
      });
    }
  }

  open<T extends Record<string, any>>(
    component: Component<T>,
    props: T = {} as T,
    title: string = ''
  ) {
    this.component = component;
    this.props = props;
    this.title = title;
    this.isOpen = true;

    if (typeof window !== 'undefined') {
      window.history.pushState({ sheetOpen: true }, '');
    }
  }

  close(fromPopState = false) {
    this.isOpen = false;
    
    if (typeof window !== 'undefined' && !fromPopState) {
      // If we close manually, and the top history state is our dummy state, pop it
      if (window.history.state?.sheetOpen) {
        window.history.back();
      }
    }

    // Đợi animation đóng xong mới clear nội dung (khoảng 300ms)
    setTimeout(() => {
      this.component = null;
      this.props = {};
      this.title = '';
    }, 300);
  }
}

// Singleton instance cho ứng dụng (hoặc dùng Context nếu cần SSR isolation)
export const sheetStore = new SheetStore();
