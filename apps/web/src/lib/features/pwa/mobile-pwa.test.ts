import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Mobile Web PWA & Responsive Verification', () => {
  const rootDir = path.resolve(__dirname, '../../../../');
  const manifestPath = path.join(rootDir, 'static/manifest.json');
  const swPath = path.join(rootDir, 'static/sw.js');
  const appHtmlPath = path.join(rootDir, 'src/app.html');
  const tokensCssPath = path.join(rootDir, 'src/lib/theme/tokens.css');

  describe('PWA Web App Manifest', () => {
    it('manifest.json tồn tại và có cấu trúc hợp lệ theo chuẩn W3C PWA', () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
      const content = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(content);

      expect(manifest.name).toBe('Tử Vi Toàn Tập — ViOS');
      expect(manifest.short_name).toBe('ViOS');
      expect(manifest.start_url).toBe('/');
      expect(manifest.display).toBe('standalone');
      expect(manifest.background_color).toBe('#0D0B14');
      expect(manifest.theme_color).toBe('#0D0B14');
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(4);
    });

    it('manifest.json chứa icon PNG kích thước 192x192 và 512x512 với purpose any và maskable', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const icons = manifest.icons as Array<{ src: string; sizes: string; type: string; purpose?: string }>;

      const icon192Any = icons.find((i) => i.src === '/icon-192.png' && i.sizes === '192x192' && i.purpose === 'any');
      const icon192Maskable = icons.find((i) => i.src === '/icon-192.png' && i.sizes === '192x192' && i.purpose === 'maskable');
      const icon512Any = icons.find((i) => i.src === '/icon-512.png' && i.sizes === '512x512' && i.purpose === 'any');
      const icon512Maskable = icons.find((i) => i.src === '/icon-512.png' && i.sizes === '512x512' && i.purpose === 'maskable');

      expect(icon192Any).toBeDefined();
      expect(icon192Maskable).toBeDefined();
      expect(icon512Any).toBeDefined();
      expect(icon512Maskable).toBeDefined();
    });

    it('các file icon PNG thực tế tồn tại trong thư mục static/', () => {
      expect(fs.existsSync(path.join(rootDir, 'static/icon-192.png'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'static/icon-512.png'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'static/apple-touch-icon.png'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'static/favicon.png'))).toBe(true);
    });
  });

  describe('iOS Safari PWA & Meta Tags in app.html', () => {
    it('app.html có khai báo viewport-fit=cover để hỗ trợ màn hình tai thỏ / dynamic island', () => {
      const html = fs.readFileSync(appHtmlPath, 'utf-8');
      expect(html).toContain('viewport-fit=cover');
      expect(html).toContain('apple-mobile-web-app-capable');
      expect(html).toContain('apple-mobile-web-app-status-bar-style');
      expect(html).toContain('apple-touch-icon');
    });
  });

  describe('Service Worker Offline Resilience (sw.js)', () => {
    it('sw.js đăng ký và cache các tài nguyên cốt lõi (manifest, icons, offline navigation)', () => {
      const swCode = fs.readFileSync(swPath, 'utf-8');
      expect(swCode).toContain('vios-cache-v5');
      expect(swCode).toContain('/icon-192.png');
      expect(swCode).toContain('/icon-512.png');
      expect(swCode).toContain('/apple-touch-icon.png');
      expect(swCode).toContain('skipWaiting');
      expect(swCode).toContain('clients.claim');
    });
  });

  describe('Mobile CSS Tokens & Safe Area Insets', () => {
    it('tokens.css có khai báo biến an toàn Safe Area Insets và tiện ích pb-safe/pt-safe', () => {
      const css = fs.readFileSync(tokensCssPath, 'utf-8');
      expect(css).toContain('--safe-bottom: env(safe-area-inset-bottom');
      expect(css).toContain('--safe-top: env(safe-area-inset-top');
      expect(css).toContain('.pb-safe');
      expect(css).toContain('.pt-safe');
      expect(css).toContain('-webkit-tap-highlight-color: transparent');
      expect(css).toContain('max-width: 100vw');
    });

    it('tokens.css có rule ngăn iOS Safari tự động zoom khi tap vào input', () => {
      const css = fs.readFileSync(tokensCssPath, 'utf-8');
      expect(css).toContain('font-size: 16px !important');
    });
  });
});
