# Overview

## Current Behavior

Bàn 12 cung Tử Vi hiện (US-008 / US-011 / US-012) hiển thị tĩnh **một** lát cắt
duy nhất là lá số gốc:

- Mỗi `PalaceCell` chỉ tô màu sao theo `brightness/mutagen/group` (US-012) +
  highlight tam phương tứ chính của cung đang chọn (US-011).
- Footer ô chỉ có 3 meta: `changsheng` (Trường Sinh), `decadalRange`
  (`24–33`), `ages` (danh sách tuổi phụ).
- KHÔNG có khái niệm "vận hạn theo mốc thời gian": ô không biết hôm nay là cung
  Mệnh đại vận / lưu niên / lưu nguyệt / lưu nhật của ai.
- Snapshot trong `packages/contracts/src/chart/chart-snapshot.ts` đã có sẵn
  `horoscopeSchema` (`decadal/age/yearly`) ở mức optional nhưng **chưa được
  endpoint nào trả về** và **chưa được UI nào tiêu thụ**.

Hệ quả: người xem không biết "hôm nay mình đang đi cung nào", phải mở thủ công
một panel khác (chưa tồn tại) — đây cũng là lý do backlog #15 và #16 bị block
chờ engine vận hạn.

## Target Behavior

Sau US-014, bàn 12 cung Tử Vi tự động phản ánh **lát cắt thời gian = hôm nay
(server)**:

- `PalaceCell` của cung Mệnh đại vận → khung tím + thanh chỉ báo tím mép trên +
  chip "Vận `<can-chi>` `<24–33>`" ở footer.
- `PalaceCell` của cung Mệnh lưu niên → khung xanh dương + thanh xanh +
  chip "Niên `<can-chi>`".
- `PalaceCell` của cung Mệnh lưu nguyệt → khung xanh lá + thanh xanh lá +
  chip "Nguyệt `<can-chi>`".
- `PalaceCell` của cung Mệnh lưu nhật → khung cam + thanh cam + chip "Nhật
  `<can-chi>`".
- Khi 1 ô là cung Mệnh của ≥ 2 tầng → thanh chỉ báo chia đều theo số tầng (mỗi
  tầng 1 mảnh màu), khung dùng nền gradient nhẹ. Footer hiển thị đủ chip của
  các tầng trùng.

Engine vận hạn chạy server-side qua endpoint mới `POST /charts/:id/horoscope`
(decision `0011`), web fetch 1 lần với `asOf = hôm nay (server)` rồi cache qua
TanStack Query `['horoscope', chartId, asOf]`. Khi fetch lỗi / chưa xong → bàn
vẫn render bình thường (không có flow-info), KHÔNG chặn UX.

## Affected Users

- Người dùng đã đăng nhập (anon hoặc email) đang xem chi tiết một lá số Tử Vi
  qua `ChartDetailScreen`.
- Người dùng anon (decision `0009`) — vẫn được dùng vì endpoint mới chia sẻ
  quota `assertCanCreateChart` (rẻ, không gọi LLM).
- KHÔNG ảnh hưởng người xem các hệ khác (Bát Tự / Lục Hào / Đại Lục Nhâm /
  Kỳ Môn / Mai Hoa) — endpoint từ chối chart system khác.

## Affected Product Docs

- `docs/product/api-contract.md` — thêm dòng `POST /charts/:id/horoscope`,
  body `horoscopeRequestSchema`, response `horoscopeResponseSchema`. Cập nhật
  cùng PR.
- `docs/product/invariants.md` — không đổi nội dung; chip flow-info phải Việt
  vẫn nằm trong §2 ngôn ngữ hiện có.
- `docs/product/overview.md` — bổ sung 1 đoạn mô tả "lát cắt thời gian trên
  bàn Tử Vi" trong mục tính năng.
- `docs/decisions/0011-horoscope-engine-boundary.md` — đã `Accepted`; story này
  là phần triển khai đầu tiên.

## Non-Goals

- **Panel chọn vận hạn tương tác**: chọn `asOf` qua UI (đại vận → lưu niên →
  lưu nguyệt → lưu nhật) thuộc US-015, KHÔNG nằm trong US-014. US-014 mặc định
  `asOf = hôm nay (server)` và chỉ xem 1 chiều.
- **Vận ngày / vận tháng / báo cáo năm**: thuộc US-016, KHÔNG nằm trong
  US-014. Endpoint `GET /charts/:id/daily`, `GET /charts/:id/monthly`,
  `POST /charts/:id/annual-report` chưa cần phát hành ở story này.
- **Gắn AI explanation theo vận hạn**: US-014 chỉ render visual, KHÔNG gọi
  `/explanations` với scope vận hạn. Tích hợp scope mới vào AI là decision
  riêng (sẽ phát sinh sau US-015).
- **Cache DB cho horoscope**: TanStack Query in-memory đủ; cache server-side ở
  `chart_snapshots` hoặc bảng riêng là decision sau, KHÔNG nằm trong US-014.
- **Mở rộng `chart-snapshot.ts` ngoài `horoscopeFrameSchema`**: `monthly` và
  `daily` là field optional **trong package mới** `horoscope/`, KHÔNG vá thêm
  field vào `chartSnapshotSchema` (giữ snapshot ổn định).
- **Đổi UI tam phương tứ chính (US-011) hoặc tô màu sao (US-012)**: giữ
  nguyên, chỉ thêm 1 lớp visual mới (thanh chỉ báo + chip footer) nằm cạnh
  các lớp đã có.
