import { test, expect } from '@playwright/test';
import { chartSystems, implementedChartSystems } from '@ziweiai/contracts';
import { CJK_TEXT_PATTERN } from '../../src/lib/text/cjk';
import { dashboardPickerHiddenSystems } from '../../src/lib/features/system-registry/chart-system-registry';
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

// Derive từ contract (nguồn sự thật). US-017d: 'mangpai' đã có adapter nên nằm trong
// implementedChartSystems, NHƯNG bị ẩn khỏi picker dashboard (gate-by-flag, có route riêng
// /mangpai). Picker mặc định = implemented TRỪ các hệ ẩn. Cả hệ framework-only lẫn hệ ẩn đều
// không được lộ ở picker dashboard.
const HIDDEN_SLUGS = [...dashboardPickerHiddenSystems] as readonly string[];
const PICKER_SLUGS = implementedChartSystems
  .filter((system) => !HIDDEN_SLUGS.includes(system))
  .sort();
const FRAMEWORK_ONLY_SLUGS = chartSystems.filter(
  (system) => !implementedChartSystems.includes(system as (typeof implementedChartSystems)[number]),
);
const PICKER_EXCLUDED_SLUGS = [...FRAMEWORK_ONLY_SLUGS, ...HIDDEN_SLUGS];

test('US-017: ChartSystemPicker chỉ render slug hệ được phép, ẩn framework-only + hệ gate-by-flag', async ({
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

  // Tập slug render ra phải khớp đúng danh sách được phép (implemented trừ hệ ẩn) — không thừa,
  // không thiếu.
  expect([...optionSlugs].sort()).toEqual(PICKER_SLUGS);

  // Không hệ framework-only HOẶC hệ gate-by-flag (vd mangpai) nào được lộ ở picker dashboard.
  for (const slug of PICKER_EXCLUDED_SLUGS) {
    expect(optionSlugs, `Hệ "${slug}" không được render ở picker dashboard`).not.toContain(slug);
  }

  // Bất biến ngôn ngữ: nhãn hiển thị toàn tiếng Việt, không rò chữ Hán. Đọc textContent
  // (allTextContents) thay vì innerText để không phụ thuộc layout của <option> đang đóng.
  const optionLabels = (await picker.locator('option').allTextContents()).map((text) => text.trim());
  expect(optionLabels.length, 'Mỗi slug phải có một nhãn hiển thị').toBe(PICKER_SLUGS.length);
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
    page.locator('#birth-day').locator('xpath=ancestor::form').getByRole('button', { name: 'Lập lá số', exact: true }).click(),
  ]);

  expect(
    chartRequest.postDataJSON()?.chartSystem,
    'POST /charts phải mang đúng hệ ba-zi đã chọn ở picker',
  ).toBe('ba-zi');

  // Lập lá số thành công → điều hướng tới trang chi tiết /charts/{uuid} (nới neo cuối để chấp
  // nhận trailing slash / query nếu route đổi sau này).
  await page.waitForURL(/\/charts\/[0-9a-f-]{36}(?:[/?#]|$)/i, { timeout: 30_000 });
});
