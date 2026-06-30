import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-025 (live): luồng gieo quẻ cho 4 hệ theo thời điểm (Mai Hoa, Lục Hào, Đại Lục Nhâm,
// Kỳ Môn) qua DivinationForm. KHÔNG nhập ngày sinh — quẻ gieo theo "now" ở server. Người
// dùng nhập câu hỏi (bắt buộc) + lĩnh vực (preset hoặc tự nhập) → POST /divinations →
// điều hướng /charts/:id. Sau đó history hiển thị câu hỏi. Selector bám id field +
// nhãn/role tiếng Việt (KHÔNG class CSS).

// CJK guard: vùng chi tiết không được rò chữ Hán (đồng bộ apps/web/src/lib/text/cjk.ts).
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

async function castDivination(
  page: Page,
  options: { question: string; purposeValue: string; purposeCustom?: string },
): Promise<string> {
  await page.locator('#divination-question').fill(options.question);
  await page.locator('#divination-purpose').selectOption(options.purposeValue);
  if (options.purposeValue === 'custom' && options.purposeCustom) {
    await page.locator('#divination-purpose-custom').fill(options.purposeCustom);
  }

  await page.getByRole('main').getByRole('button', { name: 'Gieo quẻ', exact: true }).click();

  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  const match = page.url().match(/\/charts\/([0-9a-f-]{36})/i);
  expect(match, 'URL phải chứa chartId dạng uuid').not.toBeNull();
  return match![1];
}

test('US-025: gieo quẻ Mai Hoa (preset) → chi tiết VN không Hán → history thấy câu hỏi', async ({
  page,
}) => {
  await signInViaUi(page);

  await page.goto('/meihua');
  await expect(page.getByRole('heading', { name: 'Lập quẻ Mai Hoa Dịch Số' })).toBeVisible();
  // Không có ô ngày sinh trong luồng gieo quẻ.
  await expect(page.locator('#birth-day')).toHaveCount(0);

  // Câu hỏi mang token duy nhất theo lần chạy: tài khoản test bền nên câu hỏi tĩnh
  // có thể trùng item lịch sử cũ → false positive. Token đảm bảo chỉ khớp quẻ vừa gieo.
  const uniqueToken = `qa-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const question = `Thang toi toi co nen nhan loi moi cong viec moi khong? [${uniqueToken}]`;
  await castDivination(page, { question, purposeValue: 'career' });

  // Chi tiết: rời trạng thái tải, vùng main hiện card hệ + luận giải.
  await expect(page.getByRole('heading', { name: 'Luận giải AI' })).toBeVisible({ timeout: 30_000 });
  const mainText = (await page.getByRole('main').innerText()).trim();
  expect(mainText.length, 'Chi tiết Mai Hoa phải có nội dung').toBeGreaterThan(0);
  expect(CJK_TEXT_PATTERN.test(mainText), 'Chi tiết Mai Hoa không được rò chữ Hán').toBe(false);

  // History: item gieo quẻ hiển thị câu hỏi (khác item lá số natal).
  await page.getByRole('button', { name: 'Quay về trang chính', exact: true }).click();
  await page.waitForURL(/\/$/, { timeout: 15_000 });
  await page
    .getByRole('navigation', { name: 'Hệ thuật số khác' })
    .getByRole('link', { name: 'Xem toàn bộ lịch sử', exact: true })
    .click();
  await page.waitForURL(/\/history$/, { timeout: 15_000 });

  await expect(
    page.getByRole('link').filter({ hasText: question }).first(),
    'Lịch sử phải hiện câu hỏi của quẻ vừa gieo',
  ).toBeVisible({ timeout: 15_000 });
});

test('US-025: câu hỏi bắt buộc + lĩnh vực tự nhập (Lục Hào)', async ({ page }) => {
  await signInViaUi(page);

  await page.goto('/liuyao');
  await expect(page.getByRole('heading', { name: 'Lập quẻ Lục Hào' })).toBeVisible();

  // Bỏ trống câu hỏi → submit chặn, hiện lỗi bắt buộc, không điều hướng.
  await page.getByRole('main').getByRole('button', { name: 'Gieo quẻ', exact: true }).click();
  await expect(page.getByText('Hãy nhập câu hỏi trước khi gieo quẻ.', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/liuyao$/);

  // Chọn lĩnh vực "Khác (tự nhập)" → ô tự nhập xuất hiện, gieo được sau khi điền đủ.
  await castDivination(page, {
    question: 'Viec mua nha nam nay co thuan loi khong?',
    purposeValue: 'custom',
    purposeCustom: 'Mua nha',
  });

  await expect(page.getByRole('heading', { name: 'Luận giải AI' })).toBeVisible({ timeout: 30_000 });
});
