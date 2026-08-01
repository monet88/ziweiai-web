# Handoff Session: Tarot Reading V1

## Mục tiêu (Goal)
Triển khai tính năng **Đọc Bài Tarot (1-Card Draw)** trên nhánh mới `feat/tarot-reading` để đảm bảo an toàn, dễ rollback và review trước khi đưa vào luồng chính (main).
Yêu cầu bao gồm:
1. Giao diện (UI) sang trọng, bí ẩn (Premium Design) trên Mobile Flutter.
2. Trừ phí **2 XU** mỗi lần rút bài.
3. Kế thừa hệ thống Grounding AI (cố định ý nghĩa 78 lá bài) trên Backend NestJS.

## Các Việc Đã Làm (What Was Done)
- **Kiến trúc & Git:** Khởi tạo tính năng trên nhánh `feat/tarot-reading` hoàn toàn độc lập, đáp ứng tiêu chí tránh rủi ro cho luồng chính.
- **Backend (API):** 
  - Kích hoạt tính năng Tarot bằng cờ `EXTENDED_SYSTEM_TAROT_ENABLED=true` trong `.env.local`.
  - Cập nhật hàm xử lý tại `draws-tarot.service.ts` để trừ chính xác 2 XU khi gọi API.
- **Frontend (Mobile - Flutter):**
  - **Data Layer:** Bổ sung `tarot_models.dart` (Model) và `tarot_repository.dart` (kết nối API `/draws/tarot` qua Dio).
  - **State Management:** Viết `tarot_provider.dart` để quản lý trạng thái rút bài (Loading, Success, Error). Tích hợp hàm `ref.invalidate(walletBalanceProvider)` để cập nhật số dư ngay khi bị trừ XU.
  - **Giao diện (UI):** Tạo `tarot_screen.dart` với tông màu gradient tối, viền vàng (Premium Design) và giả lập "chạm vào lưng bài" để lật mặt, hiển thị tên lá bài + Markdown thông điệp. Đã loại bỏ PaywallSheet phức tạp, chuyển sang dùng AlertDialog đơn giản cho lỗi 402/403 (Hết XU).
  - **Routing:** Móc nối `VisionKind.tarot` trong `app_router.dart` để tự động điều hướng sang `TarotScreen`.
- **Kiểm tra QA:** 
  - Đã chạy thành công `dart analyze` (Mobile) với 0 lỗi/0 cảnh báo.
  - Đã build thành công `nest build` (Backend).
  - Đã connect ADB thành công vào thiết bị Galaxy A53 (192.168.1.16:37155) để user có thể chạy test nội bộ.

## Kết quả (Results)
- Tính năng hoạt động mượt mà từ Frontend tới Backend.
- Nhánh `feat/tarot-reading` đã xanh (passed build), an toàn để review và sẵn sàng merge vào `main` trong phiên làm việc tới.

## Những Cần Ghi Nhớ (Context Updates)
- Phí Tarot được chốt là 2 XU (đổi từ 3 XU thành 2 XU).
- Cần có XU để rút, nếu không có XU sẽ văng lỗi `402/403` và app hiển thị popup nạp XU.
- Đã cập nhật `CONTEXT.md` ghi nhận `feat/tarot-reading` đã hoàn tất (v1).
