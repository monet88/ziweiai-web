import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-017 (web invariant): khung mở rộng 12 hệ ở contract, NHƯNG web chỉ tạo lá số cho 6 hệ
// đã có adapter (implementedChartSystems). ChartSystemPicker phải render ĐÚNG 6 hệ đó và
// KHÔNG lộ 6 hệ framework-only (hepan/mangpai/tarot/mbti/face/palm) — nếu lộ, người dùng có
// thể chọn hệ chưa implement rồi POST /charts vỡ ở tầng adapter.
//
// Selector bám id field (#dashboard-chart-system — ChartSystemPicker truyền cho SelectField)
// + nhãn tiếng Việt từ viCopy.chartSystem (KHÔNG class CSS dễ vỡ).

// CJK pattern (đồng bộ apps/web/src/lib/text/cjk.ts): Han + Hiragana/Katakana/Hangul/Bopomofo
// + dấu câu CJK + fullwidth. Dùng escape \u (không ký tự CJK literal) để khớp eslint
// no-irregular-whitespace. Không cờ g để .test() không giữ lastIndex.
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

// 6 hệ có adapter (implementedChartSystems) — nhãn Việt từ viCopy.chartSystem.
const IMPLEMENTED_LABELS = [
  'Tử Vi Đẩu Số',
  'Bát Tự',
  'Mai Hoa Dịch Số',
  'Lục Hào',
  'Đại Lục Nhâm',
  'Kỳ Môn Độn Giáp',
] as const;

// 6 hệ framework-only (US-017): có ở contract + nhãn viCopy nhưng KHÔNG được render ở picker.
const FRAMEWORK_ONLY_LABELS = ['Hợp Hôn', 'Manh Phái', 'Tarot', 'MBTI', 'Xem Tướng', 'Xem Tay'] as const;

test('US-017: ChartSystemPicker chỉ render 6 hệ implemented, ẩn 6 hệ framework-only', async ({
  page,
}) => {
  await signInViaUi(page);

  const picker = page.locator('#dashboard-chart-system');
  await expect(picker, 'Dashboard phải có ChartSystemPicker').toBeVisible();

  // Lấy đúng các <option> giá trị thật (SelectField không có placeholder cho picker này).
  const optionTexts = (await picker.locator('option').allInnerTexts()).map((text) => text.trim());

  // Đúng 6 hệ, không thừa không thiếu.
  expect(optionTexts.length, 'Picker phải có đúng 6 lựa chọn (implementedChartSystems)').toBe(
    IMPLEMENTED_LABELS.length,
  );
  expect([...optionTexts].sort()).toEqual([...IMPLEMENTED_LABELS].sort());

  // Không hệ framework-only nào được lộ ở picker.
  for (const label of FRAMEWORK_ONLY_LABELS) {
    expect(optionTexts, `Hệ framework-only "${label}" không được render ở picker`).not.toContain(
      label,
    );
  }

  // Bất biến ngôn ngữ: nhãn hệ toàn tiếng Việt, không rò chữ Hán.
  for (const text of optionTexts) {
    expect(CJK_TEXT_PATTERN.test(text), `Nhãn hệ "${text}" không được chứa chữ Hán`).toBe(false);
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
  // điền sẵn createBirthFormDraft), giờ/phút là input number khi biết giờ.
  await page.locator('#birth-day').selectOption('15');
  await page.locator('#birth-month').selectOption('8');
  await page.locator('#birth-year').selectOption('1990');
  await page.locator('#birth-hour').fill('10');
  await page.locator('#birth-minute').fill('30');

  await page.getByRole('main').getByRole('button', { name: 'Lập lá số', exact: true }).click();

  // Lập lá số thành công → điều hướng tới /charts/{uuid}.
  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
});
