# Validation

## Proof Strategy

Story này là tầng trình bày + state machine + tiêu thụ contract đã có (US-014).
Bằng chứng "xong" gồm 4 lớp:

1. **Lớp logic thuần (unit):** reducer 4 tầng, helper build chip, helper map
   selection → overlay, helper compute default decadal — chứng minh bằng test
   thuần Vitest, KHÔNG cần Svelte component / QueryClient context. Đây là lớp
   chính lock invariant của state machine.
2. **Lớp query (integration):** `createHoroscopeQuery` wrap `fetchChartHoroscope`
   (US-014) — mock fetch + QueryClient harness, kiểm queryKey reactive theo
   `asOf + scopes`, `staleTime: Infinity`, `enabled` guard.
3. **Lớp end-to-end (Playwright):** mở lá số Tử Vi thật → click 4 tầng theo thứ
   tự → bàn 12 cung tô 4 màu khác nhau ở 4 ô. Đây là proof contract hoạt động
   thật từ UI tới API.
4. **Lớp platform (CJK + lint + check + build):** quét `\p{Script=Han}` trên
   `apps/web/build/` = 0; ESLint `no-restricted-imports` không bắt được import
   `@ziweiai/core`/`iztro`/`lunar-javascript` trong file mới; svelte-check 0
   cảnh báo; build SPA xanh.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | 1) `createHoroscopeSelection` initial = `{}` khi default decadal null. 2) initial = `{ decadalIndex: N }` khi default = N. 3) `selectDecadal(N)` lần đầu set decadal. 4) `selectDecadal(M)` (M ≠ N) đổi sang M, reset 3 dưới. 5) `selectDecadal(N)` khi đang chọn N = toggle off → `{}`. 6) `selectYearly(Y)` khi `decadalIndex` null = noop (không leo tầng). 7) `selectYearly(Y)` đặt yearly, giữ decadal, reset monthly+daily. 8) `selectMonthly(M)` khi `yearlyYear` null = noop. 9) `selectDaily(D)` khi `monthlyMonth` null = noop. 10) Click lại chip yearly đang chọn = toggle off chỉ yearly → reset monthly+daily. 11) `buildDecadalChips` từ snapshot 12 cung sort theo `startAge`. 12) `buildYearlyChips` cho đại vận `31-40` + birthYear 1990 = 10 năm 2021–2030. 13) `buildMonthlyChips` từ frame có `monthly` = 12 chip; thiếu `monthly` = 12 chip placeholder. 14) `buildDailyChips` cho `2026-06` = 30 chip; cho `2026-02` = 28 chip (non-leap). 15) `computeDefaultDecadalIndex` chọn đại vận chứa tuổi nominal hiện tại. 16) `computeDefaultDecadalIndex` trả `null` khi snapshot thiếu `decadalRange` ở mọi cung. 17–24) `selection → overlay`: 8 case combinations (mỗi tầng on/off với 4 frame có/không có data, kiểm 4 palaceIndex đúng). 25) `translateZiweiKey` throw cho key lạ → chip secondary fallback "—" + `console.warn` 1 lần (lock fail-fast invariant). |
| Integration | 1) `createHoroscopeQuery` queryKey thay đổi khi `asOf` đổi → refetch. 2) `staleTime: Infinity` → cùng `asOf` 2 lần → 1 fetch. 3) `enabled = false` khi chưa có token → không fire. 4) `enabled = false` khi `asOf = null` → không fire. 5) Lỗi `RATE_LIMITED` từ fetch → `query.error` nắm `ApiError` đúng kind. |
| E2E | 1) Mở `/charts/<znChartId>` (Tử Vi) → panel render với 10 chip đại vận, đại vận chứa năm hiện tại có `aria-pressed=true`. 2) Click chip đại vận index khác → vùng lưu niên render 12 chip trong 2s. 3) Vùng lưu nguyệt + lưu nhật vẫn ẩn. 4) Click 1 chip lưu niên → vùng lưu nguyệt render 12 chip. 5) Click 1 chip lưu nguyệt → vùng lưu nhật render 28–31 chip. 6) Click 1 chip lưu nhật → bàn có 4 ô khác nhau với 4 outline màu (`.cell.in-decadal/.in-yearly/.in-monthly/.in-daily`). 7) Click LẠI chip lưu niên đang chọn → toggle off → vùng lưu nguyệt + lưu nhật ẩn lại; outline yearly/monthly/daily biến mất; outline decadal còn. 8) Đổi route sang lá số khác (`/charts/<otherId>`) → panel reset hoàn toàn (`{#key chartId}` đã có ở US-006). |
| Platform | 1) `pnpm -F @ziweiai/web check` 0 lỗi/0 cảnh báo. 2) `pnpm -F @ziweiai/web test` xanh. 3) `pnpm lint` xanh (`--max-warnings=0`). 4) `pnpm -F @ziweiai/web build` xanh; bundle stats không thấy `iztro`/`lunar-javascript`/`@ziweiai/core`. 5) `no-han-characters.test.ts` count = 0 trên `apps/web/build/`. 6) ESLint `no-restricted-imports` chặn import `@ziweiai/core` thử thêm trong helper mới (negative test thủ công). |
| Performance | 1) Lướt qua 10 chip đại vận trong 2s → tối đa 1 fetch yearly đang pending (chip click cuối cùng). 2) Cache `staleTime: Infinity` → click qua-lại 2 chip lưu niên cũ = 0 fetch lặp. 3) Bundle delta gzipped < 8 KB so với pre-US-015 (panel + helper thuần, không kéo lib mới). |
| Logs/Audit | 1) `apps/api` log `chart_horoscope.requested` với `asOf` đúng cho mỗi tầng (đã có từ US-014). 2) Web log `console.warn('[horoscope-panel] frame missing scope', ...)` 1 lần khi response thiếu scope đã yêu cầu (không throw). 3) Không log `selection` PII-shaped ra server. |

## Fixtures

- **Chart Tử Vi cố định:** sinh 1990-06-15 12:00 Hà Nội, nam, lịch dương → snapshot
  có 12 cung đầy đủ `decadalRange` (`6-15`, `16-25`, ..., `96-105`) + tên cung
  Việt qua `translateZiweiKey`. Reuse fixture đã có ở `palace-view-builder.test.ts`
  / `chart-detail-model` test (US-006). Nếu chưa đủ shape → bổ sung
  `tests/fixtures/charts/zwds-1990-06-15.json`.
- **Frame fixtures:** 4 file JSON ở `tests/fixtures/horoscope/`:
  - `frame-yearly-2026.json` — `decadal + yearly` cho `asOf=2026-06-15`.
  - `frame-monthly-2026-06.json` — `decadal + yearly + monthly` cho `2026-06-15`.
  - `frame-daily-2026-06-15.json` — full 4 tầng cho `2026-06-15`.
  - `frame-empty-yearly.json` — response thiếu `monthly`/`daily` (test placeholder).
- **User fixture:** Bearer cho seed user đã có; reuse pattern E2E US-009/US-011.
- **today freeze:** test E2E set system clock qua Playwright `page.clock.install({
  now: new Date('2026-06-17') })` để default decadal index deterministic.

## Commands

```text
# Unit + integration (Vitest)
pnpm -F @ziweiai/web test -- horoscope-selection.test.ts
pnpm -F @ziweiai/web test -- horoscope-chips.test.ts
pnpm -F @ziweiai/web test -- horoscope-overlay.test.ts
pnpm -F @ziweiai/web test -- horoscope-default-decadal.test.ts
pnpm -F @ziweiai/web test -- horoscope-query.test.ts

# Type check + svelte-check
pnpm -F @ziweiai/web check

# Lint + boundary check
pnpm lint

# Build SPA + CJK guard
pnpm -F @ziweiai/web build
pnpm -F @ziweiai/web test -- no-han-characters.test.ts

# E2E
pnpm -F @ziweiai/web test:e2e -- us-015-ziwei-horoscope-panel.spec.ts

# Harness update (chỉ sau khi tất cả ở trên xanh)
scripts/bin/harness-cli.exe story verify US-015
scripts/bin/harness-cli.exe story update --id US-015 --unit 1 --integration 1 --e2e 1 --platform 1
scripts/bin/harness-cli.exe trace \
  --intake <N> --story US-015 \
  --summary "Panel vận hạn 4 tầng + overlay highlight đa màu, port từ taibu" \
  --outcome completed --agent claude \
  --actions "added-helpers; added-component; e2e-pass" \
  --read "ZiweiHoroscopePanel.tsx,palace-view-builder.ts,api-client/index.ts" \
  --changed "horoscope-*.ts,ZiweiHoroscopePanel.svelte,PalaceGrid.svelte,PalaceCell.svelte,vi.ts,tokens.css" \
  --friction "<nếu có>"
```

## Acceptance Evidence

(điền sau khi verification xong)

- Unit: ≥ 30 case xanh (file path + count).
- Integration: ≥ 5 case xanh.
- E2E: 1 file 8 step xanh (link CI run).
- Platform: lint + check + build xanh; bundle delta gzipped đo được.
- Logs: snippet `apps/api` log `chart_horoscope.requested` cho 4 tầng.
- CJK: count = 0 sau build.
- Harness: trace ID + matrix snapshot.
