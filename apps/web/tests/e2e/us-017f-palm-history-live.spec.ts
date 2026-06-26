import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { signInViaUi } from './sign-in';

// US-017 follow-up (decision 0023) — LIVE proof that Xem Tay (palm) readings are PERSISTED to history.
//
// Khác us-017f-palm.spec.ts (intercept POST /vision/palm để khẳng định request multipart): spec này
// KHÔNG chặn request. Nó chạy luồng thật: upload ảnh → backend gọi vision LLM thật → lưu vision_results
// + history_views → trả kết quả. Sau đó vào /history khẳng định mục "Xem Tay đã lưu" xuất hiện với
// ảnh đã ký + câu hỏi + luận giải Markdown. Bằng chứng end-to-end cho việc lưu lịch sử phần luận giải AI.
//
// Phụ thuộc mạng + LLM thật nên cho timeout rộng; chỉ chạy khi provider vision được cấu hình (key có).
// Ảnh fixture là một JPG có sẵn trong static (không phải ảnh tay người thật → tránh PII sinh trắc).
//
// TAG @live: spec này TỐN token LLM thật mỗi lần chạy nên BỊ LOẠI khỏi `pnpm e2e` mặc định
// (--grep-invert @live). Chỉ chạy khi yêu cầu rõ "live test thật": `pnpm -F @ziweiai/web e2e:live`.

const SHOT_DIR = 'test-results/vision-history-live';
const PALM_IMAGE_PATH = fileURLToPath(new URL('../../static/tarot/major_01.jpg', import.meta.url));
const QUESTION = 'Đường chỉ tay nói gì về sự nghiệp của tôi?';

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
}

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

test('US-017f LIVE @live: Xem Tay thật → lưu vào lịch sử (ảnh + câu hỏi + luận giải)', async ({ page }) => {
  await signInViaUi(page);

  // ---- Mở route Xem Tay, tải ảnh thật + nhập câu hỏi ----
  await page.goto('/palm');
  await expect(page.getByRole('heading', { name: 'Luận giải Xem Tay' })).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(PALM_IMAGE_PATH);
  // Preview ảnh xuất hiện = ảnh đã nhận hợp lệ (loại + kích thước qua client validate).
  await expect(page.locator('img[alt="major_01.jpg"]')).toBeVisible({ timeout: 10_000 });

  await page.locator('#vision-question').fill(QUESTION);
  await shot(page, '01-palm-form-ready');

  // ---- Submit: KHÔNG intercept → backend gọi vision LLM thật rồi persist ----
  await page.getByRole('main').getByRole('button', { name: 'Luận giải Xem Tay', exact: true }).click();

  // Kết quả render = LLM trả về + đã đi qua nhánh persist (try/catch không nuốt response).
  await expect(page.getByText('Kết quả luận giải', { exact: true })).toBeVisible({ timeout: 90_000 });
  await shot(page, '02-palm-result');

  // ---- Vào lịch sử: mục Xem Tay đã lưu phải xuất hiện ----
  await page.goto('/history');
  await expect(page.getByRole('heading', { name: 'Xem Tướng & Xem Tay đã lưu' })).toBeVisible({
    timeout: 20_000,
  });

  // Mục vision lưu kèm câu hỏi vừa hỏi (bằng chứng question được persist, không bị nuốt).
  await expect(page.getByText(QUESTION, { exact: false }).first()).toBeVisible({ timeout: 10_000 });

  // Ảnh đã ký (signed URL) phải tải được — alt nhãn tiếng Việt cố định trong HistoryList.
  const savedImage = page.locator('img[alt="Ảnh đã tải lên để luận giải"]').first();
  await expect(savedImage).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(async () => savedImage.evaluate((img: HTMLImageElement) => img.naturalWidth), {
      timeout: 15_000,
    })
    .toBeGreaterThan(0);

  await shot(page, '03-history-saved-palm');
});
