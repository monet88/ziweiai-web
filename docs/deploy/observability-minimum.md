# Observability Tối Thiểu Cho Demo Vercel

Ngày tạo: 2026-07-13  
Phạm vi: `https://tuvitoantap.vercel.app`

## Mục Đích

Tài liệu này định nghĩa mức quan sát tối thiểu trước khi coi demo public là đủ
an toàn để mở traffic beta. Mục tiêu không phải dựng stack observability lớn,
mà là phát hiện sớm các lỗi làm hỏng luồng lõi:

```text
anonymous auth -> create chart/quẻ -> mở detail -> refresh detail -> tạo AI
explanation -> xem lại history
```

## Nguồn Tín Hiệu Hiện Có

| Tín hiệu | Nguồn hiện tại | Cách dùng |
| --- | --- | --- |
| Deploy/alias | Vercel inspect | Xác nhận domain đang trỏ deployment Ready, đúng account. |
| Public API | `pnpm smoke:vercel-demo` | Kiểm tra root, `/api/health`, `/api/features`, SPA fallback. |
| Live mutation flow | `pnpm smoke:vercel-live-mutation` | Mặc định skip; khi bật cờ sẽ tạo anonymous session, Lục Hào, detail và AI explanation thật. |
| API 5xx | Vercel Function logs + **ops-alert** | Lọc `[ops-alert]` / `5xx`. `ApiErrorFilter` báo 5xx + `INTERNAL_ERROR`. |
| Provider AI | API logs + **ops-alert** + Sentry (nếu DSN) | `PROVIDER_TIMEOUT` (504), `PROVIDER_UNAVAILABLE` (502) luôn alert. |
| Push alert (optional) | `OPS_ALERT_WEBHOOK_URL` | Telegram/Slack/Discord webhook; throttle 60s/code+path. |
| Sentry (optional) | `SENTRY_DSN` | Init trên **Vercel serverless entry** (`api/[...path].ts`) + local `main.ts`. |
| Quota/cost gate | API logs + response code | Theo dõi `RATE_LIMITED`, `quota-store.unavailable`, feature gate warning. |
| AI token spend | Provider metadata trong logs/DB | Tổng hợp `tokensIn`, `tokensOut`, `totalTokens`, `providerName`. |
| Supabase schema | `pnpm check:supabase-migrations` | Kiểm tra migration local; linked ledger cần project đã `supabase link`. |
| UI regression | Playwright/TestSprite/browser smoke | Xác nhận route detail không 404 và UI không báo lỗi rỗng. |

### Env production (Vercel)

```bash
# Optional but recommended for beta:
SENTRY_DSN=https://...@....ingest.sentry.io/...
# Telegram example (chat_id in query):
OPS_ALERT_WEBHOOK_URL=https://api.telegram.org/bot<token>/sendMessage?chat_id=<id>
```

Không set env → vẫn có structured log `[ops-alert]` trên Vercel (lọc trong Function logs).

## Alert Tối Thiểu

Các alert dưới đây là ngưỡng khởi đầu cho beta nhỏ. Khi có traffic thật, chỉnh
ngưỡng theo baseline thực tế.

| Alert | Ngưỡng đề xuất | Ý nghĩa | Hành động đầu tiên |
| --- | --- | --- | --- |
| API 5xx spike | Bất kỳ `5xx` nào trong 5 phút sau deploy, hoặc hơn 3 lỗi trong 15 phút | Core flow có thể đang hỏng | Mở Vercel Function logs, kiểm tra endpoint, rollback nếu `/charts`, `/divinations`, `/explanations` hỏng. |
| Provider timeout | `PROVIDER_TIMEOUT` hơn 3 lần trong 15 phút hoặc hơn 10% AI calls | Provider chậm hoặc serverless timeout quá thấp | Kiểm tra provider status, `AI_PROVIDER_TIMEOUT_MS`, model, fallback chain; cân nhắc chuyển OpenRouter/DeepSeek theo provider đang ổn. |
| Provider unavailable | `PROVIDER_UNAVAILABLE` hơn 1 lần sau deploy | Env/provider thiếu hoặc provider trả lỗi | Kiểm tra env name trên Vercel, không in secret value; xác nhận provider chính có key/model/base URL. |
| Quota hits bất thường | `RATE_LIMITED` tăng đột ngột | Có thể abuse, quota quá thấp, hoặc bug đếm quota | Phân biệt user/IP thật vượt quota với lỗi store; nếu user hợp lệ bị chặn, kiểm tra quota policy. |
| Quota store outage | Bất kỳ `quota-store.unavailable` | Store ngoài lỗi; `failMode=open` có thể đốt AI, `failMode=closed` có thể chặn user | Kiểm tra Upstash/quota driver/env; cân nhắc giảm feature AI nếu outage kéo dài. |
| AI spend vượt trần | Chi phí ngày vượt budget beta đã chốt | Public beta có thể đốt tiền | Tạm tắt hoặc siết `AI_EXPLANATION_FREE_FOR_ALL`, giảm quota anonymous, đổi model rẻ hơn. |
| Supabase migration drift | Linked ledger pass ngày 2026-07-13 10:23 +07, nhưng cần chạy lại nếu có migration mới hoặc đổi project | DB production có thể thiếu RLS/table/index nếu deploy sau này lệch migration | Chạy linked check sau mỗi thay đổi migration; không mở traffic lớn nếu RLS chưa được xác minh. |

## Checklist Sau Mỗi Deploy

1. Chạy safe smoke:

```bash
pnpm smoke:vercel-demo
```

2. Nếu release ảnh hưởng luồng ghi dữ liệu hoặc AI, chạy live mutation smoke khi
đã được xác nhận:

```bash
LIVE_MUTATION_SMOKE=1 LIVE_MUTATION_SMOKE_CONFIRM=tuvitoantap.vercel.app pnpm smoke:vercel-live-mutation
```

3. Mở Vercel deployment vừa inspect, kiểm tra Function logs trong 10-15 phút đầu.
4. Lọc log theo các chuỗi:

```text
PROVIDER_TIMEOUT
PROVIDER_UNAVAILABLE
RATE_LIMITED
quota-store.unavailable
AI_EXPLANATION_FREE_FOR_ALL=true
providerName=
tokensIn=
tokensOut=
```

5. Nếu deploy có đổi Supabase schema hoặc RLS, chạy:

```bash
pnpm check:supabase-migrations
SUPABASE_VERIFY_LINKED=1 pnpm check:supabase-migrations
```

6. Nếu có chạy live mutation smoke tạo dữ liệu thật hoặc gọi AI provider, lưu
report ngắn vào `docs/reports/` với:

- deployment id;
- endpoint đã thử;
- HTTP status;
- provider name nếu có;
- dữ liệu test đã dọn hay chưa;
- lỗi 5xx/timeout/quota nếu có.

## Incident Runbook Ngắn

### `/api/charts/:id` hoặc route detail lỗi 404/5xx

1. Chạy `pnpm smoke:vercel-demo` để phân biệt SPA fallback với API lỗi.
2. Nếu fallback route không trả `index.html`, rollback alias Vercel.
3. Nếu fallback ổn nhưng API lỗi, xem Function logs theo request id/endpoint.
4. Kiểm tra Supabase env và migration/RLS nếu lỗi là data access.

### `POST /api/explanations` trả 502/504

1. Kiểm tra response code:
   - `PROVIDER_TIMEOUT`: provider chậm hoặc timeout serverless.
   - `PROVIDER_UNAVAILABLE`: provider/env/model không khả dụng.
   - `RATE_LIMITED`: quota/cost gate đang chặn.
2. Kiểm tra provider chính hiện tại trong Vercel env bằng tên biến, không in
secret value.
3. Nếu lỗi lặp lại, tạm chuyển provider chính hoặc giảm traffic AI trước khi
đẩy thêm feature.

### AI trả lời lạc ngữ cảnh

1. Kiểm tra record có `blocksExactReading=true` không; nếu có, API phải chặn
trước provider.
2. Kiểm tra `ExplanationsService` có lấy snapshot/divination context theo owner
không.
3. Ghi lại chart id và provider name trong report; không log prompt có dữ liệu
nhạy cảm lên docs public.

## Không Làm Trong Mức Tối Thiểu Này

- Không thêm paid observability stack khi chưa có traffic baseline.
- Không log API key, service role, JWT, full prompt, ảnh người dùng hoặc dữ liệu
cá nhân không cần thiết.
- Không coi TestSprite trạng thái `queued` là pass.
- Không mở payment/XU chỉ vì smoke public API pass; payment cần ledger,
idempotency và audit riêng.

## Khoảng Trống Còn Lại

- Chưa có dashboard tự động gom log thành biểu đồ 5xx/provider/quota/spend.
- Chưa có daily AI spend report tự động.
- Chưa xác minh Supabase linked migration ledger trong workspace này vì project
chưa được `supabase link`.
- Đã có guarded live mutation smoke script, nhưng chưa chạy thật trong lượt này
vì bước đó ghi Supabase và gọi provider thật.
