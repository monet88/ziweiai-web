// ViOS Service Worker for PWA
const CACHE_NAME = 'vios-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Chỉ cache static requests (GET), bỏ qua API và POST/PUT/DELETE
  if (event.request.method !== 'GET') return;

  // Bỏ qua tất cả scheme không phải http/https (đặc biệt là chrome-extension, moz-extension)
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) {
    return;
  }

  const url = new URL(event.request.url);

  // Không cache API calls, auth routes hoặc endpoint động
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/auth')) {
    return;
  }

  // 1. Navigation requests (tải trang HTML): NETWORK-FIRST
  // Luôn lấy file HTML mới nhất từ server để có hash bundle JS chính xác sau mỗi lần deploy.
  // Chỉ khi mất mạng hoàn toàn (offline) mới fallback về cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // 2. Static Assets (_app/immutable, fonts, icons, manifest):
  // Cache-first hoặc Network fallback, nhưng KHÔNG BAO GIỜ cache nếu response là text/html
  // (tránh lưu nhầm trang 404 SPA fallback dạng HTML khi request file .js/.css cũ)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (response.status === 200 && response.type === 'basic') {
          const contentType = response.headers.get('content-type') || '';
          const isHtml = contentType.includes('text/html');
          const isAsset = url.pathname.startsWith('/_app/') ||
                          url.pathname.endsWith('.js') ||
                          url.pathname.endsWith('.css') ||
                          url.pathname.endsWith('.svg') ||
                          url.pathname.endsWith('.png') ||
                          url.pathname.endsWith('.woff2');

          // Không lưu vào cache nếu server trả về HTML cho file asset (dấu hiệu SPA 404 rewrite)
          if (!isHtml || !isAsset) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          }
        }
        return response;
      });
    })
  );
});
