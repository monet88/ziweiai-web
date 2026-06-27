import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { signInViaUi } from './sign-in';

// US-025 follow-up (@live): bang chung LLM that cho phan LUAN GIAI (narrative) cua gieo que Mai Hoa +
// Luc Hao. Bo us-025-divination.spec.ts (default) cast que that qua POST /divinations nhung phan
// narrative AI tren trang chi tiet KHONG duoc test live — no di qua endpoint explanations rieng (giong
// Bat Tu/Tu Vi). Spec nay bit khoang trong: cast que that -> bam "Tao luan giai tong quan" KHONG
// intercept -> narrative do provider AI that sinh, khang dinh co noi dung va 0 chu Han.
//
// TAG @live: dot token LLM moi lan chay nen chi chay khi yeu cau (pnpm e2e:live), KHONG nam trong bo
// default. Que gieo theo "now" tren server (khong nhap ngay sinh).

const SHOT_DIR = 'test-results/explanation-history-live';

const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
}

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

interface DivinationCase {
  readonly route: string;
  readonly heading: string;
  readonly system: string;
  readonly question: string;
}

// Mai Hoa + Luc Hao: hai he gieo que co phan luan giai AI. Cau hoi mang token duy nhat moi lan chay
// (tai khoan test ben) de que khong dedupe trung snapshot cu -> nut giu nguyen "Tao luan giai tong
// quan" thay vi "Tao lai" da hydrate.
const DIVINATION_CASES: readonly DivinationCase[] = [
  { route: '/meihua', heading: 'Lập quẻ Mai Hoa Dịch Số', system: 'Mai Hoa', question: 'Cong viec sap toi cua toi se ra sao?' },
  { route: '/liuyao', heading: 'Lập quẻ Lục Hào', system: 'Luc Hao', question: 'Chuyen dau tu nay co nen tien hanh khong?' },
];

for (const divination of DIVINATION_CASES) {
  test(`US-025 LIVE @live: ${divination.system} gieo que -> luan giai that, 0 chu Han`, async ({ page }) => {
    test.setTimeout(120_000);
    await signInViaUi(page);

    await page.goto(divination.route);
    await expect(page.getByRole('heading', { name: divination.heading })).toBeVisible();

    // Cau hoi duy nhat theo lan chay de tranh dedupe que cu tren user test ben.
    const uniqueToken = `qa-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    await page.locator('#divination-question').fill(`${divination.question} [${uniqueToken}]`);
    await page.locator('#divination-purpose').selectOption('career');
    await page.getByRole('main').getByRole('button', { name: 'Gieo quẻ', exact: true }).click();

    await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });

    // Khoi luan giai AI co nut tong quan (he gieo que khong co ban 12 cung -> luan giai tong quan).
    await expect(page.getByRole('heading', { name: 'Luận giải AI' })).toBeVisible({ timeout: 30_000 });
    await page
      .getByRole('button', { name: /^(Tạo luận giải tổng quan|Tạo lại luận giải)$/ })
      .click();

    // Narrative LLM that ve (timeout rong cho provider mang). 0 chu Han (bat bien ngon ngu).
    const result = page.locator('article.result');
    await expect(result).toBeVisible({ timeout: 90_000 });
    const resultText = (await result.innerText()).trim();
    expect(resultText.length, `Luan giai ${divination.system} that phai co noi dung`).toBeGreaterThan(0);
    expect(CJK_TEXT_PATTERN.test(resultText), `Luan giai ${divination.system} khong duoc ro chu Han`).toBe(false);
    await shot(page, `divination-${divination.system.replace(/\s+/g, '-').toLowerCase()}-explanation`);
  });
}
