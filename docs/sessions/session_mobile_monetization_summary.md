# Tổng kết Tính năng Lịch Sử Giao Dịch & Global Paywall trên Mobile

## Mục tiêu
Hoàn thiện luồng Monetization trên ứng dụng di động:
1. Xây dựng màn hình Lịch sử nạp/trừ XU (Wallet History) để người dùng theo dõi minh bạch.
2. Cải thiện cơ chế bảo vệ tính năng thu phí (Monetization Guard) bằng cách áp dụng Global Paywall tự động chặn lỗi 402/403 từ API thay vì bắt lỗi thủ công ở từng màn hình.

## Việc đã làm
1. **Cấu trúc & Contract**: 
   - Thêm schema `TransactionListResponse` vào `@ziweiai/contracts/wallet`.
2. **Backend**:
   - Thêm API endpoint `GET /wallet/transactions` vào `WalletController` tại `apps/api`.
3. **Mobile Global Paywall**:
   - Triển khai `PaywallNotifier` (bằng Riverpod) để nắm trạng thái paywall toàn ứng dụng.
   - Bổ sung Dio Interceptor trong `ApiClient` để lắng nghe mã HTTP 402/403, tự động trigger PaywallNotifier.
   - Thêm `GlobalPaywallWrapper` bọc quanh `MaterialApp.router`, tự động show `PremiumPaywallSheet` dưới dạng modal bottom sheet.
   - Dọn dẹp mã cũ: Xóa bỏ `MonetizationGuard` trên các màn hình Tarot/Thần số học.
4. **Mobile Wallet History**:
   - Bổ sung `TransactionModel` và cập nhật `walletTransactionsProvider` để lấy dữ liệu từ API.
   - Xây dựng giao diện `WalletHistoryScreen` hiển thị danh sách lịch sử XU với package `intl` để format ngày tháng đẹp.
   - Thêm icon "Lịch sử" trên màn hình `WalletScreen`.

## Kết quả
- **Tự động & Thông minh**: Ứng dụng di động giờ đây tự động hiện Paywall khi API backend báo hết tiền (402) mà không cần lập trình viên can thiệp thủ công ở từng luồng.
- **Minh bạch**: Người dùng có thể kiểm tra danh sách đầy đủ các biến động số dư một cách trực quan, giúp tăng độ tin cậy.
- **Chất lượng**: 100% tests backend thông qua (`tsc`, `vitest`), frontend mobile phân tích mã nguồn (`flutter analyze`) không lỗi. Mọi chức năng vận hành đúng đặc tả. Đã hỗ trợ cài đặt APK debug lên máy `A53 (192.168.1.16:43249)`.
