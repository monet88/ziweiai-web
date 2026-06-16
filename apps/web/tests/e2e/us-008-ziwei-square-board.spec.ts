import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-008: bàn 12 cung Tử Vi vuông trực quan 4×4 + tam phương tứ chính làm nổi.
// Kiểm 3 hành vi theo Acceptance Criteria:
//   1. Mở lá số Tử Vi → bàn vuông 4×4 hiển thị (class `.board`, role group, 4 cột).
//   2. Chọn một cung → cung đó selected (aria-pressed=true) + tam phương tứ chính nổi
//      (class `.in-aspect` trên 3 cung khác).
//   3. Mobile: viewport hẹp → bàn cuộn ngang `.board-scroll` thay vì vỡ layout (class
//      `.grid` fallback cho legacy; snapshot có đủ địa chi → không rơi fallback).
//
// Selector bám role/nhãn tiếng Việt + aria attribute, trừ class `.board`/`.board-scroll`/
// `.in-aspect` là phần trình bày thuần không có ngữ nghĩa a11y thay thế.

interface BirthData {
  day: string;
  month: string;
  year: string;
  gender: 'male' | 'female';
  hour: string;
  minute: string;
}

async function createZiweiChart(page: Page, birth: BirthData): Promise<string> {
  await page.locator('#birth-day').fill(birth.day);
  await page.locator('#birth-month').fill(birth.month);
  await page.locator('#birth-year').fill(birth.year);
  await page.locator('#birth-gender').selectOption(birth.gender);
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

test('US-008: bàn vuông 4×4 desktop → chọn cung nổi tam phương tứ chính → mobile cuộn ngang', async ({
  page,
}) => {
  await signInViaUi(page);

  // ---- Desktop: bàn vuông 4×4 hiển thị ----
  await page.setViewportSize({ width: 1280, height: 900 });

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

  // Bàn vuông hiện ra dưới dạng grid `.board` (không phải `.grid` fallback).
  const board = page.locator('.board');
  await expect(board).toBeVisible();

  // 12 cung là <button> trong bàn.
  const palaceButtons = board.getByRole('button');
  await expect(async () => {
    expect(await palaceButtons.count()).toBeGreaterThanOrEqual(12);
  }).toPass();

  // Grid 4 cột (template-columns: repeat(4, 1fr)).
  const gridColumns = await board.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  expect(gridColumns.split(' ').length, 'Bàn vuông phải có 4 cột').toBe(4);

  // ---- Chọn một cung → tam phương tứ chính nổi ----
  // Ban đầu chưa chọn → không cung nào selected.
  const pressedBefore = await board
    .getByRole('button', { pressed: true })
    .evaluateAll((nodes) => nodes.length);
  expect(pressedBefore, 'Chưa chọn cung → không selected').toBe(0);

  // Chọn cung đầu tiên (bấm vào ô).
  await palaceButtons.first().click();
  await expect(palaceButtons.first()).toHaveAttribute('aria-pressed', 'true');

  // Tam phương tứ chính = 3 cung khác nổi viền (class `.in-aspect`).
  const aspectCells = board.locator('button.cell.in-aspect');
  await expect(aspectCells).toHaveCount(3);

  // ---- Mobile: viewport hẹp → cuộn ngang ----
  await page.setViewportSize({ width: 375, height: 812 });

  // Bàn vuông vẫn trên mobile (không rơi về `.grid` fallback).
  await expect(board).toBeVisible();
  await expect(page.locator('.board-scroll')).toBeVisible();

  // Cuộn được ngang: container board-scroll có overflow-x: auto + nội dung rộng hơn.
  const scrollEl = page.locator('.board-scroll');
  const canScroll = await scrollEl.evaluate(
    (el) => el.scrollWidth > el.clientWidth,
  );
  expect(canScroll, 'Mobile phải cuộn ngang được (scrollWidth > clientWidth)').toBe(true);
});
