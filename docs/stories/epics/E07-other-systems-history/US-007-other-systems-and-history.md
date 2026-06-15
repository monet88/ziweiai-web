# US-007 5 hệ thuật số khác + history + chốt guard Hán

## Status

planned

## Lane

normal

## Product Contract

Hoàn thiện 5 hệ còn lại (BaZi/MeiHua/LiuYao/DaLiuRen/QiMen) + trang lịch sử đầy đủ, và
chốt test quét chữ Hán toàn cục. Sau story: tất cả Success Criteria của dự án đạt.

## Relevant Product Docs

- `SPEC.md` Phần C — Phase 8, Success Criteria
- `docs/product/api-contract.md` (`fetchHistory` limit 1-50 default 20)
- `docs/product/invariants.md` (test quét Hán toàn cục, không secret ở client)

## Acceptance Criteria

- 5 route wrapper hoạt động: tạo lá số mỗi hệ → xem chi tiết → quay lại history thấy
  item mới.
- Trang chi tiết chọn đúng detail card theo `chartSystem` của snapshot.
- `tests/no-han-characters.test.ts` quét `\p{Script=Han}` trên output đại diện toàn hệ
  xanh; key thiếu → throw.
- Grep `SERVICE_ROLE`/`DEEPSEEK`/`GEMINI` trong `src/` → không kết quả (secret không lọt
  client bundle).
- `pnpm build` + `tsc --noEmit` + `pnpm check` xanh.

## Design Notes

- 5 route wrapper mỏng: tái dùng `dashboard-model` + `BirthForm` (US-005) với
  `initialChartSystem` + copy/nhãn riêng từng hệ (registry US-003). KHÔNG fork logic.
- Detail card mỗi hệ: presentational, breakpoint bằng CSS media query.
- `history-model.svelte.ts`: `createQuery` fetchHistory limit 20; `HistoryList` link mỗi
  item tới route chi tiết đúng hệ; empty/loading/error dùng primitive US-004.

## Validation

`scripts\bin\harness-cli.exe story update --id US-007 --unit 1 --integration 0 --e2e 1 --platform 0`

| Layer | Expected proof |
| --- | --- |
| Unit | `no-han-characters.test.ts` toàn hệ + test logic thuần |
| Integration | — |
| E2E | mỗi hệ: tạo → chi tiết → history thấy item mới |
| Platform | `pnpm build` + `tsc --noEmit` + `pnpm check` xanh |
| Release | xác nhận đủ Success Criteria toàn dự án |

## Harness Delta

Chốt test Hán toàn cục là proof cuối cho bất biến ngôn ngữ. Card hệ thiếu field → empty
state, ghi gap vào backlog (không crash).

## Evidence

Implement xong toàn bộ phạm vi story:

- **5 detail card** (`BaziDetailCard`, `MeihuaDetailCard`, `LiuyaoDetailCard`,
  `DaliurenDetailCard`, `QimenDetailCard`) — presentational thuần, dispatch theo
  `getChartDetailState(chartSystem)` trong `ChartDetailScreen`. Kỳ Môn dựng lưới cửu cung 3x3
  (Lạc Thư) qua `buildQimenPalaceCells`.
- **5 route wrapper** (`/bazi`, `/meihua`, `/liuyao`, `/daliuren`, `/qimen`) tái dùng
  `SystemChartScreen` (mỏng) + `dashboard-model` + `BirthForm` với `initialChartSystem` riêng —
  KHÔNG fork logic tạo lá số.
- **Trang `/history`** đầy đủ (limit 20) + `HistoryList`; nav lối tắt 5 hệ + link lịch sử ở
  dashboard sidebar (thẻ `<a href={resolve(...)}>`).
- **Guard Hán toàn cục**: `guardFreeText` (qua `normalizeLegacyDisplayName`) cho chuỗi tự do từ
  engine (naYin, tên/ký hiệu quẻ Lục Hào, phục thần). Test `no-han-characters.test.ts` dựng
  fixtures 5 hệ con (key hợp lệ) chạy mọi formatter + quét `\p{Script=Han}` = 0.

Validation đã chạy xanh:

- Unit: `pnpm -F @ziweiai/web test` → 103 pass (16 file), gồm `no-han-characters.test.ts`.
- Platform: `pnpm -F @ziweiai/web check` (0/0), `lint` (0), `build` xanh.
- Bảo mật: grep `SERVICE_ROLE|DEEPSEEK|GEMINI|OPENAI_COMPAT` trong `src/` chỉ thấy comment cảnh
  báo ở `env.ts` (tên biến, không phải giá trị); grep trong `build/` → 0.
- E2E: `us-007-other-systems-history.spec.ts` (backend NestJS + Supabase local thật) → 1 pass,
  5 hệ: tạo → chi tiết VN không Hán → history thấy item mới.

Bug phát hiện qua E2E (đã fix): tạo lá số không invalidate query `['history']` (staleTime 30s)
→ tạo liên tiếp nhiều hệ thì `/history` trả cache cũ thiếu lá số mới. Fix: `dashboard-model`
nhận `queryClient` + `invalidateQueries({ queryKey: ['history'] })` trong `onSuccess`. Chi tiết:
`docs/postmortems/2026-06-15-history-cache-staleness.md`.
