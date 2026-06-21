import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-017e (live wiring): luồng Xem Tướng end-to-end qua UI. Cờ EXTENDED_SYSTEM_FACE_ENABLED bật ở
// playwright webServer env. Xem Tướng gọi POST /vision/face (multipart) → vision LLM thật. Vì kết
// quả phụ thuộc LLM đọc ảnh (không xác định + tốn token + dễ chậm với ảnh tổng hợp), test CHẶN
// (intercept) POST /vision/face để: (1) khẳng định route /face dựng đúng request multipart mang ảnh,
// (2) trả stub hợp lệ để render kết quả xác định. KHÔNG đọc/khẳng định nội dung luận giải (theo yêu
// cầu). Gate phía server (FEATURE/IDENTITY/PAYMENT/VISION_QUOTA) đã phủ bởi unit test api.

// PNG 1x1 hợp lệ tối thiểu (base64) — đủ để upload field image, không phải ảnh người thật (tránh PII).
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test('US-017e: tải ảnh ở route /face → POST /vision/face mang multipart ảnh, render kết quả', async ({
  page,
}) => {
  await signInViaUi(page);

  await page.goto('/face');
  await expect(page.getByRole('heading', { name: 'Luận giải Xem Tướng' })).toBeVisible();

  // Đặt ảnh vào input file (buffer in-memory, không file PII trên đĩa).
  await page.locator('input[type="file"]').setInputFiles({
    name: 'portrait.png',
    mimeType: 'image/png',
    buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
  });

  // Chặn POST /vision/face: khẳng định request là multipart mang ảnh, rồi trả stub hợp lệ để render
  // xác định (không phụ thuộc LLM). Bằng chứng trực tiếp cho đường route → upload → POST.
  let capturedContentType = '';
  let capturedBodyLength = 0;
  await page.route('**/vision/face', async (route) => {
    const request = route.request();
    capturedContentType = request.headers()['content-type'] ?? '';
    capturedBodyLength = (request.postDataBuffer()?.length ?? 0);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'face',
        imagePath: 'owner/req.png',
        narrative: '## Tong quan\nDay la ket qua luan giai mau cho kiem thu.\n\n## Tom lai\nChi mang tinh tham khao.',
      }),
    });
  });

  await page.getByRole('main').getByRole('button', { name: 'Luận giải Xem Tướng', exact: true }).click();

  // Kết quả render (tiêu đề mục kết quả) — KHÔNG khẳng định nội dung luận giải cụ thể.
  await expect(page.getByText('Kết quả luận giải', { exact: true })).toBeVisible({ timeout: 20_000 });

  // Khẳng định request đi ra là multipart/form-data và có thân (chứa ảnh).
  expect(capturedContentType, 'POST /vision/face phải là multipart/form-data').toContain('multipart/form-data');
  expect(capturedBodyLength, 'request phải mang thân multipart chứa ảnh').toBeGreaterThan(0);
});
