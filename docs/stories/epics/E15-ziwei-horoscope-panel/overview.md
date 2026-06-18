# Overview

## Current Behavior

Trang chi tiết Tử Vi (`apps/web/src/lib/features/chart/ChartDetailScreen.svelte`) ở
US-006 + US-008 + US-011 mới có:

- Bàn 12 cung tĩnh dựng từ `snapshot.palaces` (mỗi ô có `decadalRange` + `ages` lấy từ
  snapshot gốc — chỉ là metadata bản mệnh, không liên quan tới vận hạn theo thời
  gian).
- Lớp overlay đường nối tam phương tứ chính của một cung đang chọn (`inAspect` +
  hover dim). Đây là **không gian bản mệnh**, KHÔNG phải vận hạn.
- Không có cách nào cho người dùng chọn một mốc thời gian (đại vận / lưu niên / lưu
  nguyệt / lưu nhật) để xem cung Mệnh vận của mốc đó.
- US-014 đã đặt nền backend: contract `horoscopeFrameSchema` (mở rộng tương thích
  ngược với `monthly` + `daily`), endpoint `POST /charts/:id/horoscope`,
  `fetchChartHoroscope()` ở api-client. Web mới dùng nó cho 1 mốc mặc định = năm
  hiện tại (flow-info ô).

Tham chiếu thực taibu (`.ref/taibu/src/components/ziwei/ZiweiHoroscopePanel.tsx`) đã
có panel 4 tầng: chọn đại vận → render 12 nút lưu niên → click lưu niên → render 12
nút lưu nguyệt → click lưu nguyệt → render 28–31 nút lưu nhật. Chọn tầng cao reset
tầng thấp; click lại đúng chip = bỏ chọn (toggle).

## Target Behavior

Cạnh bàn 12 cung, web hiển thị `ZiweiHoroscopePanel.svelte` gồm 4 vùng dọc theo thứ tự:

1. **Đại vận** (10 giai đoạn 10 năm — lấy từ `snapshot.palaces[*].decadalRange` đã có
   sẵn trong snapshot bản mệnh, KHÔNG cần gọi engine).
2. **Lưu niên** (12 chip = 12 năm bên trong đại vận đang chọn — mỗi năm 1 call API
   `POST /charts/:id/horoscope` với `asOf = year-06-15` lấy `yearly`).
3. **Lưu nguyệt** (12 chip tháng âm của lưu niên đang chọn — gọi API với
   `asOf = year-month-15` lấy `monthly`).
4. **Lưu nhật** (28–31 chip ngày của lưu nguyệt đang chọn — gọi API với
   `asOf = year-month-day` lấy `daily`).

Mỗi tầng:

- Mặc định: tầng đại vận = đại vận chứa năm hiện tại (auto-select); 3 tầng còn lại
  `undefined` (chưa chọn).
- Click chip → set tầng đó = chip đang click; reset 3 tầng dưới về `undefined`.
- Click lại đúng chip đang chọn → toggle về `undefined` (như taibu `DESELECT_*`).

Bàn 12 cung nhận thêm prop `horoscopeOverlay` (tách biệt với `inAspect` của US-011):

- 4 màu khác nhau cho cung Mệnh vận của 4 tầng (đại vận = vàng, lưu niên = xanh, lưu
  nguyệt = tím, lưu nhật = hồng); nhiều tầng cùng trỏ về 1 cung → stack viền (nhiều
  layer border-color theo `box-shadow` inset hoặc `outline-offset` chồng).
- Khi không tầng nào chọn → overlay rỗng → bàn về trạng thái US-011 thuần (auto-Mệnh
  + tam phương tứ chính). KHÔNG đè lên `inAspect` (hai overlay sống chung).

API call: TanStack Query cache theo `['horoscope', chartId, asOf, scopesKey]`,
`staleTime: Infinity` (vận hạn deterministic theo `chartId + asOf`). Đổi đại vận
hủy chip lưu niên/nguyệt/nhật → query không refetch (key khác).

Mọi nhãn (đại vận, lưu niên, lưu nguyệt, lưu nhật, "10 năm", tên cung Mệnh vận, can
chi) đều tiếng Việt qua `translateZiweiKey` (fail-fast). Bàn 12 cung tiếp tục pass
CJK guard test (`\p{Script=Han}` = 0).

## Affected Users

- Người dùng đã đăng nhập (Bearer): mở chi tiết lá số Tử Vi → muốn xem vận hạn theo
  mốc thời gian thay vì chỉ bản mệnh tĩnh.
- Người dùng anon (US-009): tương tự, nhưng quota gọi `/charts/:id/horoscope` áp
  cùng quota ownership với chart anon-session.

## Affected Product Docs

- `docs/product/api-contract.md` — section `/charts/:id/horoscope` đã có ở US-014;
  story này KHÔNG mở rộng nó. Chỉ thêm note: web tiêu thụ tất cả 4 scope.
- `docs/product/invariants.md` §2 (ngôn ngữ Vi) — bổ sung khẳng định: chip vận hạn
  cũng phải pass CJK guard.
- `docs/stories/README.md` — cập nhật trạng thái US-015 từ planned → implemented sau
  khi xong.

## Non-Goals

- Báo cáo năm AI (port `/api/annual-report` của taibu) — đó là **US-016** + cần cờ
  `AI_ANNUAL_REPORT_ENABLED` riêng. Story này chỉ panel chọn mốc + highlight, KHÔNG
  gắn LLM.
- Cache vận hạn ở DB cho `daily`/`monthly` — tối ưu sau, decision riêng (đã ghi
  trong `0011`).
- Vẽ đường nối tam phương tứ chính cho cung Mệnh vận (chỉ vẽ cho cung bản mệnh đang
  chọn ở US-011). Story này chỉ tô viền/nền cung Mệnh vận, không thêm SVG line.
- Thêm endpoint mới ở `apps/api`. Mọi nhu cầu compute thêm tầng → backlog.
- Thay đổi snapshot `decadalRange` của bản mệnh (lấy nguyên từ `snapshot.palaces`,
  KHÔNG sửa shape).
