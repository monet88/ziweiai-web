import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

// Thông tin user test cho E2E. Tạo bằng email signUp (KHÔNG service role): mailer_autoconfirm
// bật trên project nên signUp trả session ngay, đăng nhập được liền.
// URL + anon/publishable key đọc từ .env root (PUBLIC_*) — đúng môi trường mà api+web đang
// trỏ tới (Supabase Cloud, decision 0016). KHÔNG hardcode endpoint local nữa.
// anon/publishable key là client-safe theo thiết kế Supabase (không phải secret).
const rootEnvPath = fileURLToPath(new URL('../../../../.env', import.meta.url));
if (existsSync(rootEnvPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(rootEnvPath);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`[e2e] Thiếu biến môi trường ${name} trong .env root (cần cho user test E2E).`);
  }
  return value;
}

export const SUPABASE_URL = requireEnv('PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = requireEnv('PUBLIC_SUPABASE_ANON_KEY');

export interface TestUser {
  email: string;
  password: string;
}

// Mật khẩu dùng chung cho mọi user test: chỉ email phân biệt theo worker. Email KHÔNG dùng
// Date.now(): globalSetup và worker là hai process tách biệt (timestamp sẽ lệch → email không
// khớp). Email tĩnh + signUp idempotent (đã tồn tại → bỏ qua, signIn dùng lại) cho local re-run.
const TEST_PASSWORD = 'e2e-password-123456';

// User dùng chung (fallback). Giữ lại email lịch sử US-006 để các lần chạy không-Playwright
// (không set TEST_PARALLEL_INDEX) vẫn đăng nhập được. globalSetup luôn provision cả user này.
export const TEST_USER: TestUser = {
  email: 'e2e-us006@example.com',
  password: TEST_PASSWORD,
};

/**
 * Chọn credentials theo worker index. Backlog #21: full-suite chạy nhiều worker dưới MỘT user
 * dùng chung → đụng quota per-user + rate-limit auth của Supabase Cloud → flaky, buộc workers:1.
 * Mỗi worker dùng email riêng `e2e-w{index}@example.com` để các phiên đăng nhập/đặt quota không
 * giẫm lên nhau, cho phép song song hoá an toàn.
 *
 * index không hợp lệ (không phải số nguyên >= 0) → trả về user dùng chung (single-run local,
 * hoặc bối cảnh không có biến worker index).
 */
export function getTestUserForWorker(index?: number): TestUser {
  if (typeof index === 'number' && Number.isInteger(index) && index >= 0) {
    return { email: `e2e-w${index}@example.com`, password: TEST_PASSWORD };
  }
  return TEST_USER;
}

/**
 * Worker index của tiến trình hiện tại, đọc từ env Playwright bơm vào MỖI worker
 * (TEST_PARALLEL_INDEX, fallback TEST_WORKER_INDEX). Trả về undefined khi không chạy trong
 * worker (vd globalSetup, hoặc gọi ngoài Playwright) → caller dùng user dùng chung.
 */
export function resolveWorkerIndex(): number | undefined {
  const raw = process.env.TEST_PARALLEL_INDEX ?? process.env.TEST_WORKER_INDEX;
  if (raw === undefined || raw.trim() === '') {
    return undefined;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

/**
 * Bảo đảm MỘT user test tồn tại: signUp qua anon key. Nếu user đã có (chạy lại cùng email) thì
 * signUp lỗi "already registered" — bỏ qua, vì test sẽ tự signIn. Idempotent, KHÔNG service role.
 */
export async function ensureTestUser(user: TestUser = TEST_USER): Promise<void> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await client.auth.signUp({
    email: user.email,
    password: user.password,
  });

  if (error && !/already registered/i.test(error.message)) {
    throw new Error(`Không tạo được user test E2E (${user.email}): ${error.message}`);
  }
}

/**
 * Provision toàn bộ user test cho một lần chạy: w0..w{workerCount-1} + user dùng chung
 * (fallback). Gọi MỘT lần ở globalSetup — process này KHÔNG biết từng worker index nên phải tạo
 * sẵn cả tập theo số worker đã resolve (FullConfig.workers). signUp tuần tự để tránh dồn rate-limit
 * auth lúc khởi động (số worker nhỏ nên chi phí không đáng kể).
 */
export async function provisionWorkerUsers(workerCount: number): Promise<void> {
  const count = Number.isInteger(workerCount) && workerCount > 0 ? workerCount : 1;
  for (let index = 0; index < count; index += 1) {
    await ensureTestUser(getTestUserForWorker(index));
  }
  // User dùng chung cho các bối cảnh không có worker index (an toàn cho mọi lần chạy).
  await ensureTestUser(TEST_USER);
}
