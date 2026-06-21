import { test, expect } from '@playwright/test';
import { chartSystems, implementedChartSystems } from '@ziweiai/contracts';
import { CJK_TEXT_PATTERN } from '../../src/lib/text/cjk';
import { signInViaUi } from './sign-in';

// US-017 (web invariant): khung mở rộng 12 hệ ở contract, NHƯNG web chỉ tạo lá số cho 6 hệ
// đã có adapter (implementedChartSystems). ChartSystemPicker phải render ĐÚNG 6 hệ đó và
// KHÔNG lộ 6 hệ framework-only (hepan/mangpai/tarot/mbti/face/palm) — nếu lộ, người dùng có
// thể chọn hệ chưa implement rồi POST /charts vỡ ở tầng adapter.
//
// Selector bám id field (#dashboard-chart-system — ChartSystemPicker truyền cho SelectField)
// + giá trị option = system slug (ChartSystemPicker đặt value={system}). Khẳng định bám SLUG
// (bất biến thật) thay vì nhãn copy, và derive kỳ vọng trực tiếp từ @ziweiai/contracts để
// test không phải nhân bản danh sách hệ.

// Derive từ contract (nguồn sự thật): 6 hệ implemented + phần framework-only = 12 hệ trừ đi 6.
const IMPLEMENTED_SLUGS = [...implementedChartSystems].sort();
const FRAMEWORK_ONLY_SLUGS = chartSystems.filter(
  (system) => !implementedChartSystems.includes(system as (typeof implementedChartSystems)[number]),
);

test('US-017: ChartSystemPicker chỉ render slug 6 hệ implemented, ẩn 6 hệ framework-only', async ({
  page,
}) => {
  await signInViaUi(page);

  const picker = page.locator('#dashboard-chart-system');
  await expect(picker, 'Dashboard phải có ChartSystemPicker').toBeVisible();

  // Đọc value qua evaluateAll (thuộc tính DOM, KHÔNG phụ thuộc layout) — <option> trong <select>
  // đóng không có hộp render nên allInnerTexts() có thể trả rỗng tuỳ môi trường (flaky).
  const optionSlugs = await picker
    .locator('option')
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));

  // Tập slug render ra phải khớp đúng implementedChartSystems — không thừa, không thiếu.
  expect([...optionSlugs].sort()).toEqual(IMPLEMENTED_SLUGS);

  // Không hệ framework-only nào được lộ ở picker.
  for (const slug of FRAMEWORK_ONLY_SLUGS) {
    expect(optionSlugs, `Hệ framework-only "${slug}" không được render ở picker`).not.toContain(
      slug,
    );
  }

  // Bất biến ngôn ngữ: nhãn hiển thị toàn tiếng Việt, không rò chữ Hán. Đọc textContent
  // (allTextContents) thay vì innerText để không phụ thuộc layout của <option> đang đóng.
  const optionLabels = (await picker.locator('option').allTextContents()).map((text) => text.trim());
  expect(optionLabels.length, 'Mỗi slug phải có một nhãn hiển thị').toBe(IMPLEMENTED_SLUGS.length);
  for (const label of optionLabels) {
    expect(label.length, 'Nhãn hệ không được rỗng').toBeGreaterThan(0);
    expect(CJK_TEXT_PATTERN.test(label), `Nhãn hệ "${label}" không được chứa chữ Hán`).toBe(false);
  }
});

test('US-017: đổi sang hệ implemented khác rồi lập được lá số (POST /charts qua picker)', async ({
  page,
}) => {
  await signInViaUi(page);

  const picker = page.locator('#dashboard-chart-system');
  await expect(picker).toBeVisible();

  // Đổi sang Bát Tự (giá trị ba-zi) để xác nhận picker đẩy lựa chọn vào model + form lập được lá số.
  await picker.selectOption({ label: 'Bát Tự' });
  await expect(picker).toHaveValue('ba-zi');

  // Ngày/tháng/năm là <select> (US-005 #22 rút gọn form); toạ độ + múi giờ mặc định VN (ẩn,
  // điền sẵn createBirthFormDraft), giờ/phút là input number khi biết giờ. Dùng ngày sinh
  // RIÊNG (22/3/1988) khác us-007 để backend không dedupe/đụng snapshot giữa các spec.
  await page.locator('#birth-day').selectOption('22');
  await page.locator('#birth-month').selectOption('3');
  await page.locator('#birth-year').selectOption('1988');
  await page.locator('#birth-hour').fill('9');
  await page.locator('#birth-minute').fill('15');

  // Chặn POST /charts để khẳng định lựa chọn picker (ba-zi) đi TRỌN vào payload — bằng chứng
  // trực tiếp cho đường picker → POST /charts, không phụ thuộc render lịch sử/AI hay dedupe
  // snapshot. Một regression bỏ qua picker và mặc định 'zi-wei-dou-shu' sẽ làm assert này fail.
  const [chartRequest] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/charts'),
      { timeout: 30_000 },
    ),
    page.getByRole('main').getByRole('button', { name: 'Lập lá số', exact: true }).click(),
  ]);

  expect(
    chartRequest.postDataJSON()?.chartSystem,
    'POST /charts phải mang đúng hệ ba-zi đã chọn ở picker',
  ).toBe('ba-zi');

  // Lập lá số thành công → điều hướng tới trang chi tiết /charts/{uuid} (nới neo cuối để chấp
  // nhận trailing slash / query nếu route đổi sau này).
  await page.waitForURL(/\/charts\/[0-9a-f-]{36}(?:[/?#]|$)/i, { timeout: 30_000 });
});
