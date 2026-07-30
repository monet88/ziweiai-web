import { expect, type Page } from '@playwright/test';
import { createClient, type Session } from '@supabase/supabase-js';
import {
  getTestUserForWorker,
  resolveWorkerIndex,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  type TestUser,
} from './test-user';

const sessionPromises = new Map<string, Promise<Session>>();

function getSupabaseStorageKey(): string {
  const host = new URL(SUPABASE_URL).hostname;
  const projectRef = host.split('.')[0] ?? host;
  return `sb-${projectRef}-auth-token`;
}

export async function getCachedSession(user: TestUser): Promise<Session> {
  const existing = sessionPromises.get(user.email);
  if (existing) {
    return existing;
  }

  const sessionPromise = (async () => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    if (error || !data.session) {
      throw new Error(error?.message || `Không lấy được session test cho ${user.email}.`);
    }
    return data.session;
  })();

  sessionPromises.set(user.email, sessionPromise);
  return sessionPromise;
}

export async function installSession(page: Page, session: Session): Promise<void> {
  const storageKey = getSupabaseStorageKey();
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: storageKey, value: JSON.stringify(session) },
  );
}

// Cấp session email thật cho E2E rồi chờ dashboard. Trước đây helper đăng nhập qua form cho
// từng spec; full suite 4 workers dễ chạm Supabase Auth rate limit. Cách này vẫn dùng JWT thật
// của user test nhưng cache session theo worker để tránh login lặp.
export async function signInViaUi(page: Page): Promise<void> {
  // Mỗi worker dùng email riêng (backlog #21): đọc index từ env Playwright bơm vào worker hiện
  // tại; ngoài Playwright (không có index) → quay về user dùng chung. signInViaUi chạy TRONG
  // worker nên resolveWorkerIndex() ở đây mới thấy đúng giá trị (globalSetup không thấy).
  const user = getTestUserForWorker(resolveWorkerIndex());
  const session = await getCachedSession(user);
  await installSession(page, session);
  await page.goto('/');

  // Dashboard hiển thị BirthForm (ô #birth-day) — mốc xác nhận đã vào (app). Dùng id field
  // thay vì nút "Lập lá số" vì khi lịch sử rỗng, EmptyStateCard sidebar cũng render nút trùng
  // nhãn (strict mode bắt 2 phần tử).
  await page.getByRole('button', { name: 'Lập lá số' }).first().click();
  await expect(page.locator('#birth-day')).toBeVisible();
}
