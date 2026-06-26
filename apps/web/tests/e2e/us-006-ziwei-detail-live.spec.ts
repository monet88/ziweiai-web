import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { signInViaUi } from './sign-in';

// US-006 LIVE (@live): luận giải cung Tử Vi gọi LLM thật + chứng minh LƯU LỊCH SỬ.
//
// Khác us-006-ziwei-detail.spec.ts (stub POST /explanations): spec này KHÔNG chặn request. Nó gọi
// provider AI thật để sinh luận giải, rồi khẳng định kết quả được PERSIST: rời trang chi tiết, mở
// LẠI đúng lá số đó từ /history → nội dung luận giải hydrate sẵn (nút "Tạo lại luận giải" + kết quả
// hiện ngay) thay vì EmptyState. Đây là bằng chứng end-to-end cho việc lưu lịch sử phần luận giải AI.
//
// Phụ thuộc mạng + LLM thật nên timeout rộng. Chụp screenshot mỗi mốc vào test-results/explanation-history-live/.

const SHOT_DIR = 'test-results/explanation-history-live';

const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
}

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

// Dữ liệu sinh RIÊNG cho spec live này (KHÁC mọi spec default). Lá số dedupe theo input sinh trên
// cloud user test dùng chung; spec này PERSIST luận giải thật, nên nếu trùng input với US-010/US-013
// (15/8/1990) thì nút "Luận giải cung này" của chúng bị thay bằng "Tạo lại luận giải" (đã hydrate)
// → vỡ test default. Ngày 07/11/1983 04:15 không spec nào dùng → cô lập dữ liệu live.
async function createZiweiChart(page: Page): Promise<string> {
  await page.locator('#birth-day').selectOption('7');
  await page.locator('#birth-month').selectOption('11');
  await page.locator('#birth-year').selectOption('1983');
  await page.locator('#birth-gender').selectOption('male');
  await page.locator('#birth-hour').fill('4');
  await page.locator('#birth-minute').fill('15');
  await page.getByRole('main').getByRole('button', { name: 'Lập lá số', exact: true }).click();
  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  const match = page.url().match(/\/charts\/([0-9a-f-]{36})/i);
  expect(match, 'URL phải chứa chartId dạng uuid').not.toBeNull();
  return match![1];
}

test('US-006 LIVE @live: luận giải cung thật → lưu → mở lại từ lịch sử hydrate sẵn', async ({ page }) => {
  test.setTimeout(120_000);
  await signInViaUi(page);

  // ---- Tạo lá số Tử Vi ----
  const chartId = await createZiweiChart(page);
  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({ timeout: 30_000 });

  const board = page.getByRole('group', { name: 'Bàn 12 cung' });
  await expect(board).toBeVisible();
  const palaceButtons = board.getByRole('button');
  await expect(async () => {
    expect(await palaceButtons.count()).toBeGreaterThanOrEqual(12);
  }).toPass();

  // ---- Chọn cung Mệnh (ô đầu) + luận giải bằng LLM thật ----
  await palaceButtons.first().click();
  await page
    .getByRole('button', { name: /^(Luận giải cung này|Tạo lại luận giải)$/ })
    .click();

  // Kết quả LLM thật về (timeout rộng cho provider mạng). 0 chữ Hán (bất biến ngôn ngữ).
  const result = page.locator('article.result');
  await expect(result).toBeVisible({ timeout: 90_000 });
  const resultText = (await result.innerText()).trim();
  expect(resultText.length, 'Luận giải thật phải có nội dung').toBeGreaterThan(0);
  expect(CJK_TEXT_PATTERN.test(resultText), 'Luận giải không được rò chữ Hán').toBe(false);
  await shot(page, '01-explanation-generated');

  // ---- Rời trang rồi mở LẠI lá số từ lịch sử: nội dung phải hydrate sẵn (đã lưu) ----
  await page.getByRole('button', { name: 'Quay về trang chính', exact: true }).click();
  await page.waitForURL(/\/$/, { timeout: 15_000 });
  await page.getByRole('link', { name: 'Xem toàn bộ lịch sử', exact: true }).click();
  await page.waitForURL(/\/history$/, { timeout: 15_000 });
  await shot(page, '02-history-list');

  // Mở lại đúng lá số vừa luận giải.
  await page.locator(`a[href="/charts/${chartId}"]`).first().click();
  await page.waitForURL(new RegExp(`/charts/${chartId}$`, 'i'), { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({ timeout: 30_000 });

  // Chọn lại cung Mệnh → kết quả ĐÃ LƯU hydrate ngay: nút đổi sang "Tạo lại luận giải" và article
  // kết quả hiện mà KHÔNG cần gọi LLM lần nữa (bằng chứng đã persist + read-path hoạt động).
  await page.getByRole('group', { name: 'Bàn 12 cung' }).getByRole('button').first().click();
  await expect(
    page.getByRole('button', { name: 'Tạo lại luận giải', exact: true }),
    'Mở lại lá số đã luận giải phải hiện nút "Tạo lại" (kết quả đã lưu được hydrate)',
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('article.result')).toBeVisible({ timeout: 15_000 });
  const hydratedText = (await page.locator('article.result').innerText()).trim();
  expect(hydratedText.length, 'Kết quả hydrate từ lịch sử phải có nội dung').toBeGreaterThan(0);
  await shot(page, '03-explanation-hydrated-from-history');
});
