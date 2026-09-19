# Báo cáo Handover & Pre-check (2026-07-20)

## 1. Mục tiêu
- Triển khai tính năng Quản lý Admin (Cộng XU, xem người dùng) bảo mật bằng service role bypass.
- Cố định API backend trên môi trường VPS AWS EC2.
- Nâng cấp độ mượt mà của Mobile App (Flutter) với timeout lớn và UX tốt hơn cho tính năng AI Vision.
- Đảm bảo logic tối ưu tính phí (XU) khi gọi AI Vision (ưu tiên Gemini 1.5 Flash).

## 2. Việc đã làm & Kết quả
- **Web Admin SvelteKit:** Đã tạo luồng đăng nhập bắt buộc (`/sign-in`), trang `/admin` liệt kê user + số dư XU. Chức năng Modal "Nạp XU" gọi API admin hoạt động hoàn hảo. Đã dọn dẹp các lỗi Eslint/Typescript (key `#each`, `err: any`).
- **Backend NestJS:** Triển khai endpoint `/admin/users` và `/admin/users/:id/topup` với Guard kiểm tra email bảo mật (chỉ cho phép các email admin). Triển khai lên VPS `52.90.173.89` qua pm2 và bảo đảm các request được pass mượt mà qua API_CORS_ORIGINS mới.
- **Mobile Flutter:** Tăng cường thời gian timeout của kết nối Dio API từ 10s lên 30s để đảm bảo request qua Gemini (có thể mất 15s) không bị ngắt giữa chừng. Sửa lỗi giao diện hiển thị loader quá to (gây RenderFlex crash) khi bấm "Lập lá số".
- **Git & Bảo mật:** `.gitignore` được rà soát nghiêm ngặt để loại bỏ mọi tệp nhạy cảm (`pem`, `env.local`, `apk`, `.agents`, v.v.).

## 3. Phân tích Pre-check
- **Logic đúng chưa?**
  - Cực kỳ an toàn. Admin API chỉ cấp quyền dựa trên config email (AdminEmailsGuard), dễ kiểm soát. Lệnh nạp XU dùng logic cộng dồn trực tiếp (increment) trong DB thay vì đọc rồi ghi đè, tránh hoàn toàn race condition nếu có nhiều lệnh nạp cùng lúc.
  - Về Vision AI, luồng lọc fallback về `Gemini 1.5 Flash` (khi model preference set là `auto`) được áp dụng tuyệt đối chính xác cho ImageInput, giải quyết bài toán tối ưu chi phí rất lớn.
- **Workflow ổn chưa?**
  - Trên Web: flow redirect 401/403 về login/home hoạt động mượt mà.
  - Trên Mobile: đã triệt tiêu lỗi Bad Request 400 và timeout oan uổng do chờ AI xử lý.
- **Thiếu tính năng gì?**
  - Bảng Admin hiện tại chỉ hỗ trợ Cộng XU, chưa có tính năng xem chi tiết giao dịch (Transaction Logs), Trừ XU hoặc Ban tài khoản.
  - Cần thêm module Analytics (Báo cáo số người dùng đăng ký mới/ngày).
- **Rủi ro tiềm ẩn?**
  - Nếu số lượng người dùng đồng thời lớn, `QUOTA_STORE_DRIVER=memory` của API Rate Limit (trên 1 node PM2) vẫn chịu tải tốt, nhưng khi scale ra nhiều instance (PM2 cluster) thì cần setup Redis.
  - Token Vercel/Github có một số lưu trong `env.local` nhưng `.gitignore` đã chặn lại. Dù vậy, tuyệt đối không share file `.env.local` ra ngoài.

## 4. Prompt Chuyển giao (Handoff to New Session)
(Hãy sử dụng nội dung prompt dưới đây cho cuộc hội thoại mới)

> "Chào bạn, ở session trước chúng ta đã hoàn tất triển khai Admin API lên VPS, hoàn thiện web dashboard và fix triệt để mọi lỗi liên quan đến Timeout & UI trên Mobile App Flutter cho tính năng Vision AI. Bây giờ chúng ta sẽ bắt đầu Sprint tiếp theo. Vui lòng đọc file `docs/handover-final-20260720.md` để lấy context. Nhiệm vụ hôm nay của chúng ta là: [ĐIỀN TÍNH NĂNG TIẾP THEO BẠN MUỐN LÀM, ví dụ: Xây dựng tính năng Xem lịch sử nạp XU trên Admin hoặc Bổ sung Analytics]..."
