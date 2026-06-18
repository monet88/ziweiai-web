# Exec Plan

## Goal

Phát hành endpoint vận hạn server-side mới + lớp UI flow-info đa màu trên bàn
12 cung Tử Vi: mỗi `PalaceCell` tự động phản ánh **lát cắt thời gian = hôm nay**
qua thanh chỉ báo + 4 chip footer (đại vận / lưu niên / lưu nguyệt / lưu nhật).
Story này là **tiền đề kích hoạt decision `0011-horoscope-engine-boundary.md`**:
gánh cả contract + engine wiring + endpoint, để US-015 (panel) và US-016 (vận
ngày / tháng / báo cáo năm) có thể tiêu thụ ngay.

## Scope

**In scope:**

- Mở rộng `@ziweiai/contracts` với package mới `horoscope/`
  (`horoscope-frame.ts`, `horoscope-request.ts`, `horoscope-response.ts`).
- Thêm hàm `computeZiweiHoroscope({ snapshot, asOf, scopes })` ở
  `@ziweiai/core` + `@ziweiai/astro-engine`, port từ
  `.ref/taibu/packages/core/src/domains/ziwei-horoscope/calculate.ts`.
- Phát hành `POST /charts/:id/horoscope` ở `apps/api` (Bearer + ownership +
  quota cùng key `assertCanCreateChart`).
- Thêm `fetchChartHoroscope` flat-function ở `apps/web/src/lib/api-client/index.ts`.
- Helper thuần `buildPalaceFlowFlags(palace, frame)` ở
  `apps/web/src/lib/features/chart/palace-view-builder.ts` (hoặc file chị em
  `palace-flow-flags.ts`).
- UI `PalaceCell` thêm prop `flowFlags`, render thanh chỉ báo đa màu + dòng
  flow-info. `PalaceGrid` quản lý query + map flags theo index.
- 8 CSS variable màu vận hạn (4 tầng × solid/soft) trong `tokens.css`.
- E2E Playwright cho lát cắt cố định + scan `\p{Script=Han}` xanh.
- Cập nhật `docs/product/api-contract.md` và (nhẹ) `docs/product/overview.md`.
- `harness-cli intake` + `story add US-014` + `story update` + `trace`.

**Out of scope** (sang story sau):

- Panel state-machine chọn `asOf` (US-015).
- Vận ngày / vận tháng / báo cáo năm + LLM (US-016).
- Bảng cache DB cho horoscope.
- Tích hợp scope vận hạn vào AI explanation prompt.
- Đổi UI tam phương tứ chính (US-011) hoặc star-color (US-012).
- Vá thêm field vào `chartSnapshotSchema` (giữ snapshot ổn định — `monthly` /
  `daily` chỉ sống trong `horoscopeFrameSchema`).

## Risk Classification

**Risk flags:**

- **Public contract**: thêm package `horoscope/` ở `@ziweiai/contracts` →
  consumer cũ (Expo / mcp-server nếu có) phải tương thích forward. Mitigation:
  reuse `horoscopeItemSchema` đã có; package mới chỉ export thêm.
- **Endpoint mới** = mặt API mới phải bảo trì version sau. Mitigation: gộp
  scopes vào 1 endpoint thay vì tách 4.
- **Engine cross-package**: `computeZiweiHoroscope` đặt ở `@ziweiai/core` (trừu
  tượng) hay `@ziweiai/astro-engine` (gọi iztro)? Quyết định: hàm public ở
  `@ziweiai/core`, implement gọi `@ziweiai/astro-engine` — khớp pattern
  `computeZiweiSnapshot` đang có.
- **Boundary 0007**: dễ tay bị nhỡ `import` engine ở web. Mitigation: ESLint
  rule có sẵn + lint chặn ở Phase 6.
- **CJK leak**: engine port từ taibu có literal Hán cho tên cung gốc.
  Mitigation: layer adapter ở engine output ánh xạ Hán → ChartKey **trước khi
  return** (server-only); unit test parse `horoscopeFrameSchema` từ output
  engine + scan `\p{Script=Han}` trên field `palaceNameKeys`/`mutagenStarKeys`.
- **Ngân sách quota**: endpoint dùng chung quota `assertCanCreateChart` rẻ
  (không LLM) → an toàn không tăng cost. Mitigation: log durationMs để chốt.

**Hard gates:**

- Snapshot legacy v1 (chỉ `decadal/age/yearly`) vẫn parse được → unit test
  fixture.
- `apps/web` lint xanh sau khi thêm code (`no-restricted-imports`).
- Test scan `\p{Script=Han}` xanh cho mọi nhãn UI mới.
- `pnpm -F @ziweiai/api test` xanh (route mới + service mới).
- `pnpm -F @ziweiai/web test` + `pnpm -F @ziweiai/web check` xanh.
- `pnpm -F @ziweiai/web test:e2e -- us-014` xanh trên fixture asOf cố định.

## Work Phases

1. **Discovery & intake**
   - `scripts/bin/harness-cli.exe query matrix` đọc proof status hiện tại.
   - `scripts/bin/harness-cli.exe intake --type spec-slice --summary "US-014 ziwei flow info" --lane high-risk`.
   - Đọc `.ref/taibu/packages/core/src/domains/ziwei-horoscope/calculate.ts`
     để chốt input/output engine.
   - Ghi note: hàm taibu trả `{ daYun, liuNian, liuYue, liuRi }` → ánh xạ thành
     `{ decadal, yearly, monthly, daily }` (Việt-hoá tên field).

2. **Contract extension** (`packages/contracts`)
   - Tạo `packages/contracts/src/horoscope/horoscope-frame.ts`:
     - import `horoscopeItemSchema` + `horoscopeAgeItemSchema` từ
       `../chart/chart-snapshot`.
     - export `horoscopeFrameSchema = z.object({ decadal, age, yearly,
       monthly: ...optional, daily: ...optional })`.
     - export type `HoroscopeFrame`.
   - Tạo `horoscope-request.ts`: `horoscopeRequestSchema`, type
     `HoroscopeRequest`, type `HoroscopeScope`.
   - Tạo `horoscope-response.ts`: `horoscopeResponseSchema`, type
     `HoroscopeResponse`.
   - Cập nhật `packages/contracts/src/index.ts` export `from './horoscope/...'`.
   - Test `packages/contracts/src/horoscope/horoscope-frame.test.ts`:
     - parse fixture cũ (chỉ decadal/age/yearly) → OK.
     - parse fixture mới có monthly+daily → OK.
     - parse fixture thiếu `decadal` → fail (decadal required).
   - Validation: `pnpm -F @ziweiai/contracts test` xanh.

3. **Engine wiring** (`packages/core` + `packages/astro-engine`)
   - Tạo `packages/astro-engine/src/ziwei-horoscope.ts`: hàm thuần
     `computeZiweiHoroscope({ snapshot, asOf, scopes })` gọi iztro y hệt taibu;
     output **đã ánh xạ** sang ChartKey ASCII (dùng từ điển nghịch của
     `ziwei-terms` đã có ở core).
   - Re-export từ `packages/core/src/index.ts` để consumer (apps/api) chỉ
     import `@ziweiai/core`.
   - Test `packages/astro-engine/src/ziwei-horoscope.test.ts`:
     - input fixture lá số cố định + `asOf = '2026-06-17'` → output ổn định
       (snapshot test bằng `vitest`).
     - parse output qua `horoscopeFrameSchema` → OK.
     - chứa CJK guard test: output JSON không có ký tự Hán.
   - Validation: `pnpm -F @ziweiai/astro-engine test` xanh, `turbo build` xanh.

4. **API endpoint** (`apps/api`)
   - Mở rộng `apps/api/src/modules/charts/services/charts.service.ts` thêm
     `computeHoroscope(userId, chartId, asOf, scopes)`:
     - load chart (404 nếu không sở hữu / không tồn tại).
     - assert `chartSystem === 'zi-wei-dou-shu'` (400).
     - `await assertCanCreateChart(userId, ip)` — quota cùng key.
     - `const frame = computeZiweiHoroscope(...)` từ `@ziweiai/core`.
     - return `{ chartId, asOf, frame }`.
   - Mở rộng `charts.controller.ts` thêm `POST :id/horoscope`:
     - parse body qua `horoscopeRequestSchema`.
     - parse param `z.uuid()`.
     - `horoscopeResponseSchema.parse(...)` trước khi return.
   - Test `apps/api/src/modules/charts/services/charts.service.spec.ts` (mở
     rộng) + `charts.controller.spec.ts`:
     - happy path (zi-wei) → 200 + frame parse được.
     - chart bazi → 400 INVALID_INPUT.
     - chartId người khác → 404 NOT_FOUND.
     - quota over → 429 RATE_LIMITED.
     - body không khớp schema → 400 INVALID_INPUT.
     - thiếu Bearer → 401 UNAUTHORIZED.
   - Validation: `pnpm -F @ziweiai/api test` + `pnpm -F @ziweiai/api typecheck`
     xanh.

5. **Web fetch helper** (`apps/web/src/lib/api-client`)
   - Thêm `fetchChartHoroscope(token, chartId, asOf, scopes)` ở `index.ts` —
     pattern flat-function khớp `createChart` / `fetchChartDetail`.
   - Thêm hằng `DEFAULT_HOROSCOPE_SCOPES`, `HOROSCOPE_QUERY_STALE_MS`,
     `HOROSCOPE_QUERY_GC_MS`.
   - Test `apps/web/src/lib/api-client/api-client.test.ts` (mở rộng):
     - mock `fetch` 200 → parse OK.
     - mock `fetch` 400 → ApiError code `INVALID_INPUT`.
     - mock `fetch` 429 → ApiError code `RATE_LIMITED`.
   - Validation: `pnpm -F @ziweiai/web test api-client` xanh.

6. **Web view-builder + flow flags helper**
   - Tạo `apps/web/src/lib/features/chart/palace-flow-flags.ts`:
     - export type `HighlightTier`, `PalaceFlowView`.
     - export `buildPalaceFlowFlags(palace: PalaceView, frame: HoroscopeFrame): PalaceFlowView`
       — thuần, KHÔNG side-effect, ánh xạ `palace.index === frame.<tier>.index`
       → set field tương ứng + `stemBranch` qua `translateZiweiKey`.
     - export `buildPalaceFlowFlagsMap(palaces, frame): Map<number, PalaceFlowView>`
       — wrapper duyệt 12 cung.
     - reuse `decadalRange` đã có trên `PalaceView` cho `agesRange` (KHÔNG đọc
       lại `palace.ages`).
   - Test `palace-flow-flags.test.ts`:
     - 4 tầng cùng cung → trả 4 field.
     - chỉ decadal → trả 1 field, các field khác undefined.
     - không match → trả `{}`.
     - frame thiếu monthly/daily (snapshot legacy) → bỏ qua, chỉ trả
       decadal+yearly khi match.
     - throw khi `translateZiweiKey` fail-fast → caller (PalaceGrid) bắt; test
       riêng path throw.
   - Validation: `pnpm -F @ziweiai/web test palace-flow-flags` xanh.

7. **Web UI**
   - Thêm 8 biến CSS vận hạn vào `apps/web/src/lib/theme/tokens.css`. Tone:
     - decadal: `oklch(60% 0.18 300)` (tím) + soft alpha 12%.
     - yearly: `oklch(62% 0.18 245)` (xanh dương) + soft.
     - monthly: `oklch(62% 0.16 145)` (xanh lá) + soft.
     - daily: `oklch(68% 0.18 60)` (cam) + soft.
     - Cân lại sau test thủ công nếu contrast AA fail.
   - `PalaceCell.svelte`:
     - Thêm prop `flowFlags?: PalaceFlowView | null`.
     - `$derived activeTiers = flowFlags ? Object.keys(flowFlags) : []`.
     - Render `<div class="flow-bar" aria-hidden="true">` khi `activeTiers.length > 0`,
       chia `flex: 1` mỗi tầng.
     - Render `<footer class="flow-info">` khi có flag, chip mỗi tầng với
       label Việt cố định + `stemBranch` + (decadal) `agesRange`.
     - Block `<style>`: rule `.flow-bar { display: flex; height: 3px; ... }`
       + `.flow-bar > .flow-bar__seg--{tier}`; `.flow-info` flex wrap;
       `.flow-chip--{tier}` background `var(--color-flow-{tier}-soft)`, color
       `var(--color-flow-{tier})`.
   - `PalaceGrid.svelte`:
     - Thêm prop `chartId: string`, `enableFlowInfo?: boolean = true`.
     - `createQuery(() => ({ queryKey: ['horoscope', chartId, asOf, scopes],
       queryFn: () => fetchChartHoroscope(...), staleTime: HOROSCOPE_QUERY_STALE_MS,
       gcTime: HOROSCOPE_QUERY_GC_MS, enabled: enableFlowInfo && palaces.length === 12 }))`.
     - `$derived flagsByIndex = buildPalaceFlowFlagsMap(palaces, query.data?.frame ?? null)`.
     - Truyền `flowFlags={flagsByIndex.get(palace.index) ?? null}` vào
       `<PalaceCell />`.
     - Lỗi query → `console.warn` (dev) + map rỗng (degrade gọn).
   - Cập nhật caller `ChartDetailScreen.svelte` truyền `chartId` vào
     `PalaceGrid` (đã có sẵn).
   - Validation: `pnpm -F @ziweiai/web check` xanh.

8. **E2E + scan Han**
   - Tạo `apps/web/tests/e2e/us-014-ziwei-flow-info.spec.ts`:
     - Login fixture + mở 1 lá số đã có (cùng fixture US-008/011/012).
     - Mock thời gian `asOf = '2026-06-17'` (qua `Date.now` injection hoặc
       MSW intercept `/charts/:id/horoscope` trả frame cố định).
     - Assert tồn tại ≥ 1 ô có `<div class="flow-bar">` với ≥ 1 segment.
     - Assert tồn tại 4 chip Vận / Niên / Nguyệt / Nhật (text Việt) với màu
       background đúng (computed style chứa `var(--color-flow-*)` tương ứng).
     - Assert chip Vận kèm `agesRange` ("24–33" hoặc tương tự).
   - Chạy `apps/web/src/lib/features/chart/no-han-characters.test.ts` lại để
     đảm bảo helper / nhãn / spec không slip Hán.
   - Validation: `pnpm -F @ziweiai/web test:e2e -- us-014` + `test no-han`
     xanh.

9. **Doc + harness update + trace**
   - Cập nhật `docs/product/api-contract.md` thêm dòng endpoint mới.
   - Cập nhật `docs/product/overview.md` (1 đoạn ngắn về flow-info).
   - `scripts/bin/harness-cli.exe story update --id US-014 --unit 1 --integration 1 --e2e 1 --platform 0`.
   - `scripts/bin/harness-cli.exe trace --intake <n> --story US-014 --summary
     "Horoscope endpoint + flow-info đa màu PalaceCell" --outcome completed
     --agent claude --actions "Add horoscope contracts, computeZiweiHoroscope
     in core, POST /charts/:id/horoscope, fetchChartHoroscope, buildPalaceFlowFlags,
     PalaceCell flow-bar+flow-info, e2e" --read "PalaceCell.svelte
     PalaceGrid.svelte palace-view-builder.ts taibu/PalaceCard.tsx
     taibu/calculate.ts chart-snapshot.ts decision-0011" --changed "horoscope/*.ts
     ziwei-horoscope.ts charts.service.ts charts.controller.ts api-client/index.ts
     palace-flow-flags.ts PalaceCell.svelte PalaceGrid.svelte tokens.css
     us-014-*.spec.ts api-contract.md" --friction "<điền nếu có>"`.
   - Nếu phát hiện friction (engine CJK chưa map đủ / contrast fail / fixture
     asOf shaky) → `backlog add --risk normal`.
   - Cập nhật Evidence trong `US-014-ziwei-flow-info.md`.

## Stop Conditions

Pause for human confirmation if:

- Cần đổi `chartSnapshotSchema` (vd. nhúng `horoscopeFrame` vào snapshot mặc
  định) — vi phạm decision `0011`. Cần decision mới.
- Cần đổi shape `apiErrorCodeSchema` (vd. thêm `FORBIDDEN`) — chạm public
  contract sâu hơn dự kiến.
- `computeZiweiHoroscope` từ taibu trả output không thể map sang ChartKey
  (vd. có sao mới không có trong từ điển). Cần decision: mở rộng từ điển hay
  loại sao đó.
- Quota `assertCanCreateChart` thực tế chặn endpoint mới quá thường (false
  positive). Cần tách quota riêng `assertCanComputeHoroscope` — quyết định
  riêng + bảng quota mới.
- Engine port từ taibu hỏng test `\p{Script=Han}` không thể fix nhanh trong
  scope — fallback: trì hoãn `monthly+daily`, ship chỉ `decadal+yearly` cho
  US-014, ghi backlog cho US-014b.
- E2E phụ thuộc thời gian thực (asOf = today) shaky trên CI → cần fixture
  inject `asOf` qua query param hoặc MSW; quyết định pattern test vận hạn cho
  US-015 / US-016 cùng dùng.
