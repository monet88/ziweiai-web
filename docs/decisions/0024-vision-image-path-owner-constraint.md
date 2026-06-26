# 0024 Ràng buộc DB cho vision_results.image_path theo owner — vá rò rỉ ảnh sinh trắc xuyên người dùng của 0023

Date: 2026-06-26

## Status

Accepted

## Context

[[0023-vision-history-persistence]] thêm bảng `vision_results` (RLS owner-only) và đọc lại ảnh
sinh trắc qua signed URL ngắn hạn. RLS insert chỉ kiểm `auth.uid() = owner_user_id` — KHÔNG ràng
buộc `image_path`. Lỗ hổng (review PR #41 — cubic P1, confidence 7):

- Một người dùng có JWT hợp lệ của chính mình có thể INSERT một row với `owner_user_id = self`
  nhưng `image_path = '{victim_id}/...jpg'` (đường dẫn ảnh của người khác). RLS insert vẫn cho qua
  vì `owner_user_id` đúng là chính họ.
- Khi liệt kê lịch sử, `HistoryService` ký `image_path` đó bằng **service-role client** —
  client này **bỏ qua Storage RLS** — và trả signed URL về cho kẻ tấn công. Kết quả: rò rỉ ảnh
  chân dung / lòng bàn tay (dữ liệu sinh trắc) của người dùng khác.

Code hiện luôn dựng path dạng `'{ownerUserId}/{requestId}.{ext}'` (`vision-storage.gateway`) nên
khai thác không xảy ra hôm nay, nhưng sự an toàn của bucket private đang **phụ thuộc hoàn toàn vào
code đúng**, không có hàng rào ở tầng dữ liệu. Đây là điểm load-bearing về cô lập sinh trắc nên
phải siết tại DB, không tự nới.

## Decision

- Thêm `CHECK constraint` `vision_results_image_path_owner_scoped` (migration `000010`):
  `image_path like owner_user_id::text || '/%'`. Buộc đoạn đầu của `image_path` phải đúng bằng
  `owner_user_id` + `/`. UUID ở dạng text không chứa ký tự đại diện `LIKE` (`%`/`_`) nên mẫu an
  toàn, không cần escape.
- Giữ nguyên RLS owner-only + bucket private + signed URL ngắn hạn của [[0023-vision-history-persistence]].
  Constraint này là lớp phòng thủ DB BỔ SUNG, không thay thế RLS.

## Alternatives Considered

1. **Chỉ dựa vào code dựng path đúng (giữ nguyên)** — không thêm gì. Loại: cô lập sinh trắc không
   được dựa vào một dòng code duy nhất; một refactor sai đường dẫn là rò rỉ thật.
2. **Kiểm tra trong RLS policy `with check`** thay vì CHECK constraint — cũng chặn được insert qua
   JWT, nhưng gateway dùng service-role bỏ qua RLS nên policy KHÔNG áp cho đường ghi của server.
   CHECK constraint áp cho MỌI đường ghi (kể cả service-role). Chọn CHECK vì phủ rộng hơn.
3. **Trigger BEFORE INSERT** so khớp path — mạnh tương đương nhưng nặng và khó đọc hơn một CHECK
   thuần. Loại theo KISS.

## Consequences

Positive:

- Cô lập ảnh sinh trắc được DB bảo đảm: mọi đường ghi (JWT người dùng hoặc service-role) không thể
  gắn `image_path` ngoài thư mục của chủ row. Vá được rò rỉ xuyên người dùng qua signed URL.

Tradeoffs:

- Mọi đường ghi `vision_results` tương lai phải dùng path bắt đầu bằng `{ownerUserId}/`. Đây vốn đã
  là quy ước của `vision-storage.gateway` nên không phát sinh thay đổi code; chỉ ràng buộc thêm.

## Follow-Up

- Khi apply lên Supabase cloud: chạy `000010` sau `000009`. Nếu đã có row vi phạm (không có trong
  thực tế vì code luôn đúng path), `ALTER TABLE ... ADD CONSTRAINT` sẽ fail — cần dọn trước.
