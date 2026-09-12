import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

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

  await page.locator('.submit-wrapper button, button:has-text("KHỞI TẠO THIÊN BÀN")').click();

  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  const match = page.url().match(/\/charts\/([0-9a-f-]{36})/i);
  expect(match, 'URL phải chứa chartId dạng uuid').not.toBeNull();
  return match![1];
}

test.describe('Sprint 81: Core User Journey & Monetization Verification', () => {
  test('1. Flow Lập lá số -> Kiểm tra nút Hồ Sơ Hoàng Gia -> Phản hồi Paywall khi chưa đủ XU', async ({ page }) => {
    await signInViaUi(page);

    // Lập lá số mới
    const birthData: BirthData = {
      day: '15',
      month: '8',
      year: '1992',
      gender: 'male',
      hour: '09',
      minute: '30',
    };
    const chartId = await createZiweiChart(page, birthData);
    expect(chartId).toBeTruthy();

    // Kiểm tra nút Hồ Sơ Hoàng Gia 50 XU hiển thị
    const royalDossierBtn = page.locator('.btn-royal-dossier');
    await expect(royalDossierBtn).toBeVisible({ timeout: 15_000 });
    await expect(royalDossierBtn).toContainText('Hồ Sơ Hoàng Gia');

    // Bấm vào nút Hồ Sơ Hoàng Gia
    await royalDossierBtn.click();

    // Người dùng chưa có đủ 50 XU -> GlobalPaywallModal hiện ra với VietQR Live TPBank
    const paywallModal = page.locator('.paywall-modal');
    await expect(paywallModal).toBeVisible({ timeout: 10_000 });
    await expect(paywallModal).toContainText('Tính năng Hoàng Gia');
    await expect(paywallModal).toContainText('Cần: 50 XU');
    await expect(paywallModal).toContainText('36889338888');

    // Đóng Paywall Modal
    const closeBtn = page.locator('.paywall-close');
    await closeBtn.click();
    await expect(paywallModal).not.toBeVisible();
  });

  test('2. Flow Ví XU: Kiểm tra Cổng thanh toán TPBank Live & VietQR chuẩn xác', async ({ page }) => {
    await signInViaUi(page);

    await page.goto('/wallet');
    await page.waitForLoadState('domcontentloaded');

    // Xác nhận tiêu đề trang
    await expect(page.getByRole('heading', { name: 'Ví XU & Điểm Danh' })).toBeVisible();

    // Kiểm tra thông tin thanh toán Live TPBank
    const bankSection = page.locator('.payment-card');
    await expect(bankSection).toBeVisible();
    await expect(bankSection).toContainText('TPBank');
    await expect(bankSection).toContainText('36889338888');
    await expect(bankSection).toContainText('LE VAN TINH');

    // Tuyệt đối không chứa số tài khoản sandbox cũ
    const pageText = await page.content();
    expect(pageText).not.toContain('6384251098');

    // Kiểm tra ảnh VietQR sinh đúng URL
    const qrImg = page.locator('.qr-image');
    await expect(qrImg).toBeVisible();
    const qrSrc = await qrImg.getAttribute('src');
    expect(qrSrc).toContain('acc=36889338888');
    expect(qrSrc).toContain('bank=TPBank');
    expect(qrSrc).toContain('TVTT');
  });

  test('3. Flow Viral Referral & Trung Tâm Đối Tác (Partner Hub) trên trang /wallet', async ({ page }) => {
    await signInViaUi(page);

    await page.goto('/wallet');
    await page.waitForLoadState('domcontentloaded');

    const refSection = page.locator('.referral-section');
    await expect(refSection).toBeVisible();

    // Kiểm tra link chia sẻ và nút copy
    const copyRefBtn = page.locator('.btn-copy-ref');
    await expect(copyRefBtn).toBeVisible();

    // Kiểm tra cả 2 nút hành động: Thiệp mời và Partner Hub
    const viralCardBtn = page.locator('.btn-open-viral-card');
    await expect(viralCardBtn).toBeVisible();

    const partnerHubBtn = page.locator('.btn-open-partner-hub');
    await expect(partnerHubBtn).toBeVisible();
    await expect(partnerHubBtn).toContainText('Cấp Bậc & Bảng Vàng Đối Tác');

    // Click mở Partner Hub Modal
    await partnerHubBtn.click();

    // Modal Partner Hub hiển thị
    const hubModal = page.locator('[role="dialog"][aria-labelledby="partner-hub-title"]');
    await expect(hubModal).toBeVisible({ timeout: 5000 });
    await expect(hubModal).toContainText('Đại Sứ Lan Tỏa');

    // Đóng Partner Hub Modal
    await page.keyboard.press('Escape');
    await expect(hubModal).not.toBeVisible();
  });

  test('4. Flow Mở Khóa Hồ Sơ Hoàng Gia 19 Trang & Xuất Bản PDF Vector', async ({ page }) => {
    await signInViaUi(page);

    // Mock API unlock thành công trước khi truy cập lá số
    await page.route('**/charts/*/dossier/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ isUnlocked: true, feeXu: 50 }),
      });
    });

    // Lập lá số mới để có chartId độc lập
    const birthData: BirthData = {
      day: '20',
      month: '11',
      year: '1990',
      gender: 'female',
      hour: '14',
      minute: '15',
    };
    const chartId = await createZiweiChart(page, birthData);
    expect(chartId).toBeTruthy();

    // Bấm nút Mở Hồ Sơ Hoàng Gia (đã ở trạng thái Đã Mở)
    const royalDossierBtn = page.locator('.btn-royal-dossier');
    await expect(royalDossierBtn).toBeVisible({ timeout: 15_000 });
    await expect(royalDossierBtn).toContainText('Đã Mở');
    await royalDossierBtn.click();

    // Modal Hồ Sơ Hoàng Gia Deluxe hiện ra
    const dossierOverlay = page.locator('.dossier-overlay');
    await expect(dossierOverlay).toBeVisible({ timeout: 10_000 });

    // Kiểm tra các thành phần cốt lõi của Hồ Sơ Hoàng Gia
    await expect(dossierOverlay).toContainText('Hồ Sơ Mệnh Lý Hoàng Gia');
    await expect(dossierOverlay).toContainText('Khâm Thiên');

    // Các nút xuất bản: In ấn A4 & Tải PDF
    const printBtn = dossierOverlay.locator('.btn-print-dossier');
    await expect(printBtn).toBeVisible();

    const pdfBtn = dossierOverlay.locator('.btn-download-pdf');
    await expect(pdfBtn).toBeVisible();

    // Đóng Modal Hồ Sơ Hoàng Gia
    const closeDossierBtn = dossierOverlay.locator('.btn-close-modal');
    await closeDossierBtn.click();
    await expect(dossierOverlay).not.toBeVisible();
  });
});
