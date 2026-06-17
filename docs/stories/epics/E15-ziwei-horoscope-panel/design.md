# Design

## Domain Model

### `HoroscopeSelection` (state thuần)

Object 4 trường, mọi trường optional (`undefined` = "chưa chọn ở tầng đó"):

```ts
export interface HoroscopeSelection {
  /** Index cung Mệnh đại vận đang chọn (0..11). undefined = chưa chọn (panel rỗng). */
  decadalIndex?: number;
  /** Năm dương đang chọn (vd 2026). undefined = chưa chọn lưu niên → ẩn vùng dưới. */
  yearlyYear?: number;
  /** Tháng âm đang chọn (1..12). undefined = chưa chọn lưu nguyệt → ẩn vùng dưới. */
  monthlyMonth?: number;
  /** Ngày dương đang chọn (1..31). undefined = chưa chọn lưu nhật. */
  dailyDay?: number;
}
```

**Invariant ràng buộc reducer phải giữ:**

- `yearlyYear !== undefined` ⇒ `decadalIndex !== undefined` (lưu niên thuộc 1 đại vận).
- `monthlyMonth !== undefined` ⇒ `yearlyYear !== undefined`.
- `dailyDay !== undefined` ⇒ `monthlyMonth !== undefined`.
- Đổi `decadalIndex` ⇒ reset `yearlyYear`, `monthlyMonth`, `dailyDay` về `undefined`.
- Đổi `yearlyYear` ⇒ reset `monthlyMonth`, `dailyDay`. Tương tự cho `monthlyMonth`.

### `HoroscopeOverlay` (overlay highlight cho `PalaceGrid`)

Tách biệt hoàn toàn với `inAspect` của US-011 (hai overlay sống chung):

```ts
export interface HoroscopeOverlay {
  /** Index cung Mệnh đại vận (0..11) hoặc null (chưa chọn). */
  decadalPalaceIndex: number | null;
  /** Index cung Mệnh lưu niên hoặc null. */
  yearlyPalaceIndex: number | null;
  /** Index cung Mệnh lưu nguyệt hoặc null. */
  monthlyPalaceIndex: number | null;
  /** Index cung Mệnh lưu nhật hoặc null. */
  dailyPalaceIndex: number | null;
}
```

`PalaceCell.svelte` nhận thêm 4 prop boolean tổng hợp từ overlay
(`isInDecadal`/`isInYearly`/`isInMonthly`/`isInDaily`); nhiều tầng cùng trỏ về 1
cung ⇒ component cộng nhiều class CSS (4 viền chồng qua `outline` + `box-shadow`,
KHÔNG ghi đè `border` của `inAspect`).

### `HoroscopeChip` (mỗi chip trong 4 vùng)

```ts
export interface HoroscopeChip {
  /** Khoá ổn định cho `{#each}` Svelte. */
  key: string;
  /** Nhãn chính tiếng Việt (vd "Mệnh", "2026", "Tháng 6", "15"). */
  primary: string;
  /** Nhãn phụ (can-chi đã dịch + tuổi nominal nếu có). */
  secondary: string;
  /** Có đang được chọn ở tầng đó không. */
  selected: boolean;
}
```

## Application Flow

### State + reducer thuần (Svelte 5 runes)

`apps/web/src/lib/features/chart/horoscope-selection.svelte.ts` xuất
`createHoroscopeSelection(opts)` — factory runes thuần (test được mà không cần
QueryClient context, đúng pattern `createPalaceSelection` của US-006):

```ts
export function createHoroscopeSelection(opts: { defaultDecadalIndex: () => number | null }) {
  let selection = $state<HoroscopeSelection>({});

  function selectDecadal(index: number): void {
    if (selection.decadalIndex === index) {
      selection = {}; // toggle off
      return;
    }
    selection = { decadalIndex: index };
  }
  function selectYearly(year: number): void { /* idem, giữ decadal, reset 2 dưới */ }
  function selectMonthly(month: number): void { /* idem */ }
  function selectDaily(day: number): void { /* idem */ }

  return {
    get value(): HoroscopeSelection { return selection; },
    selectDecadal, selectYearly, selectMonthly, selectDaily,
  };
}
```

Default: getter `defaultDecadalIndex` đọc reactive đại vận chứa năm hiện tại từ
`snapshot.palaces` (so sánh `decadalRange` "31-40" với tuổi nominal hiện tại). Khi
component mount, gọi `selectDecadal(defaultDecadalIndex())` đúng 1 lần qua
`$effect.pre` (chỉ khi snapshot có Mệnh + tuổi xác định); không có ⇒ giữ `{}`.

### Compute danh sách chip

`apps/web/src/lib/features/chart/horoscope-chips.ts` (helper thuần):

- `buildDecadalChips(palaces)` → 10 chip từ `snapshot.palaces[*].decadalRange + ages`,
  sort theo `startAge`. Nguồn KHÔNG cần gọi engine.
- `buildYearlyChips(decadalChip, birthYear, horoscopeFrame)` → khi đại vận đã chọn,
  đẩy lần lượt 12 năm; mỗi năm gắn `yearly` lấy từ `horoscopeFrame` (đã fetch
  trước; nếu thiếu năm cụ thể → chip để "—" + disabled cho tới khi data tới).
- `buildMonthlyChips(yearlyHoroscopeFrame)` → 12 chip tháng âm của lưu niên.
- `buildDailyChips(monthlyHoroscopeFrame, year, month)` → 28–31 chip dựa
  `new Date(year, month, 0).getDate()` và `daily` từ frame.

### Fetch flow (TanStack Query)

`apps/web/src/lib/features/chart/horoscope-query.ts`:

```ts
export function createHoroscopeQuery(opts: {
  auth: AuthStore;
  getChartId: () => string;
  getAsOf: () => string | null;          // ISO date 'YYYY-MM-DD' hoặc null = bỏ qua
  getScopes: () => HoroscopeScope[];     // ['decadal','yearly','monthly','daily'] subset
}) {
  return createQuery(() => ({
    queryKey: ['horoscope', opts.getChartId(), opts.getAsOf(), opts.getScopes().join(',')],
    queryFn: () => {
      const token = opts.auth.getAccessToken();
      const asOf = opts.getAsOf();
      if (!token || !asOf) throw new Error(viCopy.errors.missingChartContext);
      return fetchChartHoroscope(token, opts.getChartId(), { asOf, scopes: opts.getScopes() });
    },
    enabled: opts.auth.isAuthenticated && !!opts.auth.getAccessToken()
      && opts.getChartId().length > 0 && !!opts.getAsOf(),
    staleTime: Infinity, // deterministic theo (chartId, asOf)
    gcTime: 5 * 60 * 1000,
  }));
}
```

`ZiweiHoroscopePanel.svelte` tạo 3 instance query: `yearlyQuery`, `monthlyQuery`,
`dailyQuery` — mỗi instance có `getAsOf()` derive từ `selection`:

- `yearlyQuery.asOf = ${year}-06-15` khi `selection.yearlyYear` set, scopes =
  `['yearly']`.
- `monthlyQuery.asOf = ${year}-${month}-15` khi `selection.monthlyMonth` set,
  scopes = `['monthly']`.
- `dailyQuery.asOf = ${year}-${month}-${day}` khi `selection.dailyDay` set, scopes
  = `['daily']`.

Đại vận KHÔNG cần query: dữ liệu nằm sẵn trong `snapshot.palaces[*].decadalRange`
(US-006 đã đưa vào snapshot bản mệnh).

**Tối ưu cost:** chip lưu niên cần 12 mốc — KHÔNG gọi 12 call. Story này gộp một
call duy nhất với scope `['yearly']` cho mốc giữa đại vận (vd `${midYear}-06-15`)
chỉ để lấy can-chi 1 năm hiển thị; 11 năm còn lại render placeholder "—" và FETCH
LAZY khi user click chip đó (mới có asOf cụ thể). Đây là tradeoff đã ghi trong
`0011`: panel chấp nhận latency cho từng chip thay vì 12 round-trip prefetch.

> **Stop condition:** nếu trong quá trình implement phát hiện endpoint US-014 trả
> kèm danh sách `yearlyChips` / `monthlyChips` / `dailyChips` (12/12/N) trong 1 call
> ⇒ DỪNG, ghi backlog: contract đã đủ → bỏ pattern lazy chip + cập nhật story.
> KHÔNG tự thêm endpoint hay thêm field contract trong story này.

### Reactive flow trong component

```text
[Snapshot bản mệnh đã có (US-006)]
        ↓
[createHoroscopeSelection.defaultDecadalIndex] ← computeDefaultDecadalIndex(snapshot, today)
        ↓ ($effect.pre 1 lần khi snapshot lần đầu sẵn sàng)
[selection.decadalIndex = mặc định]
        ↓ (user click chip)
[selectYearly(year)] → reset {monthly, daily}
        ↓ ($derived asOf từ selection)
[yearlyQuery.queryKey thay đổi → refetch]
        ↓ (data về)
[buildMonthlyChips(yearlyFrame)]
        ↓
... (lặp lại cho monthly, daily)
        ↓ ($derived overlay từ selection + 4 frame)
[horoscopeOverlay] → truyền vào <PalaceGrid>
```

KHÔNG dùng `$effect` để ghi ngược selection; mọi propagation qua `$derived` (đã
kiểm chứng pattern ở US-006 + US-011).

## Interface Contract

**Tận dụng nguyên contract + endpoint từ US-014, story này KHÔNG mở rộng:**

- `POST /charts/:id/horoscope` (Bearer) — body `{ asOf: 'YYYY-MM-DD', scopes:
  HoroscopeScope[] }`, response `horoscopeFrameSchema` (đã có
  `decadal`/`yearly`/`monthly?`/`daily?`).
- `fetchChartHoroscope(token, chartId, request)` ở
  `apps/web/src/lib/api-client/index.ts` (US-014 đã thêm).
- Web import schema + type duy nhất qua `@ziweiai/contracts`
  (`horoscopeFrameSchema`, `horoscopeRequestSchema`, `HoroscopeScope`).

**Web KHÔNG được thêm contract / endpoint trong story này.** Mọi nhu cầu thay đổi
contract → backlog + decision riêng.

### Lỗi từ endpoint (đã có trong US-014)

| Mã | Khi nào | UI hành xử |
| --- | --- | --- |
| `UNAUTHORIZED` (401) | Token thiếu/hết hạn | redirect sign-in (đã có trong layout (app)) |
| `FORBIDDEN` (403) | chart không thuộc user/anon-session | banner `viCopy.errors.notFound` |
| `NOT_FOUND` (404) | chartId không tồn tại | banner `viCopy.errors.notFound` |
| `RATE_LIMITED` (429) | sliding-window quota | banner `viCopy.errors.rateLimit` (đã có) |

Mọi response đi qua `chartHoroscopeResponseSchema.parse` của contracts (do US-014
đã đặt) — sai shape ⇒ throw, không silent. Component bắt qua `query.error` →
banner.

## Data Model

KHÔNG có thay đổi schema DB / migration ở story này. Engine vận hạn chạy on-demand
ở `apps/api` (không cache DB; quyết định cache là decision riêng theo `0011`).

## UI / Platform Impact

### Layout

Trang `/charts/[chartId]` (Tử Vi):

- Mobile (≤768px): panel xếp DƯỚI bàn 12 cung (stacked), cuộn dọc bình thường.
  Mỗi vùng (đại vận / lưu niên / lưu nguyệt / lưu nhật) có thanh cuộn ngang riêng
  (chip strip). Tap chip = `select*`.
- Desktop (>768px): panel cố định bên PHẢI bàn (split 60/40 hoặc 7/5). Bàn vẫn co
  giãn theo cột bên trái; panel cuộn dọc nội bộ khi 4 vùng vượt chiều cao.

### Component hierarchy

```text
ChartDetailScreen.svelte
├── PalaceGrid            (US-008/011 + new prop horoscopeOverlay)
│   └── PalaceCell        (US-008/011 + 4 class .in-decadal .in-yearly .in-monthly .in-daily)
└── ZiweiHoroscopePanel  (mới ở story này)
    ├── HoroscopeSection (label vùng + chip strip + scroll-x)
    │   └── HoroscopeChip (button + nhãn primary/secondary)
```

`HoroscopeSection` + `HoroscopeChip` là primitives nội bộ panel, KHÔNG export ra
`components/ui/` (chỉ dùng ở 1 chỗ). Tách file để test render được.

### Style cho overlay vận hạn (khác `inAspect`)

`PalaceCell.svelte` thêm 4 class:

```css
.cell.in-decadal { outline: 2px solid var(--color-horoscope-decadal); outline-offset: 2px; }
.cell.in-yearly  { outline: 2px solid var(--color-horoscope-yearly);  outline-offset: 5px; }
.cell.in-monthly { outline: 2px solid var(--color-horoscope-monthly); outline-offset: 8px; }
.cell.in-daily   { outline: 2px solid var(--color-horoscope-daily);   outline-offset: 11px; }
```

`outline-offset` chồng → 4 viền song song quanh ô khi nhiều tầng cùng trỏ về (rất
hiếm nhưng phải xử). Token màu thêm vào `apps/web/src/lib/theme/tokens.css`:

```css
--color-horoscope-decadal: hsl(45 92% 55%);   /* vàng */
--color-horoscope-yearly:  hsl(180 60% 45%);  /* xanh teal */
--color-horoscope-monthly: hsl(280 55% 55%);  /* tím */
--color-horoscope-daily:   hsl(330 75% 60%);  /* hồng */
```

Đảm bảo contrast AA trên `--color-bg-surface`. KHÔNG đụng
`--color-accent-gold-soft` của US-011 (lớp `inAspect` giữ nguyên).

### i18n

Bổ sung `apps/web/src/lib/i18n/vi.ts → viCopy.horoscope`:

```ts
horoscope: {
  panelTitle: 'Vận hạn',
  decadal: { title: 'Đại vận (10 năm)', ageSuffix: 'tuổi' },
  yearly:  { title: 'Lưu niên', emptyHint: 'Chọn đại vận để xem lưu niên.' },
  monthly: { title: 'Lưu nguyệt', emptyHint: 'Chọn lưu niên để xem lưu nguyệt.' },
  daily:   { title: 'Lưu nhật',   emptyHint: 'Chọn lưu nguyệt để xem lưu nhật.' },
  monthFormat: 'Tháng {month}',
  loading: 'Đang tính vận hạn...',
  error: 'Không tải được vận hạn. Hãy thử lại.',
}
```

Tên cung Mệnh vận của mỗi tầng (chip secondary) lấy từ
`horoscopeItem.palaceNameKeys[0]` qua `translateZiweiKey` — fail-fast nếu key lạ.

### Server boundary

KHÔNG import `@ziweiai/core`/`iztro`/`lunar-javascript`. Mọi tính toán đi qua
`fetchChartHoroscope`. Helper `computeDefaultDecadalIndex(snapshot, today)` thuần
TS — đọc `decadalRange` ("31-40") + `birthYear` từ snapshot → tính tuổi nominal
hiện tại → chọn đại vận chứa tuổi đó. KHÔNG gọi engine.

## Observability

- Mỗi lần fetch panel → log `info` ở `apps/api` (đã có sẵn từ US-014):
  `chart_horoscope.requested chartId=... asOf=... scopes=...`.
- Web log `console.warn('[horoscope-panel] frame missing scope', { asOf, scope })`
  khi response thiếu scope đã yêu cầu (không throw, hiển thị chip placeholder).
- Tracking analytics (nếu có): `horoscope_panel_layer_selected` với
  `{ layer: 'decadal'|'yearly'|'monthly'|'daily' }`. Không bắt buộc cho story này;
  để open-question.

Không log nội dung `selection` ra server (PII không có, nhưng giữ thói quen).

## Alternatives Considered

1. **Tự tính vận hạn ở web bằng helper thuần** — vi phạm `0007-web-server-boundary`
   + iztro kéo Han + bundle nặng. ESLint chặn. Loại (đã ghi trong `0011`).
2. **1 call API gộp 4 tầng cho mọi mốc khả dĩ** — phình response, đa số chip không
   bao giờ được click. Lazy load theo tầng (story này) tiết kiệm > 90% byte.
3. **Dùng `$effect` để propagate selection → fetch** — vi phạm reactive flow của
   US-006 (KHÔNG ghi ngược state qua effect). Dùng `$derived` + `createQuery`
   queryKey reactive là đường chuẩn dự án.
4. **Gộp `selection` + 4 chip list thành 1 store global** — quá tải; mỗi
   `ChartDetailScreen` đã `{#key chartId}`-remount (US-006), state cục bộ là đủ
   và đơn giản hơn (đúng pattern `createPalaceSelection`).
