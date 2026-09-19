import { test, expect } from '@playwright/test';

test.describe('Anti-Cheat Disposable Email Blocklist & Referral Transparency', () => {
  test('chặn đăng ký tài khoản với domain email tạm thời / rác trên /sign-in', async ({ page }) => {
    await page.goto('/sign-in');

    // Chuyển sang chế độ Đăng ký bằng nút switch
    await page.locator('button.switch').click();

    // Điền email rác tạm thời
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('spammer123@tempmail.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('SecurePassword123!');

    // Bấm Đăng ký
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Xác nhận hiển thị thông báo lỗi từ chối email tạm thời
    const errorNotice = page.locator('text=Hệ thống không chấp nhận email tạm thời');
    await expect(errorNotice).toBeVisible();
  });

  test('trang /wallet hiển thị widget giới thiệu với 2 thẻ KPI', async ({ page }) => {
    await page.goto('/wallet');

    // Kiểm tra các phần tử thống kê bạn bè và XU
    const friendsKpi = page.locator('text=Bạn bè đã mời');
    const xuKpi = page.locator('text=Tổng XU nhận được');

    await expect(friendsKpi).toBeVisible();
    await expect(xuKpi).toBeVisible();
  });
});
