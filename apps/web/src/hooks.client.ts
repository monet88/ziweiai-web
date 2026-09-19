import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';
import type { HandleClientError } from '@sveltejs/kit';

Sentry.init({
  dsn: env.PUBLIC_SENTRY_DSN || '',
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  integrations: [
    Sentry.replayIntegration(),
  ],
});

// Tự động hồi phục khi máy chủ triển khai bản mới khiến mã băm chunk JS cũ bị lệch (version skew)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    const lastReloadKey = 'vios_preload_reload_ts';
    const lastReload = sessionStorage.getItem(lastReloadKey);
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(lastReloadKey, now.toString());
      console.warn('Vite preload error detected (stale chunks). Reloading to fetch latest version...', event);
      window.location.reload();
    }
  });
}

const clientErrorHandler: HandleClientError = ({ error, message, status }) => {
  const errStr = (error instanceof Error ? error.message : String(error || '')).toLowerCase();
  const isChunkLoadFailed =
    errStr.includes('failed to fetch dynamically imported module') ||
    errStr.includes('expected a javascript-or-wasm module script') ||
    errStr.includes('importing a module script failed') ||
    errStr.includes('dynamically imported module');

  if (isChunkLoadFailed && typeof window !== 'undefined') {
    const lastReloadKey = 'vios_chunk_reload_ts';
    const lastReload = sessionStorage.getItem(lastReloadKey);
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(lastReloadKey, now.toString());
      console.warn('Version skew detected in client router. Hard reloading page...');
      window.location.reload();
      return { message: 'Đang tải lại phiên bản mới nhất...', status };
    }
  }

  return {
    message: message || 'Đã xảy ra lỗi không mong muốn.',
    status,
  };
};

export const handleError = Sentry.handleErrorWithSentry(clientErrorHandler);

