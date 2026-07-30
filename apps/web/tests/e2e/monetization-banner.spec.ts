import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

test.describe('Monetization Banner', () => {
  test('Hiển thị banner khi số dư dưới 15 XU ở trang Lịch sử', async ({ page }) => {
    // 1. Mock API trả về số dư = 10 (nhỏ hơn 15)
    await page.route('**/rest/v1/profiles?select=xu_balance%2Clast_checkin_date%2Creferral_code*', async route => {
      const json = {
        xu_balance: 10,
        last_checkin_date: '2026-07-29',
        referral_code: 'TESTCODE'
      };
      await route.fulfill({ json });
    });

    // 2. Đăng nhập và đi tới trang Lịch sử
    await signInViaUi(page);
    await page.goto('/history');

    // 3. Kiểm tra banner xuất hiện
    const banner = page.locator('.monetization-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Số dư XU sắp hết!');
    await expect(banner).toContainText('Bạn chỉ còn 10 XU');

    // 4. Bấm nút Nạp XU và kiểm tra chuyển hướng
    await banner.getByRole('button', { name: 'Nạp XU' }).click();
    await expect(page).toHaveURL(/\/wallet$/);
  });

  test('KHÔNG hiển thị banner khi số dư từ 15 XU trở lên', async ({ page }) => {
    // 1. Mock API trả về số dư = 20
    await page.route('**/rest/v1/profiles?select=xu_balance%2Clast_checkin_date%2Creferral_code*', async route => {
      const json = {
        xu_balance: 20,
        last_checkin_date: '2026-07-29',
        referral_code: 'TESTCODE'
      };
      await route.fulfill({ json });
    });

    // 2. Đăng nhập và đi tới trang Lịch sử
    await signInViaUi(page);
    await page.goto('/history');

    // 3. Kiểm tra banner KHÔNG xuất hiện
    const banner = page.locator('.monetization-banner');
    await expect(banner).not.toBeVisible();
  });
});
