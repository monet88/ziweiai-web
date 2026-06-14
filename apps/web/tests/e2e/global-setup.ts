import { ensureTestUser } from './test-user';

// globalSetup chạy MỘT lần trước mọi test, sau khi webServer (api + web) đã sẵn sàng.
// Bảo đảm user test tồn tại (anon signUp idempotent) để các spec đăng nhập được ngay.
export default async function globalSetup(): Promise<void> {
  await ensureTestUser();
}
