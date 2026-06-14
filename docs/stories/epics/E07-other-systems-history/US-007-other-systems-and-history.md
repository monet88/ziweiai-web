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

_(điền sau khi implement)_
