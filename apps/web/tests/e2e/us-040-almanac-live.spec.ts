import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-040 (@live): luồng Hoàng lịch chọn ngày end-to-end qua UI, KHÔNG intercept — thực sự gọi POST
// /almanac/select (cờ EXTENDED_SYSTEM_ALMANAC_ENABLED bật ở webServer env) → engine tyme4ts chấm
// điểm + luận giải do provider AI thật sinh. Đốt token LLM nên gắn @live (chỉ chạy khi pnpm e2e:live).
// Bản default stub ở us-040-almanac-default.spec.ts. Khẳng định: chọn việc + khoảng ngày → render
// danh sách ngày đã chấm điểm + bài luận, 0 chữ Hán (Han-gate engine + overlay phải kín).

const HAN_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

test('US-040 @live: chọn ngày Hoàng lịch qua UI → render ngày chấm điểm + luận giải, 0 chữ Hán', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signInViaUi(page);

  await page.goto('/almanac');
  await expect(page.getByRole('heading', { name: 'Chọn ngày tốt' })).toBeVisible();

  // Chọn chủ đề qua value từ contract (selectOption, ổn định hơn nhãn dịch); khoảng ngày ngắn (5 ngày).
  await page.locator('#almanac-topic').selectOption('marriage');
  await page.locator('#almanac-start').fill('2026-03-01');
  await page.locator('#almanac-end').fill('2026-03-05');
  await page.getByRole('button', { name: 'Chọn ngày', exact: true }).click();

  // Kết quả LLM thật: tiêu đề "Ngày phù hợp" hiện (timeout rộng cho provider mạng).
  await expect(page.getByText('Ngày phù hợp', { exact: true })).toBeVisible({ timeout: 60_000 });

  // Toàn bộ kết quả (can chi + nghi/kỵ + thần sát qua overlay + bài luận LLM) không được chứa chữ Hán.
  const resultText = await page.getByRole('main').innerText();
  expect(HAN_TEXT_PATTERN.test(resultText), 'kết quả Hoàng lịch không được chứa chữ Hán').toBe(false);
});
