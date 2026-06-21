import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-017c (live): luồng Hợp Hôn end-to-end. Cờ EXTENDED_SYSTEM_HEPAN_ENABLED bật ở playwright
// webServer env. Nhập thông tin sinh 2 người (dropdown ngày/tháng/năm + giới tính, biết giờ →
// nhập giờ/phút), chọn loại quan hệ, submit → màn kết quả hiện điểm tương hợp. Selector bám
// id field + nhãn/role tiếng Việt (KHÔNG class CSS).

async function fillPerson(
  page: import('@playwright/test').Page,
  prefix: string,
  birth: { day: string; month: string; year: string; hour: string; minute: string },
): Promise<void> {
  await page.locator(`#${prefix}-birth-day`).selectOption(birth.day);
  await page.locator(`#${prefix}-birth-month`).selectOption(birth.month);
  await page.locator(`#${prefix}-birth-year`).selectOption(birth.year);
  // Chọn giới tính thật (mặc định draft là 'unknown' → lá số ziwei bị blocked); đặt để e2e
  // đi đúng luồng lá số hợp lệ, không phải nhánh blocked.
  await page.locator(`#${prefix}-birth-gender`).selectOption('female');
  await page.locator(`#${prefix}-birth-hour`).fill(birth.hour);
  await page.locator(`#${prefix}-birth-minute`).fill(birth.minute);
}

test('US-017c: ghép đôi Hợp Hôn qua UI → hiện mức tương hợp', async ({ page }) => {
  await signInViaUi(page);

  await page.goto('/hepan');
  await expect(page.getByRole('heading', { name: 'Ghép đôi Hợp Hôn' })).toBeVisible();

  await fillPerson(page, 'hepan-primary', { day: '15', month: '6', year: '1990', hour: '12', minute: '0' });
  await fillPerson(page, 'hepan-partner', { day: '8', month: '3', year: '1992', hour: '9', minute: '0' });

  await page.getByRole('button', { name: 'Xem mức tương hợp', exact: true }).click();

  // Kết quả: tiêu đề tổng quan + điểm tương hợp (0-100) hiển thị.
  await expect(page.getByText('Mức tương hợp tổng quan', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Các chiều tương hợp', { exact: true })).toBeVisible();
});
