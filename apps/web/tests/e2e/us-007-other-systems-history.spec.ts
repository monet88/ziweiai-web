import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-007 full flow (acceptance): mỗi hệ thuật số khác Tử Vi qua route wrapper riêng
// (/bazi, /meihua, /liuyao, /daliuren, /qimen) → tạo lá số → mở chi tiết (card đúng hệ)
// → quét \p{Script=Han} trên vùng chi tiết = 0 ký tự Hán → quay lại /history thấy item mới.
//
// Bất biến ngôn ngữ: toàn vùng chi tiết KHÔNG có chữ Hán (key đã dịch + free-text guard).
// Selector bám role/nhãn tiếng Việt + id field (KHÔNG class CSS dễ vỡ).

// CJK pattern (copy giá trị từ apps/web/src/lib/text/cjk.ts — test E2E chạy ngoài $lib alias
// của svelte-check; giữ đồng bộ với guard runtime: Han + Hiragana/Katakana/Hangul/Bopomofo +
// dấu câu CJK + fullwidth). Dùng escape \u (không ký tự CJK literal) để khớp eslint
// no-irregular-whitespace. Không cờ g để .test() không giữ lastIndex.
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

// Dữ liệu sinh hợp lệ cho mọi hệ (biết giờ; toạ độ/múi giờ nhập tay vì chưa geocoding).
// Mỗi hệ dùng ngày khác nhau để backend không tái dùng cùng snapshot giữa các hệ.
interface SystemCase {
  route: string;
  navLabel: string;
  systemLabel: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
}

const SYSTEM_CASES: readonly SystemCase[] = [
  { route: '/bazi', navLabel: 'Mở màn hình Bát Tự', systemLabel: 'Bát Tự', day: '15', month: '8', year: '1990', hour: '10', minute: '30' },
  { route: '/meihua', navLabel: 'Mở màn hình Mai Hoa', systemLabel: 'Mai Hoa Dịch Số', day: '3', month: '2', year: '1985', hour: '14', minute: '45' },
  { route: '/liuyao', navLabel: 'Mở màn hình Lục Hào', systemLabel: 'Lục Hào', day: '21', month: '11', year: '1978', hour: '8', minute: '15' },
  { route: '/daliuren', navLabel: 'Mở màn hình Đại Lục Nhâm', systemLabel: 'Đại Lục Nhâm', day: '7', month: '5', year: '2001', hour: '20', minute: '5' },
  { route: '/qimen', navLabel: 'Mở màn hình Kỳ Môn', systemLabel: 'Kỳ Môn Độn Giáp', day: '29', month: '9', year: '1995', hour: '6', minute: '50' },
];

// Điền form sinh trên màn hình hệ (đã đặt mặc định chartSystem) rồi submit. Trả chartId từ URL.
async function createChartForSystem(page: Page, birth: SystemCase): Promise<string> {
  await page.locator('#birth-day').fill(birth.day);
  await page.locator('#birth-month').fill(birth.month);
  await page.locator('#birth-year').fill(birth.year);
  await page.locator('#birth-hour').fill(birth.hour);
  await page.locator('#birth-minute').fill(birth.minute);
  await page.locator('#birth-latitude').fill('10.762622');
  await page.locator('#birth-longitude').fill('106.660172');
  await page.locator('#birth-timezone').fill('Asia/Ho_Chi_Minh');

  await page.getByRole('main').getByRole('button', { name: 'Lập lá số', exact: true }).click();

  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  const match = page.url().match(/\/charts\/([0-9a-f-]{36})/i);
  expect(match, 'URL phải chứa chartId dạng uuid').not.toBeNull();
  return match![1];
}

test('US-007: 5 hệ thuật số khác → tạo → chi tiết VN không Hán → history thấy item mới', async ({
  page,
}) => {
  await signInViaUi(page);

  for (const birth of SYSTEM_CASES) {
    // ---- Mở màn hình hệ qua lối tắt ở dashboard ----
    await page.getByRole('link', { name: birth.navLabel, exact: true }).click();
    await page.waitForURL(new RegExp(`${birth.route}$`), { timeout: 15_000 });
    await expect(page.locator('#birth-day')).toBeVisible();

    // ---- Tạo lá số hệ này ----
    const chartId = await createChartForSystem(page, birth);

    // ---- Chi tiết: rời trạng thái tải, vùng main hiển thị card hệ ----
    await expect(page.getByRole('heading', { name: 'Luận giải AI' })).toBeVisible({
      timeout: 30_000,
    });
    const main = page.getByRole('main');
    const mainText = (await main.innerText()).trim();
    expect(mainText.length, `Chi tiết ${birth.systemLabel} phải có nội dung`).toBeGreaterThan(0);

    // Bất biến ngôn ngữ: toàn vùng chi tiết KHÔNG rò chữ Hán.
    expect(
      CJK_TEXT_PATTERN.test(mainText),
      `Chi tiết ${birth.systemLabel} không được rò chữ Hán`,
    ).toBe(false);

    // ---- Quay lại trang chính rồi mở lịch sử ----
    await page.getByRole('button', { name: 'Quay về trang chính', exact: true }).click();
    await page.waitForURL(/\/$/, { timeout: 15_000 });
    await page.getByRole('link', { name: 'Xem toàn bộ lịch sử', exact: true }).click();
    await page.waitForURL(/\/history$/, { timeout: 15_000 });

    // History thấy item lá số hệ vừa tạo (nhãn hệ tiếng Việt). Mở lại đúng route chi tiết.
    const historyItem = page
      .getByRole('button')
      .filter({ hasText: birth.systemLabel })
      .first();
    await expect(historyItem, `Lịch sử phải có lá số ${birth.systemLabel} vừa tạo`).toBeVisible({
      timeout: 15_000,
    });
    await historyItem.click();
    await page.waitForURL(new RegExp(`/charts/${chartId}$`, 'i'), { timeout: 15_000 });

    // Về dashboard để vòng lặp hệ tiếp theo bắt đầu từ lối tắt.
    await page.getByRole('button', { name: 'Quay về trang chính', exact: true }).click();
    await page.waitForURL(/\/$/, { timeout: 15_000 });
  }
});
