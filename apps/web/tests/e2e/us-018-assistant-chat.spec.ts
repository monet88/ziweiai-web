import { test, expect, type Page } from '@playwright/test';
import { signInViaUi } from './sign-in';

// US-018: trợ lý AI hội thoại + SSE streaming — E2E test.
// Kiểm 4 hành vi:
//   1. Section trợ lý hiển thị với tiêu đề + gợi ý nhanh + hint mặc định.
//   2. Gợi ý nhanh 5 nút đúng nhãn Việt.
//   3. Composer (textarea + nút Gửi) hoạt động — gửi tin nhắn qua SSE.
//   4. Sau khi gửi: user message hiện, rồi assistant message stream về (intercept SSE).
//
// Lưu ý: hành vi "nút gửi disabled khi đang streaming" CHƯA được test ở đây (SSE stub trả
// nguyên body tức thì nên không bắt được trạng thái trung gian một cách ổn định); không
// liệt kê nó như đã phủ để tránh false coverage.
//
// Dùng route intercept cho:
//   - POST /conversations → trả conversation mới (schema-compliant).
//   - POST /conversations/:id/messages/stream → trả SSE stub (chunk + done).
//
// QUAN TRỌNG:
//   - Route cụ thể (dài) phải đăng ký TRƯỚC route tổng quát (ngắn) trong Playwright.
//   - Stub data phải đầy đủ theo schema contracts (conversationRecordSchema, conversationMessageRecordSchema).

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

// Schema-compliant stub data
const FAKE_CONVERSATION_ID = 'a0a0a0a0-b1b1-4c2c-8d3d-e4e4e4e40018';
const FAKE_OWNER_ID = 'a0a0a0a0-b1b1-4c2c-8d3d-e4e4e4e40001';
const FAKE_CHART_ID = 'a0a0a0a0-b1b1-4c2c-8d3d-e4e4e4e40002';
const ISO_NOW = '2026-01-01T00:00:00.000Z';

// conversationRecordSchema: id, ownerUserId, chartSnapshotId, title, status, createdAt, updatedAt
function makeConversationStub() {
  return {
    conversation: {
      id: FAKE_CONVERSATION_ID,
      ownerUserId: FAKE_OWNER_ID,
      chartSnapshotId: FAKE_CHART_ID,
      title: null,
      status: 'active',
      createdAt: ISO_NOW,
      updatedAt: ISO_NOW,
    },
  };
}

// conversationMessageRecordSchema: id, ownerUserId, conversationId, role, content, quickPromptKey, providerName, providerMetadata, createdAt
function makeDoneMessage(content: string) {
  return {
    id: 'a0a0a0a0-b1b1-4c2c-8d3d-e4e4e4e40099',
    ownerUserId: FAKE_OWNER_ID,
    conversationId: FAKE_CONVERSATION_ID,
    role: 'assistant',
    content,
    quickPromptKey: null,
    providerName: null,
    providerMetadata: {},
    createdAt: ISO_NOW,
  };
}

// SSE body for text message
const STUB_SSE_TEXT = [
  'data: {"type":"chunk","delta":"Đây là "}\n\n',
  'data: {"type":"chunk","delta":"câu trả lời thử nghiệm."}\n\n',
  `data: {"type":"done","message":${JSON.stringify(makeDoneMessage('Đây là câu trả lời thử nghiệm.'))}}\n\n`,
].join('');

// SSE body for quick prompt
const STUB_SSE_QUICK = [
  'data: {"type":"chunk","delta":"Tổng quan: lá số cho thấy bạn có vận mệnh tốt."}\n\n',
  `data: {"type":"done","message":${JSON.stringify(makeDoneMessage('Tổng quan: lá số cho thấy bạn có vận mệnh tốt.'))}}\n\n`,
].join('');

/** Đăng ký route intercept cho conversation + SSE. Stream cụ thể đăng ký TRƯỚC. */
async function setupConversationRoutes(page: Page, sseBody: string) {
  // 1) SSE stream — cụ thể nhất, đăng ký trước
  await page.route('**/conversations/*/messages/stream', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: sseBody,
    });
  });

  // 2) POST /conversations (tạo mới) — khớp regex chính xác path /conversations (không có subpath)
  await page.route(/\/conversations$/, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeConversationStub()),
      });
    } else {
      await route.continue();
    }
  });
}

test('US-018: section trợ lý hiển thị + 5 gợi ý nhanh + hint mặc định', async ({ page }) => {
  await signInViaUi(page);

  await createZiweiChart(page, {
    day: '15',
    month: '8',
    year: '1990',
    hour: '10',
    minute: '30',
    gender: 'male',
  });

  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({
    timeout: 30_000,
  });

  // (1) Section trợ lý hiện
  const assistantTitle = page.getByRole('heading', { name: 'Trợ lý AI hội thoại' });
  await expect(assistantTitle).toBeVisible();

  // (2) 5 gợi ý nhanh
  const quickGroup = page.getByRole('group', { name: 'Gợi ý nhanh' });
  await expect(quickGroup).toBeVisible();

  const expectedLabels = ['Tổng quan', 'Tình duyên', 'Sự nghiệp', 'Sức khỏe', 'Thời vận'];
  for (const label of expectedLabels) {
    await expect(quickGroup.getByRole('button', { name: label, exact: true })).toBeVisible();
  }

  // (3) Hint mặc định (transcript rỗng)
  await expect(page.getByText('Hãy chọn một gợi ý nhanh hoặc nhập câu hỏi để bắt đầu hội thoại.')).toBeVisible();

  // (4) Composer
  await expect(page.getByPlaceholder('Nhập câu hỏi của bạn...')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gửi', exact: true })).toBeVisible();

  await page.screenshot({ path: 'test-results/us-018-assistant-panel.png', fullPage: true });
});

test('US-018: gửi tin nhắn text → SSE stream → user + assistant messages hiện', async ({ page }) => {
  await signInViaUi(page);

  await createZiweiChart(page, {
    day: '15',
    month: '8',
    year: '1990',
    hour: '10',
    minute: '30',
    gender: 'male',
  });

  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({
    timeout: 30_000,
  });

  await setupConversationRoutes(page, STUB_SSE_TEXT);

  // Nhập câu hỏi
  const composer = page.getByPlaceholder('Nhập câu hỏi của bạn...');
  await composer.fill('Lá số của tôi có gì đặc biệt?');

  // Gửi
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();

  // Chờ assistant section có class msg (scoped CSS → đợi container)
  const assistantSection = page.locator('section.assistant, [aria-labelledby="assistant-title"]');

  // User message hiện (optimistic) — tìm trong assistant section
  const userMsg = assistantSection.locator('div').filter({ hasText: 'Bạn' }).filter({ hasText: 'Lá số của tôi có gì đặc biệt?' });
  await expect(userMsg.first()).toBeVisible({ timeout: 15_000 });

  // Assistant message hiện (sau stream)
  const assistantMsg = assistantSection.locator('div').filter({ hasText: 'Trợ lý' }).filter({ hasText: 'câu trả lời thử nghiệm' });
  await expect(assistantMsg.first()).toBeVisible({ timeout: 15_000 });

  // Hint mặc định biến mất (đã có tin nhắn)
  await expect(page.getByText('Hãy chọn một gợi ý nhanh hoặc nhập câu hỏi để bắt đầu hội thoại.')).toHaveCount(0);

  await page.screenshot({ path: 'test-results/us-018-assistant-conversation.png', fullPage: true });
});

test('US-018: gửi gợi ý nhanh → hiện trong transcript', async ({ page }) => {
  await signInViaUi(page);

  await createZiweiChart(page, {
    day: '3',
    month: '2',
    year: '1985',
    hour: '14',
    minute: '45',
    gender: 'female',
  });

  await expect(page.getByRole('heading', { name: 'Lá số 12 cung' })).toBeVisible({
    timeout: 30_000,
  });

  await setupConversationRoutes(page, STUB_SSE_QUICK);

  // Click gợi ý nhanh "Tổng quan"
  const quickGroup = page.getByRole('group', { name: 'Gợi ý nhanh' });
  await quickGroup.getByRole('button', { name: 'Tổng quan', exact: true }).click();

  const assistantSection = page.locator('section.assistant, [aria-labelledby="assistant-title"]');

  // User message hiện (optimistic) — quick prompt hiển thị label "Tổng quan"
  const userMsg = assistantSection.locator('div').filter({ hasText: 'Bạn' }).filter({ hasText: 'Tổng quan' });
  await expect(userMsg.first()).toBeVisible({ timeout: 15_000 });

  // Assistant response hiện
  const assistantMsg = assistantSection.locator('div').filter({ hasText: 'Trợ lý' }).filter({ hasText: 'lá số cho thấy' });
  await expect(assistantMsg.first()).toBeVisible({ timeout: 15_000 });

  await page.screenshot({ path: 'test-results/us-018-assistant-quick-prompt.png', fullPage: true });
});
