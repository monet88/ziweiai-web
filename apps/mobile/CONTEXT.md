# Mobile

Ngữ cảnh ứng dụng di động Flutter (iOS & Android) cung cấp trải nghiệm chiêm tinh, nghi thức gieo quẻ, trợ lý giọng nói và quản lý ví XU trên thiết bị cầm tay.

## Language

**Ứng Dụng Di Động (Mobile Client)**:
Gói mã nguồn Flutter độc lập đóng gói cho hai nền tảng iOS và Android, kết nối trực tiếp với NestJS backend.
_Avoid_: App webview, PWA bọc lại.

**Trợ Lý Giọng Nói (Voice Synthesis)**:
Tính năng đọc luận giải lá số và đối thoại chiêm tinh bằng giọng đọc Text-to-Speech truyền cảm, có bộ lọc Markdown.
_Avoid_: Đọc máy, bot phát loa.

**Ví XU Đa Cổng (Dual-Channel Wallet)**:
Cơ chế nạp XU hỗ trợ song song cổng thanh toán nội địa VietQR (SePay) và mua hàng trong ứng dụng (In-App Purchase qua RevenueCat).
_Avoid_: Nạp tiền App Store đơn thuần.

**Điểm Thưởng Quảng Cáo (AdMob Reward)**:
Cơ chế tặng XU khi người dùng hoàn tất xem video quảng cáo có thưởng (Rewarded Ads) được backend ký xác thực SSV.
_Avoid_: Xem ads kiếm tiền, cày xu.

**Thông Báo Khí Vận Đẩy (FCM Push Notification)**:
Hệ thống thông báo đẩy hàng ngày nhắc nhở khí vận nhật khóa và chuỗi điểm danh hoàng đạo qua Firebase Cloud Messaging.
_Avoid_: Spam tin nhắn, thông báo rác.
