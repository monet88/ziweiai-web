# Design

## Domain Model

### Vận theo mốc thời gian (port từ taibu + decision 0011)

- **DailyFortune** = `{ chartId, asOf: 'YYYY-MM-DD', frame: { daily: HoroscopeItem }, summary: string }`.
  Thuần đọc từ engine `computeZiweiHoroscope({ snapshotId, asOf, scopes: ['daily'] })`,
  thêm `summary` text Việt qua template `renderDailyCanonicalText`.
- **MonthlyFortune** = `{ chartId, asOf: 'YYYY-MM', frame: { monthly: HoroscopeItem }, summary: string }`.
  Tương tự daily; engine cho `scopes: ['monthly']`.
- **AnnualReport** = `{ chartId, year, frame: { yearly: HoroscopeItem, monthly: HoroscopeItem[12] }, markdown }`.
  Tương tự nhưng có nhánh LLM ở giữa + cache DB.

### Cache + quota

- **AnnualReportCacheRow** = `{ id, ownerUserId, chartSnapshotId, year, markdown, createdAt }`.
  Unique `(chart_snapshot_id, year)` đảm bảo idempotent — gọi `POST /annual-report`
  cùng chart + year hai lần luôn trả cùng Markdown.
- **AnnualReportDailyCounter** = thêm key `annual-report:${userId}:${utcDay}` vào
  `QuotaCounterStore` (đã có sau US-013) — dùng quota `API_ANNUAL_REPORTS_PER_DAY_PER_USER`
  thay vì quota explanations.

## Application Flow

### `GET /charts/:id/daily?asOf=YYYY-MM-DD`

```
parse(asOf) → ISO date | reject 400
auth(Bearer) → user
chartRecord = persistenceGateway.findChartSnapshotById(user.userId, id) | 404
assertChartSystemIsZiwei(chartRecord) | 400
quotasService.assertCanReadFortune(user, ip)        // chỉ rate-limit per-minute
frame = horoscopeEngine.compute({ snapshot: chartRecord.snapshot, asOf, scopes: ['daily'] })
summary = renderDailyCanonicalText(frame.daily, locale='vi')
return dailyFortuneResponseSchema.parse({ chartId, asOf, frame, summary })
```

### `GET /charts/:id/monthly?asOf=YYYY-MM`

Y hệt daily, `scopes: ['monthly']`, `renderMonthlyCanonicalText`.

### `POST /charts/:id/annual-report?year=YYYY`

```
parse(year) → integer 1900..2100 | reject 400
auth(Bearer) → user
chartRecord = persistenceGateway.findChartSnapshotById(user.userId, id) | 404
assertChartSystemIsZiwei(chartRecord) | 400

// CACHE-HIT BYPASS GATE (decision 0010 cache-hit policy)
cached = annualReportRepository.findByChartAndYear(user.userId, chart.id, year)
if (cached) {
  log("annual-report.cache-hit")
  return annualReportResponseSchema.parse({ chartId, year, frame: rebuildFrame(snapshot, year), markdown: cached.markdown })
}

// ===== GATES (chỉ áp khi sinh mới) =====
assertCanUseAiExplanation()                        // cờ AI_EXPLANATION_FREE_FOR_ALL → 402
assertAnnualReportEnabled()                        // cờ AI_ANNUAL_REPORT_ENABLED → 402 (msg riêng)
quotasService.assertCanCreateAnnualReport(user, ip) // counter store key annual-report:* → 429

frame = horoscopeEngine.compute({ snapshot, asOf: `${year}-06-15`, scopes: ['yearly', 'monthly12'] })
prompt = buildAnnualReportPrompt(snapshot, frame, locale='vi')
markdown = await providerRouter.generateAnnualReport(prompt)   // ép Việt qua EXPLANATION_SYSTEM_PROMPT
row = annualReportRepository.create({ ownerUserId, chartSnapshotId: chart.id, year, markdown })
return annualReportResponseSchema.parse({ chartId, year, frame, markdown: row.markdown })
```

Race: 2 caller cùng POST cùng `(chartId, year)` đồng thời → DB unique conflict ở
`annualReportRepository.create` → catch + đọc lại row đã có → trả Markdown của
worker thắng. Không cần claim phức tạp như `/explanations` vì annual report
không cho retry nhiều lần (mỗi `(chartId, year)` chỉ sinh 1 lần lifetime — không
có failed retain pattern).

## Interface Contract

### Errors (reuse `apiErrorCodeSchema`)

| HTTP | code | Khi nào |
| --- | --- | --- |
| 400 | `INVALID_INPUT` | `asOf` sai format / `year` ngoài 1900..2100 / chart không phải Tử Vi |
| 401 | `UNAUTHORIZED` | thiếu Bearer / token sai |
| 402 | `PAYMENT_REQUIRED` | annual: `AI_EXPLANATION_FREE_FOR_ALL=false` (chưa entitled) HOẶC `AI_ANNUAL_REPORT_ENABLED=false` |
| 404 | `NOT_FOUND` | chartId không thuộc user / không tồn tại |
| 429 | `RATE_LIMITED` | annual: vượt `API_ANNUAL_REPORTS_PER_DAY_PER_USER` |
| 504 | `PROVIDER_TIMEOUT` | annual: provider AI quá hạn (reuse `ProviderTimeoutError`) |
| 502 | `PROVIDER_UNAVAILABLE` | annual: provider AI lỗi |

### Routes

```http
GET  /charts/:id/daily?asOf=2026-06-17       Bearer
GET  /charts/:id/monthly?asOf=2026-06        Bearer
POST /charts/:id/annual-report?year=2026     Bearer
```

### DTO (Zod, `packages/contracts/src/horoscope/`)

```ts
// horoscope-request.ts
export const dailyFortuneRequestSchema = z.object({
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export const monthlyFortuneRequestSchema = z.object({
  asOf: z.string().regex(/^\d{4}-\d{2}$/),
});
export const annualReportRequestSchema = z.object({
  year: z.number().int().min(1900).max(2100),
});

// horoscope-response.ts
export const dailyFortuneResponseSchema = z.object({
  chartId: z.string().uuid(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  frame: horoscopeFrameSchema,        // chỉ field `daily` tồn tại
  summary: z.string().min(1),
});
export const monthlyFortuneResponseSchema = z.object({
  chartId: z.string().uuid(),
  asOf: z.string().regex(/^\d{4}-\d{2}$/),
  frame: horoscopeFrameSchema,        // chỉ field `monthly` tồn tại
  summary: z.string().min(1),
});
export const annualReportResponseSchema = z.object({
  chartId: z.string().uuid(),
  year: z.number().int(),
  frame: horoscopeFrameSchema,        // yearly + monthly[12]
  markdown: z.string().min(1),
});
```

`horoscopeFrameSchema` đến từ contract chung do US-014 + decision `0011` mở.

## Data Model

### Migration `apps/api/supabase/migrations/000004_annual-reports.up.sql`

```sql
create table if not exists public.annual_reports (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  chart_snapshot_id uuid not null references public.chart_snapshots(id) on delete cascade,
  year integer not null check (year between 1900 and 2100),
  markdown text not null,
  provider_metadata jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists annual_reports_chart_year_idx
  on public.annual_reports (chart_snapshot_id, year);
create index if not exists annual_reports_owner_created_idx
  on public.annual_reports (owner_user_id, created_at desc);

alter table public.annual_reports enable row level security;
create policy "annual_reports_owner_only"
  on public.annual_reports
  for all
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);
```

Rollback (`000004_annual-reports.down.sql`):

```sql
drop policy if exists "annual_reports_owner_only" on public.annual_reports;
drop index if exists annual_reports_owner_created_idx;
drop index if exists annual_reports_chart_year_idx;
drop table if exists public.annual_reports;
```

Daily/Monthly KHÔNG có bảng cache (tính lại mỗi request — engine deterministic +
rẻ).

### Retention

Annual report sống vĩnh viễn theo lifecycle của chart_snapshot (cascade delete).
Không có TTL. Decision riêng nếu muốn cap dung lượng (ví dụ giữ 5 năm gần nhất /
user) — chưa cấp thiết.

## UI / Platform Impact

### `apps/web/src/lib/features/fortune/`

```
fortune/
  api.ts                    // re-export 3 hàm api-client + zod parse helper
  DailyFortuneCard.svelte   // card hiển thị ở chart-detail; props: chartId
  MonthlyFortuneCard.svelte // card hiển thị ở chart-detail; props: chartId
  AnnualReportButton.svelte // nút + modal markdown; reuse paywall component US-010
  AnnualReportModal.svelte  // modal trình bày Markdown; loading + error states
  fortune.test.ts           // unit test render summary + paywall fallback
```

- 3 component dùng TanStack Query (`createQuery` Svelte 5):
  - `['fortune', 'daily', chartId, asOf]` — staleTime 1 giờ.
  - `['fortune', 'monthly', chartId, asOf]` — staleTime 6 giờ.
  - `['fortune', 'annual', chartId, year]` — staleTime 24 giờ + cache TanStack
    "off" (chỉ refetch khi user bấm lại).
- `AnnualReportButton.svelte`:
  - Bấm → `createMutation` gọi `createAnnualReport(token, { chartId, year })`.
  - `onError` → nếu `code='PAYMENT_REQUIRED'` thì set state `paywall='entitlement' | 'feature-locked'`
    (phân biệt theo message hoặc thêm field `details.reason` ở contract — story
    này: phân biệt qua message; decision sau nếu cần field cứng).
  - `onSuccess` → invalidate `['fortune', 'annual', chartId, year]` rồi mở modal.
- I18n vi tại `apps/web/src/lib/i18n/vi/fortune.ts` (file mới):
  ```ts
  export const fortuneCopy = {
    daily: { title: 'Vận hôm nay', empty: 'Chưa có dữ liệu vận ngày.' },
    monthly: { title: 'Vận tháng này', empty: 'Chưa có dữ liệu vận tháng.' },
    annual: {
      title: 'Báo cáo năm',
      generateCta: 'Tạo báo cáo năm',
      featureLockedBeta: 'Báo cáo năm AI tạm khoá ở giai đoạn beta. Vui lòng quay lại sau.',
      paywallTitle: 'Báo cáo năm yêu cầu gói trả phí',
      paywallBody: 'Tính năng tổng hợp 12 lưu nguyệt + xu hướng cả năm thuộc gói trả phí.',
      quotaExceeded: 'Bạn đã tạo đủ số báo cáo năm trong ngày hôm nay.',
    },
  };
  ```

### Module mới `apps/api/src/modules/fortune/`

```
fortune/
  fortune.module.ts
  fortune.controller.ts        // 3 route + ParseUUIDPipe + parse query
  services/
    daily-fortune.service.ts
    monthly-fortune.service.ts
    annual-report.service.ts   // gate AI + quota + cache + provider call
    horoscope-engine.adapter.ts // wrap @ziweiai/astro-engine compute
    annual-report.repository.ts // CRUD bảng annual_reports
  dto/
    daily-query.dto.ts
    monthly-query.dto.ts
    annual-report-query.dto.ts
```

`ExplanationsService.assertCanUseAiExplanation` được **trích ra** module chung
`apps/api/src/common/entitlement/ai-entitlement.guard.ts` để cả `ExplanationsService`
+ `AnnualReportService` cùng dùng (không copy logic). Decision 0010 không cần
update vì bản chất gate là cùng cờ.

## Observability

- Log mỗi request: `[fortune.daily] chartId=… asOf=… userId=…`,
  `[fortune.monthly] …`, `[fortune.annual] chartId=… year=… outcome=cache-hit|generated`.
- Annual cache-hit → log warn-info (không cần warn level).
- Annual sinh mới → log thêm `providerName + tokensIn + tokensOut` (đã có pattern
  ở provider router).
- 402 do `AI_ANNUAL_REPORT_ENABLED=false` log warn duy nhất 1 lần / request: cảnh
  báo flag đang ép khoá.
- 429 quota annual log warn riêng để ops thấy ai spam.

## Alternatives Considered

1. **Trả vận ngày kèm trong `/charts/:id` mặc định** — phình `chart-snapshot`,
   mỗi lần đổi `asOf` phải `POST /charts` (taibu cũng tách endpoint riêng theo
   pattern này). Loại theo decision `0011`.
2. **Chỉ làm 1 endpoint `POST /charts/:id/horoscope` (đã có ở US-014)** — vẫn cần
   layer summary text Việt cho daily/monthly; thêm 2 GET ngắn dễ cache TanStack
   Query theo `asOf`, semantic rõ hơn cho UI. Giữ đường `POST /horoscope` cho
   panel multi-scope (US-015), giữ 3 endpoint riêng cho US-016 vì semantic UX
   khác (hiển thị card vs panel).
3. **Streaming Markdown annual** (SSE) — UX tốt hơn cho 1200 từ. Hoãn — story
   này blocking mode đơn giản; nếu UX kém thì decision riêng + story sau.
4. **Cache annual cả monthly summary tách riêng** — chia nhỏ cache, nhưng cùng
   `(chartId, year)` luôn sinh trong 1 lần gọi LLM nên cache 1 row Markdown đủ.
5. **Để cờ AI duy nhất `AI_EXPLANATION_FREE_FOR_ALL`** — annual tốn token gấp
   ~3-5 lần một explanation, cần phanh độc lập để bật explanations free + giữ
   annual khoá khi chưa sẵn sàng. Quota riêng cùng lý do.
