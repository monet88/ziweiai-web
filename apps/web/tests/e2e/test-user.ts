import { createClient } from '@supabase/supabase-js';

// Thông tin user test cho E2E. Tạo bằng anon signUp (KHÔNG service role) trên Supabase
// local — enable_confirmations=false nên signUp trả session ngay, đăng nhập được liền.
// URL + anon key là giá trị demo CỐ ĐỊNH của `supabase start` (công khai theo thiết kế
// Supabase, không phải secret). Khớp apps/web/.env (PUBLIC_*).
export const SUPABASE_URL = 'http://127.0.0.1:54321';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

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
