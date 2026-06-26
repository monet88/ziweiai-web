import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-017h (@live): luồng Rút Tarot end-to-end qua UI, KHÔNG intercept — thực sự gọi POST /draws/tarot
// (cờ EXTENDED_SYSTEM_TAROT_ENABLED bật ở playwright webServer env) → narrative do provider AI thật
// sinh. Vì đốt token LLM mỗi lần chạy nên gắn @live: chỉ chạy khi yêu cầu (pnpm e2e:live), KHÔNG nằm
// trong bộ default. Bản default deterministic (stub /draws/tarot) ở us-017h-tarot-default.spec.ts.
// Test khẳng định: route /tarot dựng đúng, đặt câu hỏi + chọn trải bài → kết quả render đủ số lá kèm
// ảnh thật, và toàn bộ kết quả không lọt ký tự Hán.

// Quét chữ Hán/CJK ở phía test (đồng bộ CJK_TEXT_PATTERN của web) để chốt bất biến ngôn ngữ live.
const HAN_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

test('US-017h @live: rút Tarot ba lá qua UI → render lá + ảnh + diễn giải, 0 chữ Hán', async ({ page }) => {
  await signInViaUi(page);

  await page.goto('/tarot');
  await expect(page.getByRole('heading', { name: 'Rút bài Tarot' })).toBeVisible();

  await page.locator('#tarot-question').fill('Tuần này tôi nên tập trung vào điều gì trong công việc?');

  // Trải bài ba lá là mặc định; bấm rút.
  await page.getByRole('button', { name: 'Rút bài', exact: true }).click();

  // Kết quả: tiêu đề + đúng 3 lá (three-card), mỗi lá có ảnh tải từ static/tarot/<id>.jpg.
  await expect(page.getByText('Kết quả rút bài', { exact: true })).toBeVisible({ timeout: 30_000 });

  const cardImages = page.locator('img[src*="/tarot/"]');
  await expect(cardImages).toHaveCount(3);

  // Ảnh lá phải tải thật (naturalWidth > 0), không phải broken image.
  const firstWidth = await cardImages.first().evaluate((img) => (img as HTMLImageElement).naturalWidth);
  expect(firstWidth, 'ảnh lá Tarot phải tải được (naturalWidth > 0)').toBeGreaterThan(0);

  // Toàn bộ vùng kết quả (tên lá + diễn giải Markdown) không được chứa ký tự Hán.
  const resultText = await page.getByRole('main').innerText();
  expect(HAN_TEXT_PATTERN.test(resultText), 'kết quả Tarot không được chứa chữ Hán').toBe(false);
});

test('US-017h @live: trải bài Celtic Cross → rút 10 lá', async ({ page }) => {
  await signInViaUi(page);

  await page.goto('/tarot');
  await page.locator('#tarot-question').fill('Tôi đang mắc kẹt trong một quyết định lớn, nên nhìn nhận ra sao?');

  // Chọn Celtic Cross qua radiogroup bằng value để tránh phụ thuộc vào bản dịch UI.
  await page.locator('button[value="celtic-cross"]').click();
  await page.getByRole('button', { name: 'Rút bài', exact: true }).click();

  await expect(page.getByText('Kết quả rút bài', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('img[src*="/tarot/"]')).toHaveCount(10);
});
