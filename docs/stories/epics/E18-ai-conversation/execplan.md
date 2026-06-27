# Exec Plan

## Goal

Triển khai trợ lý AI hội thoại nhiều lượt (multi-turn) port pattern xuanshu —
bảng `conversations` + `conversation_messages` ở Supabase, 3 endpoint backend
(SSE streaming cho lượt gửi message), feature module web với panel overlay +
quick prompts + transport SSE viết tay, gắn 2 cờ feature-flag tách biệt (
`AI_CONVERSATION_ENABLED` + chia sẻ `AI_EXPLANATION_FREE_FOR_ALL` của US-010) +
2 quota daily mới.

Story đóng khi 6 phase merged thành công + cờ giữ `false` ở prod, smoke xong
ở stg với 1 conversation thật chạy đủ 3 lượt.

## Scope

In scope:

- 2 cờ env mới (`AI_CONVERSATION_ENABLED`, 2 quota
  `API_CONVERSATION_MESSAGES_PER_DAY_PER_USER` +
  `API_ANON_CONVERSATION_MESSAGES_PER_DAY_PER_IP`).
- Migration Supabase tạo 2 bảng `conversations` + `conversation_messages` + RLS
  owner-only + index list.
- 3 schema mới trong `@ziweiai/contracts/src/conversations/`:
  `conversation.ts`, `conversation-message.ts`, `quick-prompt.ts`.
- Module backend `apps/api/src/modules/conversations/` với 3 endpoint.
- Quick-prompt registry server-side
  (`apps/api/src/providers/ai/conversation-prompts.ts`).
- Mở rộng `QuotasService` thêm `assertCanSendConversationMessage`.
- Mở rộng `SupabasePersistenceGateway` thêm method CRUD conversation +
  `countConversationUserMessagesSince`.
- Mở rộng `ExplanationProviderRouter` thêm `streamGenerate(...)` (DeepSeek /
  Gemini / OpenAI-compat). Provider không hỗ trợ stream → fallback emit 1
  chunk.
- Web transport `conversation-stream.ts` — parser SSE viết tay bằng
  `Response.body.getReader()`.
- Feature module web `apps/web/src/lib/features/conversation/` (model + panel +
  message list + bubble + quick prompts bar).
- Nút "Hỏi AI" gắn vào `ChartDetailScreen.svelte`.
- i18n vi cho mọi label + system prompt mặc định + quick prompt label.
- E2E mocked LLM (env stub) — 3 lượt + reload.
- Cập nhật docs (`api-contract.md`, `invariants.md`, `SPEC.md`).

Out of scope:

- UI "danh sách hội thoại lịch sử" (sidebar) — backlog.
- Nút "Stop generation" / regenerate lượt cuối — backlog.
- Vision / ảnh đính kèm — phạm vi US-017e/f.
- Port `AISettingsPanel.tsx` của xuanshu (model/temperature client-side bị
  loại).
- Billing thật / bảng tier / payment — decision + story riêng.
- Chuyển provider sang stateful chat API (Anthropic Messages, OpenAI Threads) —
  decision riêng nếu cần.
- Xử lý cleanup partial assistant message khi client đóng connection giữa
  chừng — backlog.
- Sửa schema 5 bảng cũ (`birth_profiles`, `chart_snapshots`,
  `explanation_requests`, `explanation_results`, `history_views`).

## Risk Classification

Risk flags:

- **Schema DB mới** (2 bảng + 4 RLS policy + 3 index) — rủi ro release.
- **Đường tiền tệ** — LLM cost hội thoại cao hơn 1-shot (12-msg context + nhiều
  lượt). Phải có gate AI dùng chung `AI_EXPLANATION_FREE_FOR_ALL` + quota daily
  riêng.
- **Streaming response** — SSE qua reverse-proxy (Cloudflare/Nginx) đôi khi bị
  buffer. Cần header `X-Accel-Buffering: no` + `Cache-Control: no-cache`.
- **Public contract** — 3 endpoint mới + 3 schema mới phải parse OK ở web.
- **Privacy** — content message lưu DB; KHÔNG log content; RLS BẮT BUỘC owner-only.
- **Prompt injection** — quick prompt phải resolve ở SERVER theo enum đóng;
  client KHÔNG gửi prompt thô.

Hard gates:

- 2 cờ default `false`; gate fail-CLOSED khi cờ off (404 FEATURE_DISABLED).
- AI gate `assertCanUseAiExplanation` áp TRƯỚC mỗi `POST /messages` (không chỉ
  `POST /conversations`).
- Quota `assertCanSendConversationMessage` áp NGAY SAU gate AI, TRƯỚC khi mở
  SSE.
- RLS owner-only PHẢI test cross-user select trên `conversation_messages` qua
  join, không chỉ trên `conversations`.
- Web boundary nguyên vẹn — KHÔNG import `core`/`astro-engine`/`iztro`.
- KHÔNG thêm dependency npm mới ở web (transport viết tay).
- `pnpm why zod` đơn nhất sau khi thêm contracts mới.

## Work Phases

### P0 — Env + 2 cờ + 2 quota

Files dự kiến:

- `apps/api/src/config/env.ts` — thêm `AI_CONVERSATION_ENABLED` (`z.stringbool`),
  `API_CONVERSATION_MESSAGES_PER_DAY_PER_USER`,
  `API_ANON_CONVERSATION_MESSAGES_PER_DAY_PER_IP`.
- `apps/api/src/config/env.test.ts` — test parse default false; reject sai;
  regression `z.stringbool` không bug `'false'→true`.
- `.env.example` — thêm block ghi chú 3 biến mới.

Validation: `pnpm -F @ziweiai/api test -- env.test`.

### P1 — Migration `conversations` + `conversation_messages` (up + down)

Files dự kiến:

- `apps/api/supabase/migrations/000NNN_ai-conversations.up.sql` — tạo 2 bảng,
  3 index, 5 RLS policy (4 trên `conversations` + 2 trên `conversation_messages`).
- `apps/api/supabase/migrations/000NNN_ai-conversations.down.sql` — drop policy
  → drop table CASCADE.
- `apps/api/src/database/supabase-persistence.gateway.ts` — thêm method
  CRUD: `createConversation`, `findConversationByIdOwned`,
  `listConversationMessages`, `insertConversationMessages` (transactional 2 row),
  `updateConversationLastActivityAt`, `countConversationUserMessagesSince`.
- `apps/api/src/database/supabase-persistence.gateway.test.ts` — test CRUD +
  RLS (qua 2 user fixture; cross-user select bị block).

Validation: chạy migration trên Supabase local; integration test cross-user
chạy xanh; gateway test xanh.

### P2 — Contracts conversation/message/quick-prompt

Files dự kiến:

- `packages/contracts/src/conversations/conversation.ts` —
  `contextScopeSchema`, `conversationSchema`, `createConversationRequestSchema`,
  `createConversationResponseSchema`.
- `packages/contracts/src/conversations/conversation-message.ts` —
  `conversationMessageSchema`, `sendMessageRequestSchema`,
  `getConversationResponseSchema`.
- `packages/contracts/src/conversations/quick-prompt.ts` —
  `quickPromptKeySchema` (enum đóng), `quickPromptCatalogSchema` (key + labelVi).
- `packages/contracts/src/index.ts` — re-export.
- Tests đi kèm: `conversation.test.ts`, `conversation-message.test.ts`,
  `quick-prompt.test.ts` (parse OK + reject input méo + role enum đóng).

Validation: `pnpm -F @ziweiai/contracts test`; `pnpm why zod` đơn nhất.

### P3 — Backend module conversations + streaming SSE

Files dự kiến:

- `apps/api/src/modules/conversations/conversations.module.ts`.
- `apps/api/src/modules/conversations/conversations.controller.ts` — 3 endpoint;
  `POST /messages` set headers `Content-Type: text/event-stream`,
  `Cache-Control: no-cache`, `X-Accel-Buffering: no`, `Connection: keep-alive`;
  ghi chunk qua `Response` của Express (nest controller dùng `@Res()` đặc biệt
  cho stream).
- `apps/api/src/modules/conversations/conversations.service.ts` — gate +
  build prompt + stream + persist (theo trật tự bắt buộc trong design.md
  §Application Flow).
- `apps/api/src/providers/ai/conversation-prompts.ts` — `buildSystemPrompt(chartSnapshot, contextScope)` +
  `resolveQuickPrompt(quickPromptKey)` map sang template Việt; client KHÔNG
  gửi prompt thô. Test parse OK + key sai → throw.
- `apps/api/src/providers/ai/explanation-provider-router.ts` — thêm
  `streamGenerate(...)` (AsyncIterable<string>). Adapter từng provider
  (`deepseek`, `gemini`, `openai-compat`) implement; provider không hỗ trợ
  stream → fallback yield 1 chunk.
- `apps/api/src/modules/quotas/quotas.service.ts` — thêm
  `assertCanSendConversationMessage(userId, ip, isAnonymous)`.
- `apps/api/src/app.module.ts` — đăng ký `ConversationsModule`.
- Tests đi kèm: `conversations.service.test.ts` (gate + ownership + 12-msg
  buffer + insert sau stream); `conversation-prompts.test.ts`;
  `quotas.service.test.ts` regression cộng test mới.

Validation: `pnpm -F @ziweiai/api test -- conversations`; integration test
SSE chunk format đúng (mock provider yield 3 chunk).

### P4 — Web transport SSE (`conversation-stream.ts`)

Files dự kiến:

- `apps/web/src/lib/api/conversation-stream.ts` — `streamConversationMessage()`
  AsyncGenerator dùng `fetch` + `Response.body.getReader()` + `TextDecoder`
  + parser block `event:`/`data:` chia bằng `\n\n`. Map error response →
  `ApiError` (tái dùng `fetch-json.ts`).
- `apps/web/src/lib/api-client/index.ts` — thêm flat function
  `createConversation(token, body)` + `fetchConversation(token, id)`. (Hàm
  stream gọi qua `streamConversationMessage`, KHÔNG đi qua `fetchJson`.)
- Tests đi kèm: `conversation-stream.test.ts` — mock `fetch` + ReadableStream
  fixture, parse 3 block + 1 done + edge case `\n\n` cắt giữa chunk.

Validation: `pnpm -F @ziweiai/web test -- conversation-stream`.

### P5 — Web UI panel + message list + quick prompts

Files dự kiến:

- `apps/web/src/lib/features/conversation/conversation-model.svelte.ts` —
  `$state` messages + cursor + `sendMessage()` + `loadHistory()` +
  `ensureConversation()`. Cleanup `AbortController` khi unmount.
- `apps/web/src/lib/features/conversation/ConversationPanel.svelte` — drawer
  phải overlay + header (title "Trợ lý AI", close button) + body
  (`<MessageList>`) + footer (`<QuickPromptsBar>` + textarea + send button).
- `apps/web/src/lib/features/conversation/MessageList.svelte` — scroll
  container + auto-stick-to-bottom (port từ xuanshu `AIChatWindow.tsx` nhưng
  Svelte 5 runes); render `messages[]` + bubble streaming nếu
  `isStreaming`.
- `apps/web/src/lib/features/conversation/MessageBubble.svelte` — render role
  user/assistant (system ẩn không show); markdown render dùng `MarkdownView.svelte`
  hiện có.
- `apps/web/src/lib/features/conversation/QuickPromptsBar.svelte` — render
  catalog (lấy từ contracts); click → gọi `sendMessage('', quickPromptKey)`.
- `apps/web/src/lib/i18n/vi.ts` — thêm key:
  - `conversation.title` ("Trợ lý AI")
  - `conversation.placeholder` ("Hỏi điều bạn muốn biết về lá số...")
  - `conversation.sendButton` ("Gửi")
  - `conversation.openButton` ("Hỏi AI")
  - `conversation.streamingHint` ("Trợ lý đang trả lời...")
  - `conversation.errorRetry` ("Đã xảy ra lỗi, hãy thử lại")
  - `conversation.quotaExceeded` ("Bạn đã hỏi đủ số lượt hôm nay")
  - `conversation.featureDisabled` ("Tính năng đang phát triển")
  - `quickPrompt.lifeOverview`, `quickPrompt.careerYearly`, ... (6 key).
- `apps/web/src/routes/(app)/charts/[chartId]/+page.svelte` (hoặc
  `ChartDetailScreen` tương đương) — thêm nút "Hỏi AI" mở panel.

Validation: `pnpm -F @ziweiai/web check`; manual smoke local.

### P6 — E2E (mock LLM, không stream thật trong CI)

Files dự kiến:

- `apps/web/e2e/conversation.spec.ts` — Playwright:
  - Đăng nhập anon → mở chart → mở panel "Hỏi AI" → gửi 3 lượt câu hỏi (mock
    LLM trả response cố định) → verify 3 cặp bubble user/assistant.
  - Reload trang → panel khôi phục lịch sử qua `GET /conversations/:id`.
  - Click quick prompt → câu hỏi gửi đúng.
- `apps/api/test/mocks/conversation-stub-provider.ts` — env
  `LLM_PROVIDER_STUB=true` → provider mock yield chunk cố định
  `["Theo lá số ", "của bạn, ", "..."]` (deterministic, không cần internet).
- `apps/web/playwright.config.ts` — đảm bảo CI set `LLM_PROVIDER_STUB=true`
  trước khi start backend.

Validation: `pnpm -F @ziweiai/web test:e2e -- conversation`.

### P7 — Docs + harness

Files dự kiến:

- `docs/product/api-contract.md` — thêm 3 endpoint conversation + format SSE
  (3 event: token / done / error).
- `docs/product/invariants.md` — bổ sung: chat bubble + system prompt + quick
  prompt label đều Việt; KHÔNG cấu hình LLM ở client; quick prompt key là enum
  đóng (chống prompt injection).
- `SPEC.md` — cập nhật roadmap phase US-018.
- `scripts\bin\harness-cli.exe story add --id US-018 --title "AI conversation channel" --lane high-risk --verify "pnpm -F @ziweiai/api test"` (nếu chưa có).
- `scripts\bin\harness-cli.exe story update --id US-018 --unit 1 --integration 1 --e2e 1 --platform 1` sau khi P0–P6 xanh.
- `scripts\bin\harness-cli.exe trace --intake <n> --story US-018 --summary "..." --outcome completed --agent claude --actions "..." --read "..." --changed "..." --friction "..."`.

Validation: `pnpm lint` + `turbo typecheck` + `turbo test` + `pnpm -F @ziweiai/web build` xanh; spot check `\p{Script=Han}` scan KHÔNG match label conversation UI.

## Progress

> Nguồn sự thật của proof là harness (`scripts/bin/harness-cli.exe query matrix`),
> KHÔNG phải mục này. Tại thời điểm cập nhật: US-018 = `implemented`, proof
> `unit/integration/e2e/platform = 1/1/1/1`, PR #16 (`feat/us-018-ai-assistant-sse`)
> còn OPEN — CHƯA merge. Mục Progress dưới đây chỉ tường thuật để một agent mất
> context có thể nối lại; khi lệch với harness thì harness thắng.

- [x] (2026-06-24 16:03Z) P-merge: hợp nhất `main` vào nhánh US-018, main thắng ở
  vùng refactor, chỉ layer thêm code conversation/SSE (commit `cf9cc29`).
- [x] (2026-06-17/18) P0–P5: env + 2 cờ + 2 quota, migration 2 bảng + RLS,
  contracts conversation/message/quick-prompt, module backend + SSE, transport
  web viết tay, UI panel + quick prompts. (Cài đặt gốc landed quanh `882c465`
  2026-06-18; timestamp per-file sớm hơn không tái dựng chính xác được từ log
  hiện có — đừng bịa mốc.)
- [x] (2026-06-24 16:09Z) Đồng bộ quota hội thoại với store đếm bền của US-013,
  bỏ `anonDailyIpBuckets`, dùng `DailyQuotaExceededError` có kiểu (commit
  `5043cf3`).
- [x] (2026-06-24 17:09Z) Review-fix vòng 1 (gemini/cubic/codex): thứ tự header
  SSE, P1 whitespace-delta, real IP, typed quota mapping, lọc dangling turn,
  bản migration, cleanup stream + restore input ở web (commit `47c6905`).
- [x] (2026-06-25 02:03Z) Review-fix vòng 2 (gemini/codex): entitlement gate
  TRƯỚC quota, preprocess env empty-string, guard `res.destroyed` cho SSE,
  optimistic rollback `slice(0,-2)`, gỡ effect chết (commit `9026956`).
- [x] (2026-06-25 02:58Z) Review-fix: chunking SSE, quick prompts, thứ tự
  migration, quotas (commit `deb2837`).
- [x] (2026-06-25 05:43Z) Xử lý nốt findings của code-reviewer-pro trên PR #16
  (commit `6c9d4aa`).
- [x] (2026-06-25 10:15Z) P6: thêm coverage E2E cho US-018 (cùng mẻ với US-010/
  013/014/017i-j/022) (commit `50e9c0c`).
- [x] (2026-06-25 04:17Z) P7 (phần docs/decision): defer stream hardening sang
  backlog #28 + ADR `0019` (commits `f58fce4`, `9630885`).
- [ ] Đóng story (còn lại): merge PR #16, giữ `AI_CONVERSATION_ENABLED=false` ở
  prod, smoke ở stg với 1 conversation thật chạy đủ 3 lượt (điều kiện đóng nêu ở
  `Goal`). Hiện chưa thực hiện vì PR vẫn open.

## Surprises & Discoveries

- Observation: `z.stringbool` xử lý chuỗi rỗng `''` không như kỳ vọng cho cờ env,
  cần preprocess empty-string để default `false` không bị lật.
  Evidence: review-fix "env empty-string preprocess" trong commit `9026956`.
- Observation: Khi client đóng connection giữa stream, ghi tiếp vào response đã
  hủy gây lỗi; phải guard `res.destroyed` trước mỗi lần ghi chunk.
  Evidence: "res.destroyed SSE guard", commit `9026956`.
- Observation: Rollback optimistic phải cắt đúng cặp user+assistant cuối
  (`slice(0,-2)`), không chỉ 1 phần tử, nếu không message list lệch.
  Evidence: commit `9026956`.
- Observation: Chunking SSE phát sinh P1 sai lệch whitespace giữa các delta khi
  ghép lại ở client.
  Evidence: "whitespace-delta P1", commit `47c6905`.
- Observation: Vì kiến trúc ban đầu emit "fake chunk" (provider chưa stream
  thật), đặc tả abort/timeout/retry cho stream KHÔNG mang lại giá trị quan sát
  được, nên defer thay vì cài cho có.
  Evidence: commit `f58fce4` + ADR `0019`.

## Decision Log

- Decision: Defer stream hardening (abort/timeout/retry) ra khỏi US-018, đưa vào
  backlog #28.
  Rationale: Provider mới emit fake-chunk nên lifecycle-safety chưa kiểm chứng
  được; cài lúc này là code chết. Quyết định bền vững ghi ở `docs/decisions/0019`.
  Date/Author: 2026-06-25 / claude (commits `f58fce4`, `9630885`).
- Decision: Quota hội thoại dùng chung store đếm bền của US-013 thay vì bucket
  in-memory riêng.
  Rationale: Tránh trùng cơ chế đếm và mất số liệu khi restart; thống nhất với
  `DailyQuotaExceededError` có kiểu.
  Date/Author: 2026-06-24 / claude (commit `5043cf3`).
- Decision: Áp entitlement (AI gate) TRƯỚC quota trên mỗi `POST /messages`.
  Rationale: Khớp hard gate trong `Risk Classification`; không tiêu quota khi
  feature/entitlement đã chặn.
  Date/Author: 2026-06-25 / claude (commit `9026956`).
- Decision: Merge `main` vào nhánh — main thắng ở vùng refactor dùng chung, chỉ
  layer thêm code conversation/SSE.
  Rationale: Không để PR cũ ghi đè refactor mới hơn ở `main`.
  Date/Author: 2026-06-24 / claude (commit `cf9cc29`).
- Note (sau US-018): ADR `0019` (defer) về sau bị thay thế bởi ADR `0026` qua
  story US-027 khi streaming provider thật được triển khai (backlog #28). Ghi lại
  ở đây để truy vết; chi tiết durable nằm ở `docs/decisions/`.

## Outcomes & Retrospective

Đã triển khai trọn P0–P7: 2 cờ + 2 quota, migration 2 bảng + RLS owner-only, 3
contracts, module backend 3 endpoint + SSE, transport web viết tay, UI panel +
quick prompts, E2E mock LLM, và docs/decision. Harness ghi US-018 `implemented`
với proof `1/1/1/1`.

So với `Goal`: phần "6 phase implemented" đạt, nhưng điều kiện đóng story ("merged
thành công + cờ giữ `false` ở prod + smoke stg 3 lượt") CHƯA hoàn tất vì PR #16
còn open. Đây là khoảng cách còn lại, không phải việc đã xong.

Bài học: chốt sớm rằng stream hardening không có giá trị quan sát khi provider
còn fake-chunk đã tránh được code chết; phần streaming thật được tách đúng sang
US-027 + ADR `0026` thay vì nhồi vào US-018.

## Stop Conditions

Pause for human confirmation if:

- Migration FAIL chạy trên Supabase local (RLS sai cú pháp, FK xung đột) →
  hard block; KHÔNG merge P1 cho tới khi sửa.
- Cross-user RLS test FAIL (user B đọc được message của user A) → hard block;
  vi phạm bất biến privacy.
- Provider router không thể `streamGenerate(...)` cho ≥ 2 trong 3 provider
  hiện có (DeepSeek/Gemini/OpenAI-compat) → quyết định fallback non-stream
  hoàn toàn (emit 1 chunk lớn) hoặc dừng story chờ provider streaming sẵn
  sàng.
- SSE qua reverse-proxy ở stg bị buffer dù đã set headers chuẩn → backlog
  fallback: chuyển transport sang chunked-JSON-lines (NDJSON) trên cùng
  endpoint, hoặc yêu cầu ops chỉnh proxy.
- 12-msg buffer khiến token vượt context window của provider mặc định ở câu
  trả lời dài → chốt `MAX_MESSAGES_PER_TURN` thấp hơn (ví dụ 8) hoặc thêm
  summarizer tự động (decision riêng).
- Cờ `AI_CONVERSATION_ENABLED=true` ở prod được đề xuất bật trong phạm vi
  US-018 — vi phạm hard gate; chỉ stg.
- Phải đụng schema 5 bảng cũ → vi phạm Out of scope; dựng decision riêng
  trước.
- Yêu cầu thêm dependency npm mới ở web (`@microsoft/fetch-event-source`,
  `eventsource-parser`, ...) — vi phạm boundary; chỉ thêm khi chứng minh được
  parser viết tay không đủ.
- Yêu cầu port `AISettingsPanel.tsx` (cấu hình LLM client-side) — vi phạm
  Non-Goal; cần decision riêng nếu thực sự cần.
