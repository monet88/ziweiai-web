# Plan — US-015 Panel vận hạn tương tác Tử Vi

## Goal

Triển khai panel vận hạn 4 tầng (đại vận → lưu niên → lưu nguyệt → lưu nhật) cho lá
số Tử Vi ở `apps/web`, port pattern reducer + chip strip + overlay highlight từ
taibu `ZiweiHoroscopePanel.tsx`. Mọi compute vận hạn dùng endpoint US-014
(`POST /charts/:id/horoscope`). Bàn 12 cung tô 4 màu khác nhau cho 4 cung Mệnh vận;
overlay tách biệt với `inAspect` của US-011.

## Pre-conditions

**KHỐI BẮT BUỘC trước khi mở phase 1 của story này:**

- US-014 đã merge vào main: contract `horoscopeFrameSchema` (mở rộng tương thích
  ngược với `monthly` + `daily`) + `horoscopeRequestSchema` +
  `chartHoroscopeResponseSchema` đã ở `@ziweiai/contracts`.
- `apps/api` route `POST /charts/:id/horoscope` đã hoạt động (Bearer + ownership +
  quota). Manual smoke: `curl -X POST .../charts/<id>/horoscope -H "Authorization:
  Bearer ..." -d '{"asOf":"2026-06-15","scopes":["decadal","yearly","monthly","daily"]}'`
  → 200 với 4 tầng đầy đủ.
- `fetchChartHoroscope(token, chartId, request)` đã có ở
  `apps/web/src/lib/api-client/index.ts` (parse qua `chartHoroscopeResponseSchema`).
- `decadalRange` + `ages` trong `palaceSchema` của snapshot Tử Vi đã được serializer
  điền (đã có từ US-006/US-008 — verify lại lúc phase 1).

Nếu **bất kỳ** điều kiện trên không thoả → DỪNG phase 1, ghi `backlog add` chờ
US-014, KHÔNG tự đắp endpoint hoặc contract.

## Phases

### Phase 1 — Discovery + reuse audit (đọc, không edit)

- Đọc `.ref/taibu/src/components/ziwei/ZiweiHoroscopePanel.tsx` — bóc 4 thuật toán
  build chip (decadal/yearly/monthly/daily) + reducer 4 action.
- Đọc `apps/web/src/lib/features/chart/palace-view-builder.ts` xác nhận
  `PalaceView.decadalRange` + `ages` + `index` đầy đủ (không cần sửa).
- Đọc `apps/web/src/lib/api-client/index.ts` xác nhận `fetchChartHoroscope` đã có
  từ US-014 (nếu chưa → DỪNG, ghi backlog).
- Đọc `packages/contracts/src/horoscope/*` xác nhận shape `horoscopeFrameSchema`
  có `monthly?` + `daily?`.
- Đọc `apps/web/src/lib/features/chart/chart-detail-model.svelte.ts` để hiểu
  pattern factory `createPalaceSelection` (sẽ port style cho
  `createHoroscopeSelection`).
- Output: ghi chú reuse + xác nhận pre-conditions; KHÔNG edit code.

### Phase 2 — `horoscope-selection.svelte.ts` (state machine thuần)

- File: `apps/web/src/lib/features/chart/horoscope-selection.svelte.ts`.
- Test-first: viết `horoscope-selection.test.ts` (10 case theo `validation.md`
  layer Unit) → fail.
- Implement `createHoroscopeSelection({ defaultDecadalIndex })` → 4 method
  `selectDecadal/selectYearly/selectMonthly/selectDaily` + getter `value`.
- Reset semantics: chọn tầng cao reset tầng thấp; chọn lại đúng index/year/month/day
  đang chọn = toggle off tầng đó (lưu niên toggle off chỉ reset monthly+daily,
  KHÔNG hủy decadal).
- Guard chống leo tầng: `selectYearly` khi `decadalIndex` null = noop.
- Validate: 10 case unit xanh.

### Phase 3 — Helper thuần build chip + default decadal + overlay

- Files:
  - `apps/web/src/lib/features/chart/horoscope-chips.ts` (4 builder pure).
  - `apps/web/src/lib/features/chart/horoscope-default-decadal.ts`
    (`computeDefaultDecadalIndex(palaces, today)`).
  - `apps/web/src/lib/features/chart/horoscope-overlay.ts` (selection + 4 frame →
    `HoroscopeOverlay`).
- Test-first: 3 file test tương ứng, ≥ 16 case (chips) + 4 case (default-decadal)
  + 8 case (overlay).
- Implement helper thuần TS — KHÔNG import `@ziweiai/core`/iztro/lunar (lint sẽ
  chặn nếu lỡ tay).
- Chip nhãn: dùng `translateZiweiKey` cho `palaceNameKeys[0]` + `heavenlyStemKey` +
  `earthlyBranchKey`; bắt try/catch fallback "—" + `console.warn` 1 lần.
- Validate: ≥ 28 case unit xanh.

### Phase 4 — TanStack Query factory

- File: `apps/web/src/lib/features/chart/horoscope-query.ts`.
- Test-first: `horoscope-query.test.ts` (≥ 5 case theo `validation.md` layer
  Integration). Mock `fetchChartHoroscope` qua dependency injection (pattern
  `chart-detail-model` test đã có).
- Implement `createHoroscopeQuery({ auth, getChartId, getAsOf, getScopes })` —
  wrap `createQuery` với queryKey reactive `['horoscope', chartId, asOf,
  scopesKey]`, `staleTime: Infinity`, `gcTime: 5min`, `enabled` guard token +
  asOf.
- Validate: 5 case integration xanh.

### Phase 5 — `ZiweiHoroscopePanel.svelte` + 2 primitive nội bộ

- Files:
  - `apps/web/src/lib/features/chart/HoroscopeChip.svelte` (button + nhãn
    primary/secondary, prop `selected`, `onClick`).
  - `apps/web/src/lib/features/chart/HoroscopeSection.svelte` (header + scroll-x
    chip strip + slot empty-hint).
  - `apps/web/src/lib/features/chart/ZiweiHoroscopePanel.svelte` (gộp selection +
    3 query + 4 section).
- Panel logic:
  - Mount: gọi `selectDecadal(computeDefaultDecadalIndex(palaces, today))` qua
    `$effect.pre` 1 lần khi snapshot lần đầu sẵn sàng. KHÔNG `$effect` ghi ngược
    selection sau đó.
  - Derive `asOf` cho 3 query từ selection (vd `${year}-06-15` cho yearly).
  - Derive 4 chip list từ snapshot + 3 frame data + selection.
  - Expose `getOverlay(): HoroscopeOverlay` cho parent (qua `bind:overlay` hoặc
    `onOverlayChange` callback — chọn `bind:` cho gọn vì là local state).
- Mount panel trong `ChartDetailScreen.svelte` cạnh `<PalaceGrid>` chỉ khi
  `chartSystem === 'zi-wei-dou-shu'`. Truyền `horoscopeOverlay` xuống
  `<PalaceGrid>`.
- Validate: panel render thử qua `pnpm -F @ziweiai/web dev` thủ công.

### Phase 6 — `PalaceGrid` + `PalaceCell` overlay highlight

- Sửa `PalaceGrid.svelte`:
  - Thêm prop `horoscopeOverlay?: HoroscopeOverlay` (optional, default
    `undefined`).
  - Per palace: derive 4 boolean `isInDecadal/Yearly/Monthly/Daily` so sánh
    `palace.index` với 4 palaceIndex của overlay.
  - Truyền 4 boolean xuống `<PalaceCell>`.
- Sửa `PalaceCell.svelte`:
  - Thêm 4 prop optional cùng tên (default `false`).
  - Thêm 4 class `.in-decadal/.in-yearly/.in-monthly/.in-daily` với
    `outline-offset: 2/5/8/11` + `outline: 2px solid var(--color-horoscope-*)`.
  - KHÔNG đụng `.cell.in-aspect` (US-011 dùng `border` — outline + border là 2
    box riêng, sống chung không đè nhau).
  - Confirm `prefers-reduced-motion` không animate outline (chỉ fade-in instant).
- Validate: thủ công + chuẩn bị E2E.

### Phase 7 — i18n + tokens

- Sửa `apps/web/src/lib/i18n/vi.ts` thêm `viCopy.horoscope` (xem `design.md`
  section i18n).
- Sửa `apps/web/src/lib/theme/tokens.css` thêm 4 token màu vận hạn:
  ```
  --color-horoscope-decadal: hsl(45 92% 55%);
  --color-horoscope-yearly:  hsl(180 60% 45%);
  --color-horoscope-monthly: hsl(280 55% 55%);
  --color-horoscope-daily:   hsl(330 75% 60%);
  ```
- Verify contrast AA của 4 màu trên `--color-bg-surface` (Stark hoặc devtools).

### Phase 8 — E2E + CJK guard

- File: `tests/e2e/us-015-ziwei-horoscope-panel.spec.ts`.
- Setup: Playwright `page.clock.install({ now: new Date('2026-06-17') })` để
  default decadal index deterministic.
- 8 step E2E theo `validation.md` layer E2E.
- Confirm `apps/web/src/lib/features/chart/no-han-characters.test.ts` vẫn 0
  count (kéo build/ qua test sau khi build).

### Phase 9 — Harness + PR

- Chạy theo thứ tự (DỪNG nếu lệnh nào fail, KHÔNG bypass):
  1. `pnpm -F @ziweiai/web check`
  2. `pnpm -F @ziweiai/web test`
  3. `pnpm lint`
  4. `pnpm -F @ziweiai/web build`
  5. `pnpm -F @ziweiai/web test:e2e -- us-015-ziwei-horoscope-panel.spec.ts`
- Sau khi xanh:
  - `scripts/bin/harness-cli.exe story update --id US-015 --unit 1 --integration
    1 --e2e 1 --platform 1`
  - `scripts/bin/harness-cli.exe trace --intake <N> --story US-015 ...`
- Branch: `feat/us-015-ziwei-horoscope-panel` từ main; PR với scope đúng story
  này (theo `pr-per-phase-workflow.md`).
- Status: `planned → implemented` trong `US-015-ziwei-horoscope-panel.md` sau
  khi merge.

## Risk + Rollback

| Rủi ro | Mitigation | Rollback |
| --- | --- | --- |
| US-014 chưa merge / contract khác | DỪNG phase 1, ghi backlog | — |
| Endpoint quá chậm (>2s/call) khi click chip | TanStack Query cache + skeleton chip; nếu vẫn chậm → debounce 150ms | Tắt panel cho Tử Vi qua flag local + giữ overlay rỗng |
| Reactive loop ($effect ghi ngược selection) | Bắt qua review PR — chỉ `$derived` cho propagation; pattern lock ở US-006/011 | Revert factory về initial state, kiểm tra svelte-check warn |
| CJK leak trong chip secondary | `translateZiweiKey` fail-fast + try/catch fallback "—" | Bổ sung từ điển `ziwei-terms-vi.ts` (decision nhỏ, xác nhận với product) |
| Outline overlay đè `border` của `inAspect` | Test thủ công + visual regression — outline + border là 2 box độc lập | CSS guard: outline luôn `outline-offset > 0` để không trùng border |
| Bundle phình > 8 KB gzipped | Đo trước khi PR; nếu >8 KB → kiểm import chéo (lint `no-restricted-imports`) | — |
| Lá số cũ thiếu `decadalRange` ở mọi cung | Hint Việt "Lá số chưa có dữ liệu đại vận", KHÔNG throw, KHÔNG render panel | — |

## Done Criteria

- 6 file plan/story đã commit ở `docs/stories/epics/E15-ziwei-horoscope-panel/`
  + `plans/us-015-ziwei-horoscope-panel-plan.md`.
- Implement xong 4 file helper thuần + 3 component panel + sửa 2 component cũ +
  i18n + tokens (theo phase 2–7).
- ≥ 30 unit test + ≥ 5 integration test + 1 E2E spec xanh.
- `pnpm -F @ziweiai/web check` + `test` + `lint` + `build` xanh.
- CJK guard `no-han-characters.test.ts` count = 0.
- Bundle delta gzipped < 8 KB; KHÔNG kéo `iztro` / `lunar-javascript` /
  `@ziweiai/core` vào client bundle (kiểm qua `pnpm -F @ziweiai/web build`
  stats).
- Harness story matrix: US-015 đã update `unit=1 integration=1 e2e=1 platform=1`.
- 1 trace `--outcome completed` (hoặc `partial` + friction) đã ghi.
- PR `feat/us-015-ziwei-horoscope-panel` đã merge vào main; status story
  `implemented`.
