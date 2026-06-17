# US-016 Vận thế theo thời gian: Vận ngày, Vận tháng, Báo cáo năm

## Status

planned

## Lane

high-risk

## Product Contract

Người dùng (kể cả phiên ẩn danh có lá số) có thể xem **vận thế theo mốc thời gian**
trên một lá số Tử Vi đã lưu:

- **Vận ngày** (`GET /charts/:id/daily?asOf=YYYY-MM-DD`) — tính cung lưu nhật + tứ
  hóa lưu nhật + render một đoạn văn ngắn tiếng Việt từ template thuần (KHÔNG gọi
  LLM, KHÔNG tốn ngân sách AI).
- **Vận tháng** (`GET /charts/:id/monthly?asOf=YYYY-MM`) — cung lưu nguyệt + tứ hóa
  lưu nguyệt + đoạn văn template tiếng Việt (KHÔNG LLM).
- **Báo cáo năm** (`POST /charts/:id/annual-report?year=YYYY`) — ghép lưu niên +
  12 lưu nguyệt rồi gọi LLM tổng hợp Markdown tiếng Việt. ĐÂY là đường tốn token
  cao nên gắn cờ riêng `AI_ANNUAL_REPORT_ENABLED` (mặc định `false`) + quota riêng
  `API_ANNUAL_REPORTS_PER_DAY_PER_USER` (mặc định `2`) + gate `assertCanUseAiExplanation`
  dùng chung quyết định `0010`. Có cache DB `annual_reports(chart_id, year)` để
  tránh sinh trùng cùng lá số + năm.

Port logic chạy ở server theo quyết định `0011` (web KHÔNG nhập engine — boundary
`0007`); web chỉ nhận snapshot qua `@ziweiai/contracts`. Không Hán hoá ra UI
(`docs/product/invariants.md` §2).

## Relevant Product Docs

- `docs/decisions/0011-horoscope-engine-boundary.md` (engine vận hạn server-side)
- `docs/decisions/0010-premium-ai-entitlement-flag.md` (gate AI premium + 402)
- `docs/decisions/0007-web-server-boundary.md` (web không nhập core/iztro)
- `docs/product/api-contract.md` (5 endpoint hiện tại — story này thêm 3 endpoint)
- `docs/product/invariants.md` §2 (ngôn ngữ Việt, không rò Hán)
- `.ref/taibu/src/app/api/annual-report/route.ts` (pattern endpoint nguồn)
- `.ref/taibu/src/app/{daily,monthly}/page.tsx` (UI nguồn — chỉ tham chiếu, không port nguyên)

## Story Packet

- [Overview](./overview.md)
- [Design](./design.md)
- [Exec Plan](./execplan.md)
- [Validation](./validation.md)

## Snapshot — Acceptance Criteria

- 3 endpoint hoạt động đúng contract: `GET /charts/:id/daily`, `GET /charts/:id/monthly`,
  `POST /charts/:id/annual-report`. Tất cả đều Bearer + ownership check + `chart_system='zi-wei-dou-shu'`
  guard.
- Daily/Monthly KHÔNG gọi LLM, KHÔNG tốn quota AI; vẫn dính rate-limit per-minute và
  daily-per-user chung của API.
- Annual report: gate qua `assertCanUseAiExplanation()` (cờ `AI_EXPLANATION_FREE_FOR_ALL`)
  **VÀ** cờ riêng `AI_ANNUAL_REPORT_ENABLED` (mặc định `false`) + quota
  `API_ANNUAL_REPORTS_PER_DAY_PER_USER` (mặc định `2`). Khi cờ off → 402
  `PAYMENT_REQUIRED`. Khi vượt quota → 429 `RATE_LIMITED`.
- Có bảng `annual_reports(id, chart_id, year, markdown, user_id, created_at)` + RLS
  owner-only + unique `(chart_id, year)`. Cache hit trả Markdown cũ KHÔNG gọi LLM.
- Contracts `@ziweiai/contracts/horoscope/*` mở rộng theo decision `0011`:
  `dailyFortuneResponseSchema`, `monthlyFortuneResponseSchema`, `annualReportResponseSchema`,
  `annualReportRequestSchema`.
- Web có 3 hàm api-client (`fetchDailyFortune`, `fetchMonthlyFortune`, `createAnnualReport`)
  + `apps/web/src/lib/features/fortune/` với `DailyFortuneCard.svelte`,
  `MonthlyFortuneCard.svelte`, `AnnualReportButton.svelte` (paywall reuse pattern US-010).
- I18n vi mới: nhãn vận ngày/tháng + tiêu đề báo cáo năm + paywall annual.
- Mọi văn bản render tới UI parse qua `apps/web/src/lib/text/cjk.ts` không có ký tự
  `\p{Script=Han}` (test bất biến §2 vẫn xanh).

## Validation

`scripts\bin\harness-cli.exe story update --id US-016 --unit 1 --integration 1 --e2e 1 --platform 1`

| Layer | Expected proof |
| --- | --- |
| Unit | engine port (daily/monthly/annual) giữ deterministic; gate annual 402 khi cờ off; quota annual 429 khi vượt |
| Integration | `GET /:id/daily` 200 + Việt; `GET /:id/monthly` 200 + Việt; `POST /:id/annual-report` 200 (cờ on) + cache hit lần hai; 402 khi cờ off; 403 khi không phải owner; 400 khi non-Tử-Vi |
| E2E | UI dashboard: card daily/monthly hiển thị; modal annual report mở + render Markdown; CTA paywall xuất hiện khi 402 |
| Platform | `pnpm -F @ziweiai/web check` + backend test xanh; migration `annual_reports` apply + rollback OK |
| Release | — |

## Harness Delta

Lane high-risk vì:

1. Đường tiền tệ (LLM) qua annual report — phải gate fail-closed cả 2 cờ
   (`AI_EXPLANATION_FREE_FOR_ALL` + `AI_ANNUAL_REPORT_ENABLED`); một cờ on, một
   cờ off → vẫn block.
2. Migration `annual_reports` (schema mới + RLS + unique constraint) — phải có
   forward + rollback và run cả hai trong CI.
3. Public contract mới (`@ziweiai/contracts/horoscope/*`) — đụng decision `0011`.
4. Quota riêng cho annual (`API_ANNUAL_REPORTS_PER_DAY_PER_USER=2`) — số thấp,
   sai lệch dễ gây spam ngân sách AI.

Bất biến giữ:

- `\p{Script=Han}` không xuất hiện trong response Việt (template + LLM prompt
  ép ngôn ngữ Việt theo `EXPLANATION_SYSTEM_PROMPT`).
- Web KHÔNG nhập `@ziweiai/core`/`@ziweiai/astro-engine`.
- Cache annual hit vẫn cho xem khi cờ off (theo US-010, cache-hit không re-gate).
- Daily/Monthly là **thuần đọc** + không LLM → rollback chỉ là revert code.

## Evidence

(điền sau khi merge)
