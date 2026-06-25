import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-014: đa màu cung hạn & thông tin cung hạn — E2E test chức năng riêng biệt.
// Kiểm các hành vi:
//   1. Sau khi chọn đủ 4 tầng vận hạn (đại vận → lưu niên → lưu nguyệt → lưu nhật),
//      ô cung có flow-bar segments (.flow-bar__seg--decadal / --yearly / --monthly / --daily)
//      tương ứng — thanh chỉ báo đa màu hiện trên mỗi ô là cung Mệnh của tầng đó.
//   2. CSS horoscope-color tokens (--color-horoscope-decadal, --color-horoscope-yearly,
//      --color-horoscope-monthly, --color-horoscope-daily) được khai báo trong :root.
//   3. Ô có flow flags hiển thị box-shadow ring phân tầng.
//
// KHÔNG trùng US-015 (test panel phân cấp chọn/toggle): US-014 tập trung vào hiển thị đa màu.

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

  await page.getByRole('main').getByRole('button', { name: 'Lập lá số', exact: true }).click();

  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  const match = page.url().match(/\/charts\/([0-9a-f-]{36})/i);
  expect(match, 'URL phải chứa chartId dạng uuid').not.toBeNull();
  return match![1];
}

test('US-014: horoscope color tokens tồn tại trong :root', async ({ page }) => {
  await signInViaUi(page);

  // Kiểm tra CSS custom properties (design token) khai báo trên document
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      decadal: style.getPropertyValue('--color-horoscope-decadal').trim(),
      yearly: style.getPropertyValue('--color-horoscope-yearly').trim(),
      monthly: style.getPropertyValue('--color-horoscope-monthly').trim(),
      daily: style.getPropertyValue('--color-horoscope-daily').trim(),
    };
  });

  // Mỗi token phải có giá trị (không rỗng) — chứng minh design token đã khai báo
  expect(tokens.decadal.length, '--color-horoscope-decadal phải có giá trị').toBeGreaterThan(0);
  expect(tokens.yearly.length, '--color-horoscope-yearly phải có giá trị').toBeGreaterThan(0);
  expect(tokens.monthly.length, '--color-horoscope-monthly phải có giá trị').toBeGreaterThan(0);
  expect(tokens.daily.length, '--color-horoscope-daily phải có giá trị').toBeGreaterThan(0);

  // 4 token phải khác nhau (đa màu)
  const unique = new Set([tokens.decadal, tokens.yearly, tokens.monthly, tokens.daily]);
  expect(unique.size, '4 token horoscope phải có 4 màu khác nhau').toBe(4);

  await page.screenshot({ path: 'test-results/us-014-horoscope-tokens.png', fullPage: true });
});

test('US-014: chọn 4 tầng → flow-bar segments đa màu hiện trên ô cung Mệnh', async ({ page }) => {
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

  const board = page.getByRole('group', { name: 'Bàn 12 cung' });
  await expect(board).toBeVisible();

  // Đại vận mặc định đã preselect → vùng lưu niên render
  const yearlySection = page.getByRole('group', { name: 'Lưu niên' });
  await expect(yearlySection).toBeVisible();
  await yearlySection.getByRole('button').first().click();

  // Lưu nguyệt
  const monthlySection = page.getByRole('group', { name: 'Lưu nguyệt' });
  await expect(monthlySection).toBeVisible({ timeout: 15_000 });
  await monthlySection.getByRole('button').first().click();

  // Lưu nhật
  const dailySection = page.getByRole('group', { name: 'Lưu nhật' });
  await expect(dailySection).toBeVisible({ timeout: 15_000 });
  await dailySection.getByRole('button').first().click();

  // Chờ overlay 4 tầng trên bàn cung
  await expect(board.locator('.cell.in-decadal')).toHaveCount(1, { timeout: 15_000 });
  await expect(board.locator('.cell.in-yearly')).toHaveCount(1, { timeout: 15_000 });
  await expect(board.locator('.cell.in-monthly')).toHaveCount(1, { timeout: 15_000 });
  await expect(board.locator('.cell.in-daily')).toHaveCount(1, { timeout: 15_000 });

  // Flow-bar segments: ít nhất 1 ô có thanh đa màu (.flow-bar) với segment decadal
  const flowBars = board.locator('.flow-bar');
  await expect(flowBars.first()).toBeVisible();

  // Sau khi chọn đủ 4 tầng, cả 4 loại segment phải render (không chỉ đại vận) — nếu chỉ
  // kiểm decadal thì regression ở lưu niên/lưu nguyệt/lưu nhật sẽ lọt.
  await expect(board.locator('.flow-bar__seg--decadal').first()).toBeVisible();
  await expect(board.locator('.flow-bar__seg--yearly').first()).toBeVisible();
  await expect(board.locator('.flow-bar__seg--monthly').first()).toBeVisible();
  await expect(board.locator('.flow-bar__seg--daily').first()).toBeVisible();

  // Ô cung Mệnh đại vận có box-shadow ring (horoscopeRing inline style)
  const decadalCell = board.locator('.cell.in-decadal');
  const cellStyle = await decadalCell.getAttribute('style');
  expect(cellStyle, 'ô in-decadal phải có box-shadow ring').toMatch(/box-shadow/);

  await page.screenshot({ path: 'test-results/us-014-flow-bar-multi-color.png', fullPage: true });
});
