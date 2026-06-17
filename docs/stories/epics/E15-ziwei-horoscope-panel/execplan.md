# Exec Plan

## Goal

Người dùng mở chi tiết một lá số Tử Vi → thấy panel vận hạn 4 tầng (đại vận → lưu
niên → lưu nguyệt → lưu nhật) cạnh bàn 12 cung, click chip để chọn mốc; bàn 12 cung
tô 4 màu khác nhau cho cung Mệnh vận của 4 tầng đang chọn (chồng song song với
overlay tam phương tứ chính của US-011). Mọi compute vận hạn nằm ở `apps/api`
(endpoint US-014 đã có); web là tầng trình bày + state machine thuần.

## Scope

In scope:

- `apps/web/src/lib/features/chart/horoscope-selection.svelte.ts` — factory
  `createHoroscopeSelection` (state + reducer 4 tầng, runes thuần).
- `apps/web/src/lib/features/chart/horoscope-chips.ts` — helper thuần build 4 list
  chip (`buildDecadalChips`, `buildYearlyChips`, `buildMonthlyChips`,
  `buildDailyChips`) + `computeDefaultDecadalIndex`.
- `apps/web/src/lib/features/chart/horoscope-overlay.ts` — helper thuần map
  `selection + 4 frame` → `HoroscopeOverlay` (4 palace index cho 4 tầng).
- `apps/web/src/lib/features/chart/horoscope-query.ts` — factory `createHoroscopeQuery`
  (TanStack Query wrap `fetchChartHoroscope` từ US-014).
- `apps/web/src/lib/features/chart/ZiweiHoroscopePanel.svelte` — component panel.
- `apps/web/src/lib/features/chart/HoroscopeSection.svelte` +
  `HoroscopeChip.svelte` — primitives nội bộ panel.
- Sửa `PalaceGrid.svelte` thêm prop optional `horoscopeOverlay?: HoroscopeOverlay`,
  truyền 4 boolean xuống `PalaceCell`.
- Sửa `PalaceCell.svelte` thêm 4 prop optional `isInDecadal/isInYearly/...` + 4
  class CSS với `outline` chồng (KHÔNG đụng `border` của `inAspect`).
- Sửa `ChartDetailScreen.svelte` mount `<ZiweiHoroscopePanel>` cạnh `<PalaceGrid>`
  cho `chartSystem === 'zi-wei-dou-shu'`; đọc selection → derive overlay → truyền
  vào `<PalaceGrid>`.
- Bổ sung `viCopy.horoscope` ở `apps/web/src/lib/i18n/vi.ts`.
- Thêm 4 token màu vận hạn ở `apps/web/src/lib/theme/tokens.css`.
- Unit test: `horoscope-selection.test.ts`, `horoscope-chips.test.ts`,
  `horoscope-overlay.test.ts`, `horoscope-default-decadal.test.ts`.
- E2E test: `tests/e2e/us-015-ziwei-horoscope-panel.spec.ts`.

Out of scope:

- Bất kỳ thay đổi nào ở `apps/api`, `packages/core`, `packages/astro-engine`,
  `packages/contracts`. (Endpoint + contract horoscope đã do US-014 đặt nền.)
- Báo cáo năm AI (`POST /charts/:id/annual-report`) — thuộc US-016 + cờ
  `AI_ANNUAL_REPORT_ENABLED` riêng. KHÔNG đụng LLM trong story này.
- Cache DB cho daily/monthly — decision riêng theo `0011`, hiện chưa cấp thiết.
- Đường nối SVG cho cung Mệnh vận. Story này chỉ tô viền/nền.
- Hệ khác Tử Vi (`bazi`, `meihua`, `liuyao`, `daliuren`, `qimen`) — panel chỉ render
  khi `chartSystem === 'zi-wei-dou-shu'`.
- Sửa `palace-view-builder` / `chart-detail-model` (giữ nguyên contract trong).

## Risk Classification

Risk flags:

- **Public contract reuse:** sai shape của response US-014 ⇒ web vỡ runtime.
  Mitigation: parse mọi response qua `chartHoroscopeResponseSchema` (US-014 đã
  thêm), không tự định nghĩa DTO ở web.
- **CJK leak:** chip secondary chứa `palaceNameKey` lạ → `translateZiweiKey` throw.
  Mitigation: bắt try/catch ở chip render → degrade thành "—" + log warn; CJK guard
  test (`no-han-characters.test.ts`) chạy trên build/.
- **Reactive trap:** dùng nhầm `$effect` để propagate selection → fetch ⇒ infinite
  loop. Mitigation: chỉ `$derived` + queryKey reactive (pattern US-006/011).
- **Cost API:** lướt nhanh chip → 12+ call/giây. Mitigation: TanStack Query cache
  `staleTime: Infinity` + `enabled` guard; KHÔNG prefetch tự động ngoài tầng đang
  chọn (lazy chip-by-chip).
- **State sync với chartId:** đổi route `/charts/:id` → selection cũ giữ lại nếu
  không reset. Mitigation: layout (app)/charts/[chartId] đã `{#key chartId}` (US-006)
  → component panel remount → factory mới → selection `{}`.

Hard gates:

- `pnpm -F @ziweiai/web check` xanh (svelte-check 0 lỗi/0 cảnh báo).
- `pnpm -F @ziweiai/web test` xanh (unit + integration).
- `pnpm lint` xanh (`--max-warnings=0`); `no-restricted-imports` không bắt được
  import `@ziweiai/core`/iztro/lunar trong file mới.
- E2E `us-015-ziwei-horoscope-panel.spec.ts` xanh.
- CJK guard `no-han-characters.test.ts` vẫn 0 (build/ không lọt Han).
- `harness-cli.exe story update --id US-015 --unit 1 --integration 1 --e2e 1
  --platform 1`.

## Work Phases

1. **Discovery + reuse audit** (đọc).
   - Xác nhận US-014 đã merge: `fetchChartHoroscope` có ở api-client +
     `horoscopeFrameSchema` + `chartHoroscopeResponseSchema` ở
     `@ziweiai/contracts`. Nếu chưa → DỪNG, ghi `backlog add` và chờ US-014.
   - Đọc `.ref/taibu/src/components/ziwei/ZiweiHoroscopePanel.tsx` (đã có) — port
     reducer 4 tầng + thuật toán `decadalList` / `yearlyList` / `monthlyList` /
     `dailyList` sang TS thuần.
   - Đọc `palace-view-builder.ts` xác nhận có `decadalRange`, `ages`, `index` —
     KHÔNG sửa.

2. **Helper thuần + reducer + unit test** (test-first cho 3 file thuần TS).
   - Viết `horoscope-selection.test.ts`: 8–10 case (mặc định null, chọn decadal,
     toggle decadal off, chọn yearly giữ decadal reset 2 dưới, chọn monthly khi
     chưa có yearly là noop, ...).
   - Viết `horoscope-chips.test.ts`: build từ palace fixtures (đã có ở
     `palace-view-builder.test.ts` precedent) + frame fixtures.
   - Viết `horoscope-overlay.test.ts`: 4 tầng × 2 trạng thái (chọn/không) → 16
     case overlay.
   - Viết `horoscope-default-decadal.test.ts`: snapshot có `decadalRange` "31-40"
     + birthYear 1990 + today 2026 → tuổi 36 → đại vận index đúng.
   - Implement 3 file để chạy xanh.

3. **TanStack Query factory** (test integration).
   - `horoscope-query.ts` — wrap `fetchChartHoroscope` (US-014) trong `createQuery`,
     queryKey reactive `['horoscope', chartId, asOf, scopesKey]`,
     `staleTime: Infinity`.
   - Test integration: mock `fetchChartHoroscope`, kiểm 3 instance query
     (yearly/monthly/daily) đổi `asOf` → queryKey đổi → refetch; gộp scope không
     nên cache key chéo.

4. **Component panel** (Svelte 5).
   - `HoroscopeChip.svelte` (button + nhãn) — props `primary, secondary, selected,
     onClick`.
   - `HoroscopeSection.svelte` (header + scroll-x + slot chip) — props `title,
     chips, ariaLabel, emptyHint?`.
   - `ZiweiHoroscopePanel.svelte` — gộp `createHoroscopeSelection` +
     `createHoroscopeQuery`(×3) + 4 `HoroscopeSection`. Expose `getOverlay()` cho
     parent.
   - Mount trong `ChartDetailScreen.svelte` cạnh bàn 12 cung; truyền
     `horoscopeOverlay` xuống `PalaceGrid`.

5. **Overlay highlight ở `PalaceGrid` + `PalaceCell`**.
   - Sửa `PalaceGrid.svelte`: thêm prop `horoscopeOverlay?: HoroscopeOverlay`,
     compute 4 boolean per palace từ overlay, truyền xuống `PalaceCell`.
   - Sửa `PalaceCell.svelte`: thêm 4 prop `isInDecadal/.../isInDaily`, 4 class
     `.in-decadal/.in-yearly/.in-monthly/.in-daily` với `outline-offset` 2/5/8/11.
   - Token màu mới vào `tokens.css`.
   - Confirm `inAspect` (US-011) vẫn dùng `border` (không đụng `outline`).

6. **i18n + a11y**.
   - Bổ sung `viCopy.horoscope` trong `vi.ts`.
   - `aria-label` cho 4 vùng (`role="tablist"`?) — quyết: dùng `role="group"` +
     `aria-label`, KHÔNG ép tab semantics vì 4 vùng không phải tab thay thế.
   - Chip là `<button type="button" aria-pressed={selected}>`.
   - Confirm `prefers-reduced-motion` cho transition outline (không animate, chỉ
     fade-in 80ms).

7. **E2E + CJK guard**.
   - Viết `tests/e2e/us-015-ziwei-horoscope-panel.spec.ts`:
     - Đăng nhập fixture user → mở 1 chart Tử Vi đã tạo.
     - Assert 10 chip đại vận render; chip chứa năm hiện tại có `aria-pressed=true`.
     - Click chip đại vận khác → 12 chip lưu niên render trong 2s; trước đó vùng
       lưu nguyệt + lưu nhật ẩn.
     - Click 1 chip lưu niên → vùng lưu nguyệt render 12 chip; vùng lưu nhật ẩn.
     - Click 1 chip lưu nguyệt → vùng lưu nhật render 28–31 chip.
     - Click 1 chip lưu nhật → bàn 12 cung có 4 ô khác nhau với outline 4 màu
       (locator `.cell.in-decadal`, `.in-yearly`, `.in-monthly`, `.in-daily`).
     - Click LẠI chip lưu niên đang chọn → toggle off → vùng lưu nguyệt + lưu
       nhật ẩn lại.
   - Chạy `no-han-characters.test.ts` confirm build/ vẫn 0 Han.

8. **Validation + harness**.
   - `pnpm -F @ziweiai/web check`, `pnpm -F @ziweiai/web test`, `pnpm lint`.
   - `pnpm -F @ziweiai/web build` confirm bundle không kéo iztro.
   - `harness-cli.exe story update --id US-015 --unit 1 --integration 1 --e2e 1
     --platform 1` (chỉ sau khi lệnh ở trên ĐÃ chạy xanh).
   - `harness-cli.exe trace --intake N --story US-015 --summary "..." --outcome
     completed --agent claude --actions "..." --read "..." --changed "..."
     --friction "..."`.

9. **PR theo phase** (theo memory `pr-per-phase-workflow.md`).
   - Branch `feat/us-015-ziwei-horoscope-panel` từ main.
   - PR scope đúng story này; KHÔNG nhồi US-016 hay sửa US-014.

## Stop Conditions

Pause for human confirmation if:

- US-014 chưa merge / endpoint `POST /charts/:id/horoscope` chưa tồn tại / response
  shape khác `0011` đã chốt.
- Phát hiện cần thêm field vào `horoscopeFrameSchema` (vd `decadalAge`,
  `yearlyAge`) → backlog + decision riêng. KHÔNG tự thêm.
- Phát hiện endpoint US-014 trả kèm full chip list 12/12/N trong 1 call → cần
  refactor approach (bỏ lazy chip).
- Snapshot lá số cũ thiếu `decadalRange` ở mọi cung → không xác định được đại vận
  mặc định. Quyết: panel render với `selection = {}` + hint "Lá số chưa có dữ liệu
  đại vận"; KHÔNG throw.
- `translateZiweiKey` throw cho `palaceNameKey` mới (taibu mở rộng key) → bổ sung
  từ điển `ziwei-terms-vi.ts` là decision nhỏ (không cần ADR), nhưng phải xác
  nhận với product trước khi auto-add.
- Validation lặp đi lặp lại fail (>2 vòng) → dừng, ghi `backlog add` thay vì patch
  vá.

## Done Criteria

- 4 file template + root packet đầy đủ.
- 4 file source helper thuần + 3 component + sửa 2 component cũ + i18n + token.
- Unit test cover reducer / chips / overlay / default-decadal (≥ 30 case).
- Integration test cho `createHoroscopeQuery` (≥ 5 case).
- E2E `us-015-*.spec.ts` xanh trên CI.
- `pnpm -F @ziweiai/web check` + `test` + `pnpm lint` xanh.
- CJK guard `no-han-characters.test.ts` = 0.
- `harness-cli.exe story update --id US-015 --unit 1 --integration 1 --e2e 1
  --platform 1` đã chạy.
- `harness-cli.exe trace ...` đã ghi (success hoặc partial + friction).
- PR vào main đã merge; status story bump `planned → implemented`.
