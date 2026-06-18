# Overview

## Current Behavior

Hiện tại lá số Tử Vi đã có snapshot tĩnh (`POST /charts`, `GET /charts/:id`) +
luận giải AI tổng quan/per-cung (`POST /explanations`). Web có thể hiển thị 12
cung Tử Vi + đại vận / lưu niên (đã có trong `horoscopeSchema` cũ tại
`packages/contracts/src/chart/chart-snapshot.ts`).

KHÔNG có:

- Endpoint trả "vận ngày" cho một mốc `YYYY-MM-DD` (cung lưu nhật + tứ hóa lưu
  nhật + đoạn văn tóm tắt tiếng Việt).
- Endpoint trả "vận tháng" cho mốc `YYYY-MM`.
- Endpoint trả "báo cáo năm" — Markdown tổng hợp lưu niên + 12 lưu nguyệt do LLM
  sinh, kèm cache.
- Bảng cache `annual_reports`.
- Cờ `AI_ANNUAL_REPORT_ENABLED` + quota `API_ANNUAL_REPORTS_PER_DAY_PER_USER`.

Trong `.ref/taibu` đã có sẵn pattern (`/daily`, `/monthly`, `/user/annual-report`),
nhưng kiến trúc taibu là Next.js route handler, dùng `requireUserContext` + service
role; story này port logic sang NestJS theo decision `0011` (engine ở
`@ziweiai/astro-engine` + service ở `apps/api/src/modules/fortune/`).

## Target Behavior

Sau khi merge story:

### 1. Vận ngày (Daily Fortune) — KHÔNG LLM

`GET /charts/:id/daily?asOf=YYYY-MM-DD` → `dailyFortuneResponseSchema`:

- `chartId`, `asOf`.
- `frame`: `horoscopeFrameSchema` chỉ chứa nhánh `daily` (cung lưu nhật + tứ hóa
  lưu nhật + tuổi nominal nếu có).
- `summary`: 1 đoạn văn ngắn tiếng Việt (~3-5 câu) render từ template thuần
  (`renderDailyCanonicalText` — port từ `@ziweiai/core/text` + i18n key cố định).
  Không gọi provider AI.
- Không tốn quota AI. Vẫn dính rate-limit chung per-minute.

### 2. Vận tháng (Monthly Fortune) — KHÔNG LLM

`GET /charts/:id/monthly?asOf=YYYY-MM` → `monthlyFortuneResponseSchema`:

- Tương tự daily, lát `monthly` của `horoscopeFrameSchema`.
- `summary`: đoạn văn template tiếng Việt cho lưu nguyệt.
- Không LLM, không quota AI.

### 3. Báo cáo năm (Annual Report) — CÓ LLM, gắn cờ riêng + quota riêng

`POST /charts/:id/annual-report?year=YYYY` → `annualReportResponseSchema`:

- `chartId`, `year`.
- `frame`: lưu niên + 12 lưu nguyệt của năm đó (qua `horoscopeFrameSchema`).
- `markdown`: Markdown tiếng Việt do LLM sinh (~600-1200 từ), tổng hợp xu hướng
  cả năm + điểm nóng theo từng tháng.
- Cache: `annual_reports(chart_id, year)` — lần đầu sinh, các lần sau trả cache.
- Gate trước khi sinh:
  1. Ownership chart.
  2. `chart_system='zi-wei-dou-shu'` (các hệ khác trả 400).
  3. `assertCanUseAiExplanation()` — cờ `AI_EXPLANATION_FREE_FOR_ALL` (chung) → 402
     khi off + chưa entitled.
  4. `AI_ANNUAL_REPORT_ENABLED=true` — cờ riêng cho đường này; mặc định `false`
     vì chi phí cao. Khi off → 402 với thông điệp riêng "Báo cáo năm AI tạm
     khoá ở giai đoạn beta".
  5. Quota `API_ANNUAL_REPORTS_PER_DAY_PER_USER` (default `2`) — vượt → 429
     `RATE_LIMITED`. Đường này KHÔNG dùng chung `API_EXPLANATIONS_PER_DAY_PER_USER`.
- Cache-hit (đã có row trong `annual_reports`) đi qua **trước** mọi gate cờ +
  quota — y hệt cache-hit của `/explanations` (decision `0010`): kết quả đã sinh
  thì cho xem, gate là cho lần sinh mới.

### Web UI

- `apps/web/src/lib/features/fortune/` thêm:
  - `DailyFortuneCard.svelte` — hiển thị ở trang chi tiết lá số Tử Vi: ngày hiện
    tại + cung lưu nhật + tứ hóa lưu nhật + đoạn văn template.
  - `MonthlyFortuneCard.svelte` — tương tự, tháng hiện tại.
  - `AnnualReportButton.svelte` — nút "Báo cáo năm" mở modal Markdown. Khi nhận
    `PAYMENT_REQUIRED` → render CTA paywall (reuse component đã có trong
    US-010, KHÔNG copy lại logic gate).
- I18n vi: `viCopy.fortune.daily.title`, `viCopy.fortune.monthly.title`,
  `viCopy.fortune.annual.title`, `viCopy.fortune.annual.paywallNote`,
  `viCopy.fortune.annual.featureLockedBeta`, …

## Affected Users

- Người dùng Tử Vi đã lưu lá số (logged-in OR anonymous theo decision `0009`).
- Người dùng KHÔNG có lá số Tử Vi → 3 endpoint trả 404 / 400 đúng hệ thống đã có.

## Affected Product Docs

- `docs/product/api-contract.md` — thêm 3 endpoint mới (cập nhật khi triển khai).
- `docs/product/invariants.md` §2 — không thay đổi, chỉ kiểm tra.
- `docs/decisions/0011-horoscope-engine-boundary.md` — đã chốt; story này
  consume.
- `docs/decisions/0010-premium-ai-entitlement-flag.md` — đã chốt; story này
  reuse pattern `assertCanUseAiExplanation()`.

## Non-Goals

- Cho phép chọn provider riêng cho annual report (tạm thời reuse provider router
  hiện tại; nếu cần model riêng → decision sau).
- Streaming Markdown annual report (giai đoạn này: chờ trọn rồi trả 1 cục).
- Lịch sử báo cáo năm trong sidebar `/history` (story sau).
- Daily/Monthly không có cache DB — tính lại mỗi request (rẻ vì engine
  deterministic + chỉ một mốc).
- Báo cáo tuần / báo cáo quý — không trong scope.
- Bazi annual report — story này khoá `chart_system='zi-wei-dou-shu'`.
