import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';
import { stubTarot } from './_ai-stubs';

// US-017h (default): luồng Rút Tarot qua UI với STUB /draws/tarot (deterministic, KHÔNG đốt token
// LLM). Khẳng định route /tarot dựng đúng request + render lá kèm ảnh thật từ static/tarot/<id>.jpg
// + 0 ký tự Hán. Bản LIVE gọi provider thật ở us-017h-tarot.spec.ts (@live, chỉ chạy khi yêu cầu).

const HAN_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

test('US-017h: rút Tarot ba lá (stub) → render 3 lá + ảnh + diễn giải, 0 chữ Hán', async ({ page }) => {
  await signInViaUi(page);
  await stubTarot(page);

  await page.goto('/tarot');
  await expect(page.getByRole('heading', { name: 'Rút bài Tarot' })).toBeVisible();

  await page.locator('#tarot-question').fill('Tuần này tôi nên tập trung vào điều gì trong công việc?');
  await page.getByRole('button', { name: 'Rút bài', exact: true }).click();

  await expect(page.getByText('Kết quả rút bài', { exact: true })).toBeVisible({ timeout: 15_000 });

  // Stub trả 3 lá three-card; ảnh trỏ tới static/tarot/<id>.jpg (id khớp file thật → tải được).
  const cardImages = page.locator('img[src*="/tarot/"]');
  await expect(cardImages).toHaveCount(3);
  // Khẳng định ảnh THẬT SỰ tải xong (naturalWidth > 0). Dùng expect.poll thay vì evaluate() một lần:
  // toHaveCount chỉ xác nhận <img> có trong DOM, KHÔNG đảm bảo đã decode xong — đọc naturalWidth ngay
  // có thể bắt được lúc còn 0 → flaky CI. poll lặp lại tới khi ảnh load (hoặc hết 15s).
  await expect
    .poll(async () => cardImages.first().evaluate((img) => (img as HTMLImageElement).naturalWidth), {
      timeout: 15_000,
    })
    .toBeGreaterThan(0);

  // Bất biến ngôn ngữ: vùng kết quả (tên lá + diễn giải) không được chứa ký tự Hán.
  const resultText = await page.getByRole('main').innerText();
  expect(HAN_TEXT_PATTERN.test(resultText), 'kết quả Tarot không được chứa chữ Hán').toBe(false);
});
