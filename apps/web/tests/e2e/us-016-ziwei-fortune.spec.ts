import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-016: section "Vận hạn" trên chi tiết lá số Tử Vi — card vận ngày + vận tháng (thuần đọc,
// không LLM) và nút báo cáo năm (gate AI). Kiểm theo Acceptance Criteria:
//   1. Mở lá số Tử Vi → section "Vận hạn" hiển thị; card vận ngày + vận tháng render với tiêu
//      đề tiếng Việt và mốc ngày (YYYY-MM-DD) / tháng (YYYY-MM); summary về (data) thay vì kẹt
//      ở trạng thái loading/error.
//   2. Nút "Tạo báo cáo năm" hiển thị. Click → hoặc mở modal Markdown (cờ beta bật + entitled),
//      hoặc hiện CTA paywall (402). Cả hai nhánh đều là output tiếng Việt hợp lệ — test chấp
//      nhận một trong hai (môi trường E2E không cố định cờ AI_ANNUAL_REPORT_ENABLED).
//
// Selector bám role/nhãn tiếng Việt (section aria-label "Vận hạn"; card heading; nút theo nhãn).

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

test('US-016: section Vận hạn — card vận ngày/tháng render + nút báo cáo năm', async ({ page }) => {
  // Báo cáo năm gọi LLM thật (tổng hợp lưu niên + 12 lưu nguyệt) — backend cho phép tới
  // AI_ANNUAL_REPORT_TIMEOUT_MS (mặc định 60s, decision 0014). Nới per-test timeout để nhánh
  // modal sinh hợp lệ không bị Playwright cắt trước backend.
  test.setTimeout(150_000);

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

  // ---- (1) Section "Vận hạn" hiển thị với card vận ngày + vận tháng ----
  const fortuneSection = page.getByRole('region', { name: 'Vận hạn' });
  await expect(fortuneSection).toBeVisible({ timeout: 15_000 });

  const dailyCard = page.getByRole('article', { name: 'Vận hôm nay' });
  const monthlyCard = page.getByRole('article', { name: 'Vận tháng này' });
  await expect(dailyCard).toBeVisible();
  await expect(monthlyCard).toBeVisible();

  // Mốc ngày/tháng hiển thị (YYYY-MM-DD trong card ngày, YYYY-MM trong card tháng).
  await expect(dailyCard.getByText(/^\d{4}-\d{2}-\d{2}$/)).toBeVisible();
  await expect(monthlyCard.getByText(/^\d{4}-\d{2}$/)).toBeVisible();

  // Summary về (không kẹt loading/error). Trạng thái loading dùng "Đang tính…", error "Không tải
  // được…" → chờ chúng biến mất, đoạn summary là <p class="fortune-card__summary"> còn lại.
  await expect(dailyCard.getByText('Đang tính vận ngày…')).toHaveCount(0, { timeout: 20_000 });
  await expect(dailyCard.getByRole('alert')).toHaveCount(0);
  await expect(monthlyCard.getByText('Đang tính vận tháng…')).toHaveCount(0, { timeout: 20_000 });
  await expect(monthlyCard.getByRole('alert')).toHaveCount(0);

  // ---- (2) Nút báo cáo năm: click → modal Markdown HOẶC CTA paywall (402) ----
  const annualButton = page.getByRole('button', { name: 'Tạo báo cáo năm' });
  await expect(annualButton).toBeVisible();
  await annualButton.click();

  // Chờ một trong hai nhánh: dialog báo cáo năm, hoặc CTA nâng cấp (paywall 402). Nhánh modal
  // gọi LLM thật sinh ~600-1200 từ → backend cho tới AI_ANNUAL_REPORT_TIMEOUT_MS (60s, decision
  // 0014); chờ 70s để generation hợp lệ chậm không bị cắt trước backend (paywall thì trả tức thì).
  const modal = page.getByRole('dialog', { name: /Báo cáo năm/ });
  const paywallCta = page.getByRole('button', { name: 'Nâng cấp để tạo báo cáo năm' });
  await expect(modal.or(paywallCta).first()).toBeVisible({ timeout: 70_000 });
});
