import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-038 (@live): luồng Giải mộng end-to-end qua UI, KHÔNG intercept — thực sự gọi POST
// /dreams/interpret (cờ EXTENDED_SYSTEM_DREAM_ENABLED bật ở webServer env) → luận giải do provider
// AI thật sinh. Đốt token LLM nên gắn @live (chỉ chạy khi pnpm e2e:live). Bản default stub ở
// us-038-dream-default.spec.ts. Khẳng định: mô tả giấc mơ → render bài luận, 0 chữ Hán.

const HAN_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

test('US-038 @live: giải mộng qua UI → render luận giải, 0 chữ Hán', async ({ page }) => {
  test.setTimeout(90_000);
  await signInViaUi(page);

  await page.goto('/dream');
  await expect(page.getByRole('heading', { name: 'Giải mã giấc mơ' })).toBeVisible();

  await page.locator('#dream-input').fill('Tôi mơ thấy mình bay trên một thành phố lạ và một con rắn lớn cuộn dưới chân.');
  await page.getByRole('button', { name: 'Giải mộng', exact: true }).click();

  // Kết quả LLM thật: tiêu đề "Luận giải" luôn hiện ở vùng kết quả (timeout rộng cho provider mạng).
  await expect(page.getByText('Luận giải', { exact: true })).toBeVisible({ timeout: 60_000 });

  const resultText = await page.getByRole('main').innerText();
  expect(HAN_TEXT_PATTERN.test(resultText), 'kết quả Giải mộng không được chứa chữ Hán').toBe(false);
});
