# Handoff: Admin Dashboard & Analytics (20/07/2026)

## 1. Mục tiêu (Objective)
Sprint này tập trung vào việc cung cấp cho quản trị viên các công cụ mạnh mẽ để kiểm soát ứng dụng Tử Vi Toàn Tập thông qua Web Dashboard, bao gồm:
- Ghi nhận lịch sử nạp/tiêu thụ XU (Transaction Logs) để đối soát minh bạch.
- Các hành động quản trị viên nâng cao (Advanced Admin Actions) như Khóa/Mở khóa tài khoản (Ban/Unban) và Trừ XU khi có sự cố.
- Module Thống kê (Analytics) để theo dõi tổng số lượng người dùng, tổng XU đã nạp, tổng XU tiêu thụ, cùng với biểu đồ/bảng số liệu biến động mỗi ngày.

## 2. Công việc đã thực hiện (Work Done)
1. **Transaction Logs:** 
   - Viết RPC `log_xu_transaction` trên Supabase, đảm bảo tính nguyên tử (atomic) khi cập nhật số dư XU và ghi log.
   - Bổ sung `GET /admin/transactions` và hiển thị trên Web (tab "Lịch sử giao dịch").
2. **Advanced Admin Actions:**
   - Tạo migration thêm cột `is_banned` vào bảng `profiles`.
   - Kết nối `adminBanUser` vào Supabase Auth Admin API (thay đổi `ban_duration`).
   - Cập nhật UI: thêm nhãn đỏ [Banned], thêm nút Khóa/Mở khóa, và thêm nút "Trừ XU" trong Modal thay đổi XU.
3. **Analytics Module:**
   - Tạo RPC `get_admin_analytics` tối ưu, sử dụng `generate_series` để lấy toàn bộ dữ liệu thống kê, tránh lỗi query N+1.
   - Bổ sung `GET /admin/analytics` và tạo tab "Thống kê" trên Web Dashboard. Giao diện được thiết kế với các Stats Card và bảng dữ liệu 30 ngày.

## 3. Kết quả (Results)
- ✅ Toàn bộ Backend (API) đã pass `typecheck` và vượt qua hơn 400 Unit Tests.
- ✅ Toàn bộ Frontend (Web) SvelteKit đã pass `svelte-check` không còn lỗi type/session.
- 💡 Giao diện mượt mà, gọi API tốc độ cao nhờ tối ưu ở tầng SQL.

## 4. Tình trạng Mobile App (APK)
Trong suốt session này, các thay đổi **chỉ diễn ra ở tầng Web Dashboard và API Server** (không thay đổi mã nguồn thư mục `apps/mobile`). Do đó, bản thân file cài đặt Mobile App (APK) cũ vẫn tương thích và không có thay đổi nội tại. Tuy nhiên, các user dùng Mobile bị ban sẽ lập tức mất quyền truy cập dựa trên hệ thống Supabase Auth đã cập nhật.

---
## Prompt chuyển giao cho Session mới (Next Steps Prompt)

Bạn có thể copy đoạn prompt dưới đây và dán vào Session mới để tiếp tục công việc:

```text
Chào bạn, ở session trước chúng ta đã hoàn tất xuất sắc toàn bộ Sprint về "Admin Dashboard" (bao gồm Transaction Logs, Ban/Unban user, Trừ XU và Analytics Module). Bạn có thể xem chi tiết ở file `docs/handover-admin-dashboard-20260720-v2.md`. 
Tất cả code đã được commit đầy đủ. Các thay đổi chỉ áp dụng ở web/api nên mobile app không cần update build APK mới.

Bây giờ, mục tiêu của Sprint tiếp theo của chúng ta là: [ĐIỀN MỤC TIÊU TIẾP THEO CỦA BẠN, VÍ DỤ: "Triển khai tính năng Chia sẻ Quẻ lên Mạng Xã Hội trên Mobile" hoặc "Hoàn thiện Affiliate Tracking"].
/a/ask-matt Tư vấn cho tôi những bước cần làm tiếp theo và tiến hành lên Implementation Plan nhé!
```
