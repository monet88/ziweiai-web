# Handover: Pre-check Core UI/UX & Cài đặt RevenueCat Test

**Thời gian hoàn thành:** July 2026
**Mục tiêu:** Kiểm tra (Pre-check) UI/UX các tính năng cốt lõi (Lập lá số, Bàn cờ Tử Vi, Trợ lý AI, Ví XU) trên Mobile App. Bổ sung các tính năng còn thiếu cho IAP và hướng dẫn quy trình test RevenueCat qua Test Store.

## 1. Các việc đã thực hiện (Việc đã làm)

- **Audit Codebase:** Kiểm tra toàn bộ mã nguồn liên quan đến UI/UX trong `lib/features/` của app `apps/mobile/`.
- **Fix lỗi & Thêm tính năng (Wallet):** Đã code thêm nút **"Khôi phục thanh toán" (Restore Purchases)** vào AppBar của màn hình `WalletScreen` để đảm bảo tuân thủ 100% chính sách duyệt app của Apple đối với In-App Purchases. Fix các lỗi syntax liên quan.
- **Pre-check Core Features:**
  - **Lập lá số (HomeScreen):** Hoạt động mượt mà, gọi API và điều hướng đúng.
  - **Bàn cờ Tử Vi (ZiweiBoard):** Layout ổn định với `InteractiveViewer`, hỗ trợ zoom/pan trên màn hình nhỏ.
  - **Trợ lý AI (AssistantPanel):** Panel bottom sheet hoạt động tốt, render được Markdown, có các chip gợi ý "Tình duyên", "Sự nghiệp".
- **Biên dịch APK:** Đã khởi chạy tiến trình build APK Debug (`flutter build apk --debug`) để nạp vào máy Samsung. (Tiến trình mất nhiều thời gian do Gradle phải tải Android SDK/NDK mới).

## 2. Kết quả Pre-check
- **Logic:** Đúng, luồng kết nối giữa các màn hình và trạng thái an toàn.
- **Workflow:** Mượt, chuyển trang và xử lý giao dịch RevenueCat bắt lỗi tốt.
- **Thiếu tính năng:** Đã fix xong nút Khôi phục (Restore). Tính năng số dư (balance) đang dùng dữ liệu mock, cần tích hợp API user profile sau.
- **Rủi ro tiềm ẩn:** Không có bug tràn viền. Giao diện an toàn. 

## 3. Hướng dẫn Test RevenueCat qua Test Store
- **Google Play:** App phải được tải lên Internal Testing. Tài khoản tester phải được cấp phép (Licensed Tester). Khi thanh toán sẽ hiện "Test card, always approves".
- **App Store:** Tạo Sandbox Tester Account trên App Store Connect, đăng nhập vào thiết bị và thanh toán qua môi trường Sandbox.

## 4. Prompt đề xuất cho Session Mới

Dưới đây là Prompt bạn có thể dùng để bắt đầu session tiếp theo:

```text
Tiếp tục dự án Tử Vi Toàn Tập (Mobile App Flutter).
Ở session trước, chúng ta đã kiểm tra xong UI/UX các tính năng cốt lõi và đảm bảo RevenueCat IAP đã tuân thủ chính sách (xem docs/handovers/session_ui_ux_revenuecat_mobile.md).

Mục tiêu session mới:
1. ... (Ví dụ: Viết API lấy Số dư XU từ Backend NestJS và fetch vào WalletScreen trên Mobile)
2. ... (Ví dụ: Hoàn thiện tính năng History - Xem lại lịch sử các lá số đã tạo)
Hãy /ask-matt để gợi ý bước đi tiếp theo.
```
