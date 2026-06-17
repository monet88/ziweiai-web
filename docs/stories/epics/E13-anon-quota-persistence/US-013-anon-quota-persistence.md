# US-013 Bền hoá quota anon daily-per-IP qua store chia sẻ

## Status

planned

## Lane

normal

## Product Contract

Trần daily-per-IP cho đường ẩn danh (decision `0009`) phải SỐNG SÓT qua restart
process và CHIA SẺ giữa các instance. Hành vi gate KHÔNG đổi: vượt trần vẫn ném
`Daily chart quota exceeded.` / `Daily explanation quota exceeded.` (trace lỗi
hiện tại). Bộ đếm `anonDailyIpBuckets` (Map in-memory, TODO #20 trong
`apps/api/src/modules/quotas/quotas.service.ts`) chuyển sang một `QuotaCounterStore`
abstraction với 2 driver:

- `memory` — giữ Map cũ, dùng cho dev/test (không cần dependency ngoài).
- `redis` HOẶC `upstash` — dùng `INCR + EXPIRE` atomic theo khoá
  `anon-{chart|explanation}:{ip}:{yyyy-mm-dd}` TTL 24h, chia sẻ trạng thái
  giữa các instance.

Khi store ngoài mất kết nối, hệ thống chạy theo `QUOTA_FAIL_MODE`
(`open` mặc định) — store quota là chống lạm dụng, không phải hàng rào bảo
mật, nên `open` (cho qua + log warn) ưu tiên ổn định trước; ai cần siết
ngược lại đặt `closed` (chặn, ném quota error).

Rate-limit per-minute (sliding window theo `ip:` và `user:`) GIỮ in-memory:
cửa sổ 60s đã đủ ngắn để mất một phút sau restart không có hậu quả thật.

## Relevant Product Docs

- `docs/decisions/0009-anonymous-auth-strategy.md` (chính sách quota
  daily-per-IP cho đường ẩn danh).
- `docs/decisions/0007-web-server-boundary.md` (mọi runtime mới — Redis
  client, fetch tới Upstash — chỉ được sống ở `apps/api`).
- `apps/api/src/modules/quotas/quotas.service.ts` (TODO backlog #20).

## Acceptance Criteria

- Thêm env trong `apps/api/src/config/env.ts`:
  - `QUOTA_STORE_DRIVER`: `z.enum(['memory', 'redis', 'upstash']).default('memory')`.
  - `QUOTA_REDIS_URL`: `z.string().optional()` — chỉ bắt buộc khi driver
    `redis`; validation tại resolve-time, không phải parse-time (giữ default
    `memory` không vỡ).
  - `QUOTA_UPSTASH_REST_URL`: `z.string().url().optional()` — bắt buộc khi
    driver `upstash`.
  - `QUOTA_UPSTASH_REST_TOKEN`: `z.string().optional()` — bắt buộc khi driver
    `upstash`.
  - `QUOTA_FAIL_MODE`: `z.enum(['open', 'closed']).default('open')`.
- Abstraction `QuotaCounterStore` (interface) với chữ ký tối thiểu:
  - `incrementAndCheck(key: string, limit: number, ttlSeconds: number): Promise<{ count: number; allowed: boolean }>`.
  - Trả `allowed=false` khi count sau INCR > limit; provider tự lo TTL khi
    key vừa được tạo (set EXPIRE chỉ ở lần INCR đầu để TTL không bị reset
    giữa cửa sổ).
- Triển khai 2 driver tối thiểu:
  - `MemoryQuotaCounterStore` — dùng `Map<string, { count: number; expiresAt: number }>`,
    dọn lười khi đọc; bao backward bucket cũ.
  - `RedisQuotaCounterStore` HOẶC `UpstashRestQuotaCounterStore` (chốt một, ưu
    tiên Upstash REST vì không cần TCP socket trong dev/CI; ghi rõ alternative
    trong code-comment + Design Notes).
- `QuotasService` nhận store qua DI (`@Inject('QUOTA_COUNTER_STORE')`); xoá
  `anonDailyIpBuckets` Map cũ; nhánh anon trong `assertCanCreateChart` /
  `assertCanCreateExplanation` gọi `store.incrementAndCheck` với khoá
  `anon-chart:${ip}:${yyyy-mm-dd}` / `anon-explanation:${ip}:${yyyy-mm-dd}`,
  TTL 86_400. Khi `allowed=false` → ném đúng message cũ
  (`Daily chart quota exceeded.` / `Daily explanation quota exceeded.`) —
  contract trace error giữ nguyên.
- Khi store driver thật ném exception (timeout, mất kết nối):
  - `QUOTA_FAIL_MODE=open` (mặc định): log warn `quota-store.unavailable`,
    coi như allow, KHÔNG ném quota error.
  - `QUOTA_FAIL_MODE=closed`: log warn + ném quota error chuẩn.
- Unit test bao 4 ca cho mỗi driver (memory bắt buộc; driver thật mock
  fetch/redis client):
  - under-limit (count=1..limit-1) → allow.
  - at-limit (count=limit ngay sau INCR) → allow (đúng giới hạn cuối cùng).
  - over-limit (count=limit+1) → block.
  - store-down (driver thật ném) → fail-open allow / fail-closed block (ca
    riêng cho từng mode).
- Test hồi quy `quotas.service.test.ts` di trú từ Map sang
  `MemoryQuotaCounterStore` — tất cả case cũ vẫn xanh (chống reset phiên
  qua đổi userId, anon vs user thường).
- Backward: `pnpm -F @ziweiai/api test` không cần Redis local; CI mặc định
  `QUOTA_STORE_DRIVER=memory` (legacy behaviour).
- Cập nhật `.env.example` + `apps/api/README.md` (nếu có) hướng dẫn 3 driver.

## Design Notes

- Files đụng:
  - `apps/api/src/modules/quotas/counter-stores/quota-counter-store.ts`
    (interface + DI token).
  - `apps/api/src/modules/quotas/counter-stores/memory.ts`
    (`MemoryQuotaCounterStore`).
  - `apps/api/src/modules/quotas/counter-stores/upstash.ts` HOẶC
    `redis.ts` (chốt 1 — đề xuất `upstash.ts` qua `fetch` chuẩn, không
    thêm dependency native).
  - `apps/api/src/modules/quotas/counter-stores/index.ts` (factory: chọn
    driver theo env, trả instance + log driver đã chọn).
  - `apps/api/src/modules/quotas/quotas.service.ts` (xoá Map, nhận store
    qua constructor; rate-limit per-minute giữ nguyên).
  - `apps/api/src/modules/quotas/quotas.module.ts` (provider factory cho
    DI token `QUOTA_COUNTER_STORE`).
  - `apps/api/src/modules/quotas/quotas.service.test.ts` (di trú).
  - `apps/api/src/modules/quotas/counter-stores/*.test.ts` (test riêng
    cho từng driver).
  - `apps/api/src/config/env.ts` (5 env mới).
  - `.env.example` (block mới).
- Lý do chọn driver:
  - **Upstash REST** (đề xuất ưu tiên): gọi qua HTTPS fetch, không cần Redis
    service riêng trong dev, không thêm dependency native; có free tier; đủ
    nhanh cho 1 INCR + 1 EXPIRE per request anon (~30ms ở edge); tương thích
    boundary `0007` (chỉ apps/api gọi).
  - **Redis cổ điển (`ioredis`)**: dùng khi deploy có Redis sẵn (VM /
    container managed). Thêm dependency native + cần TCP egress; pipeline
    `INCR` + `EXPIRE` rẻ hơn Upstash REST nếu QPS cao.
- Pattern atomic INCR + EXPIRE:
  - Redis: pipeline `INCR key` + `EXPIRE key ttl NX` (NX để TTL chỉ set lần
    đầu, không reset cửa sổ). Đọc count từ INCR, so với limit.
  - Upstash REST: 1 request `pipeline` body `[["INCR", key], ["EXPIRE", key, ttl, "NX"]]`.
- Khoá có `yyyy-mm-dd` (UTC) để tự cuốn cửa sổ; TTL 24h là backstop chống rò
  key khi đồng hồ instance lệch.
- KHÔNG dùng bảng Postgres cho counter: write hot mỗi request anon, không
  hợp Postgres OLTP; cũng tránh lưu IP (PII) vào bảng owned (decision `0009`
  Alternative 1).
- Rate-limit per-minute (`ipBuckets`, `userBuckets`) giữ in-memory: cửa sổ
  60s + chấp nhận drift sau restart (per-instance OK ở MVP).

## Validation

When updating durable proof status, use numeric booleans:
`scripts\bin\harness-cli.exe story update --id US-013 --unit 1 --integration 1 --e2e 0 --platform 1`.

| Layer | Expected proof |
| --- | --- |
| Unit | 4 ca trên cho `MemoryQuotaCounterStore`; 4 ca + 2 ca fail-mode cho driver thật (mock fetch/redis); regression `quotas.service.test.ts` xanh |
| Integration | `apps/api` chạy với `QUOTA_STORE_DRIVER=memory` mặc định pass; CI tuỳ chọn chạy 1 lần với driver thật khi env Upstash có sẵn (skip nếu thiếu) |
| E2E | — (không UI mới) |
| Platform | `pnpm -F @ziweiai/api test` + `turbo typecheck` xanh |
| Release | — |

## Harness Delta

Lane normal: chạm 1 module backend + env schema + tests. KHÔNG thay schema
DB, KHÔNG thay public contract, KHÔNG thay UI. Rủi ro chính:

- Chọn driver sai (lock-in một vendor) → mitigation: abstraction
  `QuotaCounterStore` + driver swap qua env, fallback `memory` luôn dùng được.
- Store ngoài down → mitigation: `QUOTA_FAIL_MODE=open` mặc định + log warn;
  có ca test riêng cho cả `open` và `closed`.
- Deploy chưa có store ngoài: giữ `QUOTA_STORE_DRIVER=memory` (legacy
  behaviour, đúng chính xác cái đang chạy hôm nay) — không vỡ.

Bất biến giữ nguyên: error message quota, boundary import (
`docs/decisions/0007`), ngôn ngữ tiếng Việt (driver mới chỉ chạm log + env,
không sinh nhãn UI).

## Evidence

— (điền sau khi validate)
