# IMPLEMENTATION NOTES: SPRINT 59 REFACTOR & HARDENING

## 1. Unspecified & Implicit Decisions
- **Migration Version Selection:** Đổi `000021_daily_referral_cap.sql` thành `000025_daily_referral_cap.sql`. Quyết định giữ `000021_user_notifications_fcm.sql` vì notification module đã được tích hợp trước đó, trong khi referral cap chạy độc lập trên layer monetization.
- **Storage Bucket Re-use:** Thay vì tạo mới bucket riêng cho gallery (vốn yêu cầu thêm migration storage và quyền RLS phức tạp), ta tái sử dụng private bucket `vision-uploads` đã có sẵn trong hệ thống (`apps/api/supabase/migrations/000002_user_birth_profiles.sql`). Tất cả object của gallery được lưu trữ dưới tiền tố `royal-gallery/{userId}/{cardId}.webp`, đảm bảo tính đóng gói và an toàn dữ liệu.
- **Signed URL TTL Strategy:** URL ký danh phía API backend trả về có TTL 3600 giây (1 giờ) cho web client, trong khi Mobile upload trực tiếp tạo URL 7 ngày để tối ưu hóa cache trên thiết bị di động.
- **Multer Interface Typing:** Thay vì thêm package `@types/multer` vào devDependencies gây phình node_modules, ta khai báo `interface UploadedImageFile` cục bộ theo đúng pattern đã dùng trong `apps/api/src/modules/vision-shared/vision-analysis.controller.ts`.
- **Service Worker PWA Hardening:**
  - Chặn triệt để request scheme không phải `http/https` (đặc biệt là `chrome-extension:` và `moz-extension:`) trước khi gọi `cache.put()`, loại bỏ lỗi `TypeError: Request scheme 'chrome-extension' is unsupported`.
  - Chuyển đổi chiến lược điều hướng trang HTML (`request.mode === 'navigate'`) sang **Network-First**: luôn lấy `index.html` mới nhất từ Vercel để khớp hash bundle JS, chỉ fallback về cache khi offline.
  - Ngăn chặn cache các response dạng `text/html` khi request là file asset JS/CSS (tránh cache nhầm trang 404 SPA fallback HTML).
  - Tự động xóa sạch các version cache cũ (`vios-cache-v1`, `vios-cache-v2`) khi activate `vios-cache-v3`.
  - Tích hợp self-healing handler trong `app.html`: tự động unregister SW và xóa cache nếu gặp lỗi dynamic import mismatch sau deploy.

## 2. Deviations from Specification
- Không có sự sai lệch nào so với mục tiêu ban đầu của Sprint 59. Toàn bộ các yêu cầu audit từ Sprint 58 đều được hiện thực hóa đầy đủ.

## 3. Considered Trade-offs
- **Hard Delete vs. Soft Delete Tombstone:**
  - *Hard Delete:* Đơn giản, giải phóng bộ nhớ DB ngay lập tức. Tuy nhiên, trong môi trường đa thiết bị (Web + Mobile), khi thiết bị A xóa thẻ và thiết bị B đồng bộ dữ liệu local của nó lên Cloud, thẻ đã xóa sẽ bị "hồi sinh" (resurrection).
  - *Soft Delete Tombstone (`deleted_at`):* Giữ bản ghi tombstone để mọi client khi delta sync đều biết thẻ đã bị hủy, loại bỏ triệt để resurrection bug. Ta đã chọn giải pháp Tombstone.
- **Direct Supabase Call vs. API Gateway trên Web:**
  - *Direct Call:* Viết nhanh nhưng vi phạm `apps/web/AGENTS.md`, làm lộ schema DB trực tiếp ra client và bỏ qua VIP PRO server validation.
  - *API Gateway:* Tuân thủ kiến trúc phân tầng, NestJS API làm trung tâm bảo vệ nghiệp vụ và cấp signed URL an toàn.

## 4. Maintenance Notes
- Khi bổ sung migration mới cho Supabase, luôn kiểm tra bằng `pnpm check:supabase-migrations` trước khi tạo PR để tránh trùng version.
- Các dialog preview thẻ chia sẻ (`RoyalZiweiPreviewDialog`, `RoyalSacredStickPreviewDialog`, `RoyalTarotPreviewDialog`) kế thừa `ConsumerStatefulWidget` để có quyền đọc trạng thái VIP PRO từ `isProUserProvider`.
