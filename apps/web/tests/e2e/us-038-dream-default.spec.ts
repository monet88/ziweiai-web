import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';
import { stubDream } from './_ai-stubs';

// US-038 (default): luồng Giải mộng qua UI với STUB /dreams/interpret (deterministic, KHÔNG đốt token
// LLM). Khẳng định route /dream dựng đúng, mô tả giấc mơ → render biểu tượng nhận diện + bài giải, và
// 0 ký tự Hán. Bản LIVE gọi provider thật ở us-038-dream-live.spec.ts.

const HAN_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

test('US-038: giải mộng (stub) → render biểu tượng + bài giải, 0 chữ Hán', async ({ page }) => {
  await signInViaUi(page);
  await stubDream(page);

  await page.goto('/dream');
  await expect(page.getByRole('heading', { name: 'Giải mã giấc mơ' })).toBeVisible();

  await page.locator('#dream-input').fill('Tôi mơ thấy một con rắn lớn bò qua sân nhà.');
  await page.getByRole('button', { name: 'Giải mộng', exact: true }).click();

  // Kết quả: khối biểu tượng nhận diện (stub trả 1 biểu tượng) + bài giải.
  await expect(page.getByText('Biểu tượng nhận diện', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.symbol-list .symbol')).toHaveCount(1);

  // Bất biến ngôn ngữ: vùng kết quả không được chứa ký tự Hán.
  const resultText = await page.getByRole('main').innerText();
  expect(HAN_TEXT_PATTERN.test(resultText), 'kết quả Giải mộng không được chứa chữ Hán').toBe(false);
});
