import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-017d (live): luồng Mạnh Phái end-to-end. Cờ EXTENDED_SYSTEM_MANGPAI_ENABLED bật ở
// playwright webServer env. Mạnh Phái dùng chung POST /charts (chartSystem='mangpai'), route
// /mangpai đặt mặc định hệ qua SystemChartScreen. Bằng chứng đi qua: chặn POST /charts assert
// payload.chartSystem='mangpai' (slug bất biến, KHÔNG đọc rendered text), rồi xác nhận điều
// hướng sang trang chi tiết /charts/{uuid}. Dùng ngày sinh RIÊNG để không dedupe với spec khác.

test('US-017d: lập lá số Mạnh Phái qua route /mangpai → POST /charts mang chartSystem=mangpai', async ({
  page,
}) => {
  await signInViaUi(page);

  await page.goto('/mangpai');
  await expect(page.getByRole('heading', { name: 'Luận giải Mạnh Phái' })).toBeVisible();

  // Ngày sinh riêng (3/9/1991) khác các spec khác để backend không dedupe/đụng snapshot.
  await page.locator('#birth-day').selectOption('3');
  await page.locator('#birth-month').selectOption('9');
  await page.locator('#birth-year').selectOption('1991');
  await page.locator('#birth-hour').fill('7');
  await page.locator('#birth-minute').fill('30');

  // Chặn POST /charts để khẳng định route /mangpai đặt đúng hệ mangpai vào payload — bằng
  // chứng trực tiếp cho đường route → POST /charts, không phụ thuộc render kết quả/AI.
  const [chartRequest] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/charts'),
      { timeout: 30_000 },
    ),
    page.locator('#birth-day').locator('xpath=ancestor::form').getByRole('button', { name: 'Lập lá số', exact: true }).click(),
  ]);

  expect(
    chartRequest.postDataJSON()?.chartSystem,
    'POST /charts phải mang đúng hệ mangpai',
  ).toBe('mangpai');

  // Lập thành công → điều hướng tới trang chi tiết /charts/{uuid}.
  await page.waitForURL(/\/charts\/[0-9a-f-]{36}(?:[/?#]|$)/i, { timeout: 30_000 });

  // Khối luận giải Mạnh Phái hiển thị (chế độ render 'mangpai').
  await expect(page.getByText('Luận giải Mạnh Phái', { exact: true })).toBeVisible({ timeout: 20_000 });
});
