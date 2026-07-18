import { test, expect, type Page } from '@playwright/test';
import type { Session } from '@supabase/supabase-js';
import { getCachedSession, installSession } from './sign-in';
import { getTestUserForWorker, resolveWorkerIndex } from './test-user';

// US-009 (decision 0009): bỏ tường đăng nhập. Khách chưa login mở app → AuthStore.init()
// cấp phiên ẩn danh qua Supabase anonymous sign-in → KHÔNG bị redirect /sign-in, lập + xem
// lá số chạy bình thường, header hiện CTA "Đăng nhập / Đăng ký" thay cho email.
//
// Test bắt đầu với storage sạch (context Playwright mới) → không có session → buộc đi nhánh
// anon. Yêu cầu môi trường: Anonymous sign-ins BẬT trong Supabase project (Auth settings).

interface BirthData {
  day: string;
  month: string;
  year: string;
  gender: 'male' | 'female';
  hour: string;
  minute: string;
}

async function installAnonymousLikeSession(page: Page): Promise<void> {
  // Supabase Cloud rate-limit anonymous sign-in trong full suite. Dùng JWT thật của user test,
  // nhưng ghi user object phía browser như anonymous để kiểm tra UI/flow "không đăng nhập email"
  // ổn định; API vẫn xác thực bằng access_token thật.
  const session = await getCachedSession(getTestUserForWorker(resolveWorkerIndex()));
  const anonymousLikeSession: Session = {
    ...session,
    user: {
      ...session.user,
      email: undefined,
      phone: undefined,
      is_anonymous: true,
      app_metadata: { ...session.user.app_metadata, provider: 'anonymous' },
    },
  };
  await installSession(page, anonymousLikeSession);
}

async function createZiweiChart(page: Page, birth: BirthData): Promise<string> {
  await page.locator('#birth-day').selectOption(birth.day);
  await page.locator('#birth-month').selectOption(birth.month);
  await page.locator('#birth-year').selectOption(birth.year);
  await page.locator('#birth-gender').selectOption(birth.gender);
  await page.locator('#birth-hour').fill(birth.hour);
  await page.locator('#birth-minute').fill(birth.minute);

  await page.locator('#birth-day').locator('xpath=ancestor::form').getByRole('button', { name: 'Lập lá số', exact: true }).click();

  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  const match = page.url().match(/\/charts\/([0-9a-f-]{36})/i);
  expect(match, 'URL phải chứa chartId dạng uuid').not.toBeNull();
  return match![1];
}

test('US-009: khách chưa login không bị đá ra → lập + xem lá số ẩn danh → CTA đăng nhập hiện', async ({
  page,
}) => {
  await installAnonymousLikeSession(page);

  // ---- Mở app chưa đăng nhập → KHÔNG redirect /sign-in ----
  await page.goto('/');

  // Dashboard hiện ra (không bị đẩy về /sign-in). Mốc: tiêu đề + ô #birth-day.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Một không gian xem lá số tinh gọn' })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator('#birth-day')).toBeVisible();

  // ---- Header: phiên ẩn danh thấy CTA đăng nhập thay cho email + nút đăng xuất ----
  await expect(page.getByRole('link', { name: 'Đăng nhập / Đăng ký' })).toBeVisible();
  await expect(page.getByText('Bạn đang xem ẩn danh')).toBeVisible();

  // ---- Lập + xem lá số dưới phiên ẩn danh ----
  await createZiweiChart(page, {
    day: '15',
    month: '8',
    year: '1990',
    hour: '10',
    minute: '30',
    gender: 'male',
  });

  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({
    timeout: 30_000,
  });
});
