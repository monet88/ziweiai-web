# Plan US-016 — Vận ngày, Vận tháng, Báo cáo năm (port từ taibu)

## Goal

Triển khai 3 đường vận thế theo thời gian trên lá số Tử Vi đã lưu:

- `GET /charts/:id/daily?asOf=YYYY-MM-DD` — vận ngày, render template Việt,
  KHÔNG LLM.
- `GET /charts/:id/monthly?asOf=YYYY-MM` — vận tháng, render template Việt,
  KHÔNG LLM.
- `POST /charts/:id/annual-report?year=YYYY` — báo cáo năm bằng LLM, có cache
  DB `annual_reports`, gắn cờ riêng `AI_ANNUAL_REPORT_ENABLED` + quota riêng
  `API_ANNUAL_REPORTS_PER_DAY_PER_USER` + reuse gate `assertCanUseAiExplanation`
  theo decision `0010`.

Web (`apps/web`) tiêu thụ qua `@ziweiai/contracts/horoscope/*` (decision `0011`,
boundary `0007` — không nhập engine ra client).

## Pre-conditions

- **Bắt buộc**: US-014 (`E14-ziwei-flow-info`) merge xong → contract
  `horoscopeFrameSchema` (mở rộng `horoscopeSchema` cũ) đã có nhánh `monthly` +
  `daily`. Nếu chưa, story này phải mở contract trước; rủi ro va chạm với US-014
  còn dở.
- **Khuyến nghị**: US-013 (`E13-anon-quota-persistence`) merge xong →
  `QuotaCounterStore` với driver bền (Upstash) đã sống qua restart. Annual quota
  đặt trên cùng store; nếu chưa có store bền, quota annual dễ bị reset khi
  redeploy → tạm chấp nhận trong giai đoạn beta vì cờ `AI_ANNUAL_REPORT_ENABLED`
  đã chốt mặc định `false`.
- **Khuyến nghị**: US-010 đã merge → `assertCanUseAiExplanation` + mã
  `PAYMENT_REQUIRED` + paywall component đã có để reuse.
- Đọc:
  - `docs/decisions/0011-horoscope-engine-boundary.md`.
  - `docs/decisions/0010-premium-ai-entitlement-flag.md`.
  - `docs/decisions/0007-web-server-boundary.md`.
  - `apps/api/src/modules/explanations/services/explanations.service.ts`
    (pattern `assertCanUseAiExplanation` đã đứng cạnh quota assert).
  - `apps/api/src/providers/ai/ai-explanation-provider.ts` (pattern build prompt
    Việt + `EXPLANATION_SYSTEM_PROMPT`).
  - `.ref/taibu/src/app/api/annual-report/route.ts` (pattern endpoint nguồn,
    NextJS — chỉ tham chiếu logic).
  - `.ref/taibu/src/app/{daily,monthly}/page.tsx` (UI nguồn — không port
    nguyên, tham chiếu cấu trúc).
  - `apps/web/src/lib/api-client/index.ts` (pattern flat function).
- Chạy `scripts\bin\harness-cli.exe intake --type feature --summary "US-016 vận ngày / vận tháng / báo cáo năm" --lane high-risk`.

## Phase 1 — Env + flag + quota

- [ ] `apps/api/src/config/env.ts`:
  - `AI_ANNUAL_REPORT_ENABLED: z.stringbool().default(false)` — KHÔNG dùng
    `z.coerce.boolean()` (theo bài học US-010, decision 0010: `Boolean("false") === true`).
  - `API_ANNUAL_REPORTS_PER_DAY_PER_USER: z.coerce.number().int().positive().default(2)`.
- [ ] `.env.example` thêm:
  ```
  # --- Annual report (US-016) — phanh độc lập với AI_EXPLANATION_FREE_FOR_ALL ---
  AI_ANNUAL_REPORT_ENABLED=false
  API_ANNUAL_REPORTS_PER_DAY_PER_USER=2
  ```
- [ ] `apps/api/src/modules/quotas/quotas.service.ts`:
  - `assertCanCreateAnnualReport(userId, ip, isAnonymous)` — key
    `annual-report:${userId}:${utcDay()}` qua `QuotaCounterStore` (US-013) hoặc
    Map in-memory tạm nếu US-013 chưa merge.
  - Test ca: under-limit 2 lần → OK; lần 3 → throw quota.
- [ ] Files đụng: `apps/api/src/config/env.ts`, `.env.example`,
  `apps/api/src/modules/quotas/quotas.service.ts`,
  `apps/api/src/modules/quotas/quotas.service.test.ts`.
- [ ] Validation: `pnpm -F @ziweiai/api test quotas`.

## Phase 2 — Migration `annual_reports`

- [ ] Tạo `apps/api/supabase/migrations/000004_annual-reports.up.sql` (xem
  Design.md §Data Model — schema + RLS + unique `(chart_snapshot_id, year)` +
  index `(owner_user_id, created_at desc)`).
- [ ] Tạo `apps/api/supabase/migrations/000004_annual-reports.down.sql`.
- [ ] Smoke: apply → rollback → apply lại trên Supabase local. Confirm RLS chặn
  user khác (`select` không owner trả 0 row).
- [ ] Files đụng: 2 file SQL mới.
- [ ] Validation: chạy script migrations local + `psql` kiểm RLS.

## Phase 3 — Contracts

- [ ] Tạo `packages/contracts/src/horoscope/horoscope-request.ts`:
  - `dailyFortuneRequestSchema` — `asOf: /^\d{4}-\d{2}-\d{2}$/`.
  - `monthlyFortuneRequestSchema` — `asOf: /^\d{4}-\d{2}$/`.
  - `annualReportRequestSchema` — `year: int 1900..2100`.
- [ ] Tạo `packages/contracts/src/horoscope/horoscope-response.ts`:
  - `dailyFortuneResponseSchema`, `monthlyFortuneResponseSchema`,
    `annualReportResponseSchema` (import `horoscopeFrameSchema` từ US-014).
- [ ] `packages/contracts/src/index.ts` re-export 6 schema + type tương ứng.
- [ ] Test parse: success + thiếu field summary/markdown → fail rõ ràng.
- [ ] Files đụng: 3 file mới + index re-export.
- [ ] Validation: `turbo typecheck` + `pnpm -F @ziweiai/contracts test`.

## Phase 4 — Trích xuất gate AI + adapter engine

- [ ] Tạo `apps/api/src/common/entitlement/ai-entitlement.guard.ts`:
  - `assertCanUseAiExplanation()` — copy từ
    `ExplanationsService.assertCanUseAiExplanation` thành function thuần.
  - `assertAnnualReportEnabled()` — đọc `apiEnv.AI_ANNUAL_REPORT_ENABLED`; khi
    `false` → throw 402 với message Việt riêng "Báo cáo năm AI đang khoá ở
    giai đoạn beta. Vui lòng quay lại sau."
- [ ] Sửa `ExplanationsService` import từ guard mới (KHÔNG đổi behavior — chạy
  test cũ vẫn xanh).
- [ ] Tạo `apps/api/src/modules/fortune/services/horoscope-engine.adapter.ts`:
  - Wrap `@ziweiai/astro-engine` `computeZiweiHoroscope({ snapshot, asOf, scopes })`
    → trả `horoscopeFrameSchema`-shaped object.
  - Pure function, không I/O.
- [ ] Files đụng: `ai-entitlement.guard.ts` mới, `horoscope-engine.adapter.ts`
  mới, `explanations.service.ts` (chỉ đổi import).
- [ ] Validation: `pnpm -F @ziweiai/api test explanations` + typecheck.

## Phase 5 — Service Daily / Monthly + Controller

- [ ] Tạo `apps/api/src/modules/fortune/services/daily-fortune.service.ts`:
  - `getDailyFortune(user, ip, chartId, asOf)`:
    1. `findChartSnapshotById` (404).
    2. Assert `chart_system='zi-wei-dou-shu'` (400).
    3. Rate-limit per-minute (reuse cơ chế hiện có ở `QuotasService`).
    4. `frame = engineAdapter.compute({ snapshot, asOf, scopes: ['daily'] })`.
    5. `summary = renderDailyCanonicalText(frame.daily, locale='vi')`.
       - `renderDailyCanonicalText` ở `@ziweiai/core/text` (port từ taibu
         `packages/core/src/text/`); nếu chưa có hàm này → tạo mới trong core
         (1 hàm thuần in 3-5 câu Việt từ `frame.daily`, không LLM).
    6. Return `{ chartId, asOf, frame, summary }`.
- [ ] Tạo `monthly-fortune.service.ts` tương tự với `scopes: ['monthly']` +
  `renderMonthlyCanonicalText`.
- [ ] Tạo `fortune.controller.ts`:
  - `@Get(':id/daily')` — bind tới `DailyFortuneService.getDailyFortune` qua
    DTO `dailyFortuneRequestSchema.parse(query)`.
  - `@Get(':id/monthly')` — tương tự.
  - `@Post(':id/annual-report')` — placeholder, body Phase 6.
  - Reuse `SupabaseAuthGuard` + `@CurrentUser()` decorator.
- [ ] Test unit + integration:
  - Unit: mock engine + persistence; assert summary tiếng Việt + frame trả
    đúng.
  - Integration: supertest 200 + 400 (non-ziwei) + 404 (non-owner) + 401
    (no-bearer).
- [ ] Files đụng: 2 service mới, 1 controller mới, 1 module mới
  (`fortune.module.ts`), test files.
- [ ] Validation: `pnpm -F @ziweiai/api test fortune/daily fortune/monthly`.

## Phase 6 — Service Annual Report + Repository + cache

- [ ] Tạo `apps/api/src/modules/fortune/services/annual-report.repository.ts`:
  - `findByChartAndYear(ownerUserId, chartSnapshotId, year)` → row | null
    (qua `SupabasePersistenceGateway` mới mở method `selectAnnualReport`).
  - `create({ ownerUserId, chartSnapshotId, year, markdown, providerMetadata })`
    → row mới; catch unique violation → đọc lại row hiện tại + return.
- [ ] Tạo `apps/api/src/modules/fortune/services/annual-report.service.ts`:
  - `createAnnualReport(user, ip, chartId, year)`:
    1. Load chart (404).
    2. Assert ziwei (400).
    3. Cache lookup (`findByChartAndYear`) — nếu có, return ngay (cache-hit
       BYPASS GATE; theo decision `0010`).
    4. `assertCanUseAiExplanation()` (cờ chung) → 402 nếu chưa entitled.
    5. `assertAnnualReportEnabled()` (cờ riêng) → 402 với message "beta".
    6. `quotasService.assertCanCreateAnnualReport(...)` → 429.
    7. `frame = engineAdapter.compute({ snapshot, asOf: \`${year}-06-15\`, scopes: ['yearly', 'monthly12'] })`.
    8. `prompt = buildAnnualReportPrompt(snapshot, frame, locale='vi')` (port
       prompt builder từ taibu `lib/annual-report/`, ép Việt qua
       `EXPLANATION_SYSTEM_PROMPT`).
    9. `markdown = providerRouter.generateAnnualReport(prompt)` (reuse provider
       router; thêm method mới hoặc gọi qua interface chung).
    10. `repository.create(...)` (race-safe).
    11. Return `{ chartId, year, frame, markdown }`.
- [ ] Update `fortune.controller.ts` → bind `POST` route.
- [ ] Test unit:
  - Cache-hit: provider không gọi (mock count = 0).
  - Cache-miss + cờ chung off: 402.
  - Cache-miss + cờ chung on + cờ riêng off: 402 với message khác.
  - Cờ on cả hai + quota OK: gọi provider 1 lần + save row.
  - Cờ on + quota vượt: 429.
  - Race: mock 2 caller cùng `(chartId, year)` → kẻ thua đọc cache + trả cùng
    Markdown.
- [ ] Test integration: 6 ca tương ứng + Han-scan trên `markdown` trả về.
- [ ] Files đụng: 2 service mới + repo mới + controller update + test files.
- [ ] Validation: `pnpm -F @ziweiai/api test fortune/annual-report`.

## Phase 7 — Web client + UI + paywall reuse

- [ ] `apps/web/src/lib/api-client/index.ts`:
  - `fetchDailyFortune(token, chartId, asOf)`.
  - `fetchMonthlyFortune(token, chartId, asOf)`.
  - `createAnnualReport(token, { chartId, year })`.
  - Tất cả parse qua schema mới ở `@ziweiai/contracts`.
- [ ] Tạo `apps/web/src/lib/features/fortune/`:
  - `DailyFortuneCard.svelte` — `createQuery(() => ({ queryKey: ['fortune','daily',chartId,asOf], queryFn: ... }))`.
    UI: ngày + cung lưu nhật + tứ hóa + summary + skeleton loading.
  - `MonthlyFortuneCard.svelte` — tương tự.
  - `AnnualReportButton.svelte` + `AnnualReportModal.svelte`:
    - `createMutation(() => ({ mutationFn: ({ year }) => createAnnualReport(token, { chartId, year }) }))`.
    - `onSuccess` → invalidate `['fortune', 'annual', chartId, year]` + mở modal.
    - `onError` → nếu `error.code === 'PAYMENT_REQUIRED'` → render
      `<PaywallCta />` (component đã có ở US-010 hoặc copy minimal). Phân biệt
      message "beta locked" vs "needs paid plan" bằng `error.message` hoặc
      thêm field details (decision sau nếu cần cứng).
- [ ] I18n: `apps/web/src/lib/i18n/vi/fortune.ts` (xem Design §UI). Import vào
  `apps/web/src/lib/i18n/vi/index.ts`.
- [ ] Tích hợp 3 component vào page chi tiết lá số (`apps/web/src/routes/(app)/charts/[id]/+page.svelte`)
  hoặc dashboard tuỳ UX hiện tại; chỉ render khi `chart_system='zi-wei-dou-shu'`.
- [ ] Test unit (Vitest + svelte-testing-library):
  - Render card với data mock → assert text Việt + tứ hóa hiển thị.
  - Annual button error 402 → render paywall CTA Việt.
- [ ] **Quan trọng**: KHÔNG nhập `@ziweiai/core` / `@ziweiai/astro-engine` /
  `iztro` / `lunar-javascript` (boundary 0007 — ESLint chặn).
- [ ] Files đụng: api-client/index.ts, 4 svelte component mới, i18n file mới,
  page route update.
- [ ] Validation: `pnpm -F @ziweiai/web check && pnpm -F @ziweiai/web test fortune`.

## Phase 8 — E2E + Han scan

- [ ] `apps/web/e2e/fortune.spec.ts`:
  - Setup: anon session → tạo chart Tử Vi.
  - Mở `/charts/:id` → đợi 3 card render → screenshot smoke.
  - Bấm "Báo cáo năm" với `AI_ANNUAL_REPORT_ENABLED=false` (env CI mặc định) →
    paywall modal hiển thị → đọc text → assert Việt + không Hán.
  - Bấm với env override `AI_ANNUAL_REPORT_ENABLED=true` (nếu có cách inject
    qua `.env.test`) → modal Markdown hiển thị + scan không Hán.
- [ ] Han scan toàn page: `expect(domText).not.toMatch(/\p{Script=Han}/u)`.
- [ ] Validation: `pnpm -F @ziweiai/web e2e -- fortune.spec.ts`.

## Phase 9 — Validate full + harness + docs

- [ ] `turbo test typecheck lint` xanh.
- [ ] `pnpm -F @ziweiai/web build` + `pnpm why iztro` ở `apps/web` → 0
  (xác nhận không leak engine).
- [ ] `pnpm -F @ziweiai/api test fortune` xanh.
- [ ] `scripts\bin\harness-cli.exe story add --id US-016 --title "Vận ngày / Vận tháng / Báo cáo năm" --lane high-risk --verify "pnpm -F @ziweiai/api test fortune && pnpm -F @ziweiai/web check"`.
- [ ] `scripts\bin\harness-cli.exe story update --id US-016 --unit 1 --integration 1 --e2e 1 --platform 1`.
- [ ] `scripts\bin\harness-cli.exe trace --intake <n> --story US-016 --summary "US-016 vận ngày/tháng/báo cáo năm" --outcome completed --agent claude --actions "phase1-9" --read "..." --changed "..." --friction "..."`.
- [ ] Cập nhật `docs/product/api-contract.md` (thêm 3 endpoint).
- [ ] (Optional) update `docs/decisions/0011-horoscope-engine-boundary.md`
  Follow-Up: ghi chú đã triển khai daily/monthly/annual; cờ riêng + quota
  riêng đã sống.

## Risk + Rollback

| Risk | Mitigation | Rollback |
| --- | --- | --- |
| Cờ `AI_ANNUAL_REPORT_ENABLED=true` quên off ở prod → chi phí AI cao | Default `false` + log warn `[annual] feature locked` mỗi 402 + quota thấp `2/day/user` | Set env `AI_ANNUAL_REPORT_ENABLED=false` + restart; cache hit cũ vẫn xem được nhưng sinh mới bị chặn |
| Cờ chung `AI_EXPLANATION_FREE_FOR_ALL=false` (gate explanations) lại làm annual cũng off đột ngột | Đặc tả: annual cần CẢ HAI cờ on. Test integration phủ ca này. Document rõ trong `.env.example`. | Set một trong hai về `true` để khôi phục |
| Migration `annual_reports` xung đột với schema khác | Unique `(chart_snapshot_id, year)` deterministic; FK CASCADE delete chart cascade row | `000004_annual-reports.down.sql` drop policy → drop index → drop table; daily/monthly không có schema → revert code đủ |
| Race 2 caller cùng `(chartId, year)` → unique violation crash | Catch unique violation trong repository → đọc lại row hiện tại + return Markdown của winner | Test ca race phủ trong unit |
| LLM rò Hán vào Markdown annual | `EXPLANATION_SYSTEM_PROMPT` ép Việt + Han-scan test trên response | Tinh chỉnh prompt; nếu không xử được, revert annual + giữ daily/monthly |
| Quota annual reset khi redeploy (nếu US-013 chưa merge) | Dùng cờ `AI_ANNUAL_REPORT_ENABLED=false` để khoá feature; chấp nhận trong giai đoạn beta | Đợi US-013, hoặc dùng quota in-memory tạm |
| `horoscopeFrameSchema` chưa có (US-014 chưa merge) | Gate pre-condition: chỉ start US-016 sau US-014. Nếu khẩn → tự mở contract trong story này, đồng bộ sau với US-014 | Coordinate với owner US-014 |
| Web vô tình nhập engine khi viết UI | ESLint `no-restricted-imports` chặn (decision 0007) + CI fail-fast | Sửa ngay |
| Daily/Monthly summary template không đủ tự nhiên / sai ngữ pháp | Template thuần do core viết, không LLM → có thể chỉnh nhanh + có Han-scan test | Tweak template; rollback toàn phần = revert code |

**Rollback toàn diện**:

- Annual: tắt cờ + drop bảng `annual_reports` (qua down migration).
- Daily/Monthly: revert PR (không có schema change).
- Cả 3: revert PR + chạy down migration `000004` → trở về trạng thái trước.

## Done Criteria

- [ ] 3 endpoint hoạt động: daily/monthly không LLM, annual có LLM + cache +
  dual-flag gate + quota riêng.
- [ ] Migration `000004_annual-reports` apply + rollback OK trên Supabase local.
- [ ] `@ziweiai/contracts/horoscope/{request,response}.ts` export đủ schema +
  type, parse OK.
- [ ] `assertCanUseAiExplanation` trích thành module chung; `ExplanationsService`
  + `AnnualReportService` cùng dùng.
- [ ] `apps/web/src/lib/features/fortune/` 4 component + 3 hàm api-client +
  i18n vi mới.
- [ ] Han-scan test xanh (template + Markdown LLM không có `\p{Script=Han}`).
- [ ] `pnpm -F @ziweiai/web build` + `pnpm why iztro` (web) → 0 (không leak
  engine).
- [ ] Unit + integration + e2e + platform proof = 1 trên ma trận US-016.
- [ ] `pnpm lint --max-warnings=0` xanh + `turbo typecheck` xanh.
- [ ] Trace harness ghi đủ outcome + friction.
- [ ] `docs/product/api-contract.md` cập nhật 3 endpoint mới.
- [ ] Document `.env.example` rõ cờ + quota mới + cảnh báo "off ở prod".
