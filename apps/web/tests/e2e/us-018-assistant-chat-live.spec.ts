import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-018 LIVE (@live): trợ lý AI hội thoại gọi LLM thật qua SSE (KHÔNG intercept) + chứng minh
// message được PERSIST.
//
// Khác us-018-assistant-chat.spec.ts (stub POST /conversations + SSE): spec này KHÔNG chặn request.
// Nó tạo conversation thật, gửi câu hỏi thật → backend stream phản hồi LLM thật + lưu cả user và
// assistant message vào DB (createConversationMessage). Sau đó gọi GET /conversations/:id qua API
// để khẳng định cả hai message đã persist (bằng chứng lưu lịch sử hội thoại, không chỉ render UI).
//
// Phụ thuộc mạng + LLM thật nên timeout rộng. Chụp screenshot mốc vào test-results/assistant-chat-live/.
// TAG @live: đốt token LLM mỗi lần chạy nên BỊ LOẠI khỏi `pnpm e2e` mặc định; chỉ chạy `pnpm e2e:live`.

import { mkdirSync } from 'node:fs';

const SHOT_DIR = 'test-results/assistant-chat-live';

const CJK_TEXT_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
}

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

async function createZiweiChart(page: Page): Promise<string> {
  await page.locator('#birth-day').selectOption('15');
  await page.locator('#birth-month').selectOption('8');
  await page.locator('#birth-year').selectOption('1990');
  await page.locator('#birth-gender').selectOption('male');
  await page.locator('#birth-hour').fill('10');
  await page.locator('#birth-minute').fill('30');
  await page.getByRole('main').getByRole('button', { name: 'Lập lá số', exact: true }).click();
  await page.waitForURL(/\/charts\/[0-9a-f-]{36}$/i, { timeout: 30_000 });
  const match = page.url().match(/\/charts\/([0-9a-f-]{36})/i);
  expect(match, 'URL phải chứa chartId dạng uuid').not.toBeNull();
  return match![1];
}

test('US-018 LIVE @live: chat thật qua SSE → user + assistant message persist', async ({ page }) => {
  test.setTimeout(120_000);
  await signInViaUi(page);

  const chartId = await createZiweiChart(page);
  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({ timeout: 30_000 });

  // Trợ lý hiển thị (section + composer).
  await expect(page.getByRole('heading', { name: 'Trợ lý AI hội thoại' })).toBeVisible();
  const composer = page.getByPlaceholder('Nhập câu hỏi của bạn...');
  await expect(composer).toBeVisible();

  // ---- Gửi câu hỏi thật (KHÔNG intercept) → SSE stream LLM thật ----
  // Quan sát (KHÔNG chặn) response POST /conversations để bắt conversationId thật. GET /conversations
  // hiện là stub trả {items: []} (list-by-chart chưa làm), nên không thể tra id qua list — phải bắt từ
  // chính response tạo conversation. waitForResponse chỉ đọc, không can thiệp luồng LLM thật.
  const conversationCreated = page.waitForResponse(
    (resp) => resp.url().endsWith('/conversations') && resp.request().method() === 'POST' && resp.ok(),
    { timeout: 30_000 },
  );

  const question = 'Lá số của tôi nổi bật ở điểm nào?';
  await composer.fill(question);
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();

  const createdResp = await conversationCreated;
  const created = (await createdResp.json()) as { conversation: { id: string; chartSnapshotId: string } };
  expect(created.conversation.chartSnapshotId, 'conversation phải gắn đúng lá số vừa tạo').toBe(chartId);
  const conversationId = created.conversation.id;

  // Panel hội thoại = <section class="assistant"> (KHÔNG phải <section class="assistant-section">
  // region bao ngoài — cả hai dùng chung aria-labelledby nên selector phải bám đúng class panel).
  const assistantSection = page.locator('section.assistant');

  // User message hiện (optimistic). Bong bóng user = .msg.user > .content.
  await expect(
    assistantSection.locator('.msg.user .content').filter({ hasText: question }).first(),
  ).toBeVisible({ timeout: 15_000 });

  // Assistant message stream về từ LLM thật (chờ rộng cho provider mạng). Nội dung nằm ở .content
  // của bong bóng .msg.assistant (KHÔNG phải nhãn .role chỉ chứa "Trợ lý"); chờ tới khi có chữ.
  const assistantBubble = assistantSection.locator('.msg.assistant .content').last();
  await expect
    .poll(async () => (await assistantBubble.innerText()).trim().length, { timeout: 90_000 })
    .toBeGreaterThan(10);
  await shot(page, '01-chat-streamed');

  const transcript = await assistantSection.innerText();
  expect(CJK_TEXT_PATTERN.test(transcript), 'Hội thoại không được rò chữ Hán').toBe(false);

  // ---- Verify PERSIST: gọi API trực tiếp, khẳng định cả 2 message đã lưu vào đúng conversation ----
  // Lấy access_token từ session Supabase trong localStorage để gọi API với Bearer thật.
  const token = await page.evaluate(async () => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.includes('auth-token')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) ?? '{}');
          const accessToken = parsed?.access_token ?? parsed?.currentSession?.access_token;
          if (accessToken) return accessToken as string;
        } catch {
          // bỏ qua key không phải JSON session
        }
      }
    }
    return null;
  });
  expect(token, 'phải lấy được access_token từ session để gọi API verify').toBeTruthy();

  // API E2E luôn ở localhost:3000 (playwright webServer).
  const base = 'http://localhost:3000';

  // (a) GET /conversations?chartSnapshotId=… (list-by-chart, đã hết stub) phải liệt kê đúng hội thoại
  // vừa tạo cho lá số này — bằng chứng read-path list hoạt động, không chỉ dựa vào id bắt từ POST.
  const listResp = await page.request.get(`${base}/conversations?chartSnapshotId=${chartId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(listResp.ok(), 'GET /conversations?chartSnapshotId= phải trả 200').toBe(true);
  const list = (await listResp.json()) as { items: Array<{ id: string; chartSnapshotId: string }> };
  expect(
    list.items.some((item) => item.id === conversationId && item.chartSnapshotId === chartId),
    'list-by-chart phải chứa hội thoại vừa tạo gắn đúng lá số',
  ).toBe(true);

  // (b) Detail: cả 2 message (user + assistant LLM thật) đã persist vào DB.
  const detailResp = await page.request.get(`${base}/conversations/${conversationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(detailResp.ok(), 'GET /conversations/:id phải trả 200').toBe(true);
  const detail = (await detailResp.json()) as {
    messages: Array<{ role: string; content: string }>;
  };
  const roles = detail.messages.map((m) => m.role);
  expect(roles, 'hội thoại đã lưu phải có message user').toContain('user');
  expect(roles, 'hội thoại đã lưu phải có message assistant (LLM thật)').toContain('assistant');
});
