import { test, expect } from '@playwright/test';

test.describe('Live Production Smoke Test', () => {
  test('1. Chart Detail & Annual Report on Desktop', async ({ page }) => {
    test.setTimeout(60000);
    
    // First initialize session at home page
    console.log('Visiting home page to establish session...');
    await page.goto('https://tuvitoantap.vercel.app/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('Navigating to live chart...');
    await page.goto('https://tuvitoantap.vercel.app/charts/2b496e92-ea1d-4d6f-a156-ce56ada6d5e5', { waitUntil: 'networkidle' });
    
    // Check if chart loaded with 12 palaces
    const palaceCells = page.locator('button.cell');
    await expect(palaceCells.first()).toBeVisible({ timeout: 20000 });
    const cellCount = await palaceCells.count();
    console.log('Desktop 12 palaces cell count:', cellCount);
    expect(cellCount).toBe(12);
  });

  test('2. Mobile Layout and View Modes (390x844)', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 844 });

    // Establish session first
    await page.goto('https://tuvitoantap.vercel.app/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.goto('https://tuvitoantap.vercel.app/charts/2b496e92-ea1d-4d6f-a156-ce56ada6d5e5', { waitUntil: 'networkidle' });

    // Check switcher buttons
    const gridBtn = page.locator('button:has-text("Bàn cờ")').first();
    const listBtn = page.locator('button:has-text("Danh sách")').first();
    const triadsBtn = page.locator('button:has-text("Tam Hợp")').first();

    await expect(gridBtn).toBeVisible({ timeout: 20000 });
    await expect(listBtn).toBeVisible();
    await expect(triadsBtn).toBeVisible();

    // Verify no full-page horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log('Mobile horizontal window overflow:', hasHorizontalOverflow);
    expect(hasHorizontalOverflow).toBe(false);

    // Test List Mode
    await listBtn.click();
    await page.waitForTimeout(500);
    const listPalaces = page.locator('.palaces-vertical-list button.cell');
    const listCount = await listPalaces.count();
    console.log('List items found in list mode:', listCount);
    expect(listCount).toBe(12);

    // Test Triads Mode
    await triadsBtn.click();
    await page.waitForTimeout(500);
    const triadGroupHeaders = page.locator('.group-nav-btn');
    const triadTabCount = await triadGroupHeaders.count();
    console.log('Triad tabs count:', triadTabCount);
    expect(triadTabCount).toBe(4);

    const groupPalaces = page.locator('.group-palaces-grid button.cell');
    const groupPalacesCount = await groupPalaces.count();
    console.log('Palaces shown in active triad group:', groupPalacesCount);
    expect(groupPalacesCount).toBeGreaterThanOrEqual(3);
  });

  test('3. History Page Layout', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('https://tuvitoantap.vercel.app/history', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
    const text = await page.innerText('body');
    expect(text).toContain('Lịch sử');
    console.log('History page verified!');
  });
});
