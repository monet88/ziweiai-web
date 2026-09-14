import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';
import { stubExplanation } from './_ai-stubs';

// Bất biến ngôn ngữ: Không để lọt ký tự Hán/CJK ra UI
const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

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

test.describe('Sprint 95: Synthetic Autonomous User Journey (Full Cycle)', () => {
  test('Hành trình tự động toàn diện: Auth ➡️ Checkin ➡️ Sứ Giả ➡️ VietQR ➡️ Lập lá số ➡️ Luận giải', async ({
    page,
  }) => {
    // --------------------------------------------------------------------------
    // 1. GIAI ĐOẠN 1: ĐĂNG NHẬP & KHỞI TẠO SESSION
    // --------------------------------------------------------------------------
    await signInViaUi(page);
    await expect(page.locator('#birth-day')).toBeVisible();

    // --------------------------------------------------------------------------
    // 2. GIAI ĐOẠN 2: VÍ XU & ĐIỂM DANH HÀNG NGÀY (DAILY CHECK-IN)
    // --------------------------------------------------------------------------
    await page.goto('/wallet');
    await page.waitForLoadState('domcontentloaded');

    // Xác nhận giao diện Ví XU
    await expect(page.getByRole('heading', { name: 'Ví XU & Điểm Danh' })).toBeVisible();

    // Kiểm tra thông tin thanh toán VietQR TPBank Live
    const bankSection = page.locator('.payment-card');
    await expect(bankSection).toBeVisible();
    await expect(bankSection).toContainText('TPBank');
    await expect(bankSection).toContainText('36889338888');
    await expect(bankSection).toContainText('LE VAN TINH');

    // Kiểm tra ảnh mã VietQR SePay hợp lệ
    const qrImg = page.locator('.qr-image');
    await expect(qrImg).toBeVisible();
    const qrSrc = await qrImg.getAttribute('src');
    expect(qrSrc).toContain('acc=36889338888');
    expect(qrSrc).toContain('bank=TPBank');
    expect(qrSrc).toContain('TVTT');

    // Kiểm tra widget điểm danh
    const checkinWidget = page.locator('.hero-checkin-box');
    await expect(checkinWidget).toBeVisible();
    await expect(checkinWidget).toContainText('Điểm Danh Hàng Ngày');

    // Chờ query profiles từ Supabase giải quyết xong
    const checkinBtn = checkinWidget.locator('button');
    await expect(checkinBtn).toBeVisible();

    // Chờ text nút ổn định sau khi dữ liệu tải xong (không còn 'Đang kiểm tra...')
    await expect(checkinBtn).not.toContainText('Đang kiểm tra...', { timeout: 15_000 });

    const isEnabled = await checkinBtn.isEnabled();
    if (isEnabled) {
      await checkinBtn.click();
      // Chờ nút chuyển trạng thái thành Đã nhận hôm nay
      await expect(checkinBtn).toContainText('Đã nhận hôm nay', { timeout: 10_000 });

      // Nếu XuSuccessModal hiện lên mừng nạp/điểm danh XU, bấm nút đóng
      const closeSuccessBtn = page.locator('.success-modal .btn-close, .success-modal .btn-secondary');
      if (await closeSuccessBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
        await closeSuccessBtn.first().click();
        await expect(page.locator('.modal-backdrop')).not.toBeVisible({ timeout: 5_000 });
      }
    } else {
      await expect(checkinBtn).toContainText('Đã nhận hôm nay');
    }

    // Xác nhận không xuất hiện thông báo lỗi hệ thống/database
    await expect(page.locator('.error-text')).toHaveCount(0);

    // --------------------------------------------------------------------------
    // 3. GIAI ĐOẠN 3: BẢNG SỨ GIẢ LAN TỎA (PARTNER HUB & VIRAL REFERRAL)
    // --------------------------------------------------------------------------
    const refSection = page.locator('.referral-section');
    await expect(refSection).toBeVisible();

    // Kiểm tra nút copy mã giới thiệu
    const copyRefBtn = page.locator('.btn-copy-ref');
    await expect(copyRefBtn).toBeVisible();

    // Mở Bảng Vàng Đối Tác & Cấp Bậc Sứ Giả
    const partnerHubBtn = page.locator('.btn-open-partner-hub');
    await expect(partnerHubBtn).toBeVisible();
    await partnerHubBtn.scrollIntoViewIfNeeded();
    await partnerHubBtn.click();

    // Xác nhận modal Partner Hub mở thành công
    const hubModal = page.locator('[role="dialog"][aria-labelledby="partner-hub-title"]');
    await expect(hubModal).toBeVisible({ timeout: 6_000 });
    await expect(hubModal).toContainText('Đại Sứ Lan Tỏa');
    await expect(hubModal).toContainText('Khâm Thiên Giám');

    // Đóng modal bằng Escape
    await page.keyboard.press('Escape');
    await expect(hubModal).not.toBeVisible();

    // --------------------------------------------------------------------------
    // 4. GIAI ĐOẠN 4: LẬP LÁ SỐ TỬ VI MỚI
    // --------------------------------------------------------------------------
    // Cấu hình stub luận giải để kiểm thử trơn tru không đốt token AI
    await stubExplanation(
      page,
      '### Luận Giải Khâm Thiên Hoàng Gia\n\nBản mệnh tọa sao Tử Vi cư Ngọ, nhật nguyệt tịnh minh. Vận trình công danh xán lạn, hậu vận đắc lộc vi vương.'
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Lập lá số' }).first().click();
    await expect(page.locator('#birth-day')).toBeVisible();

    const birthData: BirthData = {
      day: '16',
      month: '7',
      year: '1996',
      gender: 'male',
      hour: '08',
      minute: '15',
    };

    const chartId = await createZiweiChart(page, birthData);
    expect(chartId).toBeTruthy();

    // --------------------------------------------------------------------------
    // 5. GIAI ĐOẠN 5: KIỂM TRA BÀN 12 CUNG & KHÔNG CÓ KÝ TỰ HÁN LỌT RA
    // --------------------------------------------------------------------------
    await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({
      timeout: 30_000,
    });
    const board = page.getByRole('group', { name: 'Bàn 12 cung' });
    await expect(board).toBeVisible();

    // 12 cung là button trong bàn; ít nhất 12 ô cung hiển thị
    const palaceButtons = board.getByRole('button');
    await expect(async () => {
      expect(await palaceButtons.count()).toBeGreaterThanOrEqual(12);
    }).toPass();

    // Bất biến ngôn ngữ: toàn vùng bàn cung KHÔNG có ký tự Hán
    const boardText = (await board.innerText()).trim();
    expect(boardText.length).toBeGreaterThan(0);
    expect(CJK_TEXT_PATTERN.test(boardText), 'Bàn 12 cung không được rò chữ Hán').toBe(false);

    // --------------------------------------------------------------------------
    // 6. GIAI ĐOẠN 6: CHỌN CUNG, YÊU CẦU LUẬN GIẢI VÀ XÁC NHẬN NỘI DUNG HOÀNG GIA
    // --------------------------------------------------------------------------
    const firstPalace = palaceButtons.first();
    await firstPalace.click();
    await expect(firstPalace).toHaveAttribute('aria-pressed', 'true');

    // Bấm nút luận giải trong hàng action
    const triggerExplanationBtn = page.locator('.explanation-actions-row button').first();
    await expect(triggerExplanationBtn).toBeVisible({ timeout: 10_000 });
    await triggerExplanationBtn.scrollIntoViewIfNeeded();
    await triggerExplanationBtn.click();

    // Khối luận giải xuất hiện với cơ chế Blur Teaser hoặc bản sớ hoàng gia
    const explanationSection = page.locator('.explanation-section');
    await expect(explanationSection).toBeVisible({ timeout: 15_000 });
    const renderedText = await explanationSection.innerText();
    expect(renderedText.length).toBeGreaterThan(0);
    expect(CJK_TEXT_PATTERN.test(renderedText), 'Không được lọt ký tự CJK ra ngoài UI').toBe(false);
  });
});
