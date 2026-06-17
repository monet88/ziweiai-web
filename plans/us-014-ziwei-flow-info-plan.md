# Plan US-014 — Highlight đa màu vận hạn + flow-info đáy ô bàn Tử Vi

> Tham chiếu story packet:
> `docs/stories/epics/E14-ziwei-flow-info/US-014-ziwei-flow-info.md`
> (+ `overview.md`, `design.md`, `execplan.md`, `validation.md`).
> Lane: **high-risk**. Chạm contract + engine + API + UI.

## Goal

Phát hành 1 endpoint vận hạn server-side mới (`POST /charts/:id/horoscope`) +
1 lớp UI flow-info đa màu trên bàn 12 cung Tử Vi. Mỗi `PalaceCell` tự động
phản ánh **lát cắt thời gian = hôm nay (server)**: thanh chỉ báo đa màu mép
trên + 4 chip footer (đại vận tím / lưu niên xanh dương / lưu nguyệt xanh lá
/ lưu nhật cam). US-014 GÁNH CẢ phần infra dùng chung (decision `0011`) →
US-015 (panel state-machine) và US-016 (vận ngày / tháng / báo cáo năm) sẽ
tiêu thụ thẳng cùng 1 endpoint + cùng 1 contract `horoscopeFrameSchema`.

## Pre-conditions (đọc trước khi code)

- [ ] `docs/decisions/0011-horoscope-engine-boundary.md` (decision đã viết —
      kích hoạt qua story này: contract + engine + endpoint mới).
- [ ] `docs/decisions/0007-web-server-boundary.md` (web chỉ
      `@ziweiai/contracts`).
- [ ] `docs/decisions/0006-spec-vs-code-naming.md` (tên route/schema theo
      code thật).
- [ ] `docs/stories/epics/E14-ziwei-flow-info/{overview,design,execplan,validation}.md`
      (4 file template high-risk song hành).
- [ ] `packages/contracts/src/chart/chart-snapshot.ts` (l. 475–491:
      `horoscopeSchema` + `horoscopeItemSchema` + `horoscopeAgeItemSchema`
      hiện có — sẽ reuse).
- [ ] `apps/web/src/lib/features/chart/PalaceCell.svelte` +
      `PalaceGrid.svelte` (UI hiện tại — xem điểm mở rộng).
- [ ] `apps/web/src/lib/features/chart/palace-view-builder.ts` (đã có
      `decadalRange` + `ages` — reuse cho `agesRange`).
- [ ] `.ref/taibu/src/components/ziwei/PalaceCard.tsx` (mẫu UI: bar
      4 màu + chip footer flow-info — port ý đồ, KHÔNG copy literal Hán).
- [ ] `.ref/taibu/packages/core/src/domains/ziwei-horoscope/calculate.ts`
      (mẫu engine — port logic, ánh xạ output → ChartKey ASCII).
- [ ] `apps/web/src/lib/api-client/index.ts` (pattern flat-function — copy
      cho `fetchChartHoroscope`).
- [ ] `apps/api/src/modules/charts/charts.controller.ts` +
      `services/charts.service.ts` (pattern Bearer + ownership + quota —
      reuse cho endpoint mới).
- [ ] `scripts/bin/harness-cli.exe query matrix` để xem proof status.

**Dependency tiền đề:** US-014 KÍCH HOẠT decision 0011 (chưa story nào kích).
Sau khi US-014 land, US-015 và US-016 KHÔNG cần thêm contract/endpoint mới
cho cùng `horoscopeFrameSchema` — chỉ chạm UI / thêm scope khác.

## Phases

### Phase 1 — Research & intake

- [ ] Đọc 5 file `.ref/taibu/packages/core/src/domains/ziwei-horoscope/*.ts`
      để chốt input/output engine taibu.
- [ ] Lập note ánh xạ field: `daYun → decadal`, `liuNian → yearly`,
      `liuYue → monthly`, `liuRi → daily`, `tuoiInDecadal → age`.
- [ ] Lập note ánh xạ literal Hán → ChartKey: dùng từ điển nghịch
      `packages/core/src/text/ziwei-terms.ts` đã có; nếu thiếu key → ghi
      backlog (không tự thêm trong story này).
- [ ] `scripts/bin/harness-cli.exe intake --type spec-slice --summary "US-014 ziwei flow info" --lane high-risk`
- [ ] `scripts/bin/harness-cli.exe story add --id US-014 --title "Ziwei flow info đa màu (decadal/yearly/monthly/daily)" --lane high-risk --verify "pnpm -F @ziweiai/contracts test && pnpm -F @ziweiai/astro-engine test && pnpm -F @ziweiai/api test && pnpm -F @ziweiai/web check && pnpm -F @ziweiai/web test"`
- **Files**: chỉ note + intake DB.
- **Validation**: harness DB có intake + story.

### Phase 2 — Contract `horoscope/` ở `@ziweiai/contracts`

- [ ] Tạo `packages/contracts/src/horoscope/horoscope-frame.ts`:
  - `import { horoscopeItemSchema, horoscopeAgeItemSchema } from '../chart/chart-snapshot'`.
  - `horoscopeFrameSchema = z.object({ decadal: horoscopeItemSchema, age: horoscopeAgeItemSchema, yearly: horoscopeItemSchema, monthly: horoscopeItemSchema.optional(), daily: horoscopeItemSchema.optional() })`.
  - export type `HoroscopeFrame = z.infer<typeof horoscopeFrameSchema>`.
- [ ] Tạo `packages/contracts/src/horoscope/horoscope-request.ts`:
  - `horoscopeScopeSchema = z.enum(['decadal','yearly','monthly','daily'])`.
  - `horoscopeRequestSchema = z.object({ asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), scopes: z.array(horoscopeScopeSchema).nonempty().refine(arr => arr.includes('decadal') && arr.includes('yearly')) })`.
  - export types.
- [ ] Tạo `packages/contracts/src/horoscope/horoscope-response.ts`:
  - `horoscopeResponseSchema = z.object({ chartId: z.uuid(), asOf: ..., frame: horoscopeFrameSchema })`.
  - export type.
- [ ] Cập nhật `packages/contracts/src/index.ts`:
  - `export * from './horoscope/horoscope-frame'`.
  - `export * from './horoscope/horoscope-request'`.
  - `export * from './horoscope/horoscope-response'`.
- [ ] Tạo `packages/contracts/src/horoscope/horoscope-frame.test.ts`:
  - parse fixture cũ (chỉ `{decadal, age, yearly}`) → OK.
  - parse fixture mới (5 field) → OK.
  - parse thiếu `decadal` → fail.
  - parse `monthly` không khớp `horoscopeItemSchema` → fail.
- [ ] Tạo `horoscope-request.test.ts`:
  - `scopes` thiếu `decadal` → fail (refine).
  - `asOf` sai format → fail.
- **Files**: 6 file mới ở `packages/contracts/src/horoscope/`, 1 patch
  `index.ts`.
- **Validation**: `pnpm -F @ziweiai/contracts test && pnpm -F @ziweiai/contracts typecheck`.

### Phase 3 — Engine `computeZiweiHoroscope` ở `@ziweiai/core` + `@ziweiai/astro-engine`

- [ ] Tạo `packages/astro-engine/src/ziwei-horoscope.ts`:
  - hàm `computeZiweiHoroscope({ snapshot, asOf, scopes }): HoroscopeFrame`.
  - gọi iztro y hệt taibu `calculate.ts` (cùng `birth + asOf`).
  - **Layer adapter** ánh xạ Hán → ChartKey trước khi return: dùng từ điển
    nghịch `ziwei-terms` đã có ở core. Nếu key Hán không có trong từ điển →
    throw `ZiweiHoroscopeUnknownTermError` (fail-fast — invariant ngôn ngữ).
- [ ] Re-export ở `packages/core/src/index.ts`:
  `export { computeZiweiHoroscope, type ComputeZiweiHoroscopeInput } from '@ziweiai/astro-engine'`.
  (consumer apps/api chỉ import `@ziweiai/core` cho symmetry với
  `computeZiweiSnapshot`).
- [ ] Tạo `packages/astro-engine/src/ziwei-horoscope.test.ts`:
  - Fixture chart cố định (sinh `2000-01-01 12:00`) + `asOf = '2026-06-17'`
    + `scopes = ['decadal','yearly','monthly','daily']` → snapshot test
    output.
  - Output parse `horoscopeFrameSchema` → OK (cross-package wiring).
  - CJK guard: `JSON.stringify(output)` không match `\p{Script=Han}`.
  - Throw `ZiweiHoroscopeUnknownTermError` khi inject key Hán giả vào từ
    điển stub.
- **Files**: 2 file mới ở `astro-engine/src/`, 1 patch `core/src/index.ts`,
  có thể 1 file types.
- **Validation**: `pnpm -F @ziweiai/astro-engine test && pnpm -F @ziweiai/core test && turbo build`.

### Phase 4 — Endpoint `POST /charts/:id/horoscope` ở `apps/api`

- [ ] Mở rộng `apps/api/src/modules/charts/services/charts.service.ts`:
  - method mới `computeHoroscope(userId, ip, chartId, body): Promise<HoroscopeResponse>`.
  - load chart qua `chartsRepository.findOwnedByUser(userId, chartId)` →
    null → throw `ApiErrorHttpException(404, 'NOT_FOUND')`.
  - assert `chart.snapshot.chartSystem === 'zi-wei-dou-shu'` →
    `400 INVALID_INPUT` nếu khác.
  - `await this.quotasService.assertCanCreateChart(userId, ip)` (quota
    chung, không tách).
  - `const frame = computeZiweiHoroscope({ snapshot: chart.snapshot, asOf: body.asOf, scopes: body.scopes })`.
  - return `{ chartId, asOf: body.asOf, frame }`.
- [ ] Mở rộng `apps/api/src/modules/charts/charts.controller.ts`:
  - method mới `@Post(':chartSnapshotId/horoscope') computeHoroscope(...)`.
  - parse param `z.uuid()`.
  - parse body qua `horoscopeRequestSchema`.
  - `horoscopeResponseSchema.parse(...)` trước khi return.
  - decorator `@CurrentUser()` + `@Req()` đã có.
- [ ] Test mở rộng `charts.service.spec.ts`:
  - happy zi-wei → 200 + frame parse được.
  - chart bazi → throw 400 INVALID_INPUT.
  - chartId không sở hữu → throw 404.
  - quota over → throw 429 RATE_LIMITED (mock store đầy).
- [ ] Test mở rộng `charts.controller.spec.ts`:
  - happy → 200, body parse `horoscopeResponseSchema` OK.
  - body thiếu `scopes` → 400.
  - body `scopes` thiếu `decadal` → 400 (schema refine).
  - thiếu Bearer → 401 (guard).
- **Files**: 2 patch (`charts.service.ts`, `charts.controller.ts`), 2 patch
  spec.
- **Validation**: `pnpm -F @ziweiai/api test charts && pnpm -F @ziweiai/api typecheck`.

### Phase 5 — `fetchChartHoroscope` ở `apps/web/src/lib/api-client/index.ts`

- [ ] Patch `apps/web/src/lib/api-client/index.ts`:
  - Thêm import `horoscopeResponseSchema`, type `HoroscopeRequest`,
    `HoroscopeResponse`, `HoroscopeScope` từ `@ziweiai/contracts`.
  - Thêm hằng `DEFAULT_HOROSCOPE_SCOPES = ['decadal','yearly','monthly','daily'] as const satisfies HoroscopeScope[]`.
  - Thêm hằng `HOROSCOPE_QUERY_STALE_MS = 60 * 60 * 1000`,
    `HOROSCOPE_QUERY_GC_MS = 24 * 60 * 60 * 1000`.
  - Thêm `fetchChartHoroscope(token, chartId, asOf, scopes): Promise<HoroscopeResponse>`
    gọi `fetchJson('/charts/${chartId}/horoscope', horoscopeResponseSchema, { method: 'POST', token, body: { asOf, scopes } })`.
- [ ] Test `apps/web/src/lib/api-client/api-client.test.ts` (mở rộng):
  - mock `fetch` 200 → parse OK.
  - mock `fetch` 400 INVALID_INPUT → throw `ApiError`.
  - mock `fetch` 429 RATE_LIMITED → throw `ApiError`.
- **Files**: 1 patch `index.ts`, 1 patch test.
- **Validation**: `pnpm -F @ziweiai/web test api-client`.

### Phase 6 — Helper thuần `palace-flow-flags.ts` + test

- [ ] Tạo `apps/web/src/lib/features/chart/palace-flow-flags.ts`:
  - export type `HighlightTier = 'decadal' | 'yearly' | 'monthly' | 'daily'`.
  - export type `PalaceFlowView = { decadal?: { stemBranch: string; agesRange: string | null }; yearly?: { stemBranch: string }; monthly?: { stemBranch: string }; daily?: { stemBranch: string } }`.
  - export `buildPalaceFlowFlags(palace: PalaceView, frame: HoroscopeFrame | null): PalaceFlowView` — thuần, return `{}` khi frame null hoặc không match.
    - `decadal`: nếu `palace.index === frame.decadal.index` → set `{ stemBranch: translateZiweiKey(decadal.heavenlyStemKey) + ' ' + translateZiweiKey(decadal.earthlyBranchKey), agesRange: palace.decadalRange }`.
    - `yearly` / `monthly` / `daily`: tương tự, không kèm agesRange.
  - export `buildPalaceFlowFlagsMap(palaces: PalaceView[], frame: HoroscopeFrame | null): Map<number, PalaceFlowView>` — duyệt 12 cung, bỏ qua entry rỗng.
  - import type duy nhất từ `@ziweiai/contracts` (`HoroscopeFrame`); không import core/astro-engine.
- [ ] Test `palace-flow-flags.test.ts`:
  - 4 tầng cùng cung (mock frame có 4 index trùng nhau) → 4 field set.
  - chỉ decadal match → 1 field, các field khác undefined.
  - không match → `{}`.
  - frame thiếu `monthly`/`daily` (snapshot legacy) → bỏ qua.
  - `translateZiweiKey` throw (key sai) → propagate (test path).
  - `buildPalaceFlowFlagsMap` 12 cung → đúng số entry > 0.
- **Files**: 2 file mới.
- **Validation**: `pnpm -F @ziweiai/web test palace-flow-flags`.

### Phase 7 — UI: `PalaceCell` + `PalaceGrid` + tokens

- [ ] Patch `apps/web/src/lib/theme/tokens.css` thêm 8 biến trong `:root`:
  ```css
  --color-flow-decadal:      oklch(60% 0.18 300);
  --color-flow-decadal-soft: oklch(60% 0.18 300 / 0.12);
  --color-flow-yearly:       oklch(62% 0.18 245);
  --color-flow-yearly-soft:  oklch(62% 0.18 245 / 0.12);
  --color-flow-monthly:      oklch(62% 0.16 145);
  --color-flow-monthly-soft: oklch(62% 0.16 145 / 0.12);
  --color-flow-daily:        oklch(68% 0.18 60);
  --color-flow-daily-soft:   oklch(68% 0.18 60 / 0.12);
  ```
  Cân lại lightness sau test thủ công nếu contrast AA (≥ 4.5:1) fail vs
  `--color-bg-surface`.
- [ ] Patch `PalaceCell.svelte`:
  - Thêm prop `flowFlags?: PalaceFlowView | null = null`.
  - Import `PalaceFlowView` type.
  - `$derived activeTiers: HighlightTier[] = flowFlags ? Object.keys(flowFlags) as HighlightTier[] : []`.
  - Render `<div class="flow-bar" aria-hidden="true">` ở mép trên (trước
    `<header class="cell-head">`) khi `activeTiers.length > 0`, mỗi tầng
    là `<span class="flow-bar__seg flow-bar__seg--{tier}" />`.
  - Render `<footer class="flow-info">` ngay TRƯỚC `cell-foot` cũ (KHÔNG
    gộp — giữ ranh giới rõ với `changsheng / decadal / ages`):
    - chip Vận: `flowFlags.decadal` → `<span class="flow-chip flow-chip--decadal"><span>Vận</span><span>{stemBranch}</span></span>` + (nếu `agesRange`) `<span class="flow-chip__ages">{agesRange}</span>`.
    - chip Niên: `flowFlags.yearly` → text "Niên" + stemBranch.
    - chip Nguyệt: `flowFlags.monthly` → text "Nguyệt" + stemBranch.
    - chip Nhật: `flowFlags.daily` → text "Nhật" + stemBranch.
  - Block `<style>`:
    - `.flow-bar { display: flex; height: 3px; gap: 1px; margin: -1px -1px 4px; }`.
    - `.flow-bar__seg { flex: 1; height: 100%; }`.
    - `.flow-bar__seg--decadal { background: var(--color-flow-decadal); }` (4 rule).
    - `.flow-info { display: flex; flex-wrap: wrap; gap: 4px; margin-top: auto; padding-top: 4px; border-top: 1px solid var(--color-border-hairline); font-size: 10px; }`.
    - `.flow-chip { display: inline-flex; flex-direction: column; align-items: center; padding: 1px 4px; border-radius: var(--radius-sm); line-height: 1.1; }`.
    - `.flow-chip--decadal { background: var(--color-flow-decadal-soft); color: var(--color-flow-decadal); }` (4 rule).
- [ ] Patch `PalaceGrid.svelte`:
  - Thêm prop `chartId: string`, `enableFlowInfo?: boolean = true`.
  - Lấy token tươi qua auth store (pattern US-002 / US-006 — KHÔNG snapshot
    ngay mount).
  - `createQuery(() => ({ queryKey: ['horoscope', chartId, todayAsOf, DEFAULT_HOROSCOPE_SCOPES], queryFn: () => fetchChartHoroscope(getToken(), chartId, todayAsOf, [...DEFAULT_HOROSCOPE_SCOPES]), staleTime: HOROSCOPE_QUERY_STALE_MS, gcTime: HOROSCOPE_QUERY_GC_MS, enabled: enableFlowInfo && palaces.length === 12 }))`.
  - `const todayAsOf = new Date().toISOString().slice(0, 10)` (đặt module
    scope hoặc `$derived` 1 lần).
  - `$derived flagsByIndex = buildPalaceFlowFlagsMap(palaces, query.data?.frame ?? null)`.
  - Truyền `flowFlags={flagsByIndex.get(palace.index) ?? null}` vào cả 2
    nhánh render `<PalaceCell />` (board vuông + grid responsive).
  - Nếu `query.error` → `console.warn` (dev) + giữ map rỗng.
- [ ] Patch caller `ChartDetailScreen.svelte` (hoặc tên hiện tại) truyền
      `chartId` vào `PalaceGrid`. Verify trong code thực tế tên prop ID.
- **Files**: 1 patch `tokens.css`, 1 patch `PalaceCell.svelte`, 1 patch
  `PalaceGrid.svelte`, 1 patch caller.
- **Validation**: `pnpm -F @ziweiai/web check && pnpm -F @ziweiai/web test`.

### Phase 8 — E2E + scan Han

- [ ] Tạo `apps/web/tests/fixtures/horoscope-frame-fixture.json` (trích từ
      output Phase 3 snapshot test).
- [ ] Tạo `apps/web/tests/e2e/us-014-ziwei-flow-info.spec.ts`:
  - Login fixture + mở chart fixture (ưu tiên reuse fixture US-008 / 011 /
    012).
  - Intercept `POST **/charts/*/horoscope` → trả `horoscope-frame-fixture.json`
    (đảm bảo deterministic, tránh phụ thuộc engine + `Date.now`).
  - Assert ≥ 1 ô có `<div class="flow-bar">` với ≥ 1 `<span class="flow-bar__seg">`.
  - Assert tồn tại 4 chip text Việt: `Vận`, `Niên`, `Nguyệt`, `Nhật`.
  - Assert chip có class `flow-chip--decadal` chứa thêm `flow-chip__ages`.
  - Assert computed style `background-color` của chip decadal khớp
    `var(--color-flow-decadal-soft)` (qua `getComputedStyle`).
- [ ] Chạy lại `apps/web/src/lib/features/chart/no-han-characters.test.ts`
      (đã có sẵn) → đảm bảo không slip Hán qua helper / chip / spec.
- [ ] Chạy `pnpm why iztro` xác nhận chỉ tồn tại ở `@ziweiai/astro-engine`
      (boundary 0007 còn nguyên).
- **Files**: 2 file mới ở `apps/web/tests/`.
- **Validation**: `pnpm -F @ziweiai/web test:e2e -- us-014 && pnpm -F @ziweiai/web test no-han-characters`.

### Phase 9 — Doc + harness update + trace

- [ ] Patch `docs/product/api-contract.md`:
  - Thêm dòng bảng endpoint: `POST /charts/:id/horoscope | Bearer | horoscopeRequestSchema | horoscopeResponseSchema`.
  - Cập nhật mục "Hình dạng api-client" thêm `fetchChartHoroscope(...)`.
- [ ] Patch `docs/product/overview.md` thêm 1 đoạn "Flow-info trên bàn 12
      cung" trong mục tính năng Tử Vi.
- [ ] `pnpm lint --max-warnings=0` (toàn workspace) xanh.
- [ ] `turbo test` xanh.
- [ ] `scripts/bin/harness-cli.exe story update --id US-014 --unit 1 --integration 1 --e2e 1 --platform 0`.
- [ ] `scripts/bin/harness-cli.exe trace --intake <n> --story US-014 --summary "Horoscope endpoint + flow-info đa màu PalaceCell" --outcome completed --agent claude --actions "..." --read "..." --changed "..." --friction "..."`.
- [ ] Nếu phát hiện friction → `scripts/bin/harness-cli.exe backlog add --title <…> --pain <…> --risk normal`.
- [ ] Cập nhật Evidence trong `US-014-ziwei-flow-info.md`.
- **Files**: patch 2 doc + harness DB.
- **Validation**: harness query matrix US-014 đầy đủ proof.

## Risk + Rollback

| Rủi ro | Khả năng | Hậu quả | Giảm thiểu / Rollback |
|---|---|---|---|
| Engine taibu trả literal Hán không có trong từ điển ChartKey nghịch | trung bình | CJK guard test đỏ ở Phase 3 | Adapter throw `ZiweiHoroscopeUnknownTermError` → fix điển; nếu không xong scope, ship chỉ `decadal+yearly` (skip monthly/daily ở engine) → backlog US-014b |
| `horoscopeFrameSchema` đặt sai chỗ làm vỡ `chartSnapshotSchema` cũ | thấp | unit test contracts đỏ; consumer cũ vỡ | Đặt schema mới ở package mới `horoscope/`, KHÔNG sửa `chart-snapshot.ts` (chỉ import từ đó); fixture cũ vẫn parse |
| Quota `assertCanCreateChart` chặn endpoint mới quá thường | thấp | UX 429 ngẫu nhiên | Endpoint mới rẻ (chỉ iztro) — vẫn dùng chung; nếu thực tế chặn → tách quota riêng ở story sau (decision mới) |
| Web `import { ... } from '@ziweiai/core'` vô tình kéo iztro vào client | thấp | bundle phình + Han slip | ESLint `no-restricted-imports` đã chặn 4 package; Phase 9 verify `pnpm why iztro` chỉ ở astro-engine |
| E2E `asOf = today` shaky trên CI (timezone skew, midnight roll) | trung bình | flaky test | Intercept `/horoscope` trả frame fixture cố định; KHÔNG để Playwright đi engine thật |
| Contrast 4 màu vận hạn không phân biệt nổi trên dark theme | trung bình | UX không cải thiện | Phase 7 cân lại lightness; nếu cần lâu → backlog "điều chỉnh contrast vận hạn" + vẫn merge (hành vi đúng) |
| Snapshot legacy v1 thiếu `decadalRange` → `agesRange` luôn null | thấp | chip Vận thiếu tuổi | Acceptable: chip vẫn render với mỗi can-chi; ghi note trong chip "—" hoặc bỏ phần ages |
| `createQuery` trong PalaceGrid không reactive khi `chartId` đổi | thấp | flow-info giữ chart cũ | Wrap options trong function (Svelte 5 runes) — pattern đã ghi trong CLAUDE.md; test E2E mở chart 2 → assert flow-info đổi |
| Re-export `computeZiweiHoroscope` qua `@ziweiai/core` kéo iztro vào nhánh server-only của core | thấp | Han slip vào core khi consumer bundle sai | Core đã server-only theo decision 0007 (không đi vào web); test build kiểm `apps/web/build` không chứa iztro |

**Rollback đơn giản theo tầng**:

- Web only (Phase 5–7): revert `api-client/index.ts`, `palace-flow-flags.ts`,
  `PalaceCell.svelte`, `PalaceGrid.svelte`, `tokens.css` → bàn về US-012.
- API only (Phase 4): revert 2 file controller/service + spec → endpoint
  biến mất; web fetch lỗi → degrade rỗng (đã thiết kế).
- Engine + Contract (Phase 2–3): revert package `horoscope/` ở contracts +
  `ziwei-horoscope.ts` ở astro-engine → core export biến mất; api revert
  Phase 4 đồng thời.

Không có DB migration → không cần down migration. An toàn rollback ở mọi
phase.

## Done Criteria (match story AC)

- [ ] `horoscopeFrameSchema`, `horoscopeRequestSchema`,
      `horoscopeResponseSchema` ở `@ziweiai/contracts`, parse fixture cũ +
      mới đều OK.
- [ ] `computeZiweiHoroscope` ở `@ziweiai/core` (qua `@ziweiai/astro-engine`)
      sản sinh `HoroscopeFrame` đã ánh xạ ChartKey, không Hán.
- [ ] `POST /charts/:id/horoscope` ở `apps/api` đầy đủ Bearer + ownership +
      quota; happy path + 5 path lỗi pass test.
- [ ] `fetchChartHoroscope` ở `apps/web/src/lib/api-client/index.ts` parse
      đúng response schema.
- [ ] `buildPalaceFlowFlags` thuần, fallback an toàn (test phase 6 phủ).
- [ ] `PalaceCell` thanh chỉ báo đa màu + 4 chip footer (Vận / Niên /
      Nguyệt / Nhật) khớp `.ref/taibu/PalaceCard.tsx` về ý đồ; không vỡ
      US-008 / US-011 / US-012.
- [ ] `PalaceGrid` quản lý `createQuery(['horoscope', chartId, asOf])` +
      build map, degrade gọn khi lỗi.
- [ ] `\p{Script=Han}` scan xanh; `pnpm why iztro` chỉ ở
      `@ziweiai/astro-engine`; ESLint `no-restricted-imports` xanh.
- [ ] `pnpm -F @ziweiai/contracts test`, `pnpm -F @ziweiai/astro-engine test`,
      `pnpm -F @ziweiai/api test`, `pnpm -F @ziweiai/web check`,
      `pnpm -F @ziweiai/web test`, `pnpm -F @ziweiai/web test:e2e -- us-014`
      đều xanh.
- [ ] `docs/product/api-contract.md` cập nhật endpoint mới +
      `fetchChartHoroscope`.
- [ ] Harness `story update --unit 1 --integration 1 --e2e 1 --platform 0`
      và 1 trace với outcome `completed`.
- [ ] Friction (nếu có) → `backlog add` hoặc decision mới (US-014b /
      thay đổi contrast / tách quota).
