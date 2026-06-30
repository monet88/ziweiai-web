import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';
import { stubExplanation } from './_ai-stubs';

// US-006 full flow (high-risk STOP criterion #1): đăng nhập → tạo lá số Tử Vi → mở chi tiết
// → bàn 12 cung tiếng Việt → chọn cung → luận giải → markdown VN render sanitized → tạo lá số
// thứ hai → cung selected reset đúng (remount {#key chartId}).
//
// Luận giải ở spec DEFAULT này dùng STUB (_ai-stubs.stubExplanation) — KHÔNG đốt token LLM. Bằng
// chứng luận giải LLM thật + lưu/đọc lại từ lịch sử nằm ở us-006-ziwei-detail-live.spec.ts (@live).
//
// Bất biến ngôn ngữ: quét \p{Script=Han} trên toàn vùng bàn cung + luận giải = 0 ký tự Hán.
// Selector bám role/nhãn tiếng Việt + id field (KHÔNG class CSS dễ vỡ).

// CJK pattern (copy giá trị từ apps/web/src/lib/text/cjk.ts — test E2E chạy ngoài $lib alias
// của svelte-check; giữ đồng bộ với guard runtime: Han + Hiragana/Katakana/Hangul/Bopomofo +
// dấu câu CJK + fullwidth). Dùng escape \u (không ký tự CJK literal) để khớp eslint
// no-irregular-whitespace. Không cờ g để .test() không giữ lastIndex.
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

// Dữ liệu sinh cho mỗi lá số. Hai lá số phải KHÁC nhau (ít nhất một trường) để backend
// không tái dùng cùng snapshot (reusedExistingSnapshot) → chartId mới, kiểm được reset.
interface BirthData {
  day: string;
  month: string;
  year: string;
  gender: 'male' | 'female';
  hour: string;
  minute: string;
}

// Điền form sinh hợp lệ (Tử Vi mặc định) rồi submit. Toạ độ/múi giờ nhập tay (chưa geocoding).
// Trả về chartId từ URL /charts/<id> sau khi điều hướng thành công.
async function createZiweiChart(page: Page, birth: BirthData): Promise<string> {
  await page.locator('#birth-day').selectOption(birth.day);
  await page.locator('#birth-month').selectOption(birth.month);
  await page.locator('#birth-year').selectOption(birth.year);
  // Tử Vi Đẩu Số bắt buộc giới tính nam/nữ để an 12 cung (engine chặn 'unknown' → snapshot
  // blocked, palaces rỗng). Form mặc định 'Chưa rõ' → phải chọn 'Nam'/'Nữ' trước khi tạo.
  await page.locator('#birth-gender').selectOption(birth.gender);
  await page.locator('#birth-hour').fill(birth.hour);
  await page.locator('#birth-minute').fill(birth.minute);

  // Nút submit BirthForm nằm trong <main>; sidebar (lịch sử rỗng) cũng có nút "Lập lá số"
  // → scope về main để tránh strict-mode resolve 2 phần tử.
  await page.locator('#birth-day').locator('xpath=ancestor::form').getByRole('button', { name: 'Lập lá số', exact: true }).click();

  // Điều hướng tới /charts/<uuid> sau khi tạo thành công.
  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  const match = page.url().match(/\/charts\/([0-9a-f-]{36})/i);
  expect(match, 'URL phải chứa chartId dạng uuid').not.toBeNull();
  return match![1];
}

test('US-006: tạo lá số → 12 cung VN → chọn cung → luận giải → reset khi đổi lá số', async ({
  page,
}) => {
  await signInViaUi(page);

  // ---- Tạo lá số Tử Vi thứ nhất ----
  const firstChartId = await createZiweiChart(page, {
    day: '15',
    month: '8',
    year: '1990',
    hour: '10',
    minute: '30',
    gender: 'male',
  });

  // Bàn 12 cung hiện ra (tiêu đề + group aria). Chờ rời trạng thái "Đang tải lá số".
  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({
    timeout: 30_000,
  });
  const board = page.getByRole('group', { name: 'Bàn 12 cung' });
  await expect(board).toBeVisible();

  // 12 cung là <button> trong bàn; ít nhất 12 ô cung hiển thị.
  const palaceButtons = board.getByRole('button');
  await expect(async () => {
    expect(await palaceButtons.count()).toBeGreaterThanOrEqual(12);
  }).toPass();

  // Bất biến ngôn ngữ: toàn vùng bàn cung KHÔNG có ký tự Hán.
  const boardText = (await board.innerText()).trim();
  expect(boardText.length).toBeGreaterThan(0);
  expect(CJK_TEXT_PATTERN.test(boardText), 'Bàn 12 cung không được rò chữ Hán').toBe(false);

  // ---- Chọn một cung ----
  const firstPalace = palaceButtons.first();
  await firstPalace.click();
  await expect(firstPalace).toHaveAttribute('aria-pressed', 'true');

  // ---- Luận giải cung đang chọn (STUB — không đốt token LLM) ----
  // Stub POST /explanations trả response schema-compliant với markdown tiếng Việt cố định. Khẳng
  // định luồng UI: chọn cung → bấm luận giải → render markdown sanitized. Provider thật + lưu/đọc
  // lại lịch sử do us-006-ziwei-detail-live.spec.ts (@live) phủ.
  const STUB_MARKDOWN =
    '## Tổng quan cung Mệnh\nĐây là luận giải mẫu cho kiểm thử, chỉ mang tính tham khảo.\n\n## Lời khuyên\nGiữ tâm thế chủ động và bình tĩnh.';
  await stubExplanation(page, STUB_MARKDOWN);

  // E2E dùng MỘT user test chung + backend tái dùng snapshot (cùng dữ liệu sinh) → nếu lần chạy
  // trước đã lưu luận giải cho cung này, model hydrate sẵn kết quả đã lưu (fix US-006 read-path):
  // nút đổi nhãn "Luận giải cung này" → "Tạo lại luận giải". Bấm nút DÙ ở trạng thái nào — stub xử lý.
  await page
    .getByRole('button', { name: /^(Luận giải cung này|Tạo lại luận giải)$/ })
    .click();

  // Kết quả markdown hiện ra trong <article class="result"> → MarkdownView.
  const result = page.locator('article.result');
  await expect(result).toBeVisible({ timeout: 30_000 });
  const resultText = (await result.innerText()).trim();
  expect(resultText.length, 'Luận giải phải có nội dung').toBeGreaterThan(0);

  // Bất biến ngôn ngữ: luận giải AI KHÔNG rò chữ Hán (nếu model trả Hán → fail, không nới).
  expect(CJK_TEXT_PATTERN.test(resultText), 'Luận giải không được rò chữ Hán').toBe(false);

  // Sanitize: nội dung render qua element Svelte thường (không {@html}) → không có thẻ script
  // chèn được. Kiểm chứng không có phần tử <script> nào lọt vào vùng kết quả.
  expect(await result.locator('script').count()).toBe(0);

  // ---- Đổi lá số: tạo lá số thứ hai → cung selected phải reset ----
  await page.getByRole('button', { name: 'Quay về trang chính', exact: true }).click();
  await page.waitForURL(/\/$/, { timeout: 15_000 });
  await expect(
    page.locator('#birth-day').locator('xpath=ancestor::form').getByRole('button', { name: 'Lập lá số', exact: true }),
  ).toBeVisible();

  const secondChartId = await createZiweiChart(page, {
    day: '3',
    month: '2',
    year: '1985',
    hour: '14',
    minute: '45',
    gender: 'female',
  });
  expect(secondChartId, 'Lá số thứ hai phải có id khác lá số thứ nhất').not.toBe(firstChartId);

  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({
    timeout: 30_000,
  });
  const secondBoard = page.getByRole('group', { name: 'Bàn 12 cung' });
  await expect(secondBoard).toBeVisible();

  // Reset đúng: KHÔNG cung nào ở trạng thái aria-pressed=true trên lá số mới (remount instance).
  const pressedCount = await secondBoard.getByRole('button', { name: /.*/ }).evaluateAll(
    (nodes) => nodes.filter((node) => node.getAttribute('aria-pressed') === 'true').length,
  );
  expect(pressedCount, 'Đổi lá số phải reset cung đang chọn (không cung nào còn selected)').toBe(0);
});
