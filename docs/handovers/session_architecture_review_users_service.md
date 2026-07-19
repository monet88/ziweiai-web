# Bàn Giao Session: Hoàn tất Mobile Wallet & Chọn Refactor UsersService

**Ngày:** 2026-07-19
**Ngữ cảnh:** Hoàn tất tính năng tích hợp API Ví XU từ Mobile App đến Backend, và tiến hành rà soát kiến trúc mã nguồn.

## Mục tiêu đã hoàn thành
1. **Hoàn thiện API Ví XU:** Thêm endpoint `GET /users/me/balance` trong `UsersService` (Backend NestJS) để lấy `xu_balance` từ bảng `profiles`.
2. **Tích hợp Mobile Wallet:** Chuyển màn hình `WalletScreen` trên Flutter từ Mock data sang việc sử dụng API thông qua Riverpod (`walletBalanceProvider`). Cập nhật trạng thái số dư ngay sau khi người dùng giao dịch RevenueCat thành công.
3. **Sửa lỗi kết nối & Build APK:** Xác nhận lỗi Mobile do dùng `localhost`, hướng dẫn trỏ về IP LAN. Chạy thành công tiến trình `flutter build apk --release` tạo file APK 56.5MB. Cài đặt trực tiếp vào điện thoại Android qua Wifi (ADB).

## Báo cáo Kiến trúc (Architecture Review)
- Đã chạy phân tích kiến trúc dựa trên log commit và Domain (`CONTEXT.md`).
- File báo cáo HTML đã được kết xuất và lưu về an toàn tại: `docs/agents/architecture-review-20260719.html`.
- Xác định 3 điểm rò rỉ kiến trúc. Quyết định của người dùng: Chọn **Candidate #1 (Deepen UsersService Database Seam)** làm trọng tâm cho chặng đường tiếp theo.

## Nhận định & Hướng dẫn (Matt PM)
- **Vấn đề:** Hiện tại `UsersService` chọc trực tiếp vào Supabase Client (`this.client.from('profiles')`), đi xuyên qua hệ thống Gateway đã chuẩn hoá, làm rò rỉ logic Database schema và gây khó khăn cho việc viết Test độc lập.
- **Giải pháp tiếp theo:** Chúng ta sẽ bước vào quy trình **Grilling** (`/grilling`) để định hình lại giao diện (interface) của `SupabasePersistenceGateway`, thêm seam mới, và sau đó refactor (`/implement`) dựa trên kết quả cọ xát đó.

## Nhiệm vụ cho Session Tiếp theo
1. Load nội dung file bàn giao này.
2. Bắt đầu phiên làm việc bằng lệnh `/grill-with-docs` tập trung vào việc thiết kế method mới trên `SupabasePersistenceGateway` để phục vụ lấy `xu_balance`, thay thế logic chọc thẳng Supabase của `UsersService`.
3. Viết Unit Test cho Gateway (TDD) và refactor `UsersService` để tuân thủ kiến trúc sâu (Deep Module).
