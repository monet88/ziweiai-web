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

// User cố định cho toàn bộ lần chạy. Email KHÔNG dùng Date.now(): globalSetup và test
// worker là hai process tách biệt (giá trị timestamp sẽ lệch → email không khớp). Email
// tĩnh + signUp idempotent (đã tồn tại → bỏ qua, signIn dùng lại) cho local re-run.
export const TEST_USER = {
  email: 'e2e-us006@example.com',
  password: 'e2e-password-123456',
};

/**
 * Bảo đảm user test tồn tại: signUp qua anon key. Nếu user đã có (chạy lại cùng email)
 * thì signUp lỗi "already registered" — bỏ qua, vì test sẽ tự signIn. Idempotent.
 */
export async function ensureTestUser(): Promise<void> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await client.auth.signUp({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });

  if (error && !/already registered/i.test(error.message)) {
    throw new Error(`Không tạo được user test E2E: ${error.message}`);
  }
}
