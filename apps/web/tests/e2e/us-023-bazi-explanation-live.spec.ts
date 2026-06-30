import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { signInViaUi } from './sign-in';

// US-023 (backlog #23, @live): bằng chứng LLM thật cho prompt Bát Tự nâng cấp (dụng thần / cách cục /
// điều hậu / thần sát). Trước batch này KHÔNG có spec @live nào chạm hệ Bát Tự — prompt enrichment chỉ
// có unit test prompt-builder. Spec này tạo lá số Bát Tự thật rồi bấm "Tạo luận giải tổng quan" KHÔNG
// intercept → narrative do provider AI thật sinh từ prompt mới, khẳng định có nội dung và 0 chữ Hán.
//
// TAG @live: đốt token LLM mỗi lần chạy nên chỉ chạy khi yêu cầu (pnpm e2e:live), KHÔNG nằm trong bộ
// default. Bản default (stub /explanations) cho Bát Tự ở us-007-other-systems-history.spec.ts.

const SHOT_DIR = 'test-results/explanation-history-live';

const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
}

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

// Dữ liệu sinh RIÊNG cho spec live này (KHÁC us-007 default 15/8/1990 và các spec khác) để lá số không
// dedupe trùng snapshot trên user test dùng chung — tránh nút đổi sang "Tạo lại luận giải" do đã hydrate.
async function createBaziChart(page: Page): Promise<string> {
  await page.goto('/bazi');
  await expect(page.locator('#birth-day')).toBeVisible();
  await page.locator('#birth-day').selectOption('3');
  await page.locator('#birth-month').selectOption('2');
  await page.locator('#birth-year').selectOption('1988');
  await page.locator('#birth-hour').fill('22');
  await page.locator('#birth-minute').fill('45');
  await page.locator('#birth-day').locator('xpath=ancestor::form').getByRole('button', { name: 'Lập lá số', exact: true }).click();
  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  const match = page.url().match(/\/charts\/([0-9a-f-]{36})/i);
  expect(match, 'URL phải chứa chartId dạng uuid').not.toBeNull();
  return match![1];
}

test('US-023 LIVE @live: Bát Tự luận giải tổng quan thật từ prompt nâng cấp, 0 chữ Hán', async ({ page }) => {
  test.setTimeout(120_000);
  await signInViaUi(page);

  await createBaziChart(page);

  // Hệ Bát Tự render thẻ tóm tắt (không bàn 12 cung); khối luận giải có nút tổng quan (chưa chọn cung).
  await expect(page.getByRole('heading', { name: 'Luận giải AI' })).toBeVisible({ timeout: 30_000 });

  // Bấm tạo luận giải bằng LLM thật. Nhãn là "Tạo luận giải tổng quan" lần đầu (chưa có kết quả).
  await page
    .getByRole('button', { name: /^(Tạo luận giải tổng quan|Tạo lại luận giải)$/ })
    .click();

  // Kết quả LLM thật về (timeout rộng cho provider mạng). 0 chữ Hán (bất biến ngôn ngữ).
  const result = page.locator('article.result');
  await expect(result).toBeVisible({ timeout: 90_000 });
  const resultText = (await result.innerText()).trim();
  expect(resultText.length, 'Luận giải Bát Tự thật phải có nội dung').toBeGreaterThan(0);
  expect(CJK_TEXT_PATTERN.test(resultText), 'Luận giải Bát Tự không được rò chữ Hán').toBe(false);
  await shot(page, '01-bazi-explanation-generated');
});
