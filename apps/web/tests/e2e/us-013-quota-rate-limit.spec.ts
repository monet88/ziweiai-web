import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-013: hạn ngạch (quota) lưu qua Redis/Upstash — E2E test phía UI.
// Khi backend trả 429 (TOO_MANY_REQUESTS) cho tạo lá số hoặc luận giải, UI phải
// hiển thị thông báo lỗi hợp lý (NoticeBanner tone=danger hoặc message gốc backend).
//
// Dùng route intercept: giả lập 429 trên POST /charts và POST /explanations.
// Cơ chế quota backend (Redis/in-memory) đã phủ bởi unit/integration test.

interface BirthData {
  day: string;
  month: string;
  year: string;
  gender: 'male' | 'female';
  hour: string;
  minute: string;
}

async function fillBirthForm(page: Page, birth: BirthData): Promise<void> {
  await page.locator('#birth-day').selectOption(birth.day);
  await page.locator('#birth-month').selectOption(birth.month);
  await page.locator('#birth-year').selectOption(birth.year);
  await page.locator('#birth-gender').selectOption(birth.gender);
  await page.locator('#birth-hour').fill(birth.hour);
  await page.locator('#birth-minute').fill(birth.minute);
}

test('US-013: POST /charts bị 429 → hiện thông báo lỗi quota', async ({ page }) => {
  await signInViaUi(page);

  // Intercept POST /charts → 429
  await page.route('**/charts', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Bạn đã vượt hạn ngạch tạo lá số trong ngày. Vui lòng thử lại sau.',
        }),
      });
    } else {
      await route.continue();
    }
  });

  await fillBirthForm(page, {
    day: '15',
    month: '8',
    year: '1990',
    hour: '10',
    minute: '30',
    gender: 'male',
  });

  await page.locator('#birth-day').locator('xpath=ancestor::form').getByRole('button', { name: 'Lập lá số', exact: true }).click();

  // UI phải hiển thị thông báo lỗi. BirthForm render lỗi quota qua NoticeBanner tone="danger",
  // tức role="alert" — bám đúng vai trò thay vì quét class chung chung (dễ khớp nhầm phần tử).
  const errorBanner = page.getByRole('alert');
  await expect(errorBanner.first()).toBeVisible({ timeout: 15_000 });

  // Kiểm nội dung chứa thông tin quota
  const pageText = await page.getByRole('main').innerText();
  expect(
    pageText.includes('hạn ngạch') || pageText.includes('vượt') || pageText.includes('thất bại') || pageText.includes('Yêu cầu thất bại'),
    'Phải hiện thông báo lỗi liên quan tới quota',
  ).toBe(true);

  await page.screenshot({ path: 'test-results/us-013-chart-quota-exceeded.png', fullPage: true });
});

test('US-013: POST /explanations bị 429 → hiện thông báo lỗi trên trang chi tiết', async ({ page }) => {
  await signInViaUi(page);

  // Tạo lá số thật (không chặn /charts ở test này)
  await fillBirthForm(page, {
    day: '3',
    month: '2',
    year: '1985',
    hour: '14',
    minute: '45',
    gender: 'female',
  });

  await page.locator('#birth-day').locator('xpath=ancestor::form').getByRole('button', { name: 'Lập lá số', exact: true }).click();
  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({
    timeout: 30_000,
  });

  // Intercept POST /explanations → 429
  await page.route('**/explanations', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Bạn đã vượt hạn ngạch luận giải AI trong ngày.',
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Chọn cung + luận giải
  const board = page.getByRole('group', { name: 'Bàn 12 cung' });
  await board.getByRole('button').first().click();
  await page.getByRole('button', { name: 'Luận giải cung này', exact: true }).click();

  // Chờ NoticeBanner danger xuất hiện (role="alert" cho tone="danger")
  const errorBanner = page.getByRole('alert');
  await expect(errorBanner.first()).toBeVisible({ timeout: 15_000 });

  await page.screenshot({ path: 'test-results/us-013-explanation-quota-exceeded.png', fullPage: true });
});
