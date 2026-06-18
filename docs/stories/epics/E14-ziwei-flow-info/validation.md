# Validation

## Proof Strategy

US-014 là lane high-risk: chạm public contract (`@ziweiai/contracts` thêm
package `horoscope/`), mở engine cross-package (`@ziweiai/core`/`astro-engine`),
phát hành endpoint API mới, và đổi 2 component UI có hồi quy. Proof phải đủ 4
lớp:

1. **Unit** — schema mở rộng tương thích cũ + helper thuần web không side-effect.
2. **Integration** — endpoint mới happy + 5 path lỗi (auth, ownership, system,
   schema, quota).
3. **E2E** — 1 lá số fixture với `asOf` cố định → bàn 12 cung render đúng
   thanh chỉ báo + 4 chip footer.
4. **Boundary scan** — `\p{Script=Han}` xanh ở web, `no-restricted-imports`
   xanh ở `apps/web`, `pnpm why iztro` xác nhận chỉ tồn tại ở
   `@ziweiai/astro-engine`.

Story KHÔNG done nếu thiếu bất kỳ tầng nào trong 4 lớp trên (chấp nhận E2E
hoãn nếu có rationale rõ ràng + ghi backlog, lane vẫn high-risk → mặc định
phải có).

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | (contracts) `horoscopeFrameSchema` parse fixture cũ (`{decadal, age, yearly}`) → OK; parse fixture đầy đủ 5 field → OK; thiếu `decadal` → fail; `monthly` không khớp `horoscopeItemSchema` → fail. (engine) `computeZiweiHoroscope` với fixture lá số cố định + `asOf='2026-06-17'` → output ổn định (snapshot test); CJK guard test trên output JSON → 0 ký tự Han. (web) `buildPalaceFlowFlags` 4 case: 4 tầng cùng cung → 4 field; chỉ decadal → 1 field; không match → `{}`; frame thiếu monthly/daily → bỏ qua. `buildPalaceFlowFlagsMap` 12 cung → đúng 1–4 entry. `fetchChartHoroscope` mock `fetch` 200/400/429 → parse / throw đúng `ApiError`. |
| Integration | (apps/api) `POST /charts/:id/horoscope` happy zi-wei → 200, body parse `horoscopeResponseSchema` OK; chartId của user khác → 404 NOT_FOUND; chart system bazi → 400 INVALID_INPUT; body thiếu `scopes` → 400; body thiếu `decadal` trong scopes → 400 (schema refine); thiếu Bearer → 401 UNAUTHORIZED; quota vượt → 429 RATE_LIMITED. Reuse fixture chart đã có ở `charts.controller.spec.ts`. |
| E2E | `apps/web/tests/e2e/us-014-ziwei-flow-info.spec.ts`: login fixture + mở chart fixture + intercept `/charts/:id/horoscope` trả frame cố định (không phụ thuộc `Date.now`) → assert ≥ 1 ô có `<div class="flow-bar">`; assert 4 chip với text Việt (`Vận`, `Niên`, `Nguyệt`, `Nhật`); assert chip Vận có agesRange; assert computed style chip `--color-flow-*` đúng map; toggle prop `enableFlowInfo=false` (route đặc biệt) → không render flow-bar. |
| Platform | (deferred) Test Lighthouse / responsive 320/375/768/1024/1440 chạy chung với US-015 panel — flow-info không thay đổi layout grid 4×4 đã có. Ghi rõ trong evidence khi defer. |
| Performance | `computeZiweiHoroscope` ≤ 100ms p95 (server-side, đo qua `durationMs` log). Web `createQuery` staleTime 1h, đảm bảo ≤ 1 request/giờ/chart trong session. Bundle web không tăng quá 5 KB gzipped (kiểm với `pnpm -F @ziweiai/web build` rồi diff). |
| Logs/Audit | API: log `info` `{requestId, chartId, asOf, scopes, durationMs}` khi compute thành công; log `error` `{requestId, error}` khi engine throw. KHÔNG log payload snapshot. KHÔNG ghi audit DB (endpoint không thay đổi state). Web: `console.warn` khi query lỗi, KHÔNG toast. |

## Fixtures

- **Chart cố định**: reuse `apps/api/test/fixtures/zi-wei-chart-fixture.json`
  (đã dùng cho US-006 / US-008). Nếu chưa có → tạo `zi-wei-fixture-2000-01-01.json`
  (sinh năm 2000-01-01, giờ 12:00 dương lịch — tránh edge khắc tý / khắc hợi).
- **`asOf` cố định**: `'2026-06-17'` (= ngày hôm nay khi viết spec). Output
  của engine với fixture trên + asOf này được snapshot vào
  `packages/astro-engine/src/__snapshots__/ziwei-horoscope.test.ts.snap`.
- **Frame cố định cho E2E**: trích snapshot ra `apps/web/tests/fixtures/horoscope-frame-fixture.json`
  để Playwright intercept `POST /charts/:id/horoscope` trả nguyên (không phụ
  thuộc engine thực).
- **User test**: reuse user `e2e-test@ziweiai.local` đã setup ở
  `apps/web/tests/e2e/auth.setup.ts`.
- **Quota test**: reuse `MemoryQuotaCounterStore` (US-013) — set trần thấp +
  bắn 2 request liên tiếp để chứng minh 429.

## Commands

```text
# Phase Discovery
scripts/bin/harness-cli.exe query matrix
scripts/bin/harness-cli.exe intake --type spec-slice --summary "US-014 ziwei flow info" --lane high-risk
scripts/bin/harness-cli.exe story add --id US-014 --title "Ziwei flow info đa màu (decadal/yearly/monthly/daily)" --lane high-risk --verify "pnpm -F @ziweiai/contracts test && pnpm -F @ziweiai/astro-engine test && pnpm -F @ziweiai/api test && pnpm -F @ziweiai/web check && pnpm -F @ziweiai/web test"

# Phase 2 Contract
pnpm -F @ziweiai/contracts test
pnpm -F @ziweiai/contracts typecheck

# Phase 3 Engine
pnpm -F @ziweiai/astro-engine test
pnpm -F @ziweiai/core test
turbo build

# Phase 4 API
pnpm -F @ziweiai/api typecheck
pnpm -F @ziweiai/api test charts.controller
pnpm -F @ziweiai/api test charts.service

# Phase 5 Web fetch
pnpm -F @ziweiai/web test api-client

# Phase 6 Web flow-flags
pnpm -F @ziweiai/web test palace-flow-flags

# Phase 7 Web UI
pnpm -F @ziweiai/web check
pnpm -F @ziweiai/web test
pnpm -F @ziweiai/web lint --max-warnings=0

# Phase 8 E2E
pnpm -F @ziweiai/web test:e2e -- us-014
pnpm -F @ziweiai/web test no-han-characters

# Phase 9 Wrap
pnpm why iztro                                                              # ✓ chỉ ở astro-engine
turbo build && turbo test                                                   # full repo green
scripts/bin/harness-cli.exe story update --id US-014 --unit 1 --integration 1 --e2e 1 --platform 0
scripts/bin/harness-cli.exe trace --intake <n> --story US-014 --summary "..." --outcome completed --agent claude --actions "..." --read "..." --changed "..." --friction "..."
```

## Acceptance Evidence

(Trống — bổ sung sau khi validation pass: log lệnh + screenshot bàn 12 cung
với 4 màu vận hạn + diff bundle size + output `pnpm why iztro`.)
