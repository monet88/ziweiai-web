import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { signInViaUi } from './sign-in';

// US-016 LIVE (@live): báo cáo năm gọi LLM thật (tổng hợp lưu niên + 12 lưu nguyệt → Markdown).
//
// Khác us-016-ziwei-fortune.spec.ts (chấp nhận nhánh paywall vì cờ AI_ANNUAL_REPORT_ENABLED mặc
// định tắt): spec này CHỈ chạy trong phiên @live, nơi playwright.config bật cờ AI_ANNUAL_REPORT_ENABLED
// cho api. Nhờ vậy nút "Tạo báo cáo năm" sinh báo cáo THẬT → modal Markdown hiện (không rơi paywall).
// Báo cáo năm persist vào bảng annual_reports (cache theo chart+year) — bằng chứng lưu phần luận giải AI.
//
// Phụ thuộc mạng + LLM thật (sinh ~600-1200 từ) nên timeout rộng (decision 0014: tới 60s ở backend).
// Chụp screenshot mốc vào test-results/annual-report-live/. TAG @live: đốt token, chỉ chạy `pnpm e2e:live`.

const SHOT_DIR = 'test-results/annual-report-live';

const CJK_TEXT_PATTERN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
}

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

async function createZiweiChart(page: Page): Promise<string> {
  await page.locator('#birth-day').selectOption('15');
  await page.locator('#birth-month').selectOption('8');
  await page.locator('#birth-year').selectOption('1990');
  await page.locator('#birth-gender').selectOption('male');
  await page.locator('#birth-hour').fill('10');
  await page.locator('#birth-minute').fill('30');
  await page.locator('#birth-day').locator('xpath=ancestor::form').getByRole('button', { name: 'Lập lá số', exact: true }).click();
  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  const match = page.url().match(/\/charts\/([0-9a-f-]{36})/i);
  expect(match, 'URL phải chứa chartId dạng uuid').not.toBeNull();
  return match![1];
}

test('US-016 LIVE @live: tạo báo cáo năm thật → modal Markdown sinh từ LLM (không paywall)', async ({ page }) => {
  test.setTimeout(150_000);
  await signInViaUi(page);

  await createZiweiChart(page);
  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({ timeout: 30_000 });

  // Section Vận hạn + nút báo cáo năm.
  await expect(page.getByRole('region', { name: 'Vận hạn' })).toBeVisible({ timeout: 15_000 });
  const annualButton = page.getByRole('button', { name: 'Tạo báo cáo năm' });
  await expect(annualButton).toBeVisible();
  await annualButton.click();

  // Phiên @live bật cờ AI_ANNUAL_REPORT_ENABLED → PHẢI ra modal báo cáo (không phải paywall). Nếu rơi
  // paywall nghĩa là cờ chưa bật đúng → fail (đúng, để lộ lỗi cấu hình live thay vì pass giả).
  const paywallCta = page.getByRole('button', { name: 'Nâng cấp để tạo báo cáo năm' });
  await expect(paywallCta, 'Phiên @live phải sinh báo cáo thật, KHÔNG rơi nhánh paywall').toHaveCount(0);

  const modal = page.getByRole('dialog', { name: /Báo cáo năm/ });
  await expect(modal).toBeVisible({ timeout: 90_000 });

  // Nội dung báo cáo có chữ + 0 ký tự Hán (bất biến ngôn ngữ).
  const modalText = (await modal.innerText()).trim();
  expect(modalText.length, 'Báo cáo năm thật phải có nội dung').toBeGreaterThan(50);
  expect(CJK_TEXT_PATTERN.test(modalText), 'Báo cáo năm không được rò chữ Hán').toBe(false);
  await shot(page, '01-annual-report-modal');
});
