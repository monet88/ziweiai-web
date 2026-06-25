import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-010: giới hạn / gating lượt luận giải AI — E2E test phía UI.
// Khi backend trả 402 (PAYMENT_REQUIRED), UI phải:
//   1. Hiển thị nút CTA "Nâng cấp để dùng luận giải AI" thay vì nút "Luận giải cung này".
//   2. Hiển thị gợi ý premium.
//   3. Click CTA → điều hướng đến /pricing.
//   4. Trang /pricing hiển thị thông tin "Sắp ra mắt".
//
// Dùng route intercept để giả lập 402 (không phụ thuộc quota backend thật).
// Gate phía server đã phủ unit/integration test ở apps/api.

interface BirthData {
  day: string;
  month: string;
  year: string;
  gender: 'male' | 'female';
  hour: string;
  minute: string;
}

async function createZiweiChart(page: Page, birth: BirthData): Promise<string> {
  await page.locator('#birth-day').selectOption(birth.day);
  await page.locator('#birth-month').selectOption(birth.month);
  await page.locator('#birth-year').selectOption(birth.year);
  await page.locator('#birth-gender').selectOption(birth.gender);
  await page.locator('#birth-hour').fill(birth.hour);
  await page.locator('#birth-minute').fill(birth.minute);

  await page.getByRole('main').getByRole('button', { name: 'Lập lá số', exact: true }).click();

  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  const match = page.url().match(/\/charts\/([0-9a-f-]{36})/i);
  expect(match, 'URL phải chứa chartId dạng uuid').not.toBeNull();
  return match![1];
}

test('US-010: 402 → hiện CTA paywall + gợi ý premium + điều hướng /pricing', async ({ page }) => {
  await signInViaUi(page);

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

  // Intercept POST /explanations → 402 PAYMENT_REQUIRED
  await page.route('**/explanations', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'PAYMENT_REQUIRED',
          message: 'Bạn đã hết lượt luận giải miễn phí. Vui lòng nâng cấp.',
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Chọn cung đầu tiên
  const board = page.getByRole('group', { name: 'Bàn 12 cung' });
  await expect(board).toBeVisible();
  await board.getByRole('button').first().click();

  // Bấm luận giải cung → mutation sẽ nhận 402
  await page.getByRole('button', { name: 'Luận giải cung này', exact: true }).click();

  // (1) CTA paywall hiện
  const premiumCta = page.getByRole('button', { name: 'Nâng cấp để dùng luận giải AI', exact: true });
  await expect(premiumCta).toBeVisible({ timeout: 15_000 });

  // (2) Gợi ý premium hiện
  await expect(page.getByText('Tính năng này yêu cầu gói trả phí')).toBeVisible();

  // Screenshot trước khi chuyển trang
  await page.screenshot({ path: 'test-results/us-010-paywall-cta.png', fullPage: true });

  // (3) Click CTA → /pricing
  await premiumCta.click();
  await page.waitForURL(/\/pricing$/, { timeout: 15_000 });

  // (4) Trang pricing hiển thị thông tin
  await expect(page.getByText('Sắp ra mắt', { exact: true })).toBeVisible();
  await expect(page.getByText('Nâng cấp luận giải AI')).toBeVisible();

  await page.screenshot({ path: 'test-results/us-010-pricing-page.png', fullPage: true });
});
