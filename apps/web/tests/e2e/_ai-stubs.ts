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

// Số lá theo từng kiểu trải bài Lenormand (khớp LENORMAND_SPREAD_CARD_COUNTS ở contract). Stub đọc
// spread từ request rồi trả đúng số lá để khẳng định UI render đúng bố cục.
const LENORMAND_STUB_CARD_COUNTS: Record<string, number> = {
  single: 1,
  three: 3,
  relationship: 5,
  decision: 6,
  nine: 9,
};

const LENORMAND_STUB_SPREAD_NAMES: Record<string, string> = {
  single: 'Một lá',
  three: 'Ba lá',
  relationship: 'Mối quan hệ',
  decision: 'Lựa chọn',
  nine: 'Cửu cung',
};

/**
 * Stub POST /draws/lenormand → lenormandDrawSchema hợp lệ. Số lá đúng theo spread request; mỗi lá có
 * nhãn Việt + từ khóa + nghĩa. narrative tiếng Việt, 0 chữ Hán. KHÔNG đốt token LLM.
 */
export async function stubLenormand(page: Page): Promise<void> {
  await page.route('**/draws/lenormand', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const body = (route.request().postDataJSON() ?? {}) as { question?: string; spread?: string };
    const spread = body.spread ?? 'three';
    const count = LENORMAND_STUB_CARD_COUNTS[spread] ?? 3;
    const cards = Array.from({ length: count }, (_value, index) => ({
      id: index + 1,
      name: `Lá mẫu ${index + 1}`,
      keywords: ['tin tức', 'khởi đầu'],
      meaning: 'Ý nghĩa mẫu của lá bài cho kiểm thử.',
      reversed: index % 2 === 1,
      position: index,
      positionLabel: `Vị trí ${index + 1}`,
    }));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        question: body.question ?? 'Câu hỏi kiểm thử',
        spread,
        spreadName: LENORMAND_STUB_SPREAD_NAMES[spread] ?? 'Ba lá',
        cards,
        narrative:
          '## Tổng quan\nĐây là bài đọc Lenormand mẫu cho kiểm thử, chỉ mang tính tham khảo.\n\n## Tóm lại\nHãy giữ tâm thế chủ động.',
      }),
    });
  });
}

/**
 * Stub POST /dreams/interpret → dreamInterpretationSchema hợp lệ. Trả vài biểu tượng mẫu + narrative
 * tiếng Việt, 0 chữ Hán. KHÔNG đốt token LLM.
 */
export async function stubDream(page: Page): Promise<void> {
  await page.route('**/dreams/interpret', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const body = (route.request().postDataJSON() ?? {}) as { dream?: string };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        dream: body.dream ?? 'Tôi mơ thấy một giấc mơ kỳ lạ.',
        symbols: [
          {
            keywords: ['rắn'],
            meaning: 'Biểu tượng cho sự chuyển hóa và nỗi lo tiềm ẩn.',
            category: 'Động vật',
            positive: 'Tái sinh, đổi mới.',
            negative: 'Lo âu chưa gọi tên.',
            advice: 'Quan sát cảm xúc của bạn.',
          },
        ],
        narrative:
          '## Tổng quan\nĐây là phần giải mộng mẫu cho kiểm thử, chỉ mang tính tham khảo.\n\n## Tóm lại\nHãy chiêm nghiệm cảm xúc của bạn.',
      }),
    });
  });
}

/**
 * Stub POST /draws/stick → stickDrawSchema hợp lệ. Một quẻ mẫu (id trong 1..100, mức hợp lệ) +
 * narrative tiếng Việt, 0 chữ Hán. KHÔNG đốt token LLM.
 */
export async function stubStick(page: Page): Promise<void> {
  await page.route('**/draws/stick', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const body = (route.request().postDataJSON() ?? {}) as { question?: string };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        question: body.question ?? 'Câu hỏi kiểm thử',
        stick: {
          id: 1,
          level: 'Thượng thượng',
          title: 'Quẻ mẫu kiểm thử',
          poem: 'Bốn câu thơ quẻ mẫu cho kiểm thử.',
          interpretation: 'Nghĩa nền mẫu của quẻ xăm.',
          advice: 'Giữ tâm thế bình tĩnh và chủ động.',
          categories: { career: 'Sự nghiệp thuận lợi.' },
        },
        narrative:
          '## Tổng quan\nĐây là phần luận giải quẻ mẫu cho kiểm thử, chỉ mang tính tham khảo.\n\n## Tóm lại\nHãy chọn một hành động nhỏ cho hôm nay.',
      }),
    });
  });
}

/**
 * Stub POST /almanac/select → almanacSelectionSchema hợp lệ. Trả vài ngày ứng viên đã chấm điểm +
 * narrative tiếng Việt, 0 chữ Hán. KHÔNG đốt token LLM.
 */
export async function stubAlmanac(page: Page): Promise<void> {
  await page.route('**/almanac/select', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const body = (route.request().postDataJSON() ?? {}) as {
      topic?: string;
      startDate?: string;
      endDate?: string;
    };
    const buildDay = (date: string, score: number) => ({
      date,
      weekday: 'Thứ hai',
      lunarDate: 'Mùng 1 tháng 1 âm lịch, năm Giáp Thìn',
      ganzhi: { year: 'Giáp Thìn', month: 'Bính Dần', day: 'Mậu Tý' },
      zodiac: 'Chuột',
      dayOfficer: 'Kiến',
      twelveStar: 'Thanh Long',
      twentyEightStar: 'Giác',
      nineStar: 'Nhất Bạch Thủy',
      gods: ['Thiên ân', 'Thiên đức'],
      recommends: ['Cưới hỏi', 'Xuất hành'],
      avoids: ['Động thổ'],
      pengZu: 'Mậu không nhận ruộng, ruộng chủ chẳng lành',
      clash: 'Xung tuổi Ngựa, sát hướng Nam',
      score,
      highlights: ['Việc nên trong ngày khớp với chủ đề'],
      cautions: [],
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        topic: body.topic ?? 'marriage',
        topicLabel: 'Cưới hỏi',
        startDate: body.startDate ?? '2026-01-01',
        endDate: body.endDate ?? '2026-01-03',
        days: [
          buildDay(body.startDate ?? '2026-01-01', 84),
          buildDay(body.endDate ?? '2026-01-03', 72),
        ],
        narrative:
          '## Tổng quan\nĐây là phần tư vấn chọn ngày mẫu cho kiểm thử, chỉ mang tính tham khảo.\n\n## Tóm lại\nHãy cân nhắc lịch thực tế của bạn.',
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
