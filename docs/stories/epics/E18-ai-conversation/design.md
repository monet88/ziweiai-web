# Design

## Domain Model

Hai entity mới, đều owner-scope theo `auth.users`:

### `Conversation`

```ts
{
  id: string                      // uuid pk
  ownerUserId: string             // FK auth.users(id), CASCADE
  chartId: string | null          // FK chart_snapshots(id), nullable cho "hỏi chung"
  contextScope: 'overview'        // chốt enum đóng: overview | palace | pairing
              | 'palace'          //  - overview: hội thoại tổng quan lá số
              | 'pairing'         //  - palace: tập trung 1 cung
              | null              //  - pairing: ghép lá số (US-017c, dự phòng)
  createdAt: string               // ISO timestamp
  lastActivityAt: string          // updated mỗi lần insert message thành công
}
```

Quy tắc:

- 1 user có thể có NHIỀU conversation cho CÙNG 1 chart (mỗi `contextScope` 1
  conversation, hoặc nhiều conversation cùng scope nếu user muốn). KHÔNG ép unique.
- `chartId === null` ⟹ "hỏi chung" — system prompt chỉ chèn câu giới thiệu vai
  trò, không có snapshot lá số.
- `lastActivityAt` được index để phục vụ list "conversation gần đây" sau này
  (story này KHÔNG dựng UI list, nhưng index không tốn nhiều).

### `ConversationMessage`

```ts
{
  id: string                      // uuid pk
  conversationId: string          // FK conversations(id), CASCADE
  role: 'user' | 'assistant' | 'system'
  content: string                 // markdown / plain
  tokensIn: number | null         // chỉ assistant: số token prompt khi build cho lượt này
  tokensOut: number | null        // chỉ assistant: số token completion từ provider
  createdAt: string               // ISO timestamp
}
```

Quy tắc:

- `role='system'` chỉ insert tự động ở lượt đầu tiên (chứa snapshot lá số rút
  gọn + chỉ dẫn vai trò). KHÔNG cho client gửi `system` message (server enforce).
- Mỗi lần `POST /messages` thành công ⟹ insert ĐÚNG 2 row: 1 `user` (content
  client gửi, hoặc prompt resolved từ quickPromptKey) + 1 `assistant` (content
  hoàn chỉnh sau khi stream xong).
- Insert sau khi stream xong (KHÔNG insert trước) → đảm bảo nếu LLM lỗi giữa
  chừng thì DB không có row "rỗng" dở dang. Trade-off: client đóng connection
  giữa chừng → mất nội dung đã stream. Chấp nhận trong story này; cleanup
  partial là backlog sau.
- `tokensIn/tokensOut` phục vụ audit chi phí; có thể null nếu provider không trả
  metric.

## Application Flow

### Tạo conversation (`POST /conversations`)

```text
client → SupabaseAuthGuard
       → ConversationsController.create
       → ConversationsService.create
            ├─ if (chartId) verify ownership chart_snapshots
            ├─ insert public.conversations { ownerUserId, chartId, contextScope }
            └─ return { conversationId }
```

KHÔNG gate AI ở `POST /conversations` (chỉ tạo row, chưa tốn LLM). Gate AI áp ở
`POST /messages`.

### Đọc lịch sử (`GET /conversations/:id`)

```text
client → SupabaseAuthGuard
       → ConversationsController.getById
       → ConversationsService.findByIdOwned
            ├─ select * from conversations where id=:id and owner_user_id=:userId
            ├─ if !found → 404 NOT_FOUND (không lộ existence)
            ├─ select messages where conversation_id=:id order by created_at asc
            └─ return { conversation, messages: [...] }
```

Web dùng để khôi phục panel sau reload.

### Gửi message + stream (`POST /conversations/:id/messages`)

Trật tự bắt buộc (giữ y nguyên thứ tự, đặt ở SERVICE để mọi client tương lai bị
gate đồng nhất):

```text
1. SupabaseAuthGuard       → 401 nếu Bearer thiếu/sai
2. ownership check         → 404 nếu conversation không thuộc user
3. if !apiEnv.AI_CONVERSATION_ENABLED → throw 404 FEATURE_DISABLED (fail-CLOSED)
4. assertCanUseAiExplanation()  → 402 PAYMENT_REQUIRED khi flag off + chưa entitled
5. quotasService.assertCanSendConversationMessage(userId, ip, isAnonymous)
                            → 429 RATE_LIMITED khi vượt
6. if quickPromptKey:       → resolve sang prompt thật qua conversation-prompts
                              registry; key không hợp lệ → 400 INVALID_INPUT
7. fetch context messages   → SELECT 12 message gần nhất từ DB cùng conversationId
8. build prompt array       → prepend system prompt (tóm tắt snapshot lá số nếu
                              chartId, không gửi full snapshot mỗi lượt)
9. open SSE response        → set headers Content-Type: text/event-stream,
                              Cache-Control: no-cache, X-Accel-Buffering: no
10. provider.streamGenerate(...) → forward từng chunk dạng `event: token\ndata: <chunk>\n\n`
11. on stream complete:     → emit `event: done\ndata: <messageId>\n\n`
                              insert 2 row (user + assistant) + update last_activity_at
12. on stream error:        → emit `event: error\ndata: <code>\n\n` + close
                              KHÔNG insert (tránh row dở dang)
```

Lưu ý: bước 9 (open SSE) thực hiện TRƯỚC khi gọi provider để client thấy
connection ngay. Bước 1–8 ném HTTP error chuẩn (chưa mở SSE), bước 9–12 mới là
stream.

## Interface Contract

### 3 endpoint mới

| Endpoint | Method | Body | Response | Auth | Cờ |
|---|---|---|---|---|---|
| `/conversations` | POST | `{ chartId?, contextScope }` | `{ conversationId }` | Bearer | `AI_CONVERSATION_ENABLED` |
| `/conversations/:id` | GET | — | `{ conversation, messages: [...] }` | Bearer | `AI_CONVERSATION_ENABLED` |
| `/conversations/:id/messages` | POST | `{ content, quickPromptKey? }` | SSE stream | Bearer | `AI_CONVERSATION_ENABLED` + gate AI |

### Schema mới (P2)

`packages/contracts/src/conversations/`:

```text
conversation.ts            # conversationSchema, contextScopeSchema, createConversationRequest/Response
conversation-message.ts    # conversationMessageSchema, sendMessageRequest, getConversationResponse
quick-prompt.ts            # quickPromptKeySchema (enum đóng), quickPromptCatalog (nhãn Việt)
```

Mỗi file phải:

- Export schema + type inferred (`z.infer`).
- Có test parse OK + reject input méo (theo pattern các test contract hiện có).
- Export qua `packages/contracts/src/index.ts`.

```ts
// quick-prompt.ts (preview)
export const quickPromptKeySchema = z.enum([
  'lifeOverview',     // "Hãy tổng quan vận mệnh từ lá số này"
  'careerYearly',     // "Sự nghiệp năm nay tôi nên chú ý gì?"
  'lovePalace',       // "Tình duyên qua cung Phu Thê"
  'wealthDecade',     // "Tài lộc trong đại vận hiện tại"
  'healthCaution',    // "Tôi cần lưu ý gì về sức khoẻ?"
  'familyRelations',  // "Mối quan hệ gia đình hiện tại"
]);
```

Web nhận catalog `{ key, labelVi }` để render quick prompt button. KHÔNG gửi
prompt thật xuống client (chống reverse-engineer / prompt injection).

### SSE format

```text
event: token
data: {"chunk":"Theo lá số "}

event: token
data: {"chunk":"của bạn..."}

event: done
data: {"messageId":"<uuid>","tokensIn":1234,"tokensOut":567}

event: error
data: {"code":"PROVIDER_TIMEOUT","message":"..."}
```

Quyết định: chunk bọc JSON (KHÔNG raw text) để client không lẫn newline + không
phải escape; có chỗ chèn metadata tương lai. Web parser chỉ lấy `chunk` đem
append vào bubble assistant.

### Mã lỗi

Tái dùng mã hiện có:

- `UNAUTHORIZED` (401) — Bearer thiếu/sai (auth guard).
- `NOT_FOUND` (404) — conversation không thuộc user, hoặc cờ `AI_CONVERSATION_ENABLED=false`.
- `INVALID_INPUT` (400) — `quickPromptKey` không hợp lệ, body sai schema.
- `PAYMENT_REQUIRED` (402) — `AI_EXPLANATION_FREE_FOR_ALL=false` + chưa entitled.
- `RATE_LIMITED` (429) — quota daily vượt.
- `PROVIDER_TIMEOUT` / `PROVIDER_UNAVAILABLE` — provider lỗi giữa stream (emit
  qua `event: error`).

KHÔNG cần thêm mã mới.

## Data Model

### Migration mới (P1)

```sql
-- 000NNN_ai-conversations.up.sql (số tiếp theo trong apps/api/supabase/migrations/)

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  chart_id uuid references public.chart_snapshots(id) on delete set null,
  context_scope text check (context_scope in ('overview', 'palace', 'pairing')),
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create index if not exists conversations_owner_last_activity_idx
  on public.conversations (owner_user_id, last_activity_at desc);

create index if not exists conversations_owner_chart_idx
  on public.conversations (owner_user_id, chart_id);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_in int,
  tokens_out int,
  created_at timestamptz not null default now()
);

create index if not exists conversation_messages_conversation_created_idx
  on public.conversation_messages (conversation_id, created_at asc);

-- RLS owner-only (theo pattern chart_snapshots)
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

create policy "conversations_owner_select" on public.conversations
  for select using (auth.uid() = owner_user_id);
create policy "conversations_owner_insert" on public.conversations
  for insert with check (auth.uid() = owner_user_id);
create policy "conversations_owner_update" on public.conversations
  for update using (auth.uid() = owner_user_id);
create policy "conversations_owner_delete" on public.conversations
  for delete using (auth.uid() = owner_user_id);

-- conversation_messages dùng RLS qua join (owner_user_id ở conversations)
create policy "conversation_messages_owner_select" on public.conversation_messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id
        and c.owner_user_id = auth.uid()
    )
  );
create policy "conversation_messages_owner_insert" on public.conversation_messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id
        and c.owner_user_id = auth.uid()
    )
  );
```

`down.sql` đảo ngược: drop policy → drop table (CASCADE để bỏ index).

Lý do KHÔNG dùng FK cứng `chart_snapshots(id) on delete cascade`: user có thể
xoá lá số nhưng vẫn muốn giữ lịch sử hỏi đáp (giá trị tự thân). Dùng `on delete
set null` để conversation tự "không gắn chart" khi chart bị xoá.

### 2 cờ env (P0)

`apps/api/src/config/env.ts` thêm (parse `z.stringbool()` + `z.coerce.number`,
default an toàn):

```ts
AI_CONVERSATION_ENABLED:
  z.stringbool().default(false),
API_CONVERSATION_MESSAGES_PER_DAY_PER_USER:
  z.coerce.number().int().positive().default(30),
API_ANON_CONVERSATION_MESSAGES_PER_DAY_PER_IP:
  z.coerce.number().int().positive().default(10),
```

`z.stringbool()` (KHÔNG `z.coerce.boolean()`) — giống decision 0010, tránh bug
`Boolean('false')===true` ở env prod.

### Quota service mở rộng (P3)

`apps/api/src/modules/quotas/quotas.service.ts`:

```ts
async assertCanSendConversationMessage(userId: string, ipAddress: string, isAnonymous = false): Promise<void> {
  this.assertSlidingWindow(this.ipBuckets, `ip:${ipAddress}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_IP, 60_000);
  this.assertSlidingWindow(this.userBuckets, `user:${userId}`, apiEnv.API_REQUESTS_PER_MINUTE_PER_USER, 60_000);
  if (isAnonymous) {
    this.assertSlidingWindow(
      this.anonDailyIpBuckets,
      `anon-conv-msg:${ipAddress}`,
      apiEnv.API_ANON_CONVERSATION_MESSAGES_PER_DAY_PER_IP,
      ONE_DAY_MS,
      'Daily conversation message quota exceeded.',
    );
    return;
  }
  // user thường: đếm theo DB count messages role='user' trong 24h
  const sinceIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
  const sent = await this.persistenceGateway.countConversationUserMessagesSince(userId, sinceIso);
  if (sent >= apiEnv.API_CONVERSATION_MESSAGES_PER_DAY_PER_USER) {
    throw new Error('Daily conversation message quota exceeded.');
  }
}
```

(Method `countConversationUserMessagesSince` cũng phải thêm vào
`SupabasePersistenceGateway`.)

## UI / Platform Impact

### Web feature module (P5)

```text
apps/web/src/lib/features/conversation/
├── conversation-model.svelte.ts    # $state messages + cursor streaming + sendMessage()
├── ConversationPanel.svelte        # overlay phải, header + close button + body + footer
├── MessageList.svelte              # scroll container + auto-stick-to-bottom
├── MessageBubble.svelte            # render role=user/assistant/system + markdown
├── QuickPromptsBar.svelte          # ngang trên input, render từ catalog
└── index.ts                        # public exports
apps/web/src/lib/api/
└── conversation-stream.ts          # fetch + Response.body.getReader() SSE parser
```

### Transport pattern

```ts
// conversation-stream.ts (preview)
export async function* streamConversationMessage(
  token: string,
  conversationId: string,
  body: SendMessageRequest,
  signal: AbortSignal,
): AsyncGenerator<SseEvent> {
  const res = await fetch(`${env.PUBLIC_API_BASE_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw await mapErrorResponse(res);
  if (!res.body) throw new ApiError('network', 'No stream body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // parse `event:` + `data:` blocks separated by \n\n
    let idx;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      yield parseSseBlock(block);
    }
  }
}
```

Parse từng block, yield `{ event, data }`. Caller (`conversation-model`) append
`data.chunk` vào bubble assistant đang stream.

### Model state (Svelte 5 runes)

```ts
// conversation-model.svelte.ts
export function createConversationModel(chartId: string | null) {
  let conversationId = $state<string | null>(null);
  let messages = $state<ConversationMessage[]>([]);
  let isStreaming = $state(false);
  let streamingDraft = $state(''); // bubble assistant đang build
  let error = $state<ApiError | null>(null);

  async function ensureConversation() { /* POST /conversations nếu chưa có */ }
  async function loadHistory() { /* GET /conversations/:id */ }
  async function sendMessage(content: string, quickPromptKey?: QuickPromptKey) { /* stream + apply */ }

  return { conversationId, messages, isStreaming, streamingDraft, error,
           ensureConversation, loadHistory, sendMessage };
}
```

KHÔNG dùng TanStack Query (nó cache key invalidation, không phù hợp streaming
state riêng). Tự quản state là đủ.

### UI overlay

`ConversationPanel.svelte` là drawer phải, slide từ trái sang khi mở; cao 100vh
trừ header app. Nút "Hỏi AI" đặt ở `ChartDetailScreen` (phase 5). Thu nhỏ thành
nút floating bottom-right khi đóng. Animations thuần CSS (transform + opacity) —
hợp `web/coding-style.md` "Animation-Only Properties".

### Boundary

- `apps/web` chỉ import `@ziweiai/contracts` cho types/schemas. KHÔNG import
  core/iztro (decision 0007).
- `conversation-stream.ts` dùng `fetch` native — KHÔNG thêm `@microsoft/fetch-event-source`
  hay `eventsource-parser`. Lý do: parser SSE đơn giản, viết tay 30 dòng, tránh
  dependency chỉ để xử lý 1 format text rất hẹp.

### Backend module

```text
apps/api/src/modules/conversations/
├── conversations.module.ts
├── conversations.controller.ts     # 3 endpoint
├── conversations.service.ts        # gate + build + stream + persist
└── conversations.service.test.ts
apps/api/src/providers/ai/
├── conversation-prompts.ts         # quickPromptKey → template Việt
├── conversation-prompts.test.ts
└── (tái dùng explanation-provider-router cho streamGenerate)
```

Provider router cần thêm method `streamGenerate(...)` (yield AsyncIterable<string>);
DeepSeek + OpenAI-compat hỗ trợ streaming gốc, Gemini cũng có. Nếu provider
không hỗ trợ → fallback: gọi `generate(...)` rồi emit 1 chunk duy nhất ở
`event: token`.

## Observability

- Mỗi `POST /conversations/:id/messages` log:
  `{ event: 'conversation_message', userId, conversationId, isAnonymous,
     quickPromptKey?, contextMessagesUsed, tokensIn, tokensOut, model,
     provider, durationMs, outcome: 'completed' | 'error' }`.
- Cảnh báo log khi `AI_CONVERSATION_ENABLED=true` ở `NODE_ENV=production` (giống
  pattern cảnh báo `AI_EXPLANATION_FREE_FOR_ALL=true` ở US-010).
- Quota anon-IP log key `quota_kind=conversation` để tách bạch khỏi
  `quota_kind=explanation`.
- KHÔNG log `content` của user/assistant message (privacy + token cost log
  bloat). Chỉ log số ký tự nếu cần debug.

## Alternatives Considered

Quyết định kiến trúc đã chốt ở `docs/decisions/0013-ai-conversation-channel.md`
§Alternatives Considered:

1. Mở rộng `POST /explanations` để chứa multi-turn — loại (schema phình + sai
   nghĩa, `explanation_requests` chỉ giữ markdown cuối).
2. Không streaming, trả full markdown sau khi LLM xong — loại (UX đợi 5–20s mỗi
   lượt phá lý do tồn tại của trợ lý hội thoại).
3. Lưu lịch sử ở localStorage thay vì DB — loại (mất khi xoá storage, không
   audit cost được, không enforce quota qua nhiều device).
4. WebSocket / GraphQL Subscription — loại (overkill cho 1 chiều server→client).

Story này KHÔNG mở thêm alternative mới; chỉ hiện thực 0013.
