import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// Smoke (đóng backlog #5): chứng minh hạ tầng E2E chạy được — api + web preview lên,
// user test đăng nhập, guard (app) cho vào dashboard. Không chạm luận giải AI ở đây.
test('đăng nhập rồi vào được dashboard (app)', async ({ page }) => {
  await signInViaUi(page);

  // Đã ở route gốc (app) sau khi signIn điều hướng.
  await expect(page).toHaveURL(/\/$/);
  // Tiêu đề dashboard tiếng Việt hiện ra.
  await expect(page.getByRole('heading', { name: 'Tạo lá số của bạn' })).toBeVisible();
});
