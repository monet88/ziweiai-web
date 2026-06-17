# Design

## Domain Model

### `HoroscopeFrame` (server-tính, web-tiêu thụ)

`horoscopeFrameSchema` ở `packages/contracts/src/horoscope/horoscope-frame.ts`:

```text
HoroscopeFrame {
  decadal:  HoroscopeItem    // Đại vận (10 năm)
  age:      HoroscopeAgeItem // Tuổi nominal khớp đại vận
  yearly:   HoroscopeItem    // Lưu niên (năm dương)
  monthly?: HoroscopeItem    // Lưu nguyệt (tháng âm) — optional
  daily?:   HoroscopeItem    // Lưu nhật (ngày âm) — optional
}
```

Reuse nguyên `horoscopeItemSchema` + `horoscopeAgeItemSchema` đã có trong
`chart-snapshot.ts` (l. 475–486) — KHÔNG redefine. Giá trị mỗi item:

```text
HoroscopeItem {
  index: 0..11               // index của cung Mệnh tầng đó trên vòng cung
  heavenlyStemKey: ChartKey  // can-Việt qua translateZiweiKey
  earthlyBranchKey: ChartKey // chi-Việt qua translateZiweiKey
  palaceNameKeys: ChartKey[] // 12 cung tầng đó (chiều quay theo iztro)
  mutagenStarKeys: ChartKey[]// 4 sao tứ hóa của tầng đó
}
```

### `PalaceFlowView` (web build, presentational)

```text
PalaceFlowView {
  decadal?: { stemBranch: string; agesRange: string | null }
  yearly?:  { stemBranch: string }
  monthly?: { stemBranch: string }
  daily?:   { stemBranch: string }
}
```

Helper thuần `buildPalaceFlowFlags(palaceIndex, frame)` — `() => PalaceFlowView`:

- Nếu `palaceIndex === frame.decadal.index` → set `decadal`.
- Nếu `palaceIndex === frame.yearly.index` → set `yearly`.
- Nếu `palaceIndex === frame.monthly?.index` → set `monthly`.
- Nếu `palaceIndex === frame.daily?.index` → set `daily`.
- Tất cả `stemBranch` đi qua `translateZiweiKey` (fail-fast). Snapshot legacy
  thiếu key → throw → web bắt + degrade thành "Thuật ngữ cũ" theo guard CJK đã
  có (giữ pattern US-006).
- `agesRange`: lấy từ `palace.decadalRange` đã có sẵn trong `PalaceView`
  (US-008) → `"24–33"`. Decoupling: helper KHÔNG đọc lại `palace.ages`, KHÔNG
  fetch.

### `HighlightTier` enum

`'decadal' | 'yearly' | 'monthly' | 'daily'` — dùng làm key cho cả CSS variable
và indicator bar. Ánh xạ màu thuần ở `tokens.css`:

```text
--color-flow-decadal: tím
--color-flow-yearly:  xanh dương
--color-flow-monthly: xanh lá
--color-flow-daily:   cam
```

## Application Flow

### 1. Client (apps/web)

```text
ChartDetailScreen
  └─> PalaceGrid
        ├─ createQuery(['horoscope', chartId, asOf], () =>
        │    fetchChartHoroscope(token, chartId, asOf, ['decadal','yearly','monthly','daily'])
        │  ) — staleTime: 1 hour, gcTime: 24 hours
        │
        ├─ const flagsByIndex = $derived.by(() => {
        │    if (!query.data) return new Map()
        │    return buildPalaceFlowFlagsMap(palaces, query.data.frame)
        │  })
        │
        └─ <PalaceCell flowFlags={flagsByIndex.get(palace.index)} ... />
```

Token đọc tươi từ auth store (đúng pattern US-002 / US-006). `asOf` mặc định là
`new Date().toISOString().slice(0, 10)` (ngày Việt Nam — chấp nhận skew múi giờ
±1 ngày, đủ cho Phase 1).

Loading: `flagsByIndex = new Map()` → bàn render hệt trước US-014 (không hồi
quy). Lỗi: log + giữ map rỗng (không toast — flow-info chỉ là tăng cường
trực quan, decision này được ghi trong PR description).

### 2. Server (apps/api)

```text
POST /charts/:id/horoscope
  └─> ChartsController.computeHoroscope
        ├─ guard SupabaseAuthGuard (Bearer)
        ├─ parse body via horoscopeRequestSchema
        ├─ ChartsService.computeHoroscope(userId, chartId, asOf, scopes)
        │     ├─ load chart (404 nếu không sở hữu — không lộ tồn tại)
        │     ├─ assert chartSystem === 'zi-wei-dou-shu' (400 nếu khác)
        │     ├─ assertCanCreateChart(userId, ip)  // quota cùng key, KHÔNG đụng AI
        │     ├─ const frame = await computeZiweiHoroscope({
        │     │     snapshot: chart.snapshot,
        │     │     asOf,
        │     │     scopes,
        │     │   })  // engine ở @ziweiai/core (port từ taibu)
        │     └─ return { chartId, asOf, frame }
        └─ horoscopeResponseSchema.parse(...) → 200 JSON
```

`computeZiweiHoroscope` cư trú ở `@ziweiai/core`, gọi `iztro` y hệt taibu
`packages/core/src/domains/ziwei-horoscope/calculate.ts`. Output **đã ánh xạ
sang ChartKey** (slug ASCII, không Hán) trước khi parse — engine không bao giờ
trả Hán cho contract.

## Interface Contract

### Endpoint mới: `POST /charts/:id/horoscope`

Bearer auth. Body:

```jsonc
{
  "asOf": "2026-06-17",                                     // ISO date YYYY-MM-DD
  "scopes": ["decadal", "yearly", "monthly", "daily"]       // tối thiểu ['decadal','yearly']
}
```

Schema `horoscopeRequestSchema` ở
`packages/contracts/src/horoscope/horoscope-request.ts`:

```text
horoscopeRequestSchema = z.object({
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scopes: z.array(z.enum(['decadal','yearly','monthly','daily']))
            .nonempty()
            .refine(arr => arr.includes('decadal') && arr.includes('yearly')),
})
```

Response `horoscopeResponseSchema` ở
`packages/contracts/src/horoscope/horoscope-response.ts`:

```text
horoscopeResponseSchema = z.object({
  chartId: z.uuid(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  frame: horoscopeFrameSchema,
})
```

Lỗi (đều dùng `apiErrorSchema` đã có):

| HTTP | code | Khi |
|---|---|---|
| 400 | `INVALID_INPUT` | body không khớp schema / chartSystem không phải `zi-wei-dou-shu` / `asOf` ngoài phạm vi 1900–2100 |
| 401 | `UNAUTHORIZED` | thiếu/invalid Bearer |
| 404 | `NOT_FOUND` | chartId không tồn tại HOẶC userId không sở hữu |
| 429 | `RATE_LIMITED` | quota `assertCanCreateChart` đã hết |
| 500 | `INTERNAL_ERROR` | engine throw (lá số snapshot vỡ schema) |

Endpoint **KHÔNG** chấp nhận GET (mặc dù idempotent) vì body có array `scopes` —
giữ POST để dễ mở rộng và hợp pattern `POST /charts`. Cache phía web qua
TanStack Query (key bao gồm `chartId + asOf + scopes` đã sort ổn định).

### Web flat-function

```text
fetchChartHoroscope(
  token: string,
  chartId: string,
  asOf: string,
  scopes: HoroscopeScope[],
): Promise<HoroscopeResponse>
```

Trong `apps/web/src/lib/api-client/index.ts` — port flat-function pattern hiện
có (US-001 / US-005 / US-006). KHÔNG tạo class, KHÔNG nest `apiClient.charts.*`.

### Hằng web

```text
DEFAULT_HOROSCOPE_SCOPES = ['decadal','yearly','monthly','daily'] as const
HOROSCOPE_QUERY_STALE_MS = 60 * 60 * 1000   // 1 hour
HOROSCOPE_QUERY_GC_MS    = 24 * 60 * 60 * 1000
```

## Data Model

KHÔNG đổi DB. KHÔNG migration mới.

`computeZiweiHoroscope` chạy thuần in-memory từ `chart.snapshot` (đã lưu sẵn ở
bảng `chart_snapshots`). Bảng `quota_*` (US-013) reuse y nguyên: chỉ tăng count
ở key `assertCanCreateChart` chung.

Nếu sau này cần cache (US-016 báo cáo năm) → decision riêng + bảng riêng
(`horoscope_cache(chart_id, as_of, frame jsonb, expires_at)`); KHÔNG bao gồm
trong US-014.

## UI / Platform Impact

### `apps/web/src/lib/features/chart/PalaceCell.svelte`

- Prop mới optional:
  ```ts
  interface Props {
    // ...existing...
    flowFlags?: PalaceFlowView | null
  }
  ```
- Khi `flowFlags` có ≥ 1 tầng:
  - Render `<div class="flow-bar" aria-hidden="true">` ở mép trên — chia đều
    theo số tầng đang có, mỗi mảnh nền `var(--color-flow-{tier})`.
  - Render `<footer class="flow-info">` thay (hoặc bổ sung dưới) `cell-foot`
    hiện có. 4 chip với class `flow-chip flow-chip--{tier}`. Nội dung chip:
    `<span>Vận|Niên|Nguyệt|Nhật</span><span>{stemBranch}</span>`. Decadal kèm
    `agesRange` cuối hàng (vd. `24–33`).
- Class hợp với US-008 (selected) / US-011 (in-aspect / dimmed) / US-012
  (star-color): KHÔNG xung đột vì lớp flow nằm ở mép trên + footer riêng. Mọi
  ưu tiên màu khung: `selected` > `in-aspect` > `flow` (chỉ chỉ báo, KHÔNG đổi
  border) > default.

### `apps/web/src/lib/features/chart/PalaceGrid.svelte`

- Thêm prop `chartId: string` + `enableFlowInfo?: boolean = true`.
- Trong `<script>`: `createQuery(() => ({ ... }))` đúng pattern Svelte 5 runes
  (decision wrapping function — đã ghi trong CLAUDE.md). Token lấy tươi từ
  `useAuthStore()` ngay trong `queryFn`.
- Build `flagsByIndex: Map<number, PalaceFlowView>` qua `$derived`.
- Truyền `flowFlags={flagsByIndex.get(palace.index) ?? null}` vào `<PalaceCell />`.

### `apps/web/src/lib/theme/tokens.css`

Thêm 8 biến (4 màu × 2 cấp solid/soft) trong block `:root`:

```text
--color-flow-decadal:      oklch(...)  // tím
--color-flow-decadal-soft: oklch(...)
--color-flow-yearly:       oklch(...)  // xanh dương
--color-flow-yearly-soft:  oklch(...)
--color-flow-monthly:      oklch(...)  // xanh lá
--color-flow-monthly-soft: oklch(...)
--color-flow-daily:        oklch(...)  // cam
--color-flow-daily-soft:   oklch(...)
```

Tone soft dùng cho nền chip (10–15% alpha), solid dùng cho thanh chỉ báo + chữ
chip. Contrast vs `--color-bg-surface` ≥ 4.5:1 (giữ AA — đã thiết lập ở US-012).

### Platform / mobile

Bàn 4×4 đã cuộn ngang trên mobile (US-008). Flow-bar 1px cao thêm vào ô không
tăng chiều cao đáng kể (footer có thể wrap khi 4 chip không đủ chỗ). Test 320 /
375 / 768 trong Playwright — đã có `apps/web/tests/e2e/responsive.spec.ts`
fixture; kế thừa.

## Observability

- **API logs (apps/api)**: `ChartsService.computeHoroscope` log
  `{requestId, chartId, asOf, scopes, durationMs}` ở mức `info`; lỗi engine →
  log `{requestId, chartId, asOf, error}` ở mức `error`. KHÔNG log payload
  snapshot (PII năm sinh).
- **Quota log**: reuse log `assertCanCreateChart` đã có (US-009 / US-013).
- **Web telemetry**: Phase 1 không gắn analytics — quan sát qua DevTools /
  TanStack Query Devtools là đủ. Backlog ghi nhận nếu cần Sentry breadcrumb.
- **Audit**: KHÔNG ghi audit DB (endpoint không thay đổi state).

## Alternatives Considered

1. **Tự tính vận hạn ở web bằng helper thuần** — vi phạm
   `0007-web-server-boundary`: `iztro` kéo Han + bundle nặng. ESLint chặn. Loại.
2. **Mở rộng `chartSnapshotSchema` để `POST /charts` trả luôn 4 tầng vận hạn
   theo `asOf = today` mặc định** — phình snapshot, sai semantic (snapshot là
   bất biến theo `inputHash`). Loại trong decision `0011`.
3. **Endpoint riêng cho từng tầng** (`/decadal`, `/yearly`, `/monthly`,
   `/daily`) — 4 round-trip thay vì 1, tăng latency UI. Loại; gộp 1 endpoint
   với `scopes` linh hoạt là DRY hơn.
4. **Cache DB từ Phase 1** — vận hạn deterministic theo `(snapshot, asOf)`,
   nhưng snapshot Tử Vi đã rẻ tính (~50ms iztro). Trì hoãn cache cho đến khi có
   báo cáo năm (US-016, gọi LLM đắt). Loại khỏi US-014.
5. **Giữ flow-info trong `cell-foot` thay vì footer riêng** — code ít hơn nhưng
   gây xung đột visual với `changsheng / decadal / ages` đã có ở footer cũ.
   Loại; tách footer mới `flow-info` để ranh giới rõ.
