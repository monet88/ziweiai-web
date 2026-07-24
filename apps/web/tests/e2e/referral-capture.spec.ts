import { test, expect } from '@playwright/test';

// Referral capture gate (sau ship share ?ref= + migrate 000018):
// Layout (app) sanitize ref → localStorage.ziweiai_ref_code.
// Không cần login: capture chạy cho anonymous + email.

const REF_STORAGE_KEY = 'ziweiai_ref_code';

test.describe('referral capture (?ref= → localStorage)', () => {
  test('mã hợp lệ trên / được ghi vào localStorage', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.removeItem(key);
    }, REF_STORAGE_KEY);

    await page.goto('/?ref=SmokeRef1');

    await expect.poll(async () => page.evaluate((key) => localStorage.getItem(key), REF_STORAGE_KEY)).toBe(
      'SMOKEREF1',
    );
    await expect(page).toHaveURL(/[?&]ref=SmokeRef1/);
  });

  test('mã hợp lệ trên /charts/:id giữ query và ghi storage', async ({ page }) => {
    const chartId = '00000000-0000-4000-8000-000000000099';
    await page.addInitScript((key) => {
      localStorage.removeItem(key);
    }, REF_STORAGE_KEY);

    await page.goto(`/charts/${chartId}?ref=Ab12Cd34`);

    await expect.poll(async () => page.evaluate((key) => localStorage.getItem(key), REF_STORAGE_KEY)).toBe(
      'AB12CD34',
    );
    await expect(page).toHaveURL(new RegExp(`/charts/${chartId}.*[?&]ref=Ab12Cd34`));
  });

  test('mã lowercase vẫn chuẩn hóa uppercase khi ghi storage', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.removeItem(key);
    }, REF_STORAGE_KEY);

    await page.goto('/?ref=ab12cd34');

    await expect.poll(async () => page.evaluate((key) => localStorage.getItem(key), REF_STORAGE_KEY)).toBe(
      'AB12CD34',
    );
  });

  test('mã không hợp lệ không ghi đè localStorage', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'KeepMeOK1');
    }, REF_STORAGE_KEY);

    await page.goto('/?ref=bad!code');
    // Layout đã mount khi app shell hiện; effect sanitize bỏ qua ref bẩn → giữ giá trị cũ.
    await expect(page.locator('body')).toBeVisible();
    await expect
      .poll(async () => page.evaluate((key) => localStorage.getItem(key), REF_STORAGE_KEY))
      .toBe('KeepMeOK1');
  });
});
