import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// Hardening (PR #37): khi GET /history lỗi mạng, HistoryList hiện NoticeBanner danger +
// nút "Thử lại" (query.refetch). Spec này chặn /history trả 500 (KHÔNG phải 401 → không
// kích redirect /sign-in của query-client) để buộc nhánh lỗi, khẳng định banner + nút, rồi
// gỡ chặn cho backend thật phục hồi và bấm "Thử lại" → nhánh lỗi biến mất.
//
// Selector bám role/nhãn tiếng Việt (KHÔNG class CSS dễ vỡ), khớp các spec khác.

// Khớp mọi request GET /history?limit=N bất kể host (apiBaseUrl local hay cloud).
const HISTORY_ROUTE = /\/history\?limit=/;

test('US-007 hardening: lỗi tải lịch sử hiện nút "Thử lại" và refetch thành công', async ({
  page,
}) => {
  await signInViaUi(page);

  // ---- Chặn /history trả 500 TRƯỚC khi mở màn lịch sử (limit=20, khác cache sidebar 8) ----
  await page.route(HISTORY_ROUTE, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'internal_error',
        message: 'Lỗi máy chủ giả lập cho E2E.',
        requestId: 'e2e-history-fail',
      }),
    });
  });

  // ---- Điều hướng client-side sang /history → HistoryList fetch → vào nhánh lỗi ----
  await page
    .getByRole('navigation', { name: 'Hệ thuật số khác' })
    .getByRole('link', { name: 'Xem toàn bộ lịch sử', exact: true })
    .click();
  await page.waitForURL(/\/history$/, { timeout: 15_000 });

  // ---- Banner danger (role=alert) + nút "Thử lại" hiện ra ----
  const errorBanner = page.getByRole('alert');
  await expect(errorBanner).toBeVisible({ timeout: 15_000 });
  await expect(errorBanner).toContainText('Không tải được lịch sử lá số');
  const retryButton = page.getByRole('button', { name: 'Thử lại', exact: true });
  await expect(retryButton).toBeVisible();

  // ---- Gỡ chặn → backend thật phục hồi → bấm "Thử lại" (refetch) ----
  await page.unroute(HISTORY_ROUTE);
  await retryButton.click();

  // ---- Nhánh lỗi biến mất: banner + nút "Thử lại" không còn (refetch thành công) ----
  await expect(retryButton).toBeHidden({ timeout: 15_000 });
  await expect(page.getByRole('alert')).toBeHidden();
});
