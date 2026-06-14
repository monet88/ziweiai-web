# 0006 SPEC vs Code Naming — code thật là nguồn sự thật

Date: 2026-06-14

## Status

Accepted

## Context

`SPEC.md` (Section 4 — kiến trúc web) chứa các ví dụ minh hoạ về tên schema, route,
và cấu hình. Khi đối chiếu với code thật trong repo nguồn (`F:/CodeBase/ziweiai`), phát
hiện 3 điểm lệch:

1. **Tên schema**: SPEC §13 minh hoạ `ChartHistoryResponseSchema`,
   `ChartDetailResponseSchema` (PascalCase) và gọi `apiClient.charts.listHistory()`
   (object lồng). Code thật `packages/contracts` export camelCase:
   `historyListResponseSchema`, `chartDetailResponseSchema`. Expo api-client dùng hàm
   phẳng `fetchHistory()` / `fetchChartDetail()`, không object lồng.
2. **`staleTime`**: SPEC §7 ghi `30_000`. Nguồn thật
   `apps/app/src/lib/query-client.ts` = `30_000`. → chốt `30_000`.
3. **Route đăng nhập**: SPEC §5 dùng `/login`; nguồn Expo dùng `sign-in.tsx`.
   Mâu thuẫn nội bộ.

## Decision

- **Code thật > SPEC** khi xung đột về tên cụ thể. SPEC là *input material* (theo
  mô hình Harness), không phải hợp đồng tên chính xác. Khi SPEC minh hoạ lệch code, dùng
  tên trong code.
- **Schema/api-client**: dùng tên camelCase từ `@ziweiai/contracts` và hàm phẳng từ
  Expo api-client. Ghi rõ trong `docs/product/api-contract.md`.
- **`staleTime` = `30_000`** (theo SPEC §7 + nguồn thật).
- **Route đăng nhập = `/sign-in`** (theo nguồn Expo). Sửa SPEC §5 reference
  khi viết product docs; product doc `overview.md` đã chốt `/sign-in`.

## Alternatives Considered

1. Theo sát SPEC từng chữ. Bị loại: SPEC là minh hoạ, sẽ tạo code không khớp contracts
   thật → vỡ build/type.
2. Giữ nguyên mâu thuẫn, quyết định lúc code. Bị loại: lặp lại reasoning ở mỗi phase,
   đúng loại friction Harness muốn diệt.

## Consequences

Positive:

- Một nguồn sự thật rõ ràng cho tên schema/route/config.
- Tránh schema drift và sai type ở Phase 2+.

Tradeoffs:

- SPEC.md không còn khớp 1:1 với product docs; phải nhớ SPEC là input material.

## Follow-Up

- Product docs `api-contract.md` + `overview.md` ghi tên thật.
