import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';
import { stubStick } from './_ai-stubs';

// US-039 (default): luồng Xin xăm qua UI với STUB /draws/stick (deterministic, KHÔNG đốt token LLM).
// Khẳng định route /stick dựng đúng, đặt câu hỏi → render thẻ quẻ (số + tên + mức) + bài luận, và 0
// ký tự Hán. Bản LIVE gọi provider thật ở us-039-stick-live.spec.ts.

const HAN_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

test('US-039: xin xăm (stub) → render thẻ quẻ + luận giải, 0 chữ Hán', async ({ page }) => {
  await signInViaUi(page);
  await stubStick(page);

  await page.goto('/stick');
  await expect(page.getByRole('heading', { name: 'Xin quẻ xăm' })).toBeVisible();

  await page.locator('#stick-question').fill('Công việc sắp tới của tôi có thuận lợi không?');

  // Chặn + khẳng định payload request: UI phải gửi đúng câu hỏi (không chỉ tin kết quả).
  const requestPromise = page.waitForRequest(
    (req) => req.url().includes('/draws/stick') && req.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Xin quẻ', exact: true }).click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toEqual({
    question: 'Công việc sắp tới của tôi có thuận lợi không?',
  });

  // Kết quả: thẻ quẻ (tiêu đề kết quả + tên quẻ stub).
  await expect(page.getByText('Quẻ xăm của bạn', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.stick-title')).toHaveText('Quẻ mẫu kiểm thử');

  // Bất biến ngôn ngữ: vùng kết quả không được chứa ký tự Hán.
  const resultText = await page.getByRole('main').innerText();
  expect(HAN_TEXT_PATTERN.test(resultText), 'kết quả Xin xăm không được chứa chữ Hán').toBe(false);
});
