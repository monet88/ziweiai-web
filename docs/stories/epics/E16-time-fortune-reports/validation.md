# Validation

## Proof Strategy

Before story is marked `done`, all 4 layer phải xanh:

1. **Unit** — gate AI annual + quota annual + cache repository + render template
   daily/monthly không Hán.
2. **Integration** — 3 endpoint qua supertest với token Bearer thật, kiểm tra
   ownership, chart-system guard, cache hit, 402 dual-flag, 429 quota.
3. **E2E** — UI Svelte: 3 component render đúng, paywall hiển thị khi 402.
4. **Platform** — `pnpm -F @ziweiai/web check` (svelte-check + tsc) + backend
   test xanh + migration apply + rollback OK.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | (1) `assertCanUseAiExplanation` no-op khi `AI_EXPLANATION_FREE_FOR_ALL=true`; ném 402 khi `false`. (2) `assertAnnualReportEnabled` no-op khi `AI_ANNUAL_REPORT_ENABLED=true`; ném 402 message riêng khi `false`. (3) `quotasService.assertCanCreateAnnualReport` 200 dưới hạn / 429 vượt hạn / cửa sổ daily reset đúng UTC. (4) `annualReportRepository.create` race: 2 caller cùng `(chartId, year)` → unique violation → caller thua đọc lại row. (5) `renderDailyCanonicalText` / `renderMonthlyCanonicalText` output không chứa `\p{Script=Han}`. (6) Contracts `dailyFortuneResponseSchema` parse OK / fail đúng. |
| Integration | (1) `GET /charts/:id/daily?asOf=2026-06-17` → 200 + summary Việt. (2) `GET /:id/monthly?asOf=2026-06` → 200 + summary Việt. (3) `POST /:id/annual-report?year=2026` cờ off → 402 `PAYMENT_REQUIRED`. (4) Cờ on lần đầu → 200 + Markdown. (5) Cờ on lần hai cùng `(chartId, year)` → 200 + cache-hit (provider mock đếm gọi = 1). (6) Cache-hit + cờ vừa tắt off → vẫn 200 (cache-hit bypass gate, theo decision 0010). (7) Caller không phải owner → 404. (8) Chart hệ Bazi → 400. (9) Quota annual đạt hạn → 429. (10) `asOf` sai format → 400. (11) `year` ngoài 1900..2100 → 400. |
| E2E | (1) Anon session → tạo chart Tử Vi → mở `/charts/:id` → `DailyFortuneCard` render text Việt + cung lưu nhật. (2) `MonthlyFortuneCard` render. (3) Bấm "Báo cáo năm" với cờ off → modal paywall hiển thị nội dung Việt. (4) (env test có cờ on) bấm "Báo cáo năm" → modal Markdown hiển thị. (5) Han scan: scan toàn DOM của chart-detail page sau khi load 3 card → 0 ký tự Hán. |
| Platform | (1) `pnpm -F @ziweiai/api test` xanh. (2) `pnpm -F @ziweiai/web check` xanh. (3) `pnpm -F @ziweiai/web build` xanh + bundle size không tăng > 5KB gzip (web không nhập engine). (4) Migration `000004` apply trên Supabase local + rollback OK. (5) `pnpm lint --max-warnings=0` xanh. (6) `pnpm why iztro` ở `apps/web` build → 0 (không kéo iztro ra client). |
| Performance | Daily/Monthly P95 < 250ms (engine deterministic + không LLM). Annual cold P95 < 15s (provider timeout). Annual cache-hit P95 < 50ms. |
| Logs/Audit | (1) `[fortune.daily] chartId=… asOf=… userId=…` log info mỗi request. (2) `[fortune.annual] outcome=cache-hit|generated providerName=… tokensIn=… tokensOut=…` log info khi sinh mới. (3) Cờ `AI_ANNUAL_REPORT_ENABLED=false` → log warn `[annual] feature locked` mỗi 402. (4) Quota annual vượt → log warn `[annual] quota exceeded userId=…`. |

## Fixtures

- **User Tử Vi đã lưu**: `seed-ziwei-user@test.local` + 1 `chart_snapshots` row,
  `chart_system='zi-wei-dou-shu'`, snapshot deterministic ngày sinh `1990-01-15`.
- **User Bazi**: `seed-bazi-user@test.local` + chart `chart_system='ba-zi'`
  (test 400).
- **User stranger**: `seed-stranger@test.local` (test 404).
- **Provider mock** (Vitest): `mockProviderRouter.generateAnnualReport` trả
  Markdown deterministic `# Báo cáo năm 2026\n\nNăm này...` + đếm số lần gọi.
- **`asOf` cố định**: `2026-06-17` (UTC), `2026-06`, `2026`.
- **Anon session JWT**: tạo qua Supabase admin REST trong `beforeAll` (giống
  pattern test US-009).

## Commands

```bash
# Backend unit + integration
pnpm -F @ziweiai/api test fortune
pnpm -F @ziweiai/api test quotas

# Contracts parse
pnpm -F @ziweiai/contracts test horoscope

# Web
pnpm -F @ziweiai/web check
pnpm -F @ziweiai/web test fortune

# E2E
pnpm -F @ziweiai/web e2e -- fortune.spec.ts

# Migration smoke
pnpm -F @ziweiai/api migration:apply 000004
pnpm -F @ziweiai/api migration:rollback 000004
pnpm -F @ziweiai/api migration:apply 000004

# Full suite
turbo test typecheck lint
pnpm -F @ziweiai/web build

# Han scan invariant
pnpm -F @ziweiai/web test cjk
```

## Acceptance Evidence

(điền sau khi merge — số test pass, ảnh chụp paywall modal, log apply migration,
output `pnpm why iztro` ở web)

```text
TBD
```

## Rollback Plan (story-level)

Nếu phát hiện regression sau merge:

1. **Tắt cờ ngay**: `AI_ANNUAL_REPORT_ENABLED=false` (đã default `false` nên
   bật mới phải đảo lại — set env và restart). Annual sẽ trả 402.
2. **Daily/Monthly không có gate** → nếu hỏng phải revert code (không có cờ tắt
   nhanh). Mitigation: 2 endpoint này thuần đọc, deterministic, ít rủi ro
   regression.
3. **Migration rollback**: chạy `000004_annual-reports.down.sql` (drop bảng
   annual_reports). Rollback an toàn vì không có FK ngược chiều từ bảng khác.
4. **Revert PR** nếu cần thiết — daily/monthly chỉ là code mới + 1 module
   `fortune/`, không sửa schema cũ → revert clean.

## Notes

- Annual report cache-hit KHÔNG re-gate (cùng triết lý US-010): nếu user đã
  trả tiền hoặc test free để sinh báo cáo, sau này off cờ → vẫn cho xem lại.
  Logic này phải có integration test xác nhận.
- Quota annual độc lập với quota explanations: 1 user dùng đủ annual không
  ngăn user dùng explanations bình thường.
- Han scan test (`apps/web/src/lib/text/cjk.ts`) áp cho cả 2 path: summary
  template (do `@ziweiai/core/text` render) + Markdown LLM (do prompt ép
  Việt). Nếu LLM rò Hán → test fail, revert hoặc tinh chỉnh prompt.
