# 0015 Ẩn toạ độ + múi giờ khỏi BirthForm cho bản Việt Nam

Date: 2026-06-20

## Status

Accepted

## Context

`BirthForm` (apps/web) bắt người dùng nhập vĩ độ, kinh độ, múi giờ và tên địa
điểm thủ công. Với người dùng Việt Nam đây là gánh nặng thừa:

- Engine tính lá số (`iztro` qua `astro-engine`) **không dùng toạ độ**. Kiểm
  chứng: `buildZiweiAstrolabeSource` chỉ truyền date + timeIndex + gender +
  isLeapMonth vào `astro.bySolar/byLunar`. Grep `apps/api` không có file
  production nào đọc latitude/longitude.
- Thứ engine thực sự cần là `timezone` — để quy giờ sinh → mốc UTC
  (`normalizeBirthInput` dựng `Temporal.ZonedDateTime`).
- Toạ độ chỉ phục vụ "true solar time" (真太阳时), mà tính năng này đang
  `trueSolarTime.status = 'deferred'` — chưa bật ở bất kỳ engine nào trong repo.
- Repo gốc tham chiếu còn lỏng hơn: `taibu` để `longitude?` optional (thiếu vẫn
  dựng lá số — `.ref/taibu/packages/core/src/domains/ziwei/shared.ts:223`),
  `xuanshu` không dùng toạ độ cho module Tử Vi. Ràng buộc "bắt buộc toạ độ" là
  quyết định riêng của repo này, không kế thừa từ gốc.
- Ràng buộc còn lại: `manualCoordinatesSchema` (@ziweiai/contracts) bắt buộc cả
  latitude + longitude + timezone (không nullable), và snapshot thiếu
  `place.manual` sẽ bị gắn cờ `PLACE_UNRESOLVED` → `level: 'blocked'`.

## Decision

Ẩn toàn bộ trường địa điểm (tên nơi sinh, vĩ độ, kinh độ, múi giờ) khỏi
`BirthForm`. `createBirthFormDraft` điền sẵn mặc định Việt Nam:

- `timezone = 'Asia/Ho_Chi_Minh'`
- `latitude = '10.8231'`, `longitude = '106.6297'` (trung tâm TP.HCM — giá trị
  mồi, không ảnh hưởng kết quả khi true solar time đang tắt)
- `placeLabel = 'Việt Nam'`

`buildCreateChartRequest` vẫn gửi `place.manual` đầy đủ để snapshot không rơi
vào `blocked`. KHÔNG đụng `manualCoordinatesSchema` / backend. Đồng thời đổi
3 ô số ngày/tháng/năm sang dropdown (`SelectField`) cho dễ chọn.

## Alternatives Considered

1. **Cho lat/long nullable trong `manualCoordinatesSchema`** (giống `taibu`).
   Đúng về bản chất nhưng chạm contract dùng chung api+web + backend +
   backward-compat snapshot cũ → high-risk, hoãn (xem Follow-Up).
2. **Xoá hẳn true solar time + toạ độ khỏi contract.** Phá nhiều package
   (contracts/core/astro-engine/persistence), cần migration ngược, vứt hạ tầng
   feature tương lai. Bác bỏ.
3. **Thu vào mục "Nâng cao" có thể mở.** Vẫn giữ UI phức tạp; người dùng VN
   không cần. Bác bỏ — ẩn hẳn gọn hơn.

## Consequences

Positive:

- Form chỉ còn: hệ lá số, ngày/tháng/năm (dropdown), lịch, giới tính, giờ sinh.
- Lá số không còn bị `blocked` vì lý do địa điểm.
- Không đụng contract → rủi ro thấp, không cần migration.

Tradeoffs:

- Người sinh ngoài VN tạm thời nhận timezone/toạ độ VN (sai lệch true solar time
  tương lai). Hiện không ảnh hưởng vì true solar time đang tắt.
- `BirthFormDraft` vẫn giữ field latitude/longitude/timezone/placeLabel (điền
  hằng số) — chưa dọn sạch khỏi type để tránh chạm `buildCreateChartRequest`.

## Follow-Up

- Khi làm geocoding theo địa điểm thật: bật lại nhập địa điểm + cân nhắc
  Alternative 1 (lat/long nullable) trước khi bật true solar time.
- Nếu hỗ trợ sinh ngoài VN: thêm chọn quốc gia/timezone, không hardcode.
