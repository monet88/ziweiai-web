import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

const HAN_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

test('US-043: tra cứu Thần Số Học → tính 4 chỉ số + render thẻ + AI explain, 0 chữ Hán', async ({ page }) => {
  await signInViaUi(page);

  // Stub endpoint POST /numerology/explain
  await page.route('**/numerology/explain', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        narrative: '### Phân tích Thần Số Học\nBạn mang con số đường đời 3 đầy sáng tạo và năng lượng tích cực.',
      }),
    });
  });

  await page.goto('/numerology');
  await expect(page.getByRole('heading', { name: 'Tra cứu Thần Số Học' })).toBeVisible();

  await page.locator('#numerology-fullname').fill('Nguyễn Văn An');
  await page.locator('#numerology-dob').fill('1990-05-15');
  await page.getByRole('button', { name: 'Tra cứu chỉ số', exact: true }).click();

  await expect(page.getByText('Hồ sơ Thần Số Học', { exact: true })).toBeVisible();
  await expect(page.getByText('Số Đường Đời (Life Path)')).toBeVisible();
  await expect(page.getByText('Số Sứ Mệnh (Destiny)')).toBeVisible();
  await expect(page.getByText('Số Linh Hồn (Soul Urge)')).toBeVisible();
  await expect(page.getByText('Số Nhân Cách (Personality)')).toBeVisible();

  // Bấm Luận giải chuyên sâu cùng AI
  await page.getByRole('button', { name: /Luận giải chuyên sâu/i }).click();

  await expect(page.getByText('Luận giải chuyên sâu từ AI', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Phân tích Thần Số Học')).toBeVisible();

  // Bất biến ngôn ngữ: không chứa ký tự Hán
  const resultText = await page.getByRole('main').innerText();
  expect(HAN_TEXT_PATTERN.test(resultText), 'kết quả Thần Số Học không được chứa chữ Hán').toBe(false);
});
