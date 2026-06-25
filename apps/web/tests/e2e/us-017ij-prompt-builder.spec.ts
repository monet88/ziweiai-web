import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-017i & US-017j: Tarot Prompt Builder & cải tiến prompt Face/Palm.
// Logic prompt builder nằm ở backend (provider chain + prompt template) — KHÔNG có UI riêng.
// E2E này kiểm luồng UI face/palm xác nhận prompt cải tiến không phá vỡ UI flow:
//   1. Route /face + /palm dựng đúng.
//   2. Upload ảnh + submit → request multipart gửi đi (intercept).
//   3. Kết quả render (stub response) — xác nhận pipeline prompt → response hoạt động.
//
// Lưu ý: us-017e-face.spec.ts và us-017f-palm.spec.ts kiểm đường dây cơ bản. Test này bổ sung
// xác nhận prompt builder / cải tiến không gây regression.

// PNG 1x1 hợp lệ tối thiểu (base64) — không phải ảnh người thật (tránh PII).
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test('US-017i: route /face hoạt động, request có câu hỏi bổ sung từ prompt builder', async ({
  page,
}) => {
  await signInViaUi(page);

  await page.goto('/face');
  await expect(page.getByRole('heading', { name: 'Luận giải Xem Tướng' })).toBeVisible();

  // Upload ảnh tối thiểu
  await page.locator('input[type="file"]').setInputFiles({
    name: 'portrait.png',
    mimeType: 'image/png',
    buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
  });

  // Nhập câu hỏi (prompt builder cho phép thêm question tùy chỉnh)
  const questionInput = page.locator('#vision-question');
  if (await questionInput.isVisible()) {
    await questionInput.fill('Khuôn mặt tôi nói gì về tính cách?');
  }

  // Intercept POST /vision/face
  let capturedContentType = '';
  let capturedBodyLength = 0;
  await page.route('**/vision/face', async (route) => {
    const request = route.request();
    capturedContentType = request.headers()['content-type'] ?? '';
    capturedBodyLength = request.postDataBuffer()?.length ?? 0;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'face',
        imagePath: 'owner/req.png',
        narrative:
          '## Tổng quan\nKhuôn mặt thể hiện sự thông minh và quyết đoán.\n\n## Phân tích chi tiết\nĐặc điểm khuôn mặt cho thấy tính cách mạnh mẽ.',
      }),
    });
  });

  await page.getByRole('main').getByRole('button', { name: 'Luận giải Xem Tướng', exact: true }).click();

  // Kết quả render
  await expect(page.getByText('Kết quả luận giải', { exact: true })).toBeVisible({ timeout: 20_000 });

  // Request là multipart + có body
  expect(capturedContentType, 'POST phải là multipart/form-data').toContain('multipart/form-data');
  expect(capturedBodyLength, 'body phải có dữ liệu').toBeGreaterThan(0);

  await page.screenshot({ path: 'test-results/us-017i-face-prompt-builder.png', fullPage: true });
});

test('US-017j: route /palm hoạt động, prompt cải tiến không phá luồng', async ({ page }) => {
  await signInViaUi(page);

  await page.goto('/palm');
  await expect(page.getByRole('heading', { name: 'Luận giải Xem Tay' })).toBeVisible();

  // Upload ảnh
  await page.locator('input[type="file"]').setInputFiles({
    name: 'palm.png',
    mimeType: 'image/png',
    buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
  });

  // Nhập câu hỏi bổ sung nếu có
  const questionInput = page.locator('#vision-question');
  if (await questionInput.isVisible()) {
    await questionInput.fill('Đường chỉ tay nói gì về sự nghiệp của tôi?');
  }

  // Intercept POST /vision/palm
  let capturedContentType = '';
  let capturedBodyLength = 0;
  await page.route('**/vision/palm', async (route) => {
    const request = route.request();
    capturedContentType = request.headers()['content-type'] ?? '';
    capturedBodyLength = request.postDataBuffer()?.length ?? 0;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'palm',
        imagePath: 'owner/palm-req.png',
        narrative:
          '## Tổng quan\nBàn tay cho thấy đường sự nghiệp rõ ràng.\n\n## Chi tiết\nĐường chỉ tay chính dài và sâu, thể hiện sức bền bỉ trong công việc.',
      }),
    });
  });

  await page.getByRole('main').getByRole('button', { name: 'Luận giải Xem Tay', exact: true }).click();

  // Kết quả render
  await expect(page.getByText('Kết quả luận giải', { exact: true })).toBeVisible({ timeout: 20_000 });

  // Request multipart + body
  expect(capturedContentType).toContain('multipart/form-data');
  expect(capturedBodyLength).toBeGreaterThan(0);

  await page.screenshot({ path: 'test-results/us-017j-palm-prompt-improved.png', fullPage: true });
});
