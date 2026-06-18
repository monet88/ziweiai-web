# US-018 Trợ lý AI hội thoại nhiều lượt — bảng `conversations` + streaming SSE + quick prompts (port pattern xuanshu)

## Status

planned

## Lane

high-risk

## Product Contract

Mở rộng năng lực AI từ "1 lượt markdown tĩnh" (hiện tại của `POST /explanations`) sang
**trợ lý hội thoại nhiều lượt có ngữ cảnh**, port pattern từ
`.ref/xuanshu/components/ai/{AIAssistant,AIChatWindow,QuickPrompts}.tsx` +
`.ref/xuanshu/lib/ai/{analysisPrompts,transport}.ts`. Người dùng mở panel chat overlay
cạnh lá số, gửi câu hỏi (hoặc chọn quick prompt gợi ý), nhận trả lời streaming theo
token. Lịch sử hội thoại được lưu DB → reload trang vẫn xem lại được, đổi thiết bị
vẫn xem được nhờ Supabase RLS owner-only. Mọi cấu hình LLM (model / temperature /
prompt thật) ở SERVER, web chỉ gửi `quickPromptKey` đã định nghĩa sẵn — KHÔNG cho
client gửi prompt thô.

Tính năng được khoá sau 2 cờ feature-flag tách biệt:

- `AI_CONVERSATION_ENABLED` (mặc định `false`) — bật chính tính năng (cờ riêng để
  test trước khi ra mắt).
- `AI_EXPLANATION_FREE_FOR_ALL` (đã có ở US-010) — gate "AI premium". Hội thoại
  nhiều lượt = nhiều LLM call hơn / lượt → dùng CHUNG gate này, không tách. Khi
  billing thật bật, hội thoại bị gate đồng nhất với `/explanations`.

## Relevant Product Docs

- `docs/decisions/0013-ai-conversation-channel.md` (quyết định gốc — endpoint + bảng + SSE + quota + quick prompts)
- `docs/decisions/0010-premium-ai-entitlement-flag.md` (gate AI dùng chung)
- `docs/decisions/0009-anonymous-auth-strategy.md` (anon vẫn dùng được, có quota IP riêng)
- `docs/decisions/0007-web-server-boundary.md` (web KHÔNG import core/iztro; transport stream qua fetch native)
- `docs/product/api-contract.md` (sẽ thêm 3 endpoint mới ở P4)
- `docs/product/invariants.md` (§2 ngôn ngữ — nhãn Việt, không rò Hán; chat bubble, quick prompt label, hệ thống prompt mặc định đều Việt)

## Acceptance Criteria

- **Schema mới (P1)**: 2 bảng `public.conversations` + `public.conversation_messages`
  được tạo qua migration mới (đánh số tiếp theo trong `apps/api/supabase/migrations/`).
  RLS owner-only theo `owner_user_id`. Index `(owner_user_id, last_activity_at desc)`
  trên `conversations` để phục vụ list. Migration có `down` script đảo ngược.
- **Env + 2 cờ + 2 quota (P0)**: `apps/api/src/config/env.ts` có
  `AI_CONVERSATION_ENABLED` (`z.stringbool().default(false)`),
  `API_CONVERSATION_MESSAGES_PER_DAY_PER_USER` (mặc định `30`),
  `API_ANON_CONVERSATION_MESSAGES_PER_DAY_PER_IP` (mặc định `10`). Boot OK với env
  trống (default an toàn).
- **Contracts (P2)**: `packages/contracts/src/conversations/{conversation,conversation-message,quick-prompt}.ts`
  + 3 schema response cho 3 endpoint, export qua `index.ts`. Web parse mọi response qua
  schema này. Quick prompt key là enum đóng (không free-form từ client).
- **Backend module (P3)**: module mới `apps/api/src/modules/conversations/` với
  3 endpoint:
  - `POST /conversations` — body `{ chartId?, contextScope }` → `{ conversationId }`.
  - `GET /conversations/:id` — `{ messages: [...] }`.
  - `POST /conversations/:id/messages` — body `{ content, quickPromptKey? }`, response
    `text/event-stream` (SSE, `event: token | done | error`).
  Service áp đúng trật tự: ownership → cờ `AI_CONVERSATION_ENABLED` → gate AI
  (`assertCanUseAiExplanation`) → quota `assertCanSendConversationMessage` → build
  prompt + stream → insert 2 record (user + assistant) khi xong → update
  `last_activity_at`.
- **Quick prompt registry server-side (P3)**:
  `apps/api/src/providers/ai/conversation-prompts.ts` map `quickPromptKey` → prompt
  template Việt. Client KHÔNG gửi prompt thô; key không hợp lệ → 400 INVALID_INPUT.
- **Web transport + UI (P4–P5)**: `apps/web/src/lib/api/conversation-stream.ts`
  dùng `fetch` + `Response.body.getReader()` (không thêm dependency). Feature
  module `apps/web/src/lib/features/conversation/` gồm: model state, panel overlay
  phải, message list, message bubble, quick prompts bar. Mở qua nút "Hỏi AI" trên
  ChartDetail; có thể thu nhỏ. Reload trang → load lại lịch sử qua `GET
  /conversations/:id`.
- **Bất biến giữ nguyên**: nhãn UI tiếng Việt 100% (hệ thống prompt mặc định +
  quick prompt label + thông báo lỗi); không Han khi user dùng chỉ gửi câu Việt.
  Web KHÔNG import `core` / `astro-engine` / `iztro`; KHÔNG port
  `AISettingsPanel.tsx` của xuanshu (model/temperature client-side bị loại; mọi
  cấu hình LLM ở server).
- **Rollback an toàn**: tắt `AI_CONVERSATION_ENABLED=false` → endpoint trả 404
  (hoặc 503 — chốt P0); migration giữ lại bảng (không rollback DB) — chi phí lưu
  trữ thấp.

## Design Notes

Xem `design.md` cùng thư mục. Tóm tắt:

- KHÔNG mở rộng `POST /explanations` để chứa multi-turn (decision 0013 §Alternatives).
- KHÔNG dùng WebSocket / GraphQL Subscription (SSE 1 chiều đủ, đơn giản hơn).
- Ngân sách context: server giới hạn `MAX_MESSAGES_PER_TURN=12` (6 lượt qua-lại) khi
  build prompt → drop lượt cũ hơn nếu vượt; snapshot lá số chèn ở `system` lượt đầu
  + nhắc lại bằng `summary` ngắn ở mỗi turn (không gửi full snapshot mỗi lượt).
- Web: `conversation-model.svelte.ts` dùng `$state` cho mảng `messages` + cursor
  streaming; KHÔNG dùng TanStack Query streaming custom (transport tự viết, mỏng,
  hợp boundary `apps/web` chỉ phụ thuộc `@ziweiai/contracts`).
- Quota anon dùng cùng pattern `anonDailyIpBuckets` (in-memory, sẽ chuyển sang
  Redis ở US-013 nếu đã merge khi tới phase này).

## Validation

`scripts\bin\harness-cli.exe story update --id US-018 --unit 1 --integration 1 --e2e 1 --platform 1`

| Layer | Expected proof |
| --- | --- |
| Unit | quick-prompt registry build prompt đúng theo key; SSE writer chunk format `event: token / done / error`; gate `AI_CONVERSATION_ENABLED=false` → 404; gate AI áp trước khi stream; 12-msg buffer cắt đúng |
| Integration | `POST /conversations` tạo row + RLS chặn cross-user; `POST /messages` happy path stream + insert 2 record + update `last_activity_at`; `POST /messages` flag AI off + chưa entitled → 402; quota vượt → 429 |
| E2E | Mở panel → gửi 3 lượt hội thoại → reload trang → vẫn thấy lịch sử qua `GET /conversations/:id`; quick prompt click → câu hỏi gửi đúng |
| Platform | `pnpm -F @ziweiai/api test` + `pnpm -F @ziweiai/web check` xanh; `pnpm why zod` đơn nhất; ESLint `no-restricted-imports` không bị nới |
| Release | 2 cờ giữ `false` ở prod cho tới khi smoke xong ở stg |

## Harness Delta

Lane high-risk: chạm public contract (3 endpoint mới + `apiErrorCodeSchema` có thể
thêm mã `FEATURE_DISABLED` nếu chưa có ở US-017), schema DB mới (2 bảng), đường
tiền tệ (LLM cost gấp nhiều lần text 1-shot), và streaming response (SSE qua
reverse-proxy).

Bất biến phải giữ:

- Nhãn Việt 100% trong chat UI + system prompt mặc định + quick prompt label.
- `PUBLIC_*` ra client; secret LLM/Supabase chỉ ở `apps/api`.
- 2 cờ default `false` ở prod; bật từng cờ là quyết định triển khai riêng.
- Web boundary: KHÔNG import `core`/`astro-engine`/`iztro`.
- KHÔNG port `AISettingsPanel.tsx` (cấu hình LLM client-side bị loại).

Rủi ro:

- Quên tắt `AI_CONVERSATION_ENABLED` ở prod khi chưa sẵn → cost LLM tăng đột biến.
  Mitigate: gate fail-CLOSED khi cờ off, log cảnh báo khi cờ on ở prod.
- SSE bị buffer bởi reverse-proxy (Cloudflare/Nginx) → phải set
  `X-Accel-Buffering: no` + `Cache-Control: no-cache` + `Content-Type: text/event-stream`.
  Note vào release guide.
- 12-msg buffer + summary chèn mỗi lượt → token tăng theo độ dài hội thoại; quota
  daily là trần cuối.
- Insert 2 message record CHỈ KHI streaming xong → nếu client đóng connection
  giữa chừng phải có cleanup (insert partial assistant + đánh dấu `interrupted`,
  hoặc bỏ qua). Quyết định ở P3.

## Evidence

- Decision `0013-ai-conversation-channel.md` — accepted 2026-06-17.
- P0/P1/P2/P3/P4/P5 evidence sẽ được điền sau khi từng phase merge (mỗi PR link +
  lệnh đã chạy + kết quả).
- 2 cờ prod audit: TBD sau khi deploy stg.
