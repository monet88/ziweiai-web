# 0023 Lưu lịch sử Xem Tướng / Xem Tay (ảnh + luận giải + câu hỏi) — đảo retention ảnh sinh trắc của 0012

Date: 2026-06-26

## Status

Accepted

## Context

[[0012-extended-divination-systems]] chốt rằng kết quả vision (Xem Tướng `face` / Xem Tay
`palm`) **không lưu lâu dài**: chỉ giữ narrative trả về client một lần, ảnh upload vào bucket
private `vision-uploads` và bị `pg_cron` xoá sau 7 ngày (migration 000002). Lý do khi đó: giảm
rủi ro PII/sinh trắc + dung lượng.

Hệ quả thực tế (người dùng báo lỗi):

- Xem Tướng / Xem Tay **không xuất hiện trong lịch sử** như lá số Tử Vi và các hệ bói khác.
  `vision-analysis.service.ts` chỉ `return visionAnalysisSchema.parse(...)`, KHÔNG INSERT DB,
  KHÔNG tạo `history_views`.
- Narrative chỉ tồn tại trong `mutation.data` của model web (ephemeral) — rời trang hoặc refresh
  là mất. Ảnh cũng biến mất sau 7 ngày.

Người dùng (chủ sản phẩm) yêu cầu: **lưu cả ảnh + luận giải + câu hỏi, giữ vĩnh viễn** để xem
lại trong lịch sử như một album cá nhân.

Đây là thay đổi đảo ngược một invariant privacy đã chốt ⇒ phải có decision mới, không tự sửa.

## Decision

- **Đảo phần retention ảnh của [[0012-extended-divination-systems]]** (mục Alternatives #2 "Lưu ảnh
  dài hạn — Loại"): nay GIỮ ảnh vĩnh viễn theo lựa chọn chủ sản phẩm. Gỡ lịch `pg_cron`
  `vision-uploads-cleanup`. Bucket vẫn private + RLS owner-only (không nới quyền đọc).
- **Bảng mới `vision_results`** (song song `explanation_results`): cột `owner_user_id`, `kind`
  (`face|palm`), `image_path` (Storage path trong bucket private), `narrative` (markdown),
  `question` (nullable — câu hỏi người dùng), `provider_metadata` (jsonb), `created_at`. RLS
  owner-only (select/insert/update/delete theo `auth.uid()`), nhất quán `explanation_results`.
- **Mở rộng `history_views`**: thêm cột nullable `vision_result_id` (FK → `vision_results`, cascade
  delete). Lịch sử vision = một `history_views` row trỏ tới `vision_result_id` (giống explanation
  trỏ `explanation_result_id`). KHÔNG có `chart_snapshot_id` cho vision (vision không có lá số).
- **Service persist sau khi LLM thành công + upload ảnh**: `vision-analysis.service.ts` INSERT
  `vision_results` rồi tạo `history_views`, giữ ĐÚNG thứ tự an toàn hiện có (LLM trước → upload ảnh
  → persist). Lỗi persist sau khi đã có ảnh: vẫn trả kết quả cho client (ảnh + narrative đã có),
  log cảnh báo — KHÔNG để 500 nuốt mất kết quả người dùng vừa trả tiền token.
- **Đọc lại ảnh qua signed URL**: bucket private nên web không tải trực tiếp bằng path. Thêm
  endpoint/looku­p tạo signed URL ngắn hạn (ví dụ 1 giờ) cho `image_path` khi render lịch sử. KHÔNG
  trả ảnh base64 trong list (nặng + lộ sinh trắc trong cache).
- **Contracts**: thêm `visionResultRecordSchema` vào `persistence-records`; mở rộng `historyItemSchema`
  có `visionResult` (nullable) + `historyViewRecordSchema` có `visionResultId`. Web parse qua
  contracts, không tự định nghĩa DTO (giữ [[0007-web-server-boundary]]).
- **Quota + gate giữ nguyên**: vision vẫn qua 5 cổng hiện có (feature flag → email identity → AI
  premium → vision quota → LLM). Lưu lịch sử KHÔNG nới gate nào.

## Alternatives Considered

1. **Giữ nguyên 0012 (ảnh xoá 7 ngày), chỉ lưu narrative + câu hỏi** — tôn trọng privacy nhất, không
   cần đụng cron. Nhưng chủ sản phẩm muốn xem lại ảnh lâu dài ⇒ không đáp ứng yêu cầu. Loại.
2. **Lưu narrative vĩnh viễn nhưng giữ TTL 7 ngày cho ảnh** (history cũ hiện placeholder "ảnh đã hết
   hạn") — cân bằng, nhưng UX nửa vời (album thiếu ảnh) và chủ sản phẩm đã chọn giữ ảnh. Loại.
3. **Nhồi vision vào `explanation_results`** (tái dùng bảng) — `explanation_results` ràng buộc FK
   `explanation_request_id` + `chart_snapshot_id` NOT NULL, vision không có hai thứ đó. Bóp méo schema.
   Bảng riêng `vision_results` sạch hơn. Loại.
4. **Trả ảnh base64 trong history list** — nặng payload + ảnh sinh trắc lọt vào cache trình duyệt/CDN.
   Signed URL ngắn hạn an toàn hơn. Loại.

## Consequences

Positive:

- Xem Tướng / Xem Tay vào lịch sử đồng nhất với các hệ khác; người dùng xem lại ảnh + luận giải.
- Bảng riêng giữ schema sạch, RLS owner-only nhất quán pattern hiện có.

Tradeoffs:

- **Rủi ro PII/sinh trắc tăng**: ảnh chân dung/lòng bàn tay giữ vĩnh viễn ⇒ cần cảnh báo người dùng
  trên UI + có đường xoá (follow-up). GDPR/quyền được quên: cần endpoint xoá vision result + ảnh.
- Dung lượng Storage tăng theo thời gian (không còn cron dọn). Theo dõi quota Supabase Storage.
- Tăng 1 bảng + 1 cột history_views + 1 endpoint signed URL ⇒ thêm test integration.

## Follow-Up

- ~~Thêm chức năng người dùng tự xoá một mục vision (ảnh + record) — quyền được quên.~~ **Đã làm**
  (PR review follow-up): `DELETE /vision/results/:id` (owner-scoped, gỡ ảnh Storage TRƯỚC rồi xoá row
  `vision_results`; `history_views` cascade theo FK). Web có nút "Xoá" trên từng thẻ vision trong lịch
  sử + xác nhận trước khi xoá. Đáp ứng quyền được quên/GDPR.
- ~~Cảnh báo Việt ngữ trên UI Xem Tướng/Xem Tay~~ **Đã làm**: `privacyNotice` đổi sang "lưu riêng tư
  trong tài khoản của bạn và được giữ lại để xem trong lịch sử".
- Cân nhắc nén ảnh trước khi lưu (giảm dung lượng dài hạn). Backlog.
