# 0011 Engine vận hạn (đại vận / lưu niên / lưu nguyệt / lưu nhật / vận ngày / vận tháng / báo cáo năm) chạy server-side, web nhận snapshot qua contract

Date: 2026-06-17

## Status

Accepted

## Context

Backlog #14 (highlight đa màu vận hạn + flow-info trên ô Tử Vi), #15 (panel chọn đại
vận → lưu niên → lưu nguyệt → lưu nhật, port từ `.ref/taibu`
`ZiweiHoroscopePanel.tsx`), và #18 (vận ngày / vận tháng / báo cáo năm, port từ taibu
`/daily`, `/monthly`, `/user/annual-report`) đều cần dữ liệu vận hạn theo mốc thời
gian: từ một lá số gốc + một mốc (năm dương / tháng / ngày), tính ra cung Mệnh vận,
12 cung vận, các sao tứ hóa vận, tuổi nominal, và (cho US-016) văn bản tổng hợp.

Tham chiếu thực:

- `.ref/taibu/packages/core/src/domains/ziwei-horoscope/calculate.ts` —
  `buildZiweiHoroscopeCanonicalJSON` chạy lõi `iztro` ở server, trả đại vận / lưu
  niên / lưu nguyệt / lưu nhật.
- `.ref/taibu/src/app/api/{daily,monthly,annual-report}/route.ts` — Next.js route
  handler gọi engine + (annual) gọi LLM.
- `packages/contracts/src/chart/chart-snapshot.ts` (l. 475-491) ĐÃ CÓ
  `horoscopeSchema` cho 1 mốc (`decadal` + `age` + `yearly`); `palaceSchema` đã có
  `decadalRange` và `ages`. Chưa có `monthly` / `daily` / nguồn nhiều mốc cùng lúc.
- `apps/web` BỊ CHẶN nhập `@ziweiai/core`, `@ziweiai/astro-engine`, `iztro`,
  `lunar-javascript` (`docs/decisions/0007-web-server-boundary.md` — ESLint
  `no-restricted-imports` + bundle bloat + Han characters).

Hệ quả: web KHÔNG được tự tính vận hạn. Mọi tính toán phải ở `apps/api` qua
`@ziweiai/astro-engine`/`@ziweiai/core`, web chỉ nhận snapshot đã chuẩn hoá qua
`@ziweiai/contracts`.

## Decision

- Lõi tính vận hạn (`computeZiweiHoroscope({ snapshotId, asOf })`) đặt ở
  `@ziweiai/core` + `@ziweiai/astro-engine`, gọi `iztro` y hệt taibu. Không port
  logic sang web (giữ [[0007-web-server-boundary]]).
- Mở rộng `horoscopeSchema` trong `packages/contracts/src/chart/chart-snapshot.ts`
  thành `horoscopeFrameSchema` (mọi tầng đại vận / lưu niên / lưu nguyệt / lưu nhật
  cùng kiểu `horoscopeItemSchema`) + thêm field `monthly` và `daily` ở mức optional.
  Đây là **mở rộng tương thích ngược**: snapshot cũ (chỉ `decadal/age/yearly`) vẫn
  parse OK; snapshot mới gắn thêm `monthly?` + `daily?` khi API tính kèm.
- Thêm endpoint mới ở `apps/api`:
  - `POST /charts/:id/horoscope` — body `{ asOf: ISO date, scopes: ['decadal',
    'yearly', 'monthly', 'daily'] }` → trả `horoscopeFrameSchema` đã expand. Trên
    cùng `chartSystem='zi-wei-dou-shu'`. Bearer auth + ownership check + quota
    sliding-window cùng key với `assertCanCreateChart` (rẻ, không gọi LLM).
  - `GET /charts/:id/daily?asOf=YYYY-MM-DD` — vận ngày (US-016). Cache theo
    `(chartId, asOf)` ở DB nếu cần (decision riêng, không bắt buộc trong story này).
  - `GET /charts/:id/monthly?asOf=YYYY-MM` — vận tháng.
  - `POST /charts/:id/annual-report` — báo cáo năm; ghép `computeZiweiHoroscope`
    (lưu niên + 12 lưu nguyệt) + LLM. Áp `assertCanUseAiExplanation` y hệt
    `/explanations` (ngân sách AI cùng cờ `AI_EXPLANATION_FREE_FOR_ALL`).
- Thêm contract mới `packages/contracts/src/horoscope/`:
  - `horoscope-frame.ts` (extend `horoscopeSchema` + monthly/daily).
  - `horoscope-request.ts` (`horoscopeRequestSchema`,
    `dailyFortuneRequestSchema`, `monthlyFortuneRequestSchema`,
    `annualReportRequestSchema`).
  - `horoscope-response.ts` (response envelope kèm `chartId` + `asOf`).
- Web NHẬN dữ liệu này qua `apps/web/src/lib/api/api-client.ts`
  (`fetchChartHoroscope`, `fetchDailyFortune`, `fetchMonthlyFortune`,
  `createAnnualReport`) — giữ nguyên flat-function pattern. Hiển thị trên UI là
  thuần presentational.

## Alternatives Considered

1. **Tự tính vận hạn ở web bằng helper thuần** — vi phạm
   [[0007-web-server-boundary]]: `iztro` kéo Han + bundle nặng. ESLint chặn.
   Loại.
2. **Mở rộng `chart-snapshot.ts` để API trả luôn 4 tầng vận hạn cho mặc định**
   (kèm `decadalAt`, `monthlyAt`...) — phình snapshot, mỗi lần đổi `asOf` lại phải
   `POST /charts` (đắt + sai semantic). Endpoint riêng `POST /charts/:id/horoscope`
   để client chọn `asOf` rồi compute on-demand giữ `chart-snapshot` ổn định.
3. **Cache vận hạn ở client memory** — chỉ là tối ưu UX, vẫn cần endpoint nguồn.
   Để TanStack Query cache theo `['horoscope', chartId, asOf]`.

## Consequences

Positive:

- Web KHÔNG vi phạm boundary 0007; bundle không tăng.
- 3 backlog (#14, #15, #18) chia sẻ chung 1 engine + 1 contract → DRY.
- Annual report gắn cùng `AI_EXPLANATION_FREE_FOR_ALL` → ngân sách AI có 1 chỗ tắt.

Tradeoffs:

- Mỗi lần user đổi mốc trong panel vận hạn → 1 round-trip API (latency phụ thuộc
  mạng). Mitigate bằng prefetch + TanStack Query staleTime dài (vận hạn deterministic
  theo `chartId + asOf`).
- Endpoint mới = mặt API mới = rủi ro phải bảo trì version sau này. Giữ tối thiểu:
  4 endpoint horoscope (thay vì 1 endpoint mỗi tầng), đặt sau cùng 1 prefix
  `/charts/:id/...`.
- Annual report tốn LLM token đáng kể (kèm 12 lưu nguyệt). Phải đặt quota riêng +
  feature flag riêng (`AI_ANNUAL_REPORT_ENABLED` mặc định `false` lúc test).

## Follow-Up

- US-014 (`docs/stories/epics/E14-ziwei-flow-info`) — port flow-info ô + highlight
  đa màu, dùng `fetchChartHoroscope` cho 1 `asOf` mặc định = năm hiện tại.
- US-015 (`docs/stories/epics/E15-ziwei-horoscope-panel`) — panel state machine
  (đại vận → lưu niên → lưu nguyệt → lưu nhật), gọi `fetchChartHoroscope` cho mỗi
  bước.
- US-016 (`docs/stories/epics/E16-time-fortune-reports`) — vận ngày, vận tháng, báo
  cáo năm; gắn cờ `AI_ANNUAL_REPORT_ENABLED` vào `apps/api/src/config/env.ts`.
- Cần decision riêng nếu chốt cache DB cho daily/monthly (chưa cấp thiết).
