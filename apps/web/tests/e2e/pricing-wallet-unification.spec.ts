import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

test('unification: /pricing displays 4 packages and routes seamlessly to /wallet', async ({ page }) => {
  await signInViaUi(page);

  // 1. Visit /pricing
  await page.goto('/pricing');
  await expect(page).toHaveURL(/\/pricing$/);

  // Check header & mini wallet bar
  await expect(page.getByRole('heading', { name: 'Bảng Giá Dịch Vụ & Gói Nạp XU' })).toBeVisible();
  await expect(page.getByText('Ví XU hiện tại')).toBeVisible();

  // Check 4 packages are visible
  await expect(page.getByText('Gói Cơ Bản')).toBeVisible();
  await expect(page.getByText('Gói Phổ Biến')).toBeVisible();
  await expect(page.getByText('Gói Nâng Cao')).toBeVisible();
  await expect(page.getByText('Gói VIP Thưởng Lớn')).toBeVisible();

  // Check feature matrix is visible
  await expect(page.getByText('Bảng Phí Khai Mở Các Hệ Thuật Số')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Luận giải AI Chuyên sâu' })).toBeVisible();

  // Capture light mode screenshot
  await page.screenshot({ path: 'test-results/pricing-light.png', fullPage: true });

  // Switch to dark mode and capture screenshot
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/pricing-dark.png', fullPage: true });

  // Switch back to light mode for rest of test
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.waitForTimeout(400);

  // 2. Click "Nạp Gói Này" for Gói Nâng Cao (120 XU)
  const pkgCard = page.locator('.package-card', { hasText: 'Gói Nâng Cao' });
  await pkgCard.getByRole('button', { name: 'Nạp Gói Này' }).click();

  // Should navigate to /wallet?package=120
  await page.waitForURL(/\/wallet\?package=120$/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Ví XU & Điểm Danh' })).toBeVisible();

  // Verify the 120 XU package is selected on /wallet
  const selectedWalletCard = page.locator('.package-card.selected');
  await expect(selectedWalletCard).toContainText('120');
  await expect(selectedWalletCard).toContainText('Gói Nâng Cao');
});
