# Plan US-013 — Bền hoá quota anon daily-per-IP qua store chia sẻ

## Goal

Chuyển `anonDailyIpBuckets` (Map in-memory, TODO #20 trong
`apps/api/src/modules/quotas/quotas.service.ts`) sang một
`QuotaCounterStore` abstraction với 2 driver (`memory` cho dev/test,
`upstash` cho prod) để trần daily-per-IP sống sót qua restart và chia sẻ
giữa các instance, KHÔNG đổi hành vi gate hay public contract.

## Pre-conditions

- Đọc `apps/api/src/modules/quotas/quotas.service.ts` (TODO #20),
  `quotas.service.test.ts`, `apps/api/src/config/env.ts`.
- Đọc `docs/decisions/0009-anonymous-auth-strategy.md` (vì sao có quota
  anon-per-IP) + `docs/decisions/0007-web-server-boundary.md` (driver
  mới chỉ sống ở `apps/api`).
- Chốt driver thật: **đề xuất `upstash` (REST qua `fetch`)** vì:
  - Không cần Redis service riêng trong dev/CI.
  - Không thêm dependency native (`ioredis`/`redis`); chỉ dùng `fetch`
    có sẵn trên Node 22.
  - Free tier đủ cho MVP, gọi qua HTTPS hợp boundary backend.
  - Alternative `ioredis` ghi rõ trong code-comment + Design Notes của
    story để swap nhanh khi deploy có Redis sẵn.
- Chạy `scripts\bin\harness-cli.exe intake --type maintenance --summary "US-013 anon quota persistence" --lane normal` để mở intake.

## Phase 1 — Chốt driver + env schema

- [ ] Cập nhật `apps/api/src/config/env.ts` thêm:
  - `QUOTA_STORE_DRIVER`: `z.enum(['memory','redis','upstash']).default('memory')`.
  - `QUOTA_REDIS_URL`: `z.string().optional()`.
  - `QUOTA_UPSTASH_REST_URL`: `z.string().url().optional()`.
  - `QUOTA_UPSTASH_REST_TOKEN`: `z.string().optional()`.
  - `QUOTA_FAIL_MODE`: `z.enum(['open','closed']).default('open')`.
- [ ] Validate runtime trong factory (Phase 4): driver `redis` thiếu
  `QUOTA_REDIS_URL` → ném khi bootstrap, không phải khi parse env (giữ
  default `memory` không cần env mới).
- [ ] Files đụng: `apps/api/src/config/env.ts`.
- [ ] Validation: `pnpm -F @ziweiai/api typecheck`.

## Phase 2 — Định nghĩa abstraction + driver `memory`

- [ ] Tạo `apps/api/src/modules/quotas/counter-stores/quota-counter-store.ts`:
  - `interface QuotaCounterStore { incrementAndCheck(key, limit, ttlSeconds): Promise<{ count: number; allowed: boolean }> }`.
  - Export DI token `QUOTA_COUNTER_STORE = Symbol.for('QuotaCounterStore')`
    (hoặc string token theo style hiện tại của repo — đọc 1 module khác
    để khớp convention).
- [ ] Tạo `apps/api/src/modules/quotas/counter-stores/memory.ts`:
  - `MemoryQuotaCounterStore` lưu `Map<string, { count: number; expiresAt: number }>`.
  - Khi đọc: nếu `Date.now() > expiresAt` → reset count=0 trước khi INCR.
  - INCR đầu tiên (count cũ = 0) → set `expiresAt = now + ttlSeconds*1000`.
  - Trả `allowed = count <= limit`.
- [ ] Tạo `apps/api/src/modules/quotas/counter-stores/memory.test.ts`:
  - under-limit, at-limit (count=limit), over-limit (count=limit+1).
  - TTL hết → reset cửa sổ (mock `Date.now`).
- [ ] Files đụng: `counter-stores/quota-counter-store.ts`,
  `counter-stores/memory.ts`, `counter-stores/memory.test.ts`.
- [ ] Validation: `pnpm -F @ziweiai/api test counter-stores/memory`.

## Phase 3 — Driver thật (`upstash`) + test mock fetch

- [ ] Tạo `apps/api/src/modules/quotas/counter-stores/upstash.ts`:
  - Constructor nhận `{ restUrl, restToken, failMode }`.
  - `incrementAndCheck`: 1 request POST `${restUrl}/pipeline` với body
    `[["INCR", key], ["EXPIRE", key, ttl, "NX"]]`, header
    `Authorization: Bearer ${restToken}`.
  - Parse response `[{ result: count }, { result: 0|1 }]` — đọc count
    từ phần tử đầu.
  - try/catch ngoài: khi fetch ném HOẶC response status không ok → log
    warn `quota-store.unavailable`. Theo `failMode`:
    - `open` → `return { count: 0, allowed: true }`.
    - `closed` → re-throw để `QuotasService` ném quota error chuẩn (xử
      lý tại service hoặc trả `{ allowed: false }` + cờ — chốt: trả
      `allowed: false` để không đổi shape interface).
  - Code-comment: alternative `ioredis` qua `INCR` + `EXPIRE NX` pipeline
    nếu deploy có Redis sẵn.
- [ ] Tạo `counter-stores/upstash.test.ts`:
  - Mock `globalThis.fetch` (vitest `vi.stubGlobal`).
  - 4 ca: under-limit, at-limit, over-limit, store-down (fetch reject)
    × 2 fail-mode = 6 ca thực tế.
- [ ] Files đụng: `counter-stores/upstash.ts`,
  `counter-stores/upstash.test.ts`.
- [ ] Validation: `pnpm -F @ziweiai/api test counter-stores`.

## Phase 4 — Factory + wire DI vào `QuotasModule`

- [ ] Tạo `apps/api/src/modules/quotas/counter-stores/index.ts`:
  - `createQuotaCounterStore(env)` đọc `apiEnv.QUOTA_STORE_DRIVER`:
    - `memory` → `new MemoryQuotaCounterStore()`.
    - `upstash` → validate `QUOTA_UPSTASH_REST_URL` + `QUOTA_UPSTASH_REST_TOKEN`
      có giá trị; ném `Error('QUOTA_STORE_DRIVER=upstash requires ...')`.
    - `redis` → ném `Error('redis driver not implemented yet — use upstash or memory')`
      (giữ enum mở sẵn, code-comment đường upgrade).
  - Log 1 dòng `[quotas] driver=<name>` ở bootstrap.
- [ ] Cập nhật `apps/api/src/modules/quotas/quotas.module.ts`:
  - Provider factory:
    ```ts
    {
      provide: QUOTA_COUNTER_STORE,
      useFactory: () => createQuotaCounterStore(apiEnv),
    }
    ```
  - Export token cho test override.
- [ ] Files đụng: `counter-stores/index.ts`, `quotas.module.ts`.
- [ ] Validation: `pnpm -F @ziweiai/api typecheck`.

## Phase 5 — Migrate `QuotasService` + di trú test

- [ ] Sửa `quotas.service.ts`:
  - Xoá field `anonDailyIpBuckets` + xoá comment TODO #20.
  - Constructor nhận `@Inject(QUOTA_COUNTER_STORE) store: QuotaCounterStore`
    (cùng `persistenceGateway`).
  - Trong nhánh anon của 2 method:
    - Tính `key = ` anon-chart:${ip}:${utcYyyyMmDd()}`.
    - `const { allowed } = await this.store.incrementAndCheck(key, apiEnv.API_CHARTS_PER_DAY_PER_USER, 86_400);`.
    - `if (!allowed) throw new Error('Daily chart quota exceeded.');`.
    - Tương tự `anon-explanation:` cho `assertCanCreateExplanation`.
  - Giữ rate-limit per-minute (`ipBuckets`, `userBuckets`) y nguyên.
- [ ] Sửa `quotas.service.test.ts`:
  - Thay constructor: truyền `MemoryQuotaCounterStore` làm tham số 2.
  - Toàn bộ ca cũ (under-limit, exhausted, anon ignore DB, 21 lần
    cùng IP đổi userId, user thường không dính anon) phải xanh không
    đổi expectation.
- [ ] Files đụng: `quotas.service.ts`, `quotas.service.test.ts`.
- [ ] Validation: `pnpm -F @ziweiai/api test quotas`.

## Phase 6 — `.env.example` + README

- [ ] Cập nhật `.env.example` thêm block:
  ```
  # --- Quota counter store (US-013) ---
  # memory = in-memory (default, dev/test); upstash = REST; redis = TODO
  QUOTA_STORE_DRIVER=memory
  QUOTA_FAIL_MODE=open
  # QUOTA_UPSTASH_REST_URL=
  # QUOTA_UPSTASH_REST_TOKEN=
  # QUOTA_REDIS_URL=
  ```
- [ ] Nếu `apps/api/README.md` có section env → thêm 1 đoạn ngắn về
  driver + fail-mode; nếu chưa có README thì SKIP (không tạo file mới
  ngoài scope).
- [ ] Files đụng: `.env.example`, (optional) `apps/api/README.md`.
- [ ] Validation: đọc lại file, kiểm xem placeholder đúng.

## Phase 7 — Validate full + harness update

- [ ] `pnpm -F @ziweiai/api test` → xanh.
- [ ] `turbo typecheck` → xanh.
- [ ] `pnpm lint` → xanh.
- [ ] `scripts\bin\harness-cli.exe story add --id US-013 --title "Anon quota persistence" --lane normal --verify "pnpm -F @ziweiai/api test"`.
- [ ] `scripts\bin\harness-cli.exe story update --id US-013 --unit 1 --integration 1 --e2e 0 --platform 1`.
- [ ] `scripts\bin\harness-cli.exe trace --intake <n> --story US-013 --summary "..." --outcome completed --agent claude --actions "..." --read "..." --changed "..." --friction "..."`.

## Risk + Rollback

- **Risk: chọn sai driver, lock-in vendor** → mitigation: abstraction
  `QuotaCounterStore` + factory; rollback = đổi `QUOTA_STORE_DRIVER`
  về `memory` (không cần redeploy code, không cần migration).
- **Risk: store ngoài down trong incident** → mitigation:
  `QUOTA_FAIL_MODE=open` (mặc định) cho qua + log warn; tuỳ ops chọn
  `closed` nếu chấp nhận block.
- **Risk: TTL bị reset giữa cửa sổ** → mitigation: `EXPIRE … NX` (set
  TTL chỉ ở lần INCR đầu); test cover.
- **Rollback toàn diện**: revert PR → fall back Map cũ; không có
  migration DB nên không cần down-migration.

## Done Criteria

- [ ] `QuotaCounterStore` interface + 2 driver (`memory`, `upstash`)
  triển khai đầy đủ; `redis` ném "not implemented" rõ ràng.
- [ ] `QuotasService` không còn Map `anonDailyIpBuckets`; nhận store qua DI.
- [ ] Unit test 4 ca cho mỗi driver + 2 ca fail-mode cho driver thật.
- [ ] `quotas.service.test.ts` regression xanh không đổi expectation.
- [ ] Env mới có default an toàn (`memory` + `open`) — repo chạy được
  không cần Upstash.
- [ ] `.env.example` cập nhật.
- [ ] `pnpm -F @ziweiai/api test` + `turbo typecheck` + `pnpm lint` xanh.
- [ ] Harness story `US-013` cập nhật proof + 1 trace ghi rõ outcome.
