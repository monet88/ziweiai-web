import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-011: lớp đường nối tam phương tứ chính + hover-dim trên bàn vuông Tử Vi.
// Kiểm 3 hành vi theo Acceptance Criteria:
//   1. Mở lá số → đường nối hiển thị SẴN (auto-chọn Mệnh), không cần tương tác; KHÔNG dim ô nào.
//   2. Hover một cung → cung ngoài tam phương tứ chính mờ đi (class `dimmed`); đường nối vẫn vẽ.
//   3. Rời chuột → hết dim (quay về trạng thái cung đang hiệu lực).
//
// SVG overlay là trang trí thuần (aria-hidden, pointer-events:none) nên KHÔNG có role/nhãn để
// bám — buộc dùng selector class `.aspect-overlay line`. Tương tự, dim là class `dimmed` trên ô.
// Đây là ngoại lệ có chủ đích so với quy ước "bám role/nhãn": phần trình bày thuần không phơi
// ngữ nghĩa a11y nào để bám thay thế.

interface BirthData {
  day: string;
  month: string;
  year: string;
  gender: 'male' | 'female';
  hour: string;
  minute: string;
}

// Điền form sinh Tử Vi hợp lệ rồi submit; trả chartId từ URL. (Trùng helper us-006: mỗi spec
// tự chứa theo quy ước hiện tại — không export chéo giữa các spec.)
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

test('US-011: đường nối hiển thị sẵn (auto-Mệnh) → hover dim cung ngoài → rời chuột hết dim', async ({
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
  const board = page.getByRole('group', { name: 'Bàn 12 cung' });
  await expect(board).toBeVisible();

  // ---- (1) Mặc định: đường nối auto-Mệnh vẽ sẵn, không dim ô nào ----
  // Tam phương tứ chính = 4 cung; loại chính cung → 3 đoạn nối từ cung Mệnh.
  const aspectLines = board.locator('svg.aspect-overlay line');
  await expect(aspectLines).toHaveCount(3);

  // Chưa hover → không ô nào bị mờ.
  const dimmedCells = board.locator('button.cell.dimmed');
  await expect(dimmedCells).toHaveCount(0);

  // ---- (2) Hover một cung → dim cung ngoài tam phương tứ chính ----
  // Hover cung đầu tiên; dù là cung nào, luôn có cung ngoài aspect → ít nhất 1 ô mờ.
  const palaceButtons = board.getByRole('button');
  await palaceButtons.first().hover();

  await expect(async () => {
    expect(await dimmedCells.count()).toBeGreaterThan(0);
  }).toPass();
  // Đường nối vẫn vẽ (3 đoạn) theo cung đang hover.
  await expect(aspectLines).toHaveCount(3);

  // ---- (3) Rời chuột → hết dim ----
  // Di con trỏ ra khỏi bàn (lên tiêu đề) → onmouseleave bắn → hoveredPalaceKey = null.
  await page.getByRole('heading', { name: 'Lá số 12 cung' }).hover();
  await expect(dimmedCells).toHaveCount(0);
  // Đường nối vẫn còn (quay về auto-Mệnh / cung đang chọn), không biến mất.
  await expect(aspectLines).toHaveCount(3);
});
