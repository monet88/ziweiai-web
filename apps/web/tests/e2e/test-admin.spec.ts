import { test } from '@playwright/test';

test('Test Admin Page', async ({ page }) => {
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('FAILED RESPONSE:', response.status(), response.url());
    }
  });
  
  await page.goto('https://tuvitoantap.vercel.app/sign-in');
  await page.fill('input[type="email"]', 'sevengotek@gmail.com');
  await page.fill('input[type="password"]', 'Jalafaka@112');
  
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]')
  ]);
  
  await page.goto('https://tuvitoantap.vercel.app/admin');
  await page.waitForTimeout(2000);
});
