import { test, expect } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-022: Notion paper-calm theme — E2E test.
// Kiểm các thuộc tính thiết kế đã triển khai đúng trên UI thật:
//   1. Design token CSS variables khai báo đúng trên :root (nền, chữ, accent, border, spacing, radius).
//   2. Font Inter đã được load (fontFamily trên body chứa 'Inter').
//   3. Nền trang (canvas paper) là #f6f5f4 hoặc gần.
//   4. Surface cards (thẻ nổi) dùng nền trắng #ffffff.
//   5. Viền hairline 1px nhạt (không bóng nặng).
//   6. Accent primary là xanh Notion (#0075de).
//
// Không có logic nghiệp vụ — chỉ xác nhận visual design token đã áp dụng.

test('US-022: design token CSS variables khai báo đúng trên :root', async ({ page }) => {
  await signInViaUi(page);

  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      bgPrimary: s.getPropertyValue('--color-bg-primary').trim(),
      bgSurface: s.getPropertyValue('--color-bg-surface').trim(),
      bgElevated: s.getPropertyValue('--color-bg-elevated').trim(),
      textPrimary: s.getPropertyValue('--color-text-primary').trim(),
      textSecondary: s.getPropertyValue('--color-text-secondary').trim(),
      textMuted: s.getPropertyValue('--color-text-muted').trim(),
      accentPrimary: s.getPropertyValue('--color-accent-primary').trim(),
      accentAi: s.getPropertyValue('--color-accent-ai').trim(),
      accentDanger: s.getPropertyValue('--color-accent-danger').trim(),
      borderHairline: s.getPropertyValue('--color-border-hairline').trim(),
      fontSans: s.getPropertyValue('--font-sans').trim(),
      spaceXs: s.getPropertyValue('--space-xs').trim(),
      spaceMd: s.getPropertyValue('--space-md').trim(),
      spaceLg: s.getPropertyValue('--space-lg').trim(),
      radiusSm: s.getPropertyValue('--radius-sm').trim(),
      radiusMd: s.getPropertyValue('--radius-md').trim(),
    };
  });

  // Nền canvas paper ấm
  expect(tokens.bgPrimary, '--color-bg-primary phải là #f6f5f4').toBe('#f6f5f4');
  // Surface trắng (trình duyệt rút gọn #ffffff → #fff)
  expect(['#ffffff', '#fff'].includes(tokens.bgSurface), `--color-bg-surface phải là #fff(fff) (got: ${tokens.bgSurface})`).toBe(true);
  // Elevated nhạt
  expect(tokens.bgElevated, '--color-bg-elevated phải là #efedea').toBe('#efedea');
  // Chữ gần-đen ấm
  expect(tokens.textPrimary, '--color-text-primary phải là #1a1a1a').toBe('#1a1a1a');
  expect(tokens.textSecondary).toBe('#31302e');
  expect(tokens.textMuted).toBe('#615d59');
  // Accent xanh Notion
  expect(tokens.accentPrimary).toBe('#0075de');
  // Accent AI tím
  expect(tokens.accentAi).toBe('#6d28d9');
  // Danger đỏ
  expect(tokens.accentDanger).toBe('#c0392b');
  // Border hairline
  expect(tokens.borderHairline).toBe('#e6e6e6');
  // Font Inter
  expect(tokens.fontSans).toContain('Inter');

  // Spacing base 8px
  expect(tokens.spaceXs).toBe('8px');
  expect(tokens.spaceMd).toBe('16px');
  expect(tokens.spaceLg).toBe('24px');

  // Border radius
  expect(tokens.radiusSm).toBe('5px');
  expect(tokens.radiusMd).toBe('8px');

  await page.screenshot({ path: 'test-results/us-022-theme-tokens.png', fullPage: true });
});

test('US-022: font Inter load trên body + nền canvas đúng', async ({ page }) => {
  await signInViaUi(page);

  // Background đặt trên html (tokens.css), không phải body. Font kế thừa qua html.
  const htmlStyles = await page.evaluate(() => {
    const htmlStyle = getComputedStyle(document.documentElement);
    const bodyStyle = getComputedStyle(document.body);
    return {
      fontFamily: htmlStyle.fontFamily || bodyStyle.fontFamily,
      backgroundColor: htmlStyle.backgroundColor,
    };
  });

  // Font phải chứa Inter (self-hosted)
  expect(htmlStyles.fontFamily.toLowerCase(), 'html fontFamily phải chứa Inter').toContain('inter');

  // Background nền trang (canvas paper) trên html — rgb(246, 245, 244) tương đương #f6f5f4
  expect(
    htmlStyles.backgroundColor === 'rgb(246, 245, 244)' || htmlStyles.backgroundColor === '#f6f5f4',
    `html background phải là #f6f5f4 (got: ${htmlStyles.backgroundColor})`,
  ).toBe(true);

  await page.screenshot({ path: 'test-results/us-022-font-and-canvas.png', fullPage: true });
});

test('US-022: dashboard hiển thị đúng tone paper-calm + hairline borders', async ({ page }) => {
  await signInViaUi(page);

  // Dashboard heading
  await expect(page.getByRole('heading', { name: 'Tạo lá số của bạn' })).toBeVisible();

  // Thay vì quét querySelectorAll('*') (trắng/viền nhạt là màu quá phổ biến → gần như
  // luôn pass kể cả khi theme hỏng), bám vào MỘT surface element ngữ nghĩa ổn định: link
  // trong nav "Hệ thuật số khác". Link này dùng đồng thời --color-bg-surface (#fff) +
  // --color-border-hairline (#e6e6e6), nên một element chứng minh cả hai token được áp dụng.
  // Bám role/landmark (không bám class nội bộ dễ đổi).
  const surfaceLink = page
    .getByRole('navigation', { name: 'Hệ thuật số khác' })
    .getByRole('link')
    .first();
  await expect(surfaceLink).toBeVisible();

  const surfaceStyles = await surfaceLink.evaluate((el) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, border: s.borderTopColor };
  });

  // surface = --color-bg-surface → #fff → rgb(255, 255, 255)
  expect(surfaceStyles.background, 'Surface element phải có nền trắng (--color-bg-surface)').toBe(
    'rgb(255, 255, 255)',
  );
  // hairline = --color-border-hairline → #e6e6e6 → rgb(230, 230, 230)
  expect(surfaceStyles.border, 'Surface element phải có viền hairline (--color-border-hairline)').toBe(
    'rgb(230, 230, 230)',
  );

  await page.screenshot({ path: 'test-results/us-022-dashboard-paper-calm.png', fullPage: true });
});

test('US-022: trang chi tiết lá số áp theme paper-calm nhất quán', async ({ page }) => {
  await signInViaUi(page);

  // Tạo lá số Tử Vi
  await page.locator('#birth-day').selectOption('15');
  await page.locator('#birth-month').selectOption('8');
  await page.locator('#birth-year').selectOption('1990');
  await page.locator('#birth-gender').selectOption('male');
  await page.locator('#birth-hour').fill('10');
  await page.locator('#birth-minute').fill('30');
  await page.getByRole('main').getByRole('button', { name: 'Lập lá số', exact: true }).click();
  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });

  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({
    timeout: 30_000,
  });

  // Theme tokens vẫn đúng trên trang chi tiết
  const chartTokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      bgPrimary: s.getPropertyValue('--color-bg-primary').trim(),
      accentPrimary: s.getPropertyValue('--color-accent-primary').trim(),
      fontSans: s.getPropertyValue('--font-sans').trim(),
    };
  });
  expect(chartTokens.bgPrimary).toBe('#f6f5f4');
  expect(chartTokens.accentPrimary).toBe('#0075de');
  expect(chartTokens.fontSans).toContain('Inter');

  await page.screenshot({ path: 'test-results/us-022-chart-detail-theme.png', fullPage: true });
});
