# Báo Cáo Chuyển Đổi & Handoff Session (20/07/2026)

## 1. Mục Tiêu
- Điều tra và xử lý triệt để nguyên nhân Mobile App không lập được lá số, bị lỗi `406 Not Acceptable` (khi lấy thông tin ví Xu).
- Xử lý nguyên nhân API Backend (`ziwei.7app.online`) liên tục trả về mã lỗi `500` và `503` (fetch failed) sau khi chuyển sang Database Supabase mới (Gala).

## 2. Công Việc Đã Thực Hiện
- **Sửa lỗi Database (Lỗi 406):**
  - Đã kết nối trực tiếp vào Database Gala qua cổng `5432` bằng Node.js.
  - Viết và chạy Script tạo SQL Trigger (`on_auth_user_created`) để tự động khởi tạo dòng dữ liệu trong bảng `profiles` mỗi khi có User mới (bao gồm cả Anonymous user) được tạo ra.
  - Chạy kịch bản khôi phục (backfill) thành công 7 user bị thiếu profile.
- **Điều tra sự cố máy chủ VPS (Lỗi 500/503):**
  - Đã SSH vào máy chủ `newtop-vpn` hiện tại đang host Backend.
  - Sử dụng lệnh `curl` để test kết nối từ VPS ra ngoài Internet và phát hiện ra **VPS cũ đang bị Firewall cấu hình chặn toàn bộ Outbound IPv4 HTTP/HTTPS traffic**. Máy chủ này hoàn toàn bị mù, không thể giao tiếp được với các API bên ngoài (như Cloudflare / Supabase REST API).
- **Tư vấn hạ tầng mới:**
  - Hỗ trợ phân tích và chốt cấu hình cho máy chủ AWS EC2 mới (`t3.small`, Ubuntu 24.04 LTS, 30GB Storage) để thay thế cho VPS cũ bị lỗi mạng.

## 3. Kết Quả Hiện Tại
- **Frontend / Mobile App:** Đã fix thành công lỗi `406`. App có thể get thông tin wallet và lấy dữ liệu mượt mà từ phía client-side.
- **Backend API (`ziwei.7app.online`):** Tạm thời vẫn đang sập do mắc kẹt ở VPS cũ không có kết nối ra ngoài Internet. Bắt buộc phải thực hiện di dời (Migration) sang VPS AWS mới.

## 4. Kế Hoạch Cho Session Tiếp Theo (Next Steps)
1. **Thiết lập máy chủ mới:** Đăng nhập vào VPS AWS mới (Ubuntu 24.04).
2. **Cài đặt môi trường Backend:** Cài đặt Node.js 20+, pnpm, PM2, Git, và Nginx.
3. **Deploy API:** Clone source code `ziweiai-web` về VPS mới, tạo file `apps/api/.env` chứa credentials của Database Gala, build và chạy dịch vụ bằng PM2.
4. **Cấu hình Domain:** Trỏ DNS của `ziwei.7app.online` về địa chỉ IP của VPS AWS mới và cài đặt SSL (Let's Encrypt / Certbot).
5. **Kiểm thử (Smoke Test):** Test luồng khởi tạo lá số và AI luận giải trên Mobile App để đảm bảo hệ thống End-to-End hoạt động 100%.
