# Handoff: Monetization & Wallet History Hoàn Tất -> Chuyển sang UI Premium & Kinh Dịch

## 1. Mục Tiêu Đã Hoàn Thành
- **Lịch sử giao dịch (Wallet History)**: Đã hoàn thiện toàn bộ luồng từ Backend (`GET /wallet/transactions`) xuống Mobile. Mobile hiển thị danh sách lịch sử XU theo ngày tháng (dùng package `intl`).
- **Global Paywall**: Chuyển đổi thành công kiến trúc từ bắt lỗi thủ công sang bắt lỗi toàn cục bằng Riverpod (`PaywallNotifier`) và Dio Interceptor. Khi API trả về 402/403, Modal Bottom Sheet Premium tự động hiện lên trên mọi màn hình.
- **Kiến trúc (Architecture)**: Đã chạy review kiến trúc và phát hiện cơ hội tách lớp `ApiClient` và `Riverpod Ref` để tăng tính testable (sẽ ưu tiên làm nếu cần).
- **Cài đặt**: Đã build APK và cài thành công lên máy thực (A53).

## 2. Vấn Đề Tồn Đọng (Pain Points)
- **UI/UX Chưa Đạt Chuẩn Premium**: Giao diện hiện tại nhìn "xấu tệ", thiếu cảm giác cao cấp (Premium), cần được đập đi xây lại hệ thống UI Components, typography, spacing và hiệu ứng (animations) cho xứng tầm với ứng dụng AI có thu phí.

## 3. Hướng Đi Tiếp Theo (Next Steps)
1. **Revamp UI/UX Mobile (Ưu tiên Cao nhất)**: Chỉnh trang lại giao diện để toát lên vẻ "Premium" (Dark theme sâu hơn, gradients, skeleton loading, glassmorphism, micro-interactions).
2. **Kinh Dịch (I Ching)**: Bắt tay vào tích hợp bộ môn thuật số thứ 3 sau khi giao diện đã được chuẩn hóa.

## 4. Prompt Chuyển Session (Copy & Paste vào Session mới)
```text
Chào AI, chúng ta tiếp tục từ tài liệu handoff `docs/sessions/session_monetization_handoff.md`.

Chức năng Monetization và History đã xong, nhưng UI app mobile hiện tại nhìn "xấu tệ", không toát lên được vẻ Premium của một app AI trả phí. 

Nhiệm vụ của session này:
1. Đánh giá lại hệ thống Design System hiện hành của Flutter Mobile.
2. Thiết kế và làm mới giao diện (Revamp UI) để ứng dụng trông thật Premium, hiện đại, bắt mắt (ưu tiên Glassmorphism, animations và phối màu Dark Mode cao cấp).
3. Sau khi giao diện đã mượt mà, chúng ta sẽ bàn tới tính năng Kinh Dịch.

Hãy bắt đầu bằng cách khảo sát codebase mobile và đề xuất cho tôi một Implementation Plan để "Premium hóa" UI của ứng dụng.
```
