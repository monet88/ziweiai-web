import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-037 (@live): luồng Rút Lenormand end-to-end qua UI, KHÔNG intercept — thực sự gọi POST
// /draws/lenormand (cờ EXTENDED_SYSTEM_LENORMAND_ENABLED bật ở webServer env) → bài đọc do provider
// AI thật sinh. Đốt token LLM mỗi lần chạy nên gắn @live: chỉ chạy khi yêu cầu (pnpm e2e:live),
// KHÔNG nằm trong bộ default. Bản default deterministic (stub /draws/lenormand) ở
// us-037-lenormand-default.spec.ts. Khẳng định: route dựng đúng, rút bài ba lá → render đúng 3 lá +
// bài đọc, và toàn bộ kết quả không lọt ký tự Hán.

const HAN_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

test('US-037 @live: rút Lenormand ba lá qua UI → render 3 lá + bài đọc, 0 chữ Hán', async ({ page }) => {
  test.setTimeout(90_000);
  await signInViaUi(page);

  await page.goto('/lenormand');
  await expect(page.getByRole('heading', { name: 'Rút bài Lenormand' })).toBeVisible();

  await page.locator('#lenormand-question').fill('Mối quan hệ công việc này nên đi tiếp theo hướng nào?');
  // Ba lá là mặc định; chọn tường minh qua value (ổn định hơn nhãn dịch).
  await page.locator('button[value="three"]').click();
  await page.getByRole('button', { name: 'Rút bài', exact: true }).click();

  // Kết quả LLM thật (timeout rộng cho provider mạng) + đúng 3 lá three-card.
  await expect(page.getByText('Kết quả rút bài', { exact: false })).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.card-list .card')).toHaveCount(3);

  // Toàn vùng kết quả (tên lá + bài đọc Markdown do LLM sinh) không được chứa ký tự Hán.
  const resultText = await page.getByRole('main').innerText();
  expect(HAN_TEXT_PATTERN.test(resultText), 'kết quả Lenormand không được chứa chữ Hán').toBe(false);
});
