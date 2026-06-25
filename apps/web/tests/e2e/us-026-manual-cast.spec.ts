import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-026 (live): gieo quẻ thủ công. Mai Hoa: chọn "Tự nhập số" → 2 ô số → gieo theo số.
// Lục Hào: chọn "Tự gieo 6 hào" → 6 select hào hiện ra. Không intercept — thực sự gọi
// POST /divinations (castMethod=manual). Selector bám id field + nhãn/role tiếng Việt.

test('US-026: Mai Hoa gieo quẻ theo số qua UI', async ({ page }) => {
  await signInViaUi(page);

  await page.goto('/meihua');
  await expect(page.getByRole('heading', { name: 'Lập quẻ Mai Hoa Dịch Số' })).toBeVisible();

  await page.locator('#divination-question').fill('Viec nay nen tien hay nen lui?');
  // Đổi cách gieo sang tự nhập số → 2 ô số xuất hiện.
  await page.locator('#divination-cast-method').selectOption('manual');
  await expect(page.locator('#divination-meihua-upper')).toBeVisible();
  await page.locator('#divination-meihua-upper').fill('7');
  await page.locator('#divination-meihua-lower').fill('3');

  // Bắt request POST /divinations để khẳng định payload manual thực sự được gửi
  // (regression castMethod sẽ lọt nếu chỉ kiểm điều hướng URL).
  const requestPromise = page.waitForRequest(
    (req) => req.method() === 'POST' && /\/divinations$/.test(req.url()),
    { timeout: 30_000 },
  );

  await page.getByRole('main').getByRole('button', { name: 'Gieo quẻ', exact: true }).click();

  const divinationRequest = await requestPromise;
  const payload = divinationRequest.postDataJSON() as Record<string, unknown>;
  expect(payload.castMethod, 'castMethod phải là manual').toBe('manual');
  expect(payload.chartSystem).toBe('mei-hua-yi-shu');
  expect(payload.meihuaManual, 'phải gửi meihuaManual với 2 số đã nhập').toMatchObject({
    upperNumber: 7,
    lowerNumber: 3,
  });

  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Luận giải AI' })).toBeVisible({ timeout: 30_000 });
});

test('US-026: Lục Hào hiện 6 select hào khi chọn tự gieo', async ({ page }) => {
  await signInViaUi(page);

  await page.goto('/liuyao');
  await expect(page.getByRole('heading', { name: 'Lập quẻ Lục Hào' })).toBeVisible();

  await page.locator('#divination-question').fill('Quan he nay co ben lau khong?');
  await page.locator('#divination-cast-method').selectOption('manual');

  // 6 select hào (hào 1 dưới cùng → hào 6) hiển thị.
  for (let position = 1; position <= 6; position += 1) {
    await expect(page.locator(`#divination-liuyao-line-${position}`)).toBeVisible();
  }
  // Đặt vài hào động (lão âm/lão dương) rồi gieo.
  await page.locator('#divination-liuyao-line-3').selectOption('oldYang');
  await page.locator('#divination-liuyao-line-5').selectOption('oldYin');

  // Bắt request để khẳng định payload manual (6 hào) thực sự gửi đi.
  const requestPromise = page.waitForRequest(
    (req) => req.method() === 'POST' && /\/divinations$/.test(req.url()),
    { timeout: 30_000 },
  );

  await page.getByRole('main').getByRole('button', { name: 'Gieo quẻ', exact: true }).click();

  const divinationRequest = await requestPromise;
  const payload = divinationRequest.postDataJSON() as {
    castMethod?: string;
    chartSystem?: string;
    liuyaoManual?: { lineStates?: string[] };
  };
  expect(payload.castMethod, 'castMethod phải là manual').toBe('manual');
  expect(payload.chartSystem).toBe('liu-yao');
  expect(payload.liuyaoManual?.lineStates, 'phải gửi 6 trạng thái hào').toHaveLength(6);
  // Hào 3 (index 2) = oldYang, hào 5 (index 4) = oldYin theo thao tác ở trên.
  expect(payload.liuyaoManual?.lineStates?.[2]).toBe('oldYang');
  expect(payload.liuyaoManual?.lineStates?.[4]).toBe('oldYin');

  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Luận giải AI' })).toBeVisible({ timeout: 30_000 });
});
