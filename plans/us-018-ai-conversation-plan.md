# Plan US-018 — Trợ lý AI hội thoại nhiều lượt + Quick prompts (multi-turn + SSE streaming)

## Goal

Triển khai kênh AI hội thoại multi-turn port pattern xuanshu (
`.ref/xuanshu/components/ai/{AIAssistant,AIChatWindow,QuickPrompts}.tsx` +
`.ref/xuanshu/lib/ai/{analysisPrompts,transport}.ts`) — 2 bảng Supabase mới +
3 endpoint backend (SSE streaming cho `POST /messages`) + feature module web
với panel overlay + quick prompts + transport SSE viết tay (không thêm dependency
npm). Gắn 2 cờ feature-flag tách biệt + 2 quota daily mới + tái dùng gate AI
premium của US-010. KHÔNG port `AISettingsPanel.tsx` (cấu hình LLM client-side
bị loại — mọi cấu hình ở server).

Đóng story khi 12 phase merged + 2 cờ giữ `false` ở prod + smoke 1 conversation
thật chạy đủ 3 lượt ở stg.

## Pre-conditions

- `docs/decisions/0013-ai-conversation-channel.md` accepted (đã có, 2026-06-17).
- US-010 merged (gate AI `assertCanUseAiExplanation` + cờ
  `AI_EXPLANATION_FREE_FOR_ALL` + mã lỗi `PAYMENT_REQUIRED` đã có ở
  `apps/api/src/modules/explanations/services/explanations.service.ts` +
  `packages/contracts/src/api/backend-api.ts`).
- Đọc trước:
  - `docs/decisions/0013-ai-conversation-channel.md` (kiến trúc + bảng + SSE +
    quota + quick prompts).
  - `docs/decisions/0010-premium-ai-entitlement-flag.md` (gate AI dùng chung).
  - `docs/decisions/0009-anonymous-auth-strategy.md` (anon vẫn dùng được, có
    quota IP riêng).
  - `apps/api/src/modules/explanations/services/explanations.service.ts`
    (pattern gate AI + idempotency + provider router).
  - `apps/api/supabase/migrations/000001_user-owned-astrology-records.up.sql`
    (pattern migration: RLS owner-only, index, FK CASCADE).
  - `apps/api/src/modules/quotas/quotas.service.ts` (pattern sliding-window +
    daily-per-user/IP).
  - `apps/web/src/lib/api-client/{index.ts,fetch-json.ts}` (pattern flat
    function + `ApiError` + `ApiErrorKind`).
  - `.ref/xuanshu/components/ai/{AIAssistant,AIChatWindow,QuickPrompts}.tsx`
    + `.ref/xuanshu/lib/ai/{analysisPrompts,transport}.ts` (pattern UI +
    transport reference).
  - `docs/templates/high-risk-story/` (template 4 file).
- Chạy intake:
  `scripts\bin\harness-cli.exe intake --type spec-slice --summary "US-018 AI conversation channel + multi-turn + quick prompts" --lane high-risk`.
- Branch riêng: `feat/us-018-ai-conversation` (không push lên `main`).

## Phase 1 — Env + 2 cờ + 2 quota

- [ ] Cập nhật `apps/api/src/config/env.ts`:
  - `AI_CONVERSATION_ENABLED: z.stringbool().default(false)` — KHÔNG dùng
    `z.coerce.boolean()` (regression decision 0010).
  - `API_CONVERSATION_MESSAGES_PER_DAY_PER_USER: z.coerce.number().int().positive().default(30)`.
  - `API_ANON_CONVERSATION_MESSAGES_PER_DAY_PER_IP: z.coerce.number().int().positive().default(10)`.
- [ ] Cập nhật `apps/api/src/config/env.test.ts`:
  - Test parse default `false`/`30`/`10`.
  - Reject `AI_CONVERSATION_ENABLED=invalid`.
  - Regression `'false' → false` (không bị `Boolean('false')===true`).
- [ ] Cập nhật `.env.example` thêm block:
  ```
  # --- AI conversation (US-018) ---
  AI_CONVERSATION_ENABLED=false
  API_CONVERSATION_MESSAGES_PER_DAY_PER_USER=30
  API_ANON_CONVERSATION_MESSAGES_PER_DAY_PER_IP=10
  ```
- [ ] Files đụng: `apps/api/src/config/env.ts`,
  `apps/api/src/config/env.test.ts`, `.env.example`.
- [ ] Validation: `pnpm -F @ziweiai/api test -- env.test`.

## Phase 2 — Migration `conversations` + `conversation_messages` (up + down)

- [ ] Tạo `apps/api/supabase/migrations/000NNN_ai-conversations.up.sql` (số
  tiếp theo, đọc `apps/api/supabase/migrations/` để xác định):
  - Bảng `public.conversations` (`id` uuid pk, `owner_user_id` FK
    `auth.users(id)` ON DELETE CASCADE, `chart_id` FK
    `public.chart_snapshots(id)` ON DELETE SET NULL, `context_scope` text
    CHECK in (`overview`, `palace`, `pairing`), `created_at` timestamptz,
    `last_activity_at` timestamptz).
  - Bảng `public.conversation_messages` (`id` uuid pk, `conversation_id` FK
    `public.conversations(id)` ON DELETE CASCADE, `role` text CHECK in
    (`user`, `assistant`, `system`), `content` text, `tokens_in` int,
    `tokens_out` int, `created_at` timestamptz).
  - Index: `conversations_owner_last_activity_idx (owner_user_id, last_activity_at desc)`,
    `conversations_owner_chart_idx (owner_user_id, chart_id)`,
    `conversation_messages_conversation_created_idx (conversation_id, created_at asc)`.
  - RLS owner-only: 4 policy trên `conversations` (select/insert/update/delete
    `auth.uid() = owner_user_id`); 2 policy trên `conversation_messages`
    (select/insert qua join `conversations.owner_user_id = auth.uid()`).
- [ ] Tạo `apps/api/supabase/migrations/000NNN_ai-conversations.down.sql` —
  drop policy → drop table CASCADE.
- [ ] Mở rộng `apps/api/src/database/supabase-persistence.gateway.ts`:
  - `createConversation({ ownerUserId, chartId, contextScope })`.
  - `findConversationByIdOwned(ownerUserId, conversationId)`.
  - `listConversationMessages(ownerUserId, conversationId)` (qua join
    ownership; trả mảng asc by createdAt).
  - `insertConversationMessages(ownerUserId, conversationId, [userMsg, assistantMsg])`
    transactional 2 row.
  - `updateConversationLastActivityAt(ownerUserId, conversationId, ts)`.
  - `countConversationUserMessagesSince(ownerUserId, sinceIso)` (đếm role='user' trong 24h).
- [ ] Cập nhật `apps/api/src/database/supabase-persistence.gateway.test.ts`:
  - 2 user fixture; cross-user select/insert bị RLS chặn.
  - Index list `(owner, last_activity_at desc)` thực sự dùng (verify query
    plan EXPLAIN nếu test hỗ trợ; nếu không → bỏ qua, tin DB).
- [ ] Files đụng: 2 file migration mới, gateway + gateway test.
- [ ] Validation: chạy migration trên Supabase local;
  `pnpm -F @ziweiai/api test -- supabase-persistence.gateway`.

## Phase 3 — Contracts conversation/message/quick-prompt

- [ ] Tạo `packages/contracts/src/conversations/conversation.ts`:
  - `contextScopeSchema = z.enum(['overview','palace','pairing'])`.
  - `conversationSchema` (`id`, `ownerUserId`, `chartId` nullable,
    `contextScope` nullable, `createdAt`, `lastActivityAt`).
  - `createConversationRequestSchema` (`{ chartId?: string|null, contextScope: contextScopeSchema }`).
  - `createConversationResponseSchema` (`{ conversationId: string }`).
  - `getConversationResponseSchema` (`{ conversation: conversationSchema, messages: conversationMessageSchema[] }`).
- [ ] Tạo `packages/contracts/src/conversations/conversation-message.ts`:
  - `conversationMessageRoleSchema = z.enum(['user','assistant','system'])`.
  - `conversationMessageSchema` (`id`, `conversationId`, `role`, `content`,
    `tokensIn` nullable, `tokensOut` nullable, `createdAt`).
  - `sendMessageRequestSchema` (`{ content: string, quickPromptKey?: quickPromptKeySchema }`).
- [ ] Tạo `packages/contracts/src/conversations/quick-prompt.ts`:
  - `quickPromptKeySchema = z.enum(['lifeOverview','careerYearly','lovePalace','wealthDecade','healthCaution','familyRelations'])`.
  - `quickPromptCatalogItemSchema = z.object({ key: quickPromptKeySchema, labelVi: z.string() })`.
  - Export catalog tĩnh `QUICK_PROMPT_CATALOG: QuickPromptCatalogItem[]` với
    nhãn Việt fixed.
- [ ] Cập nhật `packages/contracts/src/index.ts` re-export tất cả.
- [ ] Tests đi kèm: `conversation.test.ts`, `conversation-message.test.ts`,
  `quick-prompt.test.ts` — parse OK + reject input méo + role/contextScope/key
  enum đóng (reject `'unknown'`).
- [ ] Files đụng: 3 file mới + 3 test + `index.ts`.
- [ ] Validation: `pnpm -F @ziweiai/contracts test`; `pnpm why zod` đơn nhất.

## Phase 4 — Quick-prompt registry server-side + system prompt builder

- [ ] Tạo `apps/api/src/providers/ai/conversation-prompts.ts`:
  - `QUICK_PROMPT_TEMPLATES: Record<QuickPromptKey, string>` — 6 template
    Việt (ví dụ `lifeOverview`: "Hãy tổng quan vận mệnh từ lá số này, tập
    trung vào điểm nổi bật ở mệnh + thân + cung Quan Lộc.").
  - `resolveQuickPrompt(key: QuickPromptKey): string` — lookup; key sai →
    throw `ApiErrorHttpException(400, 'INVALID_INPUT', 'Quick prompt key không hợp lệ.')`.
  - `buildSystemPrompt(snapshot: ChartSnapshot | null, contextScope: ContextScope | null): string` —
    nếu có snapshot → chèn tóm tắt cung mệnh + đại vận hiện tại + ngữ cảnh
    `contextScope`; nếu null → chỉ chèn vai trò ("Bạn là chuyên gia Tử Vi
    Việt..."). KHÔNG chứa Han ở output (regex scan trong test).
  - `MAX_MESSAGES_PER_TURN = 12` constant; `pickContextMessages(messages: ConversationMessage[])`
    trả 12 message gần nhất (drop role='system' nếu đã có; system chèn riêng).
- [ ] Tests đi kèm: `conversation-prompts.test.ts`:
  - `resolveQuickPrompt('lifeOverview')` trả Việt template.
  - `resolveQuickPrompt('unknown' as never)` ném `INVALID_INPUT`.
  - `buildSystemPrompt(snapshot, 'overview')` không chứa Han (`/\p{Script=Han}/u` không match).
  - `pickContextMessages` cắt đúng khi length > 12 (drop cũ nhất).
- [ ] Files đụng: 1 file mới + 1 test.
- [ ] Validation: `pnpm -F @ziweiai/api test -- conversation-prompts`.

## Phase 5 — Backend service + provider router streaming

- [ ] Mở rộng `apps/api/src/providers/ai/explanation-provider-router.ts`:
  - Thêm method `streamGenerate(providerPreference, input): AsyncIterable<{ chunk: string }>`.
  - Mỗi adapter (`deepseek-explanation-provider`, `gemini-explanation-provider`,
    `openai-compatible-explanation-provider`) implement
    `streamGenerate` (hoặc fallback yield 1 chunk = full result của
    `generate(...)`).
- [ ] Tạo `apps/api/src/modules/conversations/conversations.service.ts`:
  - Constructor inject `SupabasePersistenceGateway`, `QuotasService`,
    `ExplanationProviderRouter`, `Logger`.
  - `createConversation(user, input)`: verify ownership chart nếu `chartId` có
    giá trị → insert row → trả `{ conversationId }`.
  - `getConversation(user, conversationId)`: select + ownership; messages asc.
  - `streamMessage(user, conversationId, input, ipAddress)`: AsyncIterable<SseEvent>:
    1. ownership check → 404 nếu không thuộc user.
    2. cờ `AI_CONVERSATION_ENABLED=false` → throw 404 `FEATURE_DISABLED` (mã
       lỗi tái dùng `NOT_FOUND` nếu `apiErrorCodeSchema` chưa có
       `FEATURE_DISABLED`; chốt: dùng `NOT_FOUND` để KHÔNG đụng schema mã lỗi
       trong story này).
    3. `assertCanUseAiExplanation()` (gate AI premium dùng chung US-010).
    4. `quotasService.assertCanSendConversationMessage(userId, ipAddress, isAnonymous)`.
    5. resolve `quickPromptKey` → prompt thật (nếu có).
    6. `listConversationMessages` (12 msg gần nhất) → `pickContextMessages`.
    7. `buildSystemPrompt(snapshot?, conversation.contextScope)`.
    8. yield setup → caller controller mở SSE.
    9. `for await chunk of providerRouter.streamGenerate(...)`: yield
       `{ event: 'token', data: { chunk } }`.
    10. on complete: insert 2 row (user msg + assistant msg) +
        `updateConversationLastActivityAt` → yield `{ event: 'done', data: { messageId, tokensIn, tokensOut } }`.
    11. on error: yield `{ event: 'error', data: { code, message } }` +
        KHÔNG insert.
- [ ] Mở rộng `apps/api/src/modules/quotas/quotas.service.ts`:
  - `assertCanSendConversationMessage(userId, ip, isAnonymous)` — pattern
    `assertCanCreateExplanation` nhưng dùng
    `API_CONVERSATION_MESSAGES_PER_DAY_PER_USER` /
    `API_ANON_CONVERSATION_MESSAGES_PER_DAY_PER_IP` +
    `countConversationUserMessagesSince` cho user thường.
- [ ] Tests đi kèm: `conversations.service.test.ts`:
  - Áp đúng trật tự gate (mock từng dependency, verify call order +
    early-return mỗi nhánh lỗi).
  - 12-msg buffer cắt đúng.
  - Insert 2 row CHỈ KHI stream xong; stream lỗi → KHÔNG insert.
  - Anon user áp quota IP; user thường áp quota DB count.
- [ ] Files đụng: provider router + 3 adapter, conversations.service +
  test, quotas.service + test regression.
- [ ] Validation: `pnpm -F @ziweiai/api test -- conversations`,
  `pnpm -F @ziweiai/api test -- quotas.service`.

## Phase 6 — Backend controller SSE

- [ ] Tạo `apps/api/src/modules/conversations/conversations.controller.ts`:
  - `POST /conversations` — body parse `createConversationRequestSchema` →
    `service.createConversation(user, input)` → trả `createConversationResponseSchema`.
  - `GET /conversations/:id` — `service.getConversation(user, id)` → trả
    `getConversationResponseSchema`.
  - `POST /conversations/:id/messages` — `@Res({ passthrough: false }) res`:
    - Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`,
      `X-Accel-Buffering: no`, `Connection: keep-alive`.
    - `for await event of service.streamMessage(...)`:
      - `res.write(\`event: \${event.event}\\ndata: \${JSON.stringify(event.data)}\\n\\n\`)`.
    - `res.end()` khi xong.
    - Wrap try/catch ngoài: nếu service ném HTTP error TRƯỚC khi mở SSE (gate /
      quota / ownership) → ApiErrorHttpException bubble lên (Nest filter trả
      JSON 4xx). Nếu lỗi sau khi đã mở SSE → emit `event: error` rồi `res.end()`.
- [ ] Tạo `apps/api/src/modules/conversations/conversations.module.ts` —
  imports `DatabaseModule`, `QuotasModule`, providers
  `ConversationsService`, `ExplanationProviderRouter`.
- [ ] Đăng ký `ConversationsModule` trong `apps/api/src/app.module.ts`.
- [ ] Tests đi kèm: integration test (Supertest hoặc tương đương) — gọi
  `POST /messages` thật với mock provider, verify chunk format `event: token`
  + `event: done`; verify 2 row đã insert; verify cờ off → 404 (KHÔNG mở SSE).
- [ ] Files đụng: 2 file mới + `app.module.ts`.
- [ ] Validation: `pnpm -F @ziweiai/api test -- conversations.controller`
  (hoặc tên test integration tương ứng).

## Phase 7 — Web transport (`conversation-stream.ts`)

- [ ] Tạo `apps/web/src/lib/api/conversation-stream.ts`:
  - `streamConversationMessage(token, conversationId, body, signal): AsyncGenerator<SseEvent>`
    — `fetch` POST với `Accept: text/event-stream` → `res.body.getReader()` →
    `TextDecoder` → buffer + split `\n\n` → parse mỗi block:
    `event: <name>` line + `data: <json>` line → yield `{ event, data }`.
  - Map non-OK response → `ApiError` (tái dùng `mapStatusToKind` của
    `fetch-json.ts`; xử lý 402 `PAYMENT_REQUIRED`, 429 `RATE_LIMITED`, 404,
    401).
  - Edge case: chunk cắt giữa block → giữ buffer, parse khi đủ `\n\n`.
- [ ] Cập nhật `apps/web/src/lib/api-client/index.ts`:
  - Thêm `createConversation(token, body)` qua `fetchJson` +
    `createConversationResponseSchema`.
  - Thêm `fetchConversation(token, id)` qua `fetchJson` +
    `getConversationResponseSchema`.
  - (Hàm stream gọi qua `streamConversationMessage`, KHÔNG đi qua `fetchJson`.)
- [ ] Tests đi kèm: `conversation-stream.test.ts` — mock `fetch` +
  `ReadableStream` fixture; parse 3 block + 1 done + edge case `\n\n` cắt
  giữa chunk; xử lý error response 402/429.
- [ ] Files đụng: 1 file mới + cập nhật `api-client/index.ts` + 1 test.
- [ ] Validation: `pnpm -F @ziweiai/web test -- conversation-stream`.

## Phase 8 — Web conversation-model + sendMessage flow

- [ ] Tạo `apps/web/src/lib/features/conversation/conversation-model.svelte.ts`:
  - `createConversationModel(chartId: string | null, contextScope: ContextScope)`.
  - `$state` cho `conversationId`, `messages[]`, `isStreaming`,
    `streamingDraft`, `error`.
  - `ensureConversation()` — POST nếu chưa có (lazy: chỉ tạo khi user gửi
    lượt đầu).
  - `loadHistory()` — GET nếu `conversationId` đã có (sau reload).
  - `sendMessage(content: string, quickPromptKey?: QuickPromptKey)`:
    1. `ensureConversation()`.
    2. Append optimistic bubble user (nếu `quickPromptKey` → label tạm "đang
       gửi câu hỏi gợi ý..." vì server resolve prompt thật, client KHÔNG biết
       trước nội dung). Sau khi `event: done` → reload qua `loadHistory()` để
       đồng bộ content thật từ DB.
    3. `for await event of streamConversationMessage(...)`:
       - `event: token` → append vào `streamingDraft`.
       - `event: done` → reload history, clear `streamingDraft`,
         `isStreaming = false`.
       - `event: error` → set `error`, `isStreaming = false`.
    4. `AbortController` lưu trong closure; cleanup khi unmount.
- [ ] Tests đi kèm: `conversation-model.test.ts` — happy path 3 lượt, quota
  exceeded → set error, abort khi unmount.
- [ ] Files đụng: 1 file mới + 1 test.
- [ ] Validation: `pnpm -F @ziweiai/web test -- conversation-model`.

## Phase 9 — Web UI panel + message list + quick prompts

- [ ] Tạo `apps/web/src/lib/features/conversation/MessageBubble.svelte` —
  render role user/assistant; assistant render markdown qua `MarkdownView.svelte`
  hiện có; system ẩn.
- [ ] Tạo `apps/web/src/lib/features/conversation/MessageList.svelte` —
  scroll container `var(--*)` styling; auto-stick-to-bottom (port logic từ
  `.ref/xuanshu/components/ai/AIChatWindow.tsx` sang Svelte 5: dùng
  `$effect` + `bind:this` cho scroll ref; KHÔNG dùng `useEffect` mechanic
  khi đó là `$derived`).
- [ ] Tạo `apps/web/src/lib/features/conversation/QuickPromptsBar.svelte` —
  render `QUICK_PROMPT_CATALOG` từ contracts; click button → emit event
  `quickPrompt` với `key`.
- [ ] Tạo `apps/web/src/lib/features/conversation/ConversationPanel.svelte` —
  drawer phải overlay 100vh trừ header; header (title "Trợ lý AI" + close +
  thu nhỏ); body `<MessageList>` + bubble streaming nếu `isStreaming`;
  footer `<QuickPromptsBar>` + textarea + send button.
- [ ] Tạo `apps/web/src/lib/features/conversation/index.ts` — public exports.
- [ ] Cập nhật `apps/web/src/lib/i18n/vi.ts` — thêm key:
  - `conversation.title`, `conversation.openButton`,
    `conversation.placeholder`, `conversation.sendButton`,
    `conversation.streamingHint`, `conversation.errorRetry`,
    `conversation.quotaExceeded`, `conversation.featureDisabled`.
  - `quickPrompt.lifeOverview`, `quickPrompt.careerYearly`,
    `quickPrompt.lovePalace`, `quickPrompt.wealthDecade`,
    `quickPrompt.healthCaution`, `quickPrompt.familyRelations`.
- [ ] Cập nhật `apps/web/src/routes/(app)/charts/[chartId]/+page.svelte`
  (hoặc component `ChartDetailScreen` hiện hành) — thêm nút "Hỏi AI" floating
  / inline; click → mở `<ConversationPanel>` với `chartId` + `contextScope='overview'`.
- [ ] Files đụng: 5 file mới trong `features/conversation/` + i18n vi +
  ChartDetail.
- [ ] Validation: `pnpm -F @ziweiai/web check`; manual smoke local
  (`pnpm -F @ziweiai/web dev` + mở chart → mở panel → gõ → verify bubble +
  reload).

## Phase 10 — E2E (mock LLM, không stream thật trong CI)

- [ ] Tạo `apps/api/test/mocks/conversation-stub-provider.ts`:
  - Khi env `LLM_PROVIDER_STUB=true` → `streamGenerate` yield chunk cố định
    `['Theo lá số ', 'của bạn, ', 'cung Mệnh có ', 'điểm đáng chú ý.']`.
  - Trả `tokensIn=42`, `tokensOut=24`.
- [ ] Cập nhật `apps/api/src/providers/ai/explanation-provider-router.ts`
  — nếu `LLM_PROVIDER_STUB=true` → return stub thay vì provider thật.
- [ ] Tạo `apps/web/e2e/conversation.spec.ts`:
  - Đăng nhập anon → tạo chart → mở panel → gõ "Hỏi tổng quan" → verify
    bubble user + bubble assistant streaming → verify content sau
    `event: done`.
  - Gửi 2 lượt nữa → verify 3 cặp bubble.
  - Reload trang → mở panel → verify 3 cặp bubble vẫn còn (load qua
    `GET /conversations/:id`).
  - Click quick prompt "Tổng quan vận mệnh" → verify câu hỏi user resolved
    (Việt) + bubble assistant.
  - Cờ `AI_CONVERSATION_ENABLED=false` (override env e2e) → nút "Hỏi AI" ẩn.
- [ ] Cập nhật `apps/web/playwright.config.ts` (nếu cần) — đảm bảo CI set
  `LLM_PROVIDER_STUB=true` + `AI_CONVERSATION_ENABLED=true` trước khi start
  backend.
- [ ] Files đụng: 1 mock + cập nhật router + 1 e2e spec + (optional)
  playwright config.
- [ ] Validation:
  `LLM_PROVIDER_STUB=true AI_CONVERSATION_ENABLED=true pnpm -F @ziweiai/web test:e2e -- conversation`.

## Phase 11 — Docs (api-contract / invariants / SPEC)

- [ ] Cập nhật `docs/product/api-contract.md`:
  - Thêm 3 endpoint conversation + format SSE (3 event: token / done /
    error).
  - Ghi rõ `quickPromptKey` resolve ở server, client KHÔNG gửi prompt thô.
- [ ] Cập nhật `docs/product/invariants.md`:
  - Bổ sung: chat bubble + system prompt mặc định + quick prompt label đều
    Việt; KHÔNG cấu hình LLM ở client; quick prompt key là enum đóng (chống
    prompt injection).
- [ ] Cập nhật `SPEC.md` — Phase US-018 section.
- [ ] Files đụng: 3 file docs.
- [ ] Validation: đọc lại; spot check `\p{Script=Han}` scan KHÔNG match label
  conversation UI ở DOM e2e.

## Phase 12 — Validate full + harness update + PR

- [ ] `pnpm -F @ziweiai/contracts test` → xanh.
- [ ] `pnpm -F @ziweiai/api test` → xanh (cộng test mới `conversations`,
  `conversation-prompts`, `quotas.service` regression).
- [ ] `pnpm -F @ziweiai/web check` → xanh.
- [ ] `pnpm -F @ziweiai/web build` → xanh.
- [ ] `pnpm why zod` → đơn nhất.
- [ ] `pnpm lint` → xanh (`--max-warnings=0`).
- [ ] `turbo typecheck` + `turbo test` → xanh.
- [ ] `LLM_PROVIDER_STUB=true AI_CONVERSATION_ENABLED=true pnpm -F @ziweiai/web test:e2e -- conversation` → xanh.
- [ ] `scripts\bin\harness-cli.exe story add --id US-018 --title "AI conversation channel" --lane high-risk --verify "pnpm -F @ziweiai/api test"` (nếu chưa có).
- [ ] `scripts\bin\harness-cli.exe story update --id US-018 --unit 1 --integration 1 --e2e 1 --platform 1`.
- [ ] `scripts\bin\harness-cli.exe trace --intake <n> --story US-018 --summary "AI conversation channel: 2 bảng + 3 endpoint + SSE + 6 quick prompts + UI panel + e2e mock LLM" --outcome completed --agent claude --actions "Phase 1..12" --read "<files>" --changed "<files>" --friction "<nếu có>"`.
- [ ] Push branch `feat/us-018-ai-conversation` (KHÔNG push `main`); mở PR
  vào `main` qua `gh pr create`.

## Risk + Rollback

- **Risk: cờ `AI_CONVERSATION_ENABLED=true` lỡ bật ở prod khi chưa sẵn** →
  cost LLM tăng đột biến. Mitigate: gate fail-CLOSED khi cờ off (404), log
  cảnh báo khi cờ on ở prod (giống pattern US-010 cho
  `AI_EXPLANATION_FREE_FOR_ALL`). Rollback nhanh: tắt cờ env, không cần
  redeploy code.
- **Risk: SSE qua reverse-proxy bị buffer** → user thấy stream "đứng" 5–20s
  rồi lộ ra cả khối. Mitigate: header `X-Accel-Buffering: no` +
  `Cache-Control: no-cache` + `Content-Type: text/event-stream`. Note vào
  release guide; smoke ở stg để xác nhận. Rollback: nếu proxy không cho qua
  → backlog NDJSON (chunked-JSON-lines) cùng endpoint, không đổi public
  contract.
- **Risk: 12-msg buffer + summary mỗi lượt → token tăng → vượt context
  window** → provider trả lời cụt. Mitigate: log `tokensIn` + cảnh báo nếu
  > 80% context window mặc định; quota daily là trần cuối. Rollback:
  giảm `MAX_MESSAGES_PER_TURN` xuống 8 (hằng số trong code, hot fix nhanh).
- **Risk: client đóng connection giữa stream → assistant message dở dang**
  → mất nội dung đã stream về client nhưng DB không có. Mitigate (đã chốt
  trong design): KHÔNG insert partial; user gửi lại lượt là cách khôi phục
  duy nhất. Backlog: persist partial + đánh dấu `interrupted`.
- **Risk: prompt injection qua quick prompt** → mitigate: enum đóng, server
  resolve sang template Việt fixed; client gửi `quickPromptKey` không phải
  prompt thô. Test: `resolveQuickPrompt('unknown' as never)` ném
  `INVALID_INPUT`.
- **Risk: privacy — content message lưu DB lộ ra** → mitigate: RLS
  owner-only BẮT BUỘC qua join `conversations.owner_user_id`; cross-user
  test bắt buộc xanh trước khi merge P2; KHÔNG log content trong
  observability.
- **Risk: provider router `streamGenerate` không hoạt động cho ≥ 2 trong 3
  provider hiện có** → fallback emit 1 chunk lớn (không stream thật, nhưng
  contract endpoint vẫn đúng). Story vẫn đóng được; UX kém hơn nhưng không
  block release.
- **Rollback toàn diện**: tắt 2 cờ env (`AI_CONVERSATION_ENABLED=false`)
  → endpoint trả 404 → UI ẩn nút "Hỏi AI" → user không thấy tính năng. Có
  thể giữ migration DB (bảng rỗng, chi phí lưu trữ thấp). KHÔNG cần down
  migration trừ khi muốn dọn schema.

## Done Criteria

- [ ] 2 cờ env mới + 2 quota mới có default an toàn
  (`AI_CONVERSATION_ENABLED=false`, `30`, `10`); regression `z.stringbool`
  xanh.
- [ ] Migration `000NNN_ai-conversations.up.sql` + `.down.sql` chạy được trên
  Supabase local; RLS chặn cross-user trên `conversation_messages` qua join.
- [ ] 3 schema mới (`conversation`, `conversation-message`, `quick-prompt`)
  trong `@ziweiai/contracts` với test parse OK + reject; export qua
  `index.ts`.
- [ ] 3 endpoint backend (`POST /conversations`, `GET /conversations/:id`,
  `POST /conversations/:id/messages`) áp đúng trật tự gate (cờ → AI gate
  → quota → ownership) + SSE streaming chạy thật với mock provider; insert 2
  row CHỈ KHI stream xong.
- [ ] Quick-prompt registry server-side với 6 key Việt; client KHÔNG gửi
  prompt thô; key sai → `INVALID_INPUT`.
- [ ] Provider router có `streamGenerate` cho 3 adapter; fallback emit 1
  chunk khi provider không hỗ trợ.
- [ ] Web transport `conversation-stream.ts` parser SSE viết tay (không
  thêm dependency); xử lý edge case `\n\n` cắt giữa chunk; map error 402/429.
- [ ] Web feature module `conversation/` (model + panel + message list +
  bubble + quick prompts bar) + nút "Hỏi AI" trên ChartDetail.
- [ ] i18n vi đầy đủ; `\p{Script=Han}` scan KHÔNG match label
  conversation UI.
- [ ] E2E mock LLM xanh — gửi 3 lượt + reload + quick prompt + cờ off ẩn nút.
- [ ] `pnpm -F @ziweiai/api test` + `pnpm -F @ziweiai/web check` +
  `pnpm -F @ziweiai/web build` + `pnpm lint` + `turbo typecheck` xanh.
- [ ] `pnpm why zod` đơn nhất.
- [ ] Harness story `US-018` cập nhật proof (`unit 1 integration 1 e2e 1
  platform 1`) + 1 trace ghi rõ outcome.
- [ ] PR `feat/us-018-ai-conversation` mở vào `main` (KHÔNG push trực tiếp).
