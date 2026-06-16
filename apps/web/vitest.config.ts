import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Test runes trong .svelte.ts: cần svelte plugin compile + điều kiện resolve 'browser'
// để $state/$derived chạy đúng runtime client. $lib alias do SvelteKit cấp lúc chạy thật,
// vitest phải tự khai báo. $env/static/public là virtual module SvelteKit chỉ tồn tại
// lúc build/dev — test thay bằng stub giá trị giả để import.meta.env không vỡ.
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser'],
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      '$env/static/public': fileURLToPath(
        new URL('./src/test/env-static-public-stub.ts', import.meta.url),
      ),
      '$app/navigation': fileURLToPath(
        new URL('./src/test/app-navigation-stub.ts', import.meta.url),
      ),
      '$app/paths': fileURLToPath(
        new URL('./src/test/app-paths-stub.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/.svelte-kit/**', '**/build/**'],
  },
});
