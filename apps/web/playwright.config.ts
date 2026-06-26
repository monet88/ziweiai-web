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

// Backlog #21: mỗi worker dùng email test riêng (global-setup provision w0..wN-1 + user dùng
// chung), nên va chạm quota/rate-limit per-user — nguyên nhân gốc buộc workers:1 — đã được gỡ.
// Hạ tầng song song hoá đã sẵn sàng, nhưng việc bật song song thật cần chứng minh xanh trên
// Supabase Cloud + mạng thật (không chạy được trong môi trường implement này). Vì vậy mặc định
// vẫn 1 worker; nâng qua env E2E_WORKERS (vd E2E_WORKERS=4) khi đã verify được phiên live xanh —
// không cần đổi code. fullyParallel bám theo: chỉ bật khi chạy >1 worker.
const workerCount = (() => {
  const raw = process.env.E2E_WORKERS;
  if (raw === undefined || raw.trim() === '') {
    return 1;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
})();

// Nhóm @live (pnpm e2e:live) gọi LLM thật. Một số feature cần cờ server bật mới sinh được kết quả
// thật — cụ thể báo cáo năm (AI_ANNUAL_REPORT_ENABLED, mặc định tắt ở mọi nơi để tránh đốt token).
// webServer khởi động MỘT lần với env tĩnh nên phải quyết cờ tại đây: phát hiện chế độ live qua argv
// rồi chỉ bật cờ annual cho phiên live. Bộ default vẫn chạy với cờ tắt (paywall, 0 token).
//
// Phát hiện phải nhận MỌI dạng CLI tương đương của Playwright (`--grep @live`, `-g @live`,
// `--grep=@live`, `-g=@live`) — nếu chỉ khớp đúng dạng hai-token `--grep @live` thì các lệnh khác
// lặng lẽ khởi động server KHÔNG có cờ live → test @live rơi vào nhánh paywall/FEATURE_DISABLED mà
// không có tín hiệu lỗi rõ. ĐỒNG THỜI phải loại `--grep-invert @live` (đây là bộ default loại bỏ
// @live, KHÔNG phải phiên live) — vì vậy so khớp chính xác tên cờ, không quét @live ở mọi vị trí.
const cliArgs = process.argv.slice(2);
const isLiveRun = cliArgs.some((arg, index) => {
  // Dạng gộp: --grep=@live / -g=@live (regex chốt `=` ngay sau tên cờ → '--grep-invert=' không khớp).
  const inlineMatch = /^(--grep|-g)=(.*)$/.exec(arg);
  if (inlineMatch) {
    return inlineMatch[2].includes('@live');
  }
  // Dạng hai-token: --grep @live / -g @live ('--grep-invert' !== '--grep' nên bị loại đúng cách).
  if (arg === '--grep' || arg === '-g') {
    return (cliArgs[index + 1] ?? '').includes('@live');
  }
  return false;
});

export default defineConfig({
  testDir: './tests/e2e',
  // Luận giải AI gọi provider thật (mạng) → cho mỗi test tối đa 90s. Mặc định 1 worker; khi
  // bật song song (E2E_WORKERS>1) mỗi worker có user riêng nên không đua quota/rate-limit per-user.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: workerCount > 1,
  workers: workerCount,
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
        // E2E chạy nhiều spec dưới ít user test + store quota in-memory (per-process), nên trần
        // chống-lạm-dụng mặc định (charts 20/ngày, 30 req/phút...) bị cộng dồn và chặn các spec
        // cuối (US-009/US-015...). Backlog #21 tách user theo worker giúp giảm dồn per-user, nhưng
        // vẫn nâng trần cho riêng tiến trình api e2e — KHÔNG nới lỏng sản phẩm: hành vi quota được
        // kiểm riêng ở US-013.
        API_REQUESTS_PER_MINUTE_PER_IP: '100000',
        API_REQUESTS_PER_MINUTE_PER_USER: '100000',
        API_CHARTS_PER_DAY_PER_USER: '100000',
        API_EXPLANATIONS_PER_DAY_PER_USER: '100000',
        API_VISION_REQUESTS_PER_DAY_PER_USER: '100000',
        API_ANNUAL_REPORTS_PER_DAY_PER_USER: '100000',
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
        // US-017h: bật cờ Tarot cho e2e (mặc định false ở mọi nơi khác → fail-closed).
        EXTENDED_SYSTEM_TAROT_ENABLED: 'true',
        // Báo cáo năm (US-016) + Trợ lý hội thoại (US-018) chỉ sinh thật khi cờ tương ứng bật (mặc
        // định tắt ở mọi nơi → nhánh paywall/FEATURE_DISABLED). webServer khởi động MỘT lần với env
        // tĩnh nên chỉ bật cho phiên @live: bản live gọi LLM thật, bộ default giữ tắt (0 token LLM,
        // các spec stub tự intercept request nên không phụ thuộc cờ server).
        ...(isLiveRun ? { AI_ANNUAL_REPORT_ENABLED: 'true', AI_CONVERSATION_ENABLED: 'true' } : {}),
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
