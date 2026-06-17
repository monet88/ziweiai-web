# US-014 Highlight đa màu vận hạn + flow-info đáy ô bàn Tử Vi

## Status

planned

## Lane

high-risk

## Product Contract

Trên bàn 12 cung Tử Vi, mỗi ô phải:

1. Nhận **highlight đa màu** cho 4 tầng vận hạn theo `asOf = hôm nay (server)`:
   đại vận (tím) / lưu niên (xanh dương) / lưu nguyệt (xanh lá) / lưu nhật (cam).
   Khi 1 ô là cung Mệnh của ≥ 2 tầng → vẽ thanh chỉ báo nhiều màu chia đều ở mép trên.
2. Hiển thị dòng **flow-info ở đáy ô**: 4 chip "Vận / Niên / Nguyệt / Nhật" với
   nội dung là can-chi-Việt (vd. `Giáp Tý`) cho cung tương ứng + dải tuổi đại vận
   (`24–33`) khi có. Mỗi chip dùng đúng màu của tầng tương ứng.

Dữ liệu vận hạn được tính **server-side** (decision `0011-horoscope-engine-boundary.md`),
trả về qua `POST /charts/:id/horoscope` với contract `horoscopeFrameSchema` mở rộng
(`decadal/yearly/monthly/daily`). Web KHÔNG tự tính vận hạn — chỉ render snapshot
nhận từ API.

US-014 là **story tiền đề kích hoạt decision 0011**: bao gồm cả việc mở rộng
contract `horoscopeFrameSchema` ở `@ziweiai/contracts`, wiring engine vận hạn ở
`apps/api`, và phát hành endpoint `POST /charts/:id/horoscope`. US-015 (panel
state-machine vận hạn) và US-016 (vận ngày / vận tháng / báo cáo năm) sẽ tiêu thụ
chính endpoint này.

## Relevant Product Docs

- `docs/decisions/0011-horoscope-engine-boundary.md` (quyết định gốc — bao gồm
  ranh giới engine + contract + endpoint mới)
- `docs/decisions/0007-web-server-boundary.md` (web chỉ import `@ziweiai/contracts`)
- `docs/decisions/0006-spec-vs-code-naming.md` (tên schema/route theo code thật)
- `docs/product/api-contract.md` (sẽ thêm `POST /charts/:id/horoscope`)
- `docs/product/invariants.md` (§1 boundary, §2 ngôn ngữ — chip flow-info phải Việt)

## Acceptance Criteria

- `packages/contracts`: `horoscopeFrameSchema` mở rộng từ `horoscopeSchema` hiện
  có, gồm `decadal: horoscopeItemSchema`, `age: horoscopeAgeItemSchema`,
  `yearly: horoscopeItemSchema`, `monthly?: horoscopeItemSchema`,
  `daily?: horoscopeItemSchema`. Snapshot cũ (chỉ `decadal/age/yearly`) vẫn parse
  OK (mở rộng tương thích ngược).
- `packages/contracts`: thêm `horoscopeRequestSchema`, `horoscopeResponseSchema`
  trong `packages/contracts/src/horoscope/`, export từ `index.ts`.
- `apps/api`: thêm `POST /charts/:id/horoscope` (controller + DTO + service):
  Bearer auth → ownership check (404 nếu không sở hữu) → quota sliding-window
  (cùng key `assertCanCreateChart`, KHÔNG đụng AI quota) → gọi
  `computeZiweiHoroscope({ snapshotId, asOf, scopes })` qua `@ziweiai/core` /
  `@ziweiai/astro-engine` → trả `horoscopeResponseSchema { chartId, asOf, frame }`.
- `apps/api`: chỉ chấp nhận `chartSystem === 'zi-wei-dou-shu'`; chart system khác
  → `400 INVALID_INPUT`.
- `apps/web`: `fetchChartHoroscope(token, chartId, asOf, scopes)` ở
  `lib/api-client/index.ts` (flat function) — parse response qua
  `horoscopeResponseSchema`.
- `apps/web`: helper thuần `buildPalaceFlowFlags(palace, frame)` ở
  `palace-view-builder.ts` (hoặc file chị em) — KHÔNG fetch, KHÔNG side-effect.
- `apps/web`: `PalaceCell` nhận thêm prop optional
  `flowFlags?: { decadal?: FlowChip; yearly?: FlowChip; monthly?: FlowChip; daily?: FlowChip }`.
  Khi có ≥ 1 flag → render thanh chỉ báo đa màu mép trên + dòng flow-info dưới
  cùng. Không có flag → render hệt US-008/011/012 (không hồi quy).
- `apps/web`: `PalaceGrid` quản lý `horoscopeFrame` (TanStack Query
  `['horoscope', chartId, asOf]`, staleTime dài), build map `palaceIndex → flags`,
  truyền xuống `PalaceCell`. Loading / lỗi không chặn render bàn (degrade gọn:
  vẫn hiện bàn không có flow-info).
- Mọi nhãn chip Việt: `Vận`, `Niên`, `Nguyệt`, `Nhật`. Can-chi qua
  `translateZiweiKey` đã có (fail-fast). Test scan `\p{Script=Han}` xanh.
- Boundary 0007: web KHÔNG `import` core/astro-engine/iztro/lunar-javascript;
  ESLint `no-restricted-imports` xanh.

## Design Notes

Story này KÍCH HOẠT decision 0011 nên có 4 lớp:

- **Contract** (`packages/contracts/src/horoscope/horoscope-frame.ts`,
  `horoscope-request.ts`, `horoscope-response.ts`): mở rộng tương thích
  ngược; reuse `horoscopeItemSchema` + `horoscopeAgeItemSchema` đã có ở
  `chart-snapshot.ts`.
- **Engine** (`@ziweiai/core` + `@ziweiai/astro-engine`): hàm
  `computeZiweiHoroscope({ snapshotId, asOf, scopes })` dùng iztro y hệt
  `.ref/taibu/packages/core/src/domains/ziwei-horoscope/calculate.ts`. Output
  parse được bằng `horoscopeFrameSchema`.
- **HTTP** (`apps/api/src/modules/charts/charts.controller.ts` +
  `services/charts.service.ts` mở rộng, hoặc module mới `horoscope/`): endpoint
  `POST /charts/:id/horoscope` với Bearer + ownership + quota cùng key
  `assertCanCreateChart`. Lỗi mã `INVALID_INPUT` / `NOT_FOUND` / `RATE_LIMITED`
  (đã có trong enum).
- **Web** (`apps/web/src/lib/api-client/index.ts`,
  `apps/web/src/lib/features/chart/palace-view-builder.ts`,
  `PalaceCell.svelte`, `PalaceGrid.svelte`): fetch helper + builder thuần + UI
  presentational. Tham chiếu đối chiếu UI: `.ref/taibu/src/components/ziwei/PalaceCard.tsx`
  (lấy ý đồ thanh chỉ báo + flow-info; KHÔNG copy literal Hán).

## Validation

`scripts\bin\harness-cli.exe story update --id US-014 --unit 1 --integration 1 --e2e 0 --platform 0`

| Layer | Expected proof |
| --- | --- |
| Unit | `horoscopeFrameSchema` parse cũ + mới; `buildPalaceFlowFlags` thuần với 4 case (1 cung trùng nhiều tầng / chỉ decadal / không match / snapshot bazi → trả {}) |
| Integration | `POST /charts/:id/horoscope` flag scope đầy đủ → 200 + frame; ownership sai → 404; chart bazi → 400; quota over → 429 |
| E2E | Mở 1 lá số (fixture có asOf cố định) → thấy thanh chỉ báo đa màu trên ≥ 1 ô + 4 chip flow-info đúng màu, đúng can-chi |
| Platform | (deferred — chạy chung với US-015 panel) |
| Release | — |

## Sub-files

- [overview.md](./overview.md)
- [design.md](./design.md)
- [execplan.md](./execplan.md)
- [validation.md](./validation.md)

## Harness Delta

Lane high-risk: chạm public contract (`@ziweiai/contracts` mở rộng), thêm endpoint
mới ở `apps/api`, kích hoạt engine `@ziweiai/core` mới — đây là tiền đề cho
backlog #14 + #15 + #18. Đã có decision `0011`. Bất biến: nhãn Việt (`Vận`,
`Niên`, `Nguyệt`, `Nhật` + can-chi Việt), web không import engine, snapshot cũ
vẫn parse. Rủi ro lớn nhất: contract `horoscopeFrameSchema` đặt sai chỗ → trùng
`horoscopeSchema` cũ; mitigation: reuse `horoscopeItemSchema` + đặt schema mới ở
package mới `horoscope/`, KHÔNG sửa `chart-snapshot.ts` ngoài việc export lại.

## Evidence

(Trống — bổ sung sau khi validation pass.)
