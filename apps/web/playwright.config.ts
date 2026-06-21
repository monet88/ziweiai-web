import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// E2E US-006: khởi cả api (NestJS, :3000) lẫn web preview (SPA tĩnh, :4173) rồi tự dừng.
// CORS: api mặc định chỉ cho phép một số origin; inject API_CORS_ORIGINS qua webServer.env
// để thêm origin preview (process.loadEnvFile KHÔNG override biến đã set sẵn — xác nhận ở
// dev-server.cjs). KHÔNG sửa file .env (chứa secret server). Service role không bao giờ
// chạm tới đây: user test tạo bằng anon signUp (enable_confirmations=false → có session ngay).
const WEB_PORT = 4173;
const API_PORT = 3000;
const WEB_ORIGIN = `http://localhost:${WEB_PORT}`;
const API_ORIGIN = `http://localhost:${API_PORT}`;

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  testDir: './tests/e2e',
  // Luận giải AI gọi provider thật (mạng) → cho mỗi test tối đa 90s; toàn bộ flow 1 worker
  // để không đua nhau tạo lá số trùng và tránh rate-limit per-user của api.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: WEB_ORIGIN,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // api dev: builder watch + runtime watch (dev-server.cjs). CORS bổ sung origin preview.
      command: 'pnpm --filter @ziweiai/api dev',
      cwd: repoRoot,
      port: API_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        API_CORS_ORIGINS: `${WEB_ORIGIN},${API_ORIGIN}`,
        // US-017b: bật cờ MBTI cho e2e (mặc định false ở mọi nơi khác → fail-closed).
        EXTENDED_SYSTEM_MBTI_ENABLED: 'true',
        // US-017c: bật cờ Hợp Hôn cho e2e (mặc định false ở mọi nơi khác → fail-closed).
        EXTENDED_SYSTEM_HEPAN_ENABLED: 'true',
        // US-017d: bật cờ Mạnh Phái cho e2e (mặc định false ở mọi nơi khác → fail-closed).
        EXTENDED_SYSTEM_MANGPAI_ENABLED: 'true',
        // US-017e: bật cờ Xem Tướng cho e2e (mặc định false ở mọi nơi khác → fail-closed).
        EXTENDED_SYSTEM_FACE_ENABLED: 'true',
        // US-017f: bật cờ Xem Tay cho e2e (mặc định false ở mọi nơi khác → fail-closed).
        EXTENDED_SYSTEM_PALM_ENABLED: 'true',
      },
    },
    {
      // web: build SPA tĩnh rồi preview (gần production hơn dev). Fallback index.html cho SPA.
      command: `pnpm --filter @ziweiai/web build && pnpm --filter @ziweiai/web preview --port ${WEB_PORT} --strictPort`,
      cwd: repoRoot,
      port: WEB_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
