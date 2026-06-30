import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-015: panel vận hạn 4 tầng (đại vận → lưu niên → lưu nguyệt → lưu nhật) cạnh bàn 12 cung.
// Kiểm flow phân cấp theo Acceptance Criteria:
//   1. Mở lá số Tử Vi → panel "Vận hạn" hiển thị với các chip đại vận; đại vận chứa năm hiện
//      tại được preselect (aria-pressed=true). Vùng lưu niên render (đại vận mặc định đã chọn);
//      vùng lưu nguyệt + lưu nhật ẩn (chưa chọn lưu niên).
//   2. Click 1 chip lưu niên → vùng lưu nguyệt render 12 chip; vùng lưu nhật vẫn ẩn.
//   3. Click 1 chip lưu nguyệt → vùng lưu nhật render 28–31 chip.
//   4. Click 1 chip lưu nhật → bàn 12 cung có 4 ô outline 4 màu khác nhau
//      (.cell.in-decadal / .in-yearly / .in-monthly / .in-daily).
//   5. Click LẠI chip lưu niên đang chọn → toggle off → vùng lưu nguyệt + lưu nhật ẩn lại;
//      overlay yearly/monthly/daily biến mất, overlay decadal còn.
//
// Selector bám role/nhãn tiếng Việt (panel = aria-label "Vận hạn", mỗi vùng role=group +
// aria-label; chip = button + aria-pressed), trừ class overlay `.in-decadal`/... là phần
// trình bày thuần không phơi ngữ nghĩa a11y — ngoại lệ có chủ đích như us-008/us-011.

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

test('US-015: panel vận hạn 4 tầng — chọn phân cấp + overlay 4 màu + toggle off reset tầng dưới', async ({
  page,
}) => {
  await signInViaUi(page);

  await createZiweiChart(page, {
    day: '15',
    month: '8',
    year: '1990',
    hour: '10',
    minute: '30',
    gender: 'male',
  });

  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({
    timeout: 30_000,
  });

  // ---- (1) Panel hiển thị, vùng đại vận có chip; đại vận mặc định preselect ----
  // Panel là <aside aria-label="Vận hạn"> → landmark complementary (không phải group).
  const panel = page.getByRole('complementary', { name: 'Vận hạn' });
  await expect(panel).toBeVisible();

  const decadalSection = page.getByRole('group', { name: 'Đại vận (10 năm)' });
  await expect(decadalSection).toBeVisible();
  const decadalChips = decadalSection.getByRole('button');
  await expect(async () => {
    expect(await decadalChips.count()).toBeGreaterThanOrEqual(8);
  }).toPass();

  // Đại vận chứa năm hiện tại được preselect (đúng 1 chip aria-pressed=true).
  await expect(decadalSection.getByRole('button', { pressed: true })).toHaveCount(1);

  // Vùng lưu niên render (đại vận mặc định đã chọn) với các chip năm.
  const yearlySection = page.getByRole('group', { name: 'Lưu niên' });
  await expect(yearlySection).toBeVisible();
  const yearlyChips = yearlySection.getByRole('button');
  await expect(async () => {
    expect(await yearlyChips.count()).toBeGreaterThanOrEqual(10);
  }).toPass();

  // Vùng lưu nguyệt + lưu nhật chưa hiện (chưa chọn lưu niên).
  await expect(page.getByRole('group', { name: 'Lưu nguyệt' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Lưu nhật' })).toHaveCount(0);

  // ---- (2) Click 1 chip lưu niên → vùng lưu nguyệt render ----
  await yearlyChips.first().click();

  const monthlySection = page.getByRole('group', { name: 'Lưu nguyệt' });
  await expect(monthlySection).toBeVisible({ timeout: 15_000 });
  await expect(monthlySection.getByRole('button')).toHaveCount(12);

  // Lưu nhật vẫn ẩn (chưa chọn lưu nguyệt).
  await expect(page.getByRole('group', { name: 'Lưu nhật' })).toHaveCount(0);

  // ---- (3) Click 1 chip lưu nguyệt → vùng lưu nhật render 28–31 chip ----
  await monthlySection.getByRole('button').first().click();

  const dailySection = page.getByRole('group', { name: 'Lưu nhật' });
  await expect(dailySection).toBeVisible({ timeout: 15_000 });
  await expect(async () => {
    const count = await dailySection.getByRole('button').count();
    expect(count).toBeGreaterThanOrEqual(28);
    expect(count).toBeLessThanOrEqual(31);
  }).toPass();

  // ---- (4) Click 1 chip lưu nhật → bàn có 4 ô outline 4 màu khác nhau ----
  await dailySection.getByRole('button').first().click();

  const board = page.getByRole('group', { name: 'Bàn 12 cung' });
  // Overlay đại vận luôn có (đại vận đã chọn từ đầu). Sau khi chọn đủ 4 tầng + frame về,
  // 4 class overlay xuất hiện. Frame yearly/monthly/daily là network → chờ.
  await expect(board.locator('.cell.in-decadal')).toHaveCount(1, { timeout: 15_000 });
  await expect(board.locator('.cell.in-yearly')).toHaveCount(1, { timeout: 15_000 });
  await expect(board.locator('.cell.in-monthly')).toHaveCount(1, { timeout: 15_000 });
  await expect(board.locator('.cell.in-daily')).toHaveCount(1, { timeout: 15_000 });

  // ---- (5) Toggle off chip lưu niên đang chọn → vùng lưu nguyệt + nhật ẩn lại ----
  await yearlySection.getByRole('button', { pressed: true }).click();

  await expect(page.getByRole('group', { name: 'Lưu nguyệt' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Lưu nhật' })).toHaveCount(0);
  // Overlay yearly/monthly/daily biến mất; overlay decadal còn (đại vận vẫn chọn).
  await expect(board.locator('.cell.in-yearly')).toHaveCount(0);
  await expect(board.locator('.cell.in-monthly')).toHaveCount(0);
  await expect(board.locator('.cell.in-daily')).toHaveCount(0);
  await expect(board.locator('.cell.in-decadal')).toHaveCount(1);
});
