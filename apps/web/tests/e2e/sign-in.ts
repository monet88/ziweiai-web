import { expect, type Page } from '@playwright/test';
import { getTestUserForWorker, resolveWorkerIndex } from './test-user';

// Đăng nhập qua form sign-in thật (UI flow) rồi chờ điều hướng về dashboard (route '/').
// Selector bám nhãn tiếng Việt + type input (form sign-in/+page.svelte): KHÔNG dùng class
// CSS (dễ vỡ). Sau signIn, +layout (app) guard cho qua khi isAuthenticated.
export async function signInViaUi(page: Page): Promise<void> {
  await page.goto('/sign-in');

  // Mỗi worker dùng email riêng (backlog #21): đọc index từ env Playwright bơm vào worker hiện
  // tại; ngoài Playwright (không có index) → quay về user dùng chung. signInViaUi chạy TRONG
  // worker nên resolveWorkerIndex() ở đây mới thấy đúng giá trị (globalSetup không thấy).
  const user = getTestUserForWorker(resolveWorkerIndex());
  await page.getByPlaceholder('ban@vidu.com').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();

  // Dashboard hiển thị BirthForm (ô #birth-day) — mốc xác nhận đã vào (app). Dùng id field
  // thay vì nút "Lập lá số" vì khi lịch sử rỗng, EmptyStateCard sidebar cũng render nút trùng
  // nhãn (strict mode bắt 2 phần tử).
  await expect(page.locator('#birth-day')).toBeVisible();
}
