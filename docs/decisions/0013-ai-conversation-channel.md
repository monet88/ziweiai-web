# 0013 Trợ lý AI hội thoại nhiều lượt (multi-turn) — bảng `conversations` + streaming SSE + gắn entitlement flag

Date: 2026-06-17

## Status

Accepted

## Context

Backlog #19 yêu cầu port pattern trợ lý AI hội thoại của
`.ref/xuanshu/components/ai/{AIAssistant,AIChatWindow,QuickPrompts}.tsx` +
`.ref/xuanshu/lib/ai/{analysisPrompts,transport}.ts`: khung chat overlay cạnh lá
số, gợi ý câu hỏi nhanh, hội thoại nhiều lượt (multi-turn) với streaming, ghi nhớ
context (snapshot lá số + lịch sử lượt đã trao đổi).

Ràng buộc thực tế:

- `POST /explanations` hiện tại = **1 lượt trả markdown tĩnh** (xem
  `apps/api/src/modules/explanations/services/explanations.service.ts`); không
  có lưu hội thoại, không streaming. Mỗi lần hỏi tiếp = lập lại `POST
  /explanations` mới, không có context lượt trước.
- `apiErrorCodeSchema` đã có `PAYMENT_REQUIRED` (US-010 / decision 0010) nhưng
  gate AI hiện chỉ gắn cho `/explanations`. Hội thoại = nhiều lượt ⇒ rủi ro chi
  phí AI gấp nhiều lần text 1-shot.
- `apps/web` dùng TanStack Query (`createQuery`/`createMutation`). Streaming
  yêu cầu kênh khác (Server-Sent Events hoặc fetch streaming).
- Lưu trữ: chưa có bảng `conversations` / `messages` ở Supabase; thêm là
  migration mới (CLAUDE.md: "Stop và ask trước khi thay đổi schema DB" → có
  decision này).

## Decision

- **Tách khỏi `/explanations`**: tạo module mới `apps/api/src/modules/conversations`
  với 3 endpoint:
  - `POST /conversations` — tạo phiên hội thoại mới gắn với 1 `chartId` (hoặc
    không, dạng "hỏi chung" khoá theo user). Body `{ chartId?, contextScope?:
    'overview' | 'palace' | 'pairing' }`. Response trả `conversationId`.
  - `GET /conversations/:id` — đọc lịch sử (mọi `messages` đã chốt). Bearer
    + ownership.
  - `POST /conversations/:id/messages` — thêm 1 lượt user → server stream
    response qua SSE; khi xong thì insert `messages` (role=user) + `messages`
    (role=assistant) vào DB. Body `{ content, quickPromptKey? }`.
- **Schema mới ở Supabase** (migration mới, không phá legacy):
  - `conversations` (`id`, `owner_user_id`, `chart_id?`, `context_scope`,
    `created_at`, `last_activity_at`).
  - `conversation_messages` (`id`, `conversation_id`, `role`
    (`user|assistant|system`), `content`, `tokens_in`, `tokens_out`,
    `created_at`).
  - RLS: owner-only (như chart_snapshots).
- **Streaming SSE**: response dạng `text/event-stream`, `event: token` →
  `data: <chunk>`, `event: done` → `data: <messageId>`, `event: error`. Web dùng
  `EventSource` hoặc `fetch + ReadableStream` reader (không cần lib mới). Lý do
  không dùng WebSocket: SSE 1 chiều đủ, đơn giản hơn, qua HTTP/2 không tốn kết
  nối, dễ reverse-proxy. Không dùng GraphQL Subscription (không có GraphQL).
- **Ngân sách context**: server giới hạn `max_messages_per_turn = 12` (6 lượt
  qua-lại) khi build prompt — drop lượt cũ hơn nếu vượt. Lý do: token cost +
  drift. Snapshot lá số chèn ở `system` lượt đầu tiên + nhắc lại bằng `summary`
  ngắn ở mỗi turn (không gửi full snapshot mỗi lượt).
- **Gate AI dùng lại [[0010-premium-ai-entitlement-flag]]**: hooks
  `assertCanUseAiExplanation(user)` ÁP TRƯỚC mỗi `POST /messages` (không chỉ
  `POST /conversations`) — fail-closed khi `AI_EXPLANATION_FREE_FOR_ALL=false`
  + chưa entitled. Cờ `AI_CONVERSATION_ENABLED` (mặc định `false` lúc test) bật
  chính tính năng (giảm rủi ro lộ nhánh trước khi sẵn sàng).
- **Quota riêng**: thêm `API_CONVERSATION_MESSAGES_PER_DAY_PER_USER` (mặc định
  `30`), check trong `QuotasService.assertCanSendConversationMessage(userId,
  ip, isAnonymous)` — anon vẫn có nhưng số nhỏ hơn (`API_ANON_CONVERSATION
  _MESSAGES_PER_DAY_PER_IP=10`). Áp ngay sau gate AI, trước khi stream.
- **Quick prompts**: thêm `packages/contracts/src/conversations/quick-prompt.ts`
  — danh sách key tiếng Việt (`quickPromptKey: 'lifeOverview' | 'careerYearly'
  | 'lovePalace' | ...`). Backend nhận `quickPromptKey?` rồi resolve sang prompt
  thật ở `apps/api/src/providers/ai/build-conversation-prompt.ts` — KHÔNG để
  client gửi prompt thô (chống prompt injection từ UI gợi ý).
- **Web boundary nguyên vẹn**: thêm `apps/web/src/lib/features/conversation/`
  với `conversation-model.svelte.ts` (state $state mảng messages + streaming
  cursor) + `ConversationPanel.svelte` overlay. Stream qua
  `apps/web/src/lib/api/conversation-stream.ts` (dùng native `fetch` +
  `Response.body` reader, không thêm dependency).

## Alternatives Considered

1. **Mở rộng `POST /explanations` để chứa multi-turn** — explanations là
   request 1-shot, chèn `previousMessages` làm phình schema; `explanation_requests`
   dài chỉ giữ markdown cuối, không phù hợp với từng lượt. Tách module rõ
   ràng hơn.
2. **Không streaming, trả full markdown sau khi LLM xong** — UX đợi 5–20s mỗi
   lượt = chối bỏ lý do tồn tại của trợ lý hội thoại. Streaming SSE cần thiết.
3. **Lưu lịch sử ở localStorage thay vì DB** — anon user (decision 0009) đã có
   localStorage cho session, nhưng:
   - Lịch sử mất khi xoá storage / đổi thiết bị → không thể tham chiếu lại.
   - Không thể audit chi phí AI (cost engineering).
   - Không thể áp quota chính xác qua nhiều device cùng user.
   Lưu DB là ràng buộc thực tế.
4. **WebSocket** — overkill cho 1 chiều server→client; tăng phức tạp ops
   (sticky session). Loại.

## Consequences

Positive:

- Trợ lý hội thoại có context dài (12 messages) + UI streaming → trải nghiệm gần
  ChatGPT, đúng pattern xuanshu.
- Hệ thống flag/quota/gate AI thống nhất (cùng ngân sách `AI_EXPLANATION_FREE_FOR_ALL`
  điều khiển cả `/explanations` lẫn conversation).
- Bảng riêng → có thể audit token cost đầy đủ + làm UI "lịch sử hội thoại" sau.

Tradeoffs:

- Migration DB mới (`conversations` + `conversation_messages`) — rủi ro release.
  Apply theo quy trình `apps/api/supabase/migrations/` hiện hữu; rollback bằng
  `down` script. Yêu cầu staging test trước.
- SSE qua reverse-proxy đôi khi bị buffer (Cloudflare, Nginx mặc định) — phải
  set `X-Accel-Buffering: no` + `Content-Encoding: identity`. Note vào release
  guide.
- 12 message buffer + summary chèn vào mỗi lượt = token tăng theo độ dài hội
  thoại. Quota daily là trần cuối.

## Follow-Up

- US-018 (`docs/stories/epics/E18-ai-conversation/US-018-ai-conversation.md`) —
  triển khai chi tiết: migration DB → backend module → streaming SSE → contracts
  → web panel → e2e.
- Khi tích hợp thanh toán thật, gate `assertCanUseAiExplanation` sẽ fail-closed
  cho cả `/messages` mà không cần đổi code (nhờ dùng chung).
- Có thể cần decision riêng nếu chuyển sang LLM provider hỗ trợ "stateful chat"
  (Anthropic Messages, OpenAI Threads) để giảm chi phí context lặp; chưa cấp
  thiết.
