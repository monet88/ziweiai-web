import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-039 (@live): luồng Xin xăm end-to-end qua UI, KHÔNG intercept — thực sự gọi POST /draws/stick
// (cờ EXTENDED_SYSTEM_STICKS_ENABLED bật ở webServer env) → luận giải do provider AI thật sinh. Đốt
// token LLM nên gắn @live (chỉ chạy khi pnpm e2e:live). Bản default stub ở us-039-stick-default.spec.ts.
// Khẳng định: đặt câu hỏi → rút quẻ + render bài luận, 0 chữ Hán.

const HAN_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

test('US-039 @live: xin quẻ qua UI → rút quẻ + render luận giải, 0 chữ Hán', async ({ page }) => {
  test.setTimeout(90_000);
  await signInViaUi(page);

  await page.goto('/stick');
  await expect(page.getByRole('heading', { name: 'Xin quẻ xăm' })).toBeVisible();

  await page.locator('#stick-question').fill('Công việc sắp tới của tôi có thuận lợi không?');
  await page.getByRole('button', { name: 'Xin quẻ', exact: true }).click();

  // Kết quả LLM thật: thẻ quẻ ("Quẻ xăm của bạn") hiện (timeout rộng cho provider mạng).
  await expect(page.getByText('Quẻ xăm của bạn', { exact: true })).toBeVisible({ timeout: 60_000 });

  const resultText = await page.getByRole('main').innerText();
  expect(HAN_TEXT_PATTERN.test(resultText), 'kết quả Xin xăm không được chứa chữ Hán').toBe(false);
});
