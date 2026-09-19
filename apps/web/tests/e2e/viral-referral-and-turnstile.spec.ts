import { test, expect } from '@playwright/test';

test.describe('Sprint 41 Phase 6: Viral Referral Card & Turnstile Protection', () => {
  test('renders viral referral card button and opens celestial luxury modal in /wallet', async ({ page }) => {
    // Mở trang ví XU
    await page.goto('/wallet');
    await page.waitForLoadState('domcontentloaded');

    // Chờ section tiếp thị liên kết xuất hiện
    const referralSection = page.locator('.referral-section');
    await expect(referralSection).toBeVisible();

    // Kiểm tra sự hiện diện của nút "Tạo Thiệp Mời Celestial Luxury"
    const openCardBtn = page.locator('.btn-open-viral-card');
    await expect(openCardBtn).toBeVisible();
    await expect(openCardBtn).toContainText('Tạo Thiệp Mời Celestial Luxury');

    // Click mở Modal Thiệp Mời
    await openCardBtn.click();

    // Modal hiển thị với đầy đủ thành phần
    const modalDialog = page.locator('[role="dialog"][aria-labelledby="viral-modal-title"]');
    await expect(modalDialog).toBeVisible();
    await expect(modalDialog).toContainText('Thiệp Mời Thượng Khách ViOS');
    await expect(modalDialog).toContainText('Celestial Luxury');

    // Kiểm tra Canvas thiệp mời
    const canvas = page.locator('.viral-card-canvas');
    await expect(canvas).toBeVisible();

    // Kiểm tra các nút hành động (Tải ảnh, Sao chép, Chia sẻ)
    await expect(page.locator('button:has-text("Tải Thiệp Ảnh (.PNG)")')).toBeVisible();
    await expect(page.locator('button:has-text("Sao Chép Ảnh")')).toBeVisible();
    await expect(page.locator('button:has-text("Chia Sẻ 1 Chạm")')).toBeVisible();

    // Kiểm tra social buttons
    await expect(page.locator('.social-btn.zalo')).toBeVisible();
    await expect(page.locator('.social-btn.fb')).toBeVisible();
    await expect(page.locator('.social-btn.tele')).toBeVisible();

    // Đóng modal thiệp mời
    const closeBtn = page.locator('.close-btn[aria-label="Đóng thiệp mời"]');
    await closeBtn.click();
    await expect(modalDialog).not.toBeVisible();
  });

  test('sign-in page includes invisible Turnstile bot protection container', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');

    // Chuyển sang tab Đăng Ký
    const switchBtn = page.locator('button.switch');
    await switchBtn.click();

    // Xác nhận tiêu đề Đăng ký (Tạo tài khoản)
    await expect(page.locator('h1.title')).toContainText('Tạo tài khoản');

    // Kiểm tra Turnstile invisible container hiện diện ngầm trong form
    const turnstileContainer = page.locator('.turnstile-invisible-container');
    await expect(turnstileContainer).toBeAttached();
  });
});
