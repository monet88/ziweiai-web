import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

class ThemeStore {
  current = $state<Theme>('light');

  constructor() {
    if (browser) {
      const saved = localStorage.getItem('ziweiai_theme') as Theme | null;
      if (saved === 'dark' || saved === 'light') {
        this.current = saved;
      } else {
        this.current = 'light'; // Default to light theme as requested
      }
      this.applyTheme(this.current);
    }
  }

  toggle() {
    this.current = this.current === 'light' ? 'dark' : 'light';
    if (browser) {
      localStorage.setItem('ziweiai_theme', this.current);
      this.applyTheme(this.current);
    }
  }

  setTheme(theme: Theme) {
    this.current = theme;
    if (browser) {
      localStorage.setItem('ziweiai_theme', this.current);
      this.applyTheme(this.current);
    }
  }

  private applyTheme(theme: Theme) {
    if (!browser) return;
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
}

export const themeStore = new ThemeStore();
