import type { Page, Route } from '@playwright/test';

// Stub dùng chung cho các E2E "default" (luôn chạy, KHÔNG đốt token LLM). Mỗi feature AI có một
// cặp spec: bản default ở đây chặn request và trả response schema-compliant để khẳng định luồng UI
// (gửi request đúng → render kết quả), còn bản LIVE (@live, chỉ chạy khi yêu cầu) gọi LLM thật để
// chứng minh end-to-end + lưu lịch sử. Tách giữ bộ default nhanh + deterministic; bằng chứng LLM
// thật dồn vào nhóm @live.
//
// Các builder dưới đây dựng đúng shape contracts (createExplanationResponseSchema,
// annualReportResponseSchema, conversation SSE) để web parse() không ném. Giá trị là giả lập cố
// định; uuid hợp lệ nhưng không liên kết session thật (web chỉ validate shape, không cross-check).

const ISO_NOW = '2026-01-01T00:00:00.000Z';
const STUB_OWNER_ID = 'c0ffeec0-0000-4000-8000-000000000001';
const STUB_REQUEST_ID = 'c0ffeec0-0000-4000-8000-000000000002';
const STUB_RESULT_ID = 'c0ffeec0-0000-4000-8000-000000000003';
const STUB_CONVERSATION_ID = 'c0ffeec0-0000-4000-8000-000000000010';
const STUB_MESSAGE_ID = 'c0ffeec0-0000-4000-8000-000000000011';
const STUB_OWNER_FALLBACK_CHART = 'c0ffeec0-0000-4000-8000-000000000004';

/**
 * Stub POST /explanations → createExplanationResponseSchema hợp lệ. Đọc palaceScope + chartSnapshotId
 * từ body request để providerMetadata.palaceScope KHỚP scope đang chọn (explanation-model key kết quả
 * theo providerMetadata.palaceScope ?? 'overview' → sai scope sẽ không render). Markdown tiếng Việt,
 * 0 ký tự Hán (giữ bất biến ngôn ngữ kể cả ở bản stub).
 */
export async function stubExplanation(page: Page, markdown: string): Promise<void> {
  await page.route('**/explanations', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const body = (route.request().postDataJSON() ?? {}) as {
      chartSnapshotId?: string;
      palaceScope?: string;
    };
    const chartSnapshotId = body.chartSnapshotId ?? STUB_OWNER_FALLBACK_CHART;
    const providerMetadata: Record<string, string> = {
      provider: 'stub',
      explanationKind: 'overview',
      ...(body.palaceScope ? { palaceScope: body.palaceScope } : {}),
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        request: {
          id: STUB_REQUEST_ID,
          ownerUserId: STUB_OWNER_ID,
          chartSnapshotId,
          idempotencyKey: 'stub-idempotency-key-0001',
          requestState: 'completed',
          providerName: 'stub',
          promptStorageMode: 'not_stored',
          failureRetainsUntil: null,
          createdAt: ISO_NOW,
          updatedAt: ISO_NOW,
        },
        result: {
          id: STUB_RESULT_ID,
          ownerUserId: STUB_OWNER_ID,
          explanationRequestId: STUB_REQUEST_ID,
          chartSnapshotId,
          cacheScope: 'user_snapshot',
          renderedMarkdown: markdown,
          providerMetadata,
          createdAt: ISO_NOW,
        },
        explanationContext: {
          chartSystem: 'zi-wei-dou-shu',
          visibleMessageKeys: [],
          confidence: {
            level: 'high',
            reasons: [],
            visibleMessageKey: 'confidence.high',
            blocksExactReading: false,
          },
          sourceLabel: 'Stub luận giải (E2E default)',
        },
      }),
    });
  });
}

/**
 * Stub POST /draws/tarot → tarotDrawSchema hợp lệ. Lá đủ theo spread; ảnh trỏ tới static/tarot/<id>.jpg
 * (id phải khớp tên file thật để <img> tải được). narrative tiếng Việt, 0 chữ Hán.
 */
export async function stubTarot(page: Page): Promise<void> {
  await page.route('**/draws/tarot', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const body = (route.request().postDataJSON() ?? {}) as { question?: string; spread?: string };
    const cards = [
      { id: 'major_00', name: 'Gã Khờ', reversed: false, position: 0 },
      { id: 'major_01', name: 'Nhà Ảo Thuật', reversed: true, position: 1 },
      { id: 'major_02', name: 'Nữ Tư Tế', reversed: false, position: 2 },
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        question: body.question ?? 'Câu hỏi kiểm thử',
        spread: body.spread ?? 'three-card',
        cards,
        narrative:
          '## Tổng quan\nĐây là diễn giải mẫu cho kiểm thử, chỉ mang tính tham khảo.\n\n## Lời khuyên\nHãy giữ tâm thế bình tĩnh và chủ động.',
      }),
    });
  });
}

/**
 * Stub POST /charts/:id/annual-report → annualReportResponseSchema hợp lệ. frame.monthly đúng 12 mục.
 * markdown tiếng Việt, 0 chữ Hán.
 */
export async function stubAnnualReport(page: Page): Promise<void> {
  await page.route('**/annual-report**', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const url = new URL(route.request().url());
    const chartId = url.pathname.match(/\/charts\/([0-9a-f-]{36})\//i)?.[1] ?? STUB_OWNER_FALLBACK_CHART;
    const year = Number(url.searchParams.get('year') ?? '2026');
    const horoscopeItem = (label: string) => ({
      scope: label,
      title: label,
      summary: 'Tóm tắt vận hạn mẫu cho kiểm thử.',
      details: ['Chi tiết một.', 'Chi tiết hai.'],
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        chartId,
        year,
        frame: {
          yearly: horoscopeItem('Lưu niên'),
          monthly: Array.from({ length: 12 }, (_value, index) => horoscopeItem(`Lưu nguyệt ${index + 1}`)),
        },
        markdown:
          '## Báo cáo năm (mẫu)\nĐây là báo cáo năm mẫu cho kiểm thử, chỉ mang tính tham khảo.\n\n## Khuyến nghị\nGiữ kế hoạch ổn định.',
      }),
    });
  });
}

/**
 * Stub conversation cho US-018 default: POST /conversations (tạo) + SSE stream (chunk + done). Dùng
 * lại shape conversationRecordSchema + conversationMessageRecordSchema. Route stream (cụ thể) đăng ký
 * TRƯỚC route /conversations (tổng quát) theo yêu cầu thứ tự match của Playwright.
 */
export async function stubConversation(page: Page, assistantText: string): Promise<void> {
  const sseBody = [
    `data: {"type":"chunk","delta":${JSON.stringify(assistantText)}}\n\n`,
    `data: {"type":"done","message":${JSON.stringify({
      id: STUB_MESSAGE_ID,
      ownerUserId: STUB_OWNER_ID,
      conversationId: STUB_CONVERSATION_ID,
      role: 'assistant',
      content: assistantText,
      quickPromptKey: null,
      providerName: null,
      providerMetadata: {},
      createdAt: ISO_NOW,
    })}}\n\n`,
  ].join('');

  await page.route('**/conversations/*/messages/stream', async (route: Route) => {
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: sseBody });
  });
  await page.route(/\/conversations$/, async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversation: {
            id: STUB_CONVERSATION_ID,
            ownerUserId: STUB_OWNER_ID,
            chartSnapshotId: STUB_OWNER_FALLBACK_CHART,
            title: null,
            status: 'active',
            createdAt: ISO_NOW,
            updatedAt: ISO_NOW,
          },
        }),
      });
    } else {
      await route.continue();
    }
  });
}
