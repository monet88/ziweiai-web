# Session Handoff: Auth & Networking Stabilization

## 🎯 Mục Tiêu (Goal)
Hoàn thiện và ổn định luồng đăng nhập (Authentication), kết nối mạng (Networking) trên ứng dụng Mobile (Flutter), đồng thời làm sạch dữ liệu và xử lý các lỗi typecheck/accessibility trên Web Admin Dashboard. Đảm bảo toàn bộ hệ thống sẵn sàng cho production hoặc phase tiếp theo.

## 🛠 Việc Đã Làm (Tasks Done)
1. **Dọn dẹp Database (Admin Dashboard):** 
   - Xoá sạch hơn 20 user rác ẩn danh (`N/A`) trong cơ sở dữ liệu để bảng điều khiển Admin sạch sẽ.
2. **Tích hợp Google Login cho Mobile App:**
   - Thêm nút "Tiếp tục với Google" trên `auth_screen.dart`.
   - Cập nhật logic Supabase OAuth Provider để sử dụng Deep Link.
   - Bổ sung Intent-Filter `app.ziweiai.auth` vào `AndroidManifest.xml` để xử lý callback redirect mượt mà.
3. **Sửa triệt để lỗi Networking (`Failed host lookup`) trên Mobile:**
   - Fix lỗi điện thoại Android (Release/Profile build) không gọi được API bằng cách bổ sung quyền `<uses-permission android:name="android.permission.INTERNET"/>` và `ACCESS_NETWORK_STATE` vào `src/main/AndroidManifest.xml`.
4. **Sửa lỗi TypeScript & Accessibility trên Web App:**
   - Fix lỗi `data.session possibly undefined` ở các luồng nạp/trừ XU, Cấm user trong file `admin/+page.svelte`.
   - Cải thiện A11y cho modal backdrop tránh warning svelte-check.
   - Xác nhận Codebase Web (`pnpm check`, `typecheck`) và Dart (`analyzer`) passing 100% không còn lỗi.

## 📊 Kết Quả (Results)
- **Core Workflow** (Mở App -> Đăng nhập Google/Ẩn danh -> Tạo lá số -> Luận giải AI) chạy thông suốt trên nền tảng Web và Mobile.
- App Mobile không còn bị hệ điều hành chặn phân giải tên miền (DNS) khi trỏ tới `https://ziwei.7app.online` (chạy trên EC2 `52.90.173.89`).
- Không còn bất kỳ rác dữ liệu hay type-error nào sót lại trong luồng auth và admin.

## 🚀 Hướng Chuyển Giao (Next Steps / Handoff Roadmap)
Cho phiên làm việc kế tiếp, hệ thống cần ưu tiên giải quyết các tính năng tăng trưởng và phòng tránh rủi ro:
1. **Apple Sign-in (Mobile):** Bắt buộc tích hợp Apple Login vì đã có Google Login (luật bắt buộc để không bị Reject khi đưa lên App Store iOS).
2. **Account Merging:** Viết logic gộp tài khoản Anonymous (có thể đã nạp XU) vào tài khoản Google khi user đăng nhập, chống mất tiền của khách.
3. **Daily Horoscope & Push Notifications:** Kích thích người dùng quay lại app bằng thông báo xem quẻ mỗi ngày.
4. **Export Image:** Tính năng chụp và tải xuống ảnh lá số đẹp để chia sẻ mạng xã hội.
