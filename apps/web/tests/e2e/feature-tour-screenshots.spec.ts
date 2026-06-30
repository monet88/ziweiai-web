import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// Tour chụp ảnh kết quả các tính năng đã có (US-005/006/015/016/017b/017c) trên UI HIỆN TẠI,
// để review một loạt. Drive đúng BirthForm sau US-005 #22 (ngày/tháng/năm là <select>, toạ độ
// mặc định VN ẩn). Mỗi bước chụp full-page vào test-results/feature-tour/.
// KHÔNG phải test pass/fail nghiêm ngặt — mục tiêu là ảnh kết quả; vẫn assert mốc chính để
// ảnh chụp đúng màn (không chụp trang loading/trắng).

const SHOT_DIR = 'test-results/feature-tour';

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
}

// Lập lá số Tử Vi từ dashboard (gender + biết giờ để lá số KHÔNG bị blocked), trả về URL chi tiết.
async function createZiweiChart(page: Page): Promise<void> {
  await page.locator('#dashboard-chart-system').selectOption('zi-wei-dou-shu');
  await page.locator('#birth-day').selectOption('15');
  await page.locator('#birth-month').selectOption('6');
  await page.locator('#birth-year').selectOption('1990');
  await page.locator('#birth-gender').selectOption('female');
  await page.locator('#birth-hour').fill('12');
  await page.locator('#birth-minute').fill('30');
  await page.locator('form:has(#birth-day)').getByRole('button', { name: 'Lập lá số', exact: true }).click();
  await page.waitForURL(/\/charts\/[0-9a-f-]{36}(?:[/?#]|$)/i, { timeout: 30_000 });
}

test('tour: dashboard + birth form', async ({ page }) => {
  await signInViaUi(page);
  await expect(page.locator('#birth-day')).toBeVisible();
  await shot(page, '01-dashboard');
});

test('tour: chi tiết lá số Tử Vi (bàn 12 cung + vận hạn)', async ({ page }) => {
  await signInViaUi(page);
  await createZiweiChart(page);

  // Chờ bàn 12 cung hiển thị (mốc rời trạng thái tải).
  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({ timeout: 30_000 });
  await shot(page, '02-ziwei-chart-detail');

  // Chọn 1 cung để lộ vùng chi tiết cung + nút luận giải.
  const board = page.getByRole('group', { name: 'Bàn 12 cung' });
  await board.getByRole('button').first().click();
  await shot(page, '03-ziwei-palace-selected');
});

test('tour: lịch sử lá số', async ({ page }) => {
  await signInViaUi(page);
  await createZiweiChart(page);
  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Quay về trang chính', exact: true }).click();
  await page.waitForURL(/\/$/, { timeout: 15_000 });
  await page
    .getByRole('navigation', { name: 'Hệ thuật số khác' })
    .getByRole('link', { name: 'Xem toàn bộ lịch sử', exact: true })
    .click();
  await page.waitForURL(/\/history$/, { timeout: 15_000 });
  await expect(page.locator('a[href^="/charts/"]').first()).toBeVisible({ timeout: 15_000 });
  await shot(page, '04-history');
});

test('tour: MBTI kết quả (US-017b)', async ({ page }) => {
  await signInViaUi(page);
  await page.goto('/mbti');
  await expect(page.getByRole('heading', { name: 'Trắc nghiệm tính cách MBTI' })).toBeVisible();
  await shot(page, '05-mbti-start');

  const neutral = page.getByRole('button', { name: 'Trung lập', exact: true });
  const nextButton = page.getByRole('button', { name: 'Câu tiếp theo', exact: true });
  const submitButton = page.getByRole('button', { name: 'Xem kết quả', exact: true });
  for (let step = 0; step < 200; step += 1) {
    await neutral.click();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      break;
    }
    await nextButton.click();
  }
  await expect(page.getByText('Kiểu tính cách của bạn', { exact: true })).toBeVisible({ timeout: 15_000 });
  await shot(page, '06-mbti-result');
});

test('tour: Hợp Hôn kết quả (US-017c)', async ({ page }) => {
  await signInViaUi(page);
  await page.goto('/hepan');
  await expect(page.getByRole('heading', { name: 'Ghép đôi Hợp Hôn' })).toBeVisible();
  await shot(page, '07-hepan-form');

  for (const prefix of ['hepan-primary', 'hepan-partner']) {
    await page.locator(`#${prefix}-birth-day`).selectOption('15');
    await page.locator(`#${prefix}-birth-month`).selectOption('6');
    await page.locator(`#${prefix}-birth-year`).selectOption('1990');
    await page.locator(`#${prefix}-birth-gender`).selectOption('female');
    await page.locator(`#${prefix}-birth-hour`).fill('12');
    await page.locator(`#${prefix}-birth-minute`).fill('0');
  }
  await page.getByRole('button', { name: 'Xem mức tương hợp', exact: true }).click();
  await expect(page.getByText('Mức tương hợp tổng quan', { exact: true })).toBeVisible({ timeout: 20_000 });
  await shot(page, '08-hepan-result');
});
