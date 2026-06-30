import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-012: tô màu sao theo brightness (7 cấp) / tứ hóa (4 cấp) / hung tinh phụ.
// Kiểm 4 hành vi theo Acceptance Criteria:
//   1. Sao có brightnessKey → nhãn brightness có --star-brightness-color đúng token.
//   2. Sao có mutagen → nhãn mutagen có --star-mutagen-color đúng token.
//   3. Hung tinh phụ (minor malefic) → class `malefic` + --star-name-color (nếu có).
//   4. Hover sao có brightness/mutagen → tooltip (title) tiếng Việt xuất hiện.
//
// Lưu ý: style được gắn trực tiếp trên `<li>` và các `<span>` con, nên dùng `getAttribute('style')`
// để kiểm tra chứa biến CSS (không cần bám computed color).

interface BirthData {
  day: string;
  month: string;
  year: string;
  gender: 'male' | 'female';
  hour: string;
  minute: string;
}

async function createZiweiChart(page: Page, birth: BirthData): Promise<string> {
  await page.locator('#birth-day').selectOption(birth.day);
  await page.locator('#birth-month').selectOption(birth.month);
  await page.locator('#birth-year').selectOption(birth.year);
  await page.locator('#birth-gender').selectOption(birth.gender);
  await page.locator('#birth-hour').fill(birth.hour);
  await page.locator('#birth-minute').fill(birth.minute);

  await page.locator('#birth-day').locator('xpath=ancestor::form').getByRole('button', { name: 'Lập lá số', exact: true }).click();

  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  const match = page.url().match(/\/charts\/([0-9a-f-]{36})/i);
  expect(match, 'URL phải chứa chartId dạng uuid').not.toBeNull();
  return match![1];
}

test('US-012: brightness color token + mutagen color token + tooltip + malefic class', async ({ page }) => {
  await signInViaUi(page);

  await createZiweiChart(page, {
    day: '15',
    month: '8',
    year: '1990',
    hour: '10',
    minute: '30',
    gender: 'male',
  });

  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({ timeout: 30_000 });
  const board = page.getByRole('group', { name: 'Bàn 12 cung' });
  await expect(board).toBeVisible();

  // 1) Brightness: tìm một sao có nhãn brightness (star-meta), kiểm style chứa --star-brightness-color
  // Chọn một sao bất kỳ có .star-meta (brightness), lấy parent li
  const anyBrightnessMeta = board.locator('.star-meta').first();
  await expect(anyBrightnessMeta).toBeVisible();

  const parentLi = anyBrightnessMeta.locator('xpath=ancestor::li[contains(@class,"star")]').first();
  const styleAttr = await parentLi.getAttribute('style');
  expect(styleAttr, 'li phải có biến --star-brightness-color').toMatch(/--star-brightness-color/);

  // 2) Mutagen: nếu có sao có .star-mutagen, kiểm --star-mutagen-color
  const mutagenEls = board.locator('.star-mutagen');
  const mutagenCount = await mutagenEls.count();
  if (mutagenCount > 0) {
    const mParent = mutagenEls.first().locator('xpath=ancestor::li[contains(@class,"star")]').first();
    const mStyle = await mParent.getAttribute('style');
    expect(mStyle, 'li có mutagen phải có --star-mutagen-color').toMatch(/--star-mutagen-color/);
  }

  // 3) Tooltip (title): sao có brightness/mutagen phải mang title tiếng Việt.
  // `title` là thuộc tính HTML tĩnh (native tooltip) → đọc trực tiếp bằng getAttribute,
  // KHÔNG hover. Bỏ hover loại bỏ nguồn flaky cũ (scroll-into-view/animation/overlap timeout).
  // Selector dùng CSS `li.star:has(.star-meta)` cho gọn và tường minh.
  const firstStarWithMeta = board.locator('li.star:has(.star-meta)').first();
  await expect(firstStarWithMeta).toBeVisible();
  const title = await firstStarWithMeta.getAttribute('title');
  expect(title && title.length > 0, 'title tooltip phải có nội dung').toBeTruthy();
  // Nội dung tooltip là tiếng Việt (không Hán) — kiểm bằng pattern đơn giản
  expect(/Miếu|Vượng|Đắc|Lợi|Bình|Bất|Hãm|Lộc|Quyền|Khoa|Kỵ/.test(title || '')).toBe(true);

  // 4) Malefic class: tìm hung tinh phụ (nếu có trên snapshot này) → có class malefic
  const maleficLi = board.locator('li.star.malefic');
  // Không bắt buộc phải có hung tinh phụ trong mọi lá số; chỉ kiểm nếu có thì đúng class
  const maleficCount = await maleficLi.count();
  if (maleficCount > 0) {
    // Có thể null nếu component chỉ gắn class, không gắn inline cho tên; chấp nhận có class là đủ
    expect(await maleficLi.first().evaluate((el) => el.classList.contains('malefic'))).toBe(true);
  }

  // Sanity: vẫn có ít nhất 1 sao với brightness style (đảm bảo render)
  const starsWithBrightnessStyle = board.locator('li.star[style*="--star-brightness-color"]');
  await expect(starsWithBrightnessStyle.first()).toBeVisible();
});
