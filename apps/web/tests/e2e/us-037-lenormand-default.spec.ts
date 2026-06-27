import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';
import { stubLenormand } from './_ai-stubs';

// US-037 (default): luồng Rút Lenormand qua UI với STUB /draws/lenormand (deterministic, KHÔNG đốt
// token LLM). Khẳng định route /lenormand dựng đúng, đặt câu hỏi + chọn trải bài → render đúng số lá
// theo bố cục + bài đọc, và 0 ký tự Hán. Bản LIVE gọi provider thật ở us-037-lenormand-live.spec.ts.

const HAN_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

test('US-037: rút Lenormand ba lá (stub) → render 3 lá + bài đọc, 0 chữ Hán', async ({ page }) => {
  await signInViaUi(page);
  await stubLenormand(page);

  await page.goto('/lenormand');
  await expect(page.getByRole('heading', { name: 'Rút bài Lenormand' })).toBeVisible();

  await page.locator('#lenormand-question').fill('Mối quan hệ này nên đi tiếp theo hướng nào?');
  // Trải bài ba lá: chọn qua value (ổn định hơn nhãn dịch).
  await page.locator('button[value="three"]').click();

  // Chặn + khẳng định payload request: UI phải gửi đúng câu hỏi + spread đã chọn (không chỉ tin kết quả).
  const requestPromise = page.waitForRequest(
    (req) => req.url().includes('/draws/lenormand') && req.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Rút bài', exact: true }).click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toEqual({
    question: 'Mối quan hệ này nên đi tiếp theo hướng nào?',
    spread: 'three',
  });

  // Kết quả: đúng 3 lá (mỗi lá một .card) + bài đọc.
  await expect(page.locator('.card-list .card')).toHaveCount(3, { timeout: 15_000 });

  // Bất biến ngôn ngữ: vùng kết quả (tên lá + bài đọc Markdown) không được chứa ký tự Hán.
  const resultText = await page.getByRole('main').innerText();
  expect(HAN_TEXT_PATTERN.test(resultText), 'kết quả Lenormand không được chứa chữ Hán').toBe(false);
});

test('US-037: trải bài Cửu cung (stub) → rút 9 lá', async ({ page }) => {
  await signInViaUi(page);
  await stubLenormand(page);

  await page.goto('/lenormand');
  await page.locator('#lenormand-question').fill('Bức tranh toàn cảnh tình hình hiện tại của tôi ra sao?');
  await page.locator('button[value="nine"]').click();

  const requestPromise = page.waitForRequest(
    (req) => req.url().includes('/draws/lenormand') && req.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Rút bài', exact: true }).click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toEqual({
    question: 'Bức tranh toàn cảnh tình hình hiện tại của tôi ra sao?',
    spread: 'nine',
  });

  await expect(page.locator('.card-list .card')).toHaveCount(9, { timeout: 15_000 });
});
