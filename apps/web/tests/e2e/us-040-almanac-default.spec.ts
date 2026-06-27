import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';
import { stubAlmanac } from './_ai-stubs';

// US-040 (default): luồng Hoàng lịch chọn ngày qua UI với STUB /almanac/select (deterministic, KHÔNG
// đốt token LLM). Khẳng định route /almanac dựng đúng, chọn việc + khoảng ngày → render danh sách
// ngày đã chấm điểm + bài luận, và 0 ký tự Hán. Bản LIVE gọi provider thật ở us-040-almanac-live.spec.ts.

const HAN_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

test('US-040: chọn ngày Hoàng lịch (stub) → render danh sách ngày + luận giải, 0 chữ Hán', async ({
  page,
}) => {
  await signInViaUi(page);
  await stubAlmanac(page);

  await page.goto('/almanac');
  await expect(page.getByRole('heading', { name: 'Chọn ngày tốt' })).toBeVisible();

  // Chọn việc qua value từ contract (selectOption, ổn định hơn nhãn dịch) + khoảng ngày.
  await page.locator('#almanac-topic').selectOption('marriage');
  await page.locator('#almanac-start').fill('2026-01-01');
  await page.locator('#almanac-end').fill('2026-01-03');

  // Chặn + khẳng định payload request: UI phải gửi đúng topic + khoảng ngày.
  const requestPromise = page.waitForRequest(
    (req) => req.url().includes('/almanac/select') && req.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Chọn ngày', exact: true }).click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toEqual({
    topic: 'marriage',
    startDate: '2026-01-01',
    endDate: '2026-01-03',
  });

  // Kết quả: tiêu đề + danh sách ngày (2 ngày stub, mỗi ngày có .day-date).
  await expect(page.getByText('Ngày phù hợp', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.day-date')).toHaveCount(2);

  // Bất biến ngôn ngữ: vùng kết quả (can chi/trực/sao/nghi-kỵ + luận giải) không được chứa ký tự Hán.
  const resultText = await page.getByRole('main').innerText();
  expect(HAN_TEXT_PATTERN.test(resultText), 'kết quả Hoàng lịch không được chứa chữ Hán').toBe(false);
});
