# Validation

## Proof Strategy

US-018 là story high-risk dựng kênh AI mới (multi-turn + streaming + lưu DB +
gate AI premium). Chứng minh "kênh sẵn sàng cho user" yêu cầu 5 lớp bằng chứng:

1. **Khung env + 2 cờ + 2 quota** parse default an toàn (`false` + `30` +
   `10`); reject sai → unit xanh trong `apps/api`.
2. **Khung schema DB** — migration up/down chạy được trên Supabase local; RLS
   chặn cross-user select trên `conversation_messages` (qua join từ
   `conversations.owner_user_id`); index list `(owner, last_activity_at)` lên
   đúng → integration xanh.
3. **Khung contract** parse 3 schema mới + quick-prompt enum đóng → unit xanh
   trong `@ziweiai/contracts`.
4. **Khung backend** — 3 endpoint áp đúng trật tự gate (cờ → AI gate → quota
   → ownership), insert 2 record CHỈ KHI stream xong, SSE format đúng (3
   event), provider router fallback non-stream → unit + integration xanh.
5. **Khung web + e2e** — panel UI mở/đóng + gửi 3 lượt + reload khôi phục
   lịch sử + quick prompt click → e2e xanh với mock LLM.

Nguyên tắc:

- KHÔNG claim pass nếu lệnh chưa chạy thật xanh (tuân thủ
  `CLAUDE.md` <important if="you just finished implementing a story or milestone">).
- E2E dùng provider stub deterministic — KHÔNG gọi LLM thật trong CI (tốn cost
  + flake). Provider thật chỉ chạy khi smoke ở stg.
- 2 cờ giữ `false` ở prod sau merge — operator audit cấu hình prod là một phần
  proof "Release".
- KHÔNG log content message trong test (privacy). Test verify metrics
  (`tokens_in/tokens_out`) ghi đủ.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | • `apiEnvSchema` parse default `AI_CONVERSATION_ENABLED=false`, quota mặc định `30` + `10`; reject `AI_CONVERSATION_ENABLED=invalid`; `z.stringbool()` không bug `'false' → true` (regression theo decision 0010) <br>• `conversationSchema`, `conversationMessageSchema`, `quickPromptKeySchema` parse OK + reject input méo (role enum đóng; contextScope enum đóng) <br>• `quickPromptCatalogSchema` parse 6 key + Việt label <br>• `resolveQuickPrompt('lifeOverview')` trả template tiếng Việt; `resolveQuickPrompt('unknown')` ném `INVALID_INPUT` <br>• `buildSystemPrompt(snapshot, contextScope)` chèn nhãn Việt; `\p{Script=Han}` không match output <br>• `ConversationsService` áp đúng trật tự gate: cờ off → 404 trước AI gate; AI gate off + chưa entitled → 402 trước quota; quota vượt → 429 trước stream <br>• 12-msg buffer cắt đúng khi history > 12 (drop lượt cũ nhất, giữ lượt mới) <br>• Insert 2 record CHỈ KHI stream xong; stream lỗi giữa chừng → KHÔNG insert (verify count rows trước/sau) <br>• `assertCanSendConversationMessage` áp daily-per-user (DB count) cho user thường, daily-per-IP (sliding window) cho anon <br>• SSE writer chunk format `event: token\ndata: <json>\n\n` (parse được bởi parser web) <br>• Provider router `streamGenerate` fallback emit 1 chunk khi provider không hỗ trợ stream |
| Integration | • `POST /conversations` Bearer hợp lệ → tạo row đúng `owner_user_id`; cross-user select bị RLS chặn (user B select id của user A → 0 row) <br>• `POST /conversations` cờ `AI_CONVERSATION_ENABLED=false` → 404 FEATURE_DISABLED (hoặc cách trả 404 chuẩn của module) <br>• `GET /conversations/:id` user A đọc → trả messages; user B đọc id của A → 404 <br>• `POST /conversations/:id/messages` happy path: stream chunk → emit `event: token` ≥ 1 lần → `event: done` → DB có 2 row mới (1 user + 1 assistant) → `last_activity_at` cập nhật <br>• `POST /messages` flag `AI_EXPLANATION_FREE_FOR_ALL=false` + chưa entitled → 402 PAYMENT_REQUIRED (TRƯỚC khi mở SSE) <br>• `POST /messages` quota daily vượt → 429 RATE_LIMITED <br>• `POST /messages` `quickPromptKey='lifeOverview'` → server resolve sang template Việt; `content` row user lưu đúng prompt resolved (KHÔNG lưu key thô) <br>• `POST /messages` provider lỗi giữa stream → emit `event: error` + close + KHÔNG insert row <br>• Migration `000NNN_ai-conversations.up.sql` chạy xanh trên Supabase local; `down.sql` reverse sạch (drop 2 bảng + 5 policy + 3 index) <br>• Anon user (is_anonymous=true) → quota theo IP (`API_ANON_CONVERSATION_MESSAGES_PER_DAY_PER_IP=10`); user thường → quota theo DB count |
| E2E | • Đăng nhập anon → mở chart → bấm "Hỏi AI" → panel mở; gõ 3 câu hỏi tuần tự → bubble user + bubble assistant streaming hiện ra; cả 3 cặp message được render <br>• Reload trang → panel mở lại → load lịch sử qua `GET /conversations/:id` → 3 cặp message vẫn còn <br>• Click quick prompt "Tổng quan vận mệnh" → 1 cặp message thêm vào, bubble user hiển thị template Việt resolved <br>• Cờ `AI_CONVERSATION_ENABLED=false` → nút "Hỏi AI" ẩn (hoặc disabled) + thông báo "Tính năng đang phát triển" <br>• Quota anon vượt (gửi > 10 lượt cùng IP) → bubble lỗi tiếng Việt "Bạn đã hỏi đủ số lượt hôm nay" <br>• `\p{Script=Han}` scan trên DOM panel: KHÔNG match (mọi label + system prompt mặc định + quick prompt + thông báo lỗi đều Việt) |
| Platform | • `pnpm -F @ziweiai/contracts test` xanh <br>• `pnpm -F @ziweiai/api test` xanh (cộng test mới `conversations.service`, `conversation-prompts`, `quotas.service` regression) <br>• `pnpm -F @ziweiai/web check` xanh (svelte-check + tsc) <br>• `pnpm -F @ziweiai/web build` xanh (static build vẫn ra, không thêm dependency mới) <br>• `pnpm why zod` đơn nhất (chỉ 1 version) <br>• `pnpm lint` xanh (`--max-warnings=0`) <br>• ESLint `no-restricted-imports` vẫn chặn web import `@ziweiai/core` / `@ziweiai/astro-engine` / `iztro` |
| Performance | • TTFB (Time To First Byte) `event: token` đầu tiên < 1s với provider stub; < 2s với provider thật ở stg (mục tiêu mềm — báo nếu vượt) <br>• Tổng thời gian 1 lượt (gửi → `event: done`) < 30s với provider thật (timeout cứng `AI_PROVIDER_TIMEOUT_MS` từ env) <br>• Concurrency: 5 user gửi message đồng thời cùng provider → không request nào timeout giả; mỗi user thấy stream tươi (verify ở stg, không CI) <br>• Bundle web không tăng > 5% sau khi thêm feature module + transport (đo qua `pnpm -F @ziweiai/web build` so size trước/sau) |
| Logs/Audit | • Mỗi `POST /messages` log đủ trường: `userId`, `conversationId`, `isAnonymous`, `quickPromptKey?`, `contextMessagesUsed`, `tokensIn`, `tokensOut`, `model`, `provider`, `durationMs`, `outcome` ('completed' | 'error') <br>• KHÔNG log `content` (privacy + cost log bloat); spot check log không chứa câu hỏi user/trả lời assistant <br>• Cảnh báo log khi `AI_CONVERSATION_ENABLED=true` ở `NODE_ENV=production` (giống pattern US-010) <br>• Quota anon log key `quota_kind=conversation` tách bạch khỏi `quota_kind=explanation` <br>• Audit cấu hình prod sau merge: 2 cờ giữ `false` (kiểm tra deploy spec) |

## Fixtures

- 2 user fixture trong Supabase local:
  - `user_email_a@test.local` (email identity) — chính chủ conversation, dùng
    cho test happy path + RLS owner-side.
  - `user_email_b@test.local` (email identity khác) — dùng cho test cross-user
    RLS chặn (user B SELECT conversation/messages của A → 0 row).
- `user_anon_c` (anon JWT, `is_anonymous=true`) — dùng cho test quota anon-IP +
  CTA gợi ý đăng ký khi vượt quota.
- 1 chart fixture (ziwei snapshot v2) gắn với user A — `chartId` để
  conversation gắn vào.
- LLM provider stub: `apps/api/test/mocks/conversation-stub-provider.ts`
  - `LLM_PROVIDER_STUB=true` ở env CI → provider yield chunk cố định
    `['Theo lá số ', 'của bạn, ', 'cung Mệnh có ', 'điểm đáng chú ý.']`
    (deterministic, không cần internet, không cost).
  - Stub trả `tokensIn=42`, `tokensOut=24` (giá trị cố định để test log).
- Quick prompt fixture: tái dùng catalog thật từ
  `packages/contracts/src/conversations/quick-prompt.ts` — 6 key + Việt label,
  KHÔNG fake riêng cho test.
- 12-msg buffer fixture: tạo 14 message giả trong DB (xen kẽ user/assistant) +
  verify service chỉ build prompt với 12 message gần nhất.

## Commands

P0 (Env + 2 cờ + 2 quota):

```text
pnpm -F @ziweiai/api test -- env.test
```

P1 (Migration + gateway):

```text
# (Supabase local đã start)
pnpm -F @ziweiai/api supabase:migrate
pnpm -F @ziweiai/api test -- supabase-persistence.gateway
```

P2 (Contracts):

```text
pnpm -F @ziweiai/contracts test
pnpm why zod
```

P3 (Backend module + provider router stream):

```text
pnpm -F @ziweiai/api test -- conversations
pnpm -F @ziweiai/api test -- conversation-prompts
pnpm -F @ziweiai/api test -- quotas.service
pnpm -F @ziweiai/api test -- explanation-provider-router
```

P4 (Web transport):

```text
pnpm -F @ziweiai/web test -- conversation-stream
```

P5 (Web UI):

```text
pnpm -F @ziweiai/web check
pnpm -F @ziweiai/web test -- conversation-model
```

P6 (E2E mock LLM):

```text
LLM_PROVIDER_STUB=true pnpm -F @ziweiai/web test:e2e -- conversation
```

P7 (Docs + lint + harness):

```text
pnpm lint
turbo typecheck
turbo test
pnpm -F @ziweiai/web build
scripts\bin\harness-cli.exe story update --id US-018 --unit 1 --integration 1 --e2e 1 --platform 1
scripts\bin\harness-cli.exe trace --intake <n> --story US-018 --summary "AI conversation channel + 3 endpoint + SSE + UI panel + e2e mock LLM" --outcome completed --agent claude --actions "P0+P1+P2+P3+P4+P5+P6+P7" --read <files> --changed <files> --friction "<nếu có>"
```

## Acceptance Evidence

Add results after verification.

- Decision `0013-ai-conversation-channel.md` — accepted 2026-06-17.
- P0/P1/P2/P3/P4/P5/P6/P7 evidence sẽ được điền sau khi từng phase merge (mỗi
  PR link + lệnh đã chạy + kết quả).
- 2 cờ prod audit: TBD sau khi deploy stg.
- Smoke ở stg với provider thật: TBD (1 conversation thật chạy đủ 3 lượt;
  reload khôi phục; quota daily áp đúng).
