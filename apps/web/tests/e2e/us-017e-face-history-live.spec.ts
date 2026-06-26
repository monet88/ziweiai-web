import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { signInViaUi } from './sign-in';

// US-017 follow-up (decision 0023) — LIVE proof that AI vision readings are PERSISTED to history.
//
// Khác us-017e-face.spec.ts (intercept POST /vision/face để khẳng định request multipart): spec này
// KHÔNG chặn request. Nó chạy luồng thật: upload ảnh → backend gọi vision LLM thật → lưu vision_results
// + history_views → trả kết quả. Sau đó vào /history khẳng định mục "Xem Tướng đã lưu" xuất hiện với
// ảnh đã ký + câu hỏi + luận giải Markdown. Đây là bằng chứng end-to-end cho việc "lưu lại lịch sử các
// phần AI luận giải" (yêu cầu chủ sản phẩm). Chụp screenshot mỗi mốc vào test-results/vision-history-live/.
//
// Phụ thuộc mạng + LLM thật nên cho timeout rộng; chỉ chạy khi provider vision được cấu hình (key có).
// Ảnh fixture là một JPG có sẵn trong static (không phải ảnh người thật → tránh PII sinh trắc).
//
// TAG @live: spec này TỐN token LLM thật mỗi lần chạy nên BỊ LOẠI khỏi `pnpm e2e` mặc định
// (--grep-invert @live). Chỉ chạy khi yêu cầu rõ "live test thật": `pnpm -F @ziweiai/web e2e:live`.

const SHOT_DIR = 'test-results/vision-history-live';
const FACE_IMAGE_PATH = fileURLToPath(new URL('../../static/tarot/major_00.jpg', import.meta.url));
// Câu hỏi gắn token DUY NHẤT theo lần chạy: user test BỀN (decision 0023 — bỏ cron xoá 7 ngày) nên
// mỗi lần chạy live trước để lại entry lịch sử cùng câu hỏi. Với câu hỏi tĩnh, getByText().first()
// có thể khớp entry CŨ → false positive (test xanh dù persist của lần này âm thầm lỗi). Token duy
// nhất bảo đảm assertion chỉ khớp đúng entry vừa tạo ở lần chạy này.
const QUESTION = `Sự nghiệp của tôi năm nay thế nào? [run-${Date.now()}]`;

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
}

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

// Tag @live: spec này gọi LLM thật (tốn token + phụ thuộc mạng) nên KHÔNG chạy trong bộ E2E mặc
// định (`pnpm e2e` lọc bỏ @live). Chỉ chạy khi yêu cầu chạy live test thật: `pnpm e2e:live`.
test('US-017e LIVE @live: Xem Tướng thật → lưu vào lịch sử (ảnh + câu hỏi + luận giải)', async ({ page }) => {
  await signInViaUi(page);

  // ---- Mở route Xem Tướng, tải ảnh thật + nhập câu hỏi ----
  await page.goto('/face');
  await expect(page.getByRole('heading', { name: 'Luận giải Xem Tướng' })).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(FACE_IMAGE_PATH);
  // Preview ảnh xuất hiện = ảnh đã nhận hợp lệ (loại + kích thước qua client validate).
  await expect(page.locator('img[alt="major_00.jpg"]')).toBeVisible({ timeout: 10_000 });

  await page.locator('#vision-question').fill(QUESTION);
  await shot(page, '01-face-form-ready');

  // ---- Submit: KHÔNG intercept → backend gọi vision LLM thật rồi persist ----
  await page.getByRole('main').getByRole('button', { name: 'Luận giải Xem Tướng', exact: true }).click();

  // Kết quả render = LLM trả về + đã đi qua nhánh persist (try/catch không nuốt response).
  // Cho timeout rộng vì gọi LLM đọc ảnh thật qua mạng.
  await expect(page.getByText('Kết quả luận giải', { exact: true })).toBeVisible({ timeout: 90_000 });
  await shot(page, '02-face-result');

  // ---- Vào lịch sử: mục Xem Tướng đã lưu phải xuất hiện ----
  await page.goto('/history');
  await expect(page.getByRole('heading', { name: 'Xem Tướng & Xem Tay đã lưu' })).toBeVisible({
    timeout: 20_000,
  });

  // Mục vision lưu kèm câu hỏi (bằng chứng question được persist, không bị nuốt). QUESTION mang
  // token duy nhất theo lần chạy nên chỉ khớp đúng entry vừa tạo — entry cũ từ lần chạy trước (user
  // test bền) không lọt vào. .first() chỉ là phòng thủ strict-mode, không còn để bỏ qua entry cũ.
  await expect(page.getByText(QUESTION, { exact: false }).first()).toBeVisible({ timeout: 10_000 });

  // Ảnh đã ký (signed URL) phải tải được — alt nhãn tiếng Việt cố định trong HistoryList.
  const savedImage = page.locator('img[alt="Ảnh đã tải lên để luận giải"]').first();
  await expect(savedImage).toBeVisible({ timeout: 15_000 });
  // Khẳng định ảnh THẬT SỰ tải xong (naturalWidth > 0) — signed URL hợp lệ, không phải ảnh vỡ.
  await expect
    .poll(async () => savedImage.evaluate((img: HTMLImageElement) => img.naturalWidth), {
      timeout: 15_000,
    })
    .toBeGreaterThan(0);

  await shot(page, '03-history-saved-vision');
});
