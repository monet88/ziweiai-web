import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-017h follow-up (backlog #24, @live): bằng chứng LLM thật cho BỐN trải bài MỚI thêm ở batch này
// — single / diamond / moon / horseshoe. Bộ us-017h-tarot.spec.ts (live) chỉ phủ three-card +
// celtic-cross (đã có TRƯỚC #24); spec này bịt khoảng trống: mỗi spread mới được rút thật qua UI,
// KHÔNG intercept POST /draws/tarot → narrative do provider AI thật sinh, đúng số lá theo
// SPREAD_CARD_COUNTS, ảnh lá tải được, và 0 chữ Hán.
//
// TAG @live: đốt token LLM mỗi spread nên chỉ chạy khi yêu cầu (pnpm e2e:live), KHÔNG nằm trong bộ
// default. Số lá khớp contracts/src/chart/tarot-draw.ts (single 1, diamond 4, moon 4, horseshoe 7).

const HAN_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

interface SpreadCase {
  readonly value: string;
  readonly cards: number;
  readonly question: string;
}

// Bốn trải bài mới của #24. Câu hỏi khác nhau để mỗi lần rút là một turn LLM độc lập (tránh trùng
// ngữ cảnh giữa các case khi user test dùng chung).
const NEW_SPREADS: readonly SpreadCase[] = [
  { value: 'single', cards: 1, question: 'Hôm nay tôi nên giữ tâm thế nào?' },
  { value: 'diamond', cards: 4, question: 'Dự án mới của tôi nên bắt đầu từ đâu?' },
  { value: 'moon', cards: 4, question: 'Điều gì đang ẩn dưới cảm xúc gần đây của tôi?' },
  { value: 'horseshoe', cards: 7, question: 'Mối quan hệ này sẽ đi về đâu trong vài tháng tới?' },
];

async function drawSpread(page: Page, spread: SpreadCase): Promise<void> {
  await page.goto('/tarot');
  await expect(page.getByRole('heading', { name: 'Rút bài Tarot' })).toBeVisible();

  await page.locator('#tarot-question').fill(spread.question);
  // Chọn trải bài qua value (ổn định hơn nhãn dịch). single là mặc định nhưng vẫn click cho tường minh.
  await page.locator(`button[value="${spread.value}"]`).click();
  await page.getByRole('button', { name: 'Rút bài', exact: true }).click();

  // Kết quả LLM thật (timeout rộng cho provider mạng) + đúng số lá của spread.
  await expect(page.getByText('Kết quả rút bài', { exact: true })).toBeVisible({ timeout: 60_000 });
  const cardImages = page.locator('img[src*="/tarot/"]');
  await expect(cardImages).toHaveCount(spread.cards);

  // Lá đầu phải tải ảnh thật (naturalWidth > 0), không phải broken image.
  const firstWidth = await cardImages.first().evaluate((img) => (img as HTMLImageElement).naturalWidth);
  expect(firstWidth, `ảnh lá Tarot (${spread.value}) phải tải được`).toBeGreaterThan(0);

  // Toàn vùng kết quả (tên lá + diễn giải Markdown do LLM sinh) không được chứa ký tự Hán.
  const resultText = await page.getByRole('main').innerText();
  expect(HAN_TEXT_PATTERN.test(resultText), `kết quả Tarot (${spread.value}) không được chứa chữ Hán`).toBe(false);
}

for (const spread of NEW_SPREADS) {
  test(`US-017h @live: trải bài ${spread.value} → rút ${spread.cards} lá thật + diễn giải, 0 chữ Hán`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await signInViaUi(page);
    await drawSpread(page, spread);
  });
}
