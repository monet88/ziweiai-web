# Exec Plan

## Goal

Triển khai 3 tính năng vận thế theo thời gian (vận ngày, vận tháng, báo cáo năm)
theo quyết định `0011` (engine ở server, web nhận snapshot) + tái sử dụng gate
premium AI theo quyết định `0010` cho đường báo cáo năm.

## Scope

In scope:

- Thêm 3 endpoint + DTO + validation:
  - `GET /charts/:id/daily?asOf=YYYY-MM-DD`
  - `GET /charts/:id/monthly?asOf=YYYY-MM`
  - `POST /charts/:id/annual-report?year=YYYY`
- Thêm bảng `annual_reports` + migration + RLS owner-only + unique index.
- Thêm cờ `AI_ANNUAL_REPORT_ENABLED` (mặc định `false`) + quota
  `API_ANNUAL_REPORTS_PER_DAY_PER_USER` (mặc định `2`).
- Trích xuất gate `assertCanUseAiExplanation` thành module chung để reuse.
- Thêm contracts `@ziweiai/contracts/horoscope/{request,response}.ts` theo
  `horoscopeFrameSchema`.
- Thêm 3 hàm api-client + 3 component UI + paywall reuse.
- I18n vi cho nhãn mới.
- Unit + integration + E2E test (browser smoke cho UI).
- Harness story `US-016` + trace.

Out of scope:

- Streaming annual report (hoãn).
- Lịch sử annual report trong `/history`.
- Bazi annual report.
- Cache DB cho daily/monthly.
- Provider riêng cho annual report.

## Risk Classification

Risk flags:

- High-risk: đường tốn token (LLM) + migration DB + public contract mới.
- Feature flag dual-gate (`AI_EXPLANATION_FREE_FOR_ALL` + `AI_ANNUAL_REPORT_ENABLED`)
  phải fail-closed cùng lúc.
- Quota riêng số thấp (`2`) — sai lệch dễ gây chi phí.

Hard gates:

- `scripts\bin\harness-cli.exe story update` chỉ khi unit + integration + e2e +
  platform đều 1.
- Migration forward + rollback chạy trong CI.
- Han scan test vẫn xanh (bất biến §2).

## Work Phases

1. **Pre-work — intake + read decisions**

   - [ ] `scripts\bin\harness-cli.exe intake --type feature --summary "US-016 vận ngày/vận tháng/báo cáo năm" --lane high-risk`.
   - [ ] Đọc `docs/decisions/0011-horoscope-engine-boundary.md`, `0010-premium-ai-entitlement-flag.md`, `0007-web-server-boundary.md`.
   - [ ] Đọc `apps/api/src/modules/explanations/services/explanations.service.ts`
     (pattern `assertCanUseAiExplanation`).
   - [ ] Đọc `.ref/taibu/src/app/api/annual-report/route.ts` + `daily/page.tsx`,
     `monthly/page.tsx` (pattern nguồn).
   - [ ] Đọc `apps/api/src/config/env.ts`, `apps/api/src/modules/quotas/quotas.service.ts`.
   - [ ] Đọc `packages/contracts/src/chart/chart-snapshot.ts` (để thấy
     `horoscopeSchema`).
   - [ ] Đọc `apps/web/src/lib/api-client/index.ts` (pattern flat function).
   - [ ] Đọc `docs/stories/epics/E10-premium-ai-gating/US-010-premium-ai-gating.md`
     (mẫu high-risk).

2. **Phase 1 — Env + flag + quota**

   - [ ] `apps/api/src/config/env.ts`:
     - Thêm `AI_ANNUAL_REPORT_ENABLED: z.stringbool().default(false)`.
     - Thêm `API_ANNUAL_REPORTS_PER_DAY_PER_USER: z.coerce.number().int().positive().default(2)`.
   - [ ] `.env.example` thêm block:
     ```
     # --- Annual report AI gate (US-016) ---
     AI_ANNUAL_REPORT_ENABLED=false
     API_ANNUAL_REPORTS_PER_DAY_PER_USER=2
     ```
   - [ ] `apps/api/src/modules/quotas/quotas.service.ts`:
     - Thêm `assertCanCreateAnnualReport(userId, ip, isAnonymous)` dùng
       `API_ANNUAL_REPORTS_PER_DAY_PER_USER` + key `annual-report:${userId}:${utcDay}`.
     - Test unit: under-limit, at-limit, over-limit cho quota annual.
   - [ ] Validation: `pnpm -F @ziweiai/api test quotas`.

3. **Phase 2 — Migration `annual_reports`**

   - [ ] Tạo `apps/api/supabase/migrations/000004_annual-reports.up.sql` (schema
     + unique + RLS + index).
   - [ ] Tạo `000004_annual-reports.down.sql` (drop policy → drop index →
     drop table).
   - [ ] Smoke migration: apply + rollback + apply lại trong local Supabase.
   - [ ] Validation: `supabase db push` (nếu có script) hoặc `psql` manual.
   - [ ] Ghi note vào `docs/decisions/0011-horoscope-engine-boundary.md` Follow-Up
     rằng migration `000004` đã chạy (không cần decision mới).

4. **Phase 3 — Contracts**

   - [ ] Tạo `packages/contracts/src/horoscope/horoscope-request.ts`:
     `dailyFortuneRequestSchema`, `monthlyFortuneRequestSchema`,
     `annualReportRequestSchema`.
   - [ ] Tạo `packages/contracts/src/horoscope/horoscope-response.ts`:
     `dailyFortuneResponseSchema`, `monthlyFortuneResponseSchema`,
     `annualReportResponseSchema` (import `horoscopeFrameSchema` từ nơi US-014
     đã export).
   - [ ] Cập nhật `packages/contracts/src/index.ts` re-export 3 schema + 3 type.
   - [ ] Test contracts parse:
     - `dailyFortuneResponseSchema.parse({ chartId: uuid, asOf: '2026-06-17', frame: { daily: {...} }, summary: '...' })` OK.
     - Parse thiếu `summary` → fail.
   - [ ] Validation: `turbo typecheck` + `pnpm -F @ziweiai/contracts test`.

5. **Phase 4 — Service + Controller**

   - [ ] Tạo module `apps/api/src/modules/fortune/`:
     - `fortune.module.ts` (provider `FortuneService`, `AnnualReportRepository`).
     - `fortune.controller.ts` (3 route + `ParseUUIDPipe` + query DTO).
   - [ ] Trích xuất gate:
     - Tạo `apps/api/src/common/entitlement/ai-entitlement.guard.ts`:
       ```ts
       export function assertCanUseAiExplanation() {
         if (apiEnv.AI_EXPLANATION_FREE_FOR_ALL) { log.warn(...); return; }
         throw new ApiErrorHttpException(402, 'PAYMENT_REQUIRED', ...);
       }
       ```
     - Update `ExplanationsService` import từ guard mới (không đổi logic).
   - [ ] Tạo `annual-report.service.ts`:
     - `createAnnualReport(user, chartId, year)`:
       1. Load chart → 404.
       2. Assert `zi-wei-dou-shu` → 400.
       3. Check cache → nếu có, return.
       4. `assertCanUseAiExplanation()`.
       5. `assertAnnualReportEnabled()` (cờ `AI_ANNUAL_REPORT_ENABLED` → 402
          message riêng).
       6. `quotasService.assertCanCreateAnnualReport(...)` → 429.
       7. Compute frame (yearly + monthly12) qua `HoroscopeEngineAdapter`.
       8. Build prompt (reuse `buildExplanationPrompt` pattern hoặc mới).
       9. `providerRouter.generateAnnualReport(...)`.
       10. Save `annual_reports` row.
       11. Return.
   - [ ] Tạo `daily-fortune.service.ts`:
     - `getDailyFortune(user, chartId, asOf)`:
       1. Load chart → 404.
       2. Assert ziwei → 400.
       3. Quota per-minute (reuse `assertCanReadFortune` hoặc gọi trực tiếp
          rate-limit guard).
       4. Compute frame `scopes: ['daily']`.
       5. `summary = renderDailyCanonicalText(frame.daily)`.
       6. Return.
   - [ ] Tương tự `monthly-fortune.service.ts`.
   - [ ] Tạo `annual-report.repository.ts`:
     - `findByChartAndYear(ownerUserId, chartSnapshotId, year)` → row | null.
     - `create({ ownerUserId, chartSnapshotId, year, markdown, providerMetadata })`.
   - [ ] Test unit service (mock persistence + mock provider):
     - daily/monthly: trả frame + summary Việt.
     - annual cache-hit: trả markdown cũ, KHÔNG gọi provider.
     - annual cache-miss + cờ off: ném 402.
     - annual cache-miss + cờ on + quota OK: gọi provider + save + return.
   - [ ] Test integration (supertest):
     - `GET /charts/:id/daily` → 200 + Việt.
     - `POST /charts/:id/annual-report` flag off → 402.
     - `POST` flag on → 200 + cache hit lần hai.
     - Non-owner → 404.
     - Non-ziwei → 400.
   - [ ] Validation: `pnpm -F @ziweiai/api test fortune`.

6. **Phase 5 — Web client + UI**

   - [ ] `apps/web/src/lib/api-client/index.ts` thêm:
     ```ts
     export function fetchDailyFortune(token: string, chartId: string, asOf: string): Promise<DailyFortuneResponse> {
       return fetchJson(`/charts/${chartId}/daily?asOf=${asOf}`, dailyFortuneResponseSchema, { token });
     }
     export function fetchMonthlyFortune(token: string, chartId: string, asOf: string): Promise<MonthlyFortuneResponse> { ... }
     export function createAnnualReport(token: string, req: { chartId: string; year: number }): Promise<AnnualReportResponse> { ... }
     ```
   - [ ] Tạo `apps/web/src/lib/features/fortune/`:
     - `DailyFortuneCard.svelte`:
       - `createQuery(() => ({ queryKey: ['fortune','daily',chartId,asOf], queryFn: () => fetchDailyFortune(token, chartId, asOf) }))`.
       - Render: ngày, cung lưu nhật, tứ hóa, summary.
       - Loading skeleton.
     - `MonthlyFortuneCard.svelte`: tương tự.
     - `AnnualReportButton.svelte` + `AnnualReportModal.svelte`:
       - Nút → `createMutation` → gọi `createAnnualReport`.
       - `onError` → nếu `error.code === 'PAYMENT_REQUIRED'` → render `PaywallCta`
         (reuse component US-010) với message "Báo cáo năm yêu cầu gói trả phí"
         hoặc "Tính năng tạm khoá beta" tuỳ message.
       - `onSuccess` → invalidate query + mở modal.
   - [ ] Tạo i18n:
     - `apps/web/src/lib/i18n/vi/fortune.ts`.
     - Import vào `apps/web/src/lib/i18n/vi/index.ts`.
   - [ ] Test UI (unit component):
     - Render card với data mock → snapshot text Việt.
     - Annual button khi mutation error 402 → hiển thị paywall CTA.
   - [ ] Validation: `pnpm -F @ziweiai/web check`.

7. **Phase 6 — E2E**

   - [ ] Tạo `apps/web/e2e/fortune.spec.ts`:
     - Login anon → tạo chart Tử Vi → mở chi tiết → card daily/monthly
       hiển thị (smoke).
     - Bấm "Báo cáo năm" → nếu cờ off → modal paywall xuất hiện.
     - (Nếu có cách bật cờ trong test env) → tạo report thành công + modal
       render Markdown.
   - [ ] Validation: `pnpm -F @ziweiai/web e2e` (hoặc playwright local).

8. **Phase 7 — Han scan + bất biến**

   - [ ] Chạy test bất biến: `pnpm -F @ziweiai/web test text/cjk` (nếu có) hoặc
     `turbo test` toàn bộ.
   - [ ] Kiểm tra output của `renderDailyCanonicalText` / prompt annual không
     chứa `\p{Script=Han}`.

9. **Phase 8 — Harness + docs**

   - [ ] `scripts\bin\harness-cli.exe story add --id US-016 --title "Vận ngày / Vận tháng / Báo cáo năm" --lane high-risk --verify "pnpm -F @ziweiai/api test fortune && pnpm -F @ziweiai/web check"`.
   - [ ] `scripts\bin\harness-cli.exe story update --id US-016 --unit 1 --integration 1 --e2e 1 --platform 1`.
   - [ ] `scripts\bin\harness-cli.exe trace --intake <n> --story US-016 --summary "..." --outcome completed --agent claude --actions "..." --read "..." --changed "..." --friction "..."`.
   - [ ] Cập nhật `docs/product/api-contract.md` (thêm 3 endpoint).
   - [ ] (Optional) cập nhật `docs/decisions/0011-horoscope-engine-boundary.md`
     Follow-Up nếu cần.

## Stop Conditions

Pause for human confirmation if:

- Product behavior is ambiguous (ví dụ: "annual report có nên cache hit khi
  cờ off?" — đã chốt theo US-010).
- Data migration or deletion risk appears (migration `000004` có forward +
  rollback đầy đủ).
- Validation requirements need to be weakened (không nới coverage).
- Architecture direction changes (ví dụ: muốn cache daily/monthly DB — cần
  decision riêng).
- Cờ `AI_ANNUAL_REPORT_ENABLED` + quota bị conflict với `AI_EXPLANATION_FREE_FOR_ALL`
  (cần review lại).
