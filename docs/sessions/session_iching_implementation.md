# Session: Tính năng Kinh Dịch (I Ching)
**Date**: 2026-08-01

## Mục Tiêu
Triển khai tính năng "Gieo Quẻ Kinh Dịch" cho ứng dụng mobile Tử Vi Toàn Tập (Ziwei AI) dựa trên yêu cầu từ UI Revamp và Monetization. Yêu cầu tính năng phải đồng bộ với backend (trừ XU khi gieo) và cung cấp giao diện tương tác (lắc xu) chân thực.

## Việc Đã Làm
1. **Backend & Contracts**:
   - Khởi tạo Data Contracts (schemas) cho `IChingHexagram`, `IChingDraw`.
   - Tạo module `DrawsIchingModule` trên NestJS API xử lý logic gieo quẻ (coin toss logic) ngẫu nhiên bằng seed.
   - Viết `IChingGroundingAdapter` tạo context luận giải và kết nối với AI thông qua `AiFeatureExecutionOrchestrator` (trừ 5 XU mỗi lần draw).
   - Đảm bảo unit test chạy ổn định (`draws-iching.service.test.ts`).

2. **Mobile Frontend**:
   - Thêm `IChingRepository` và `IChingNotifier` sử dụng `flutter_riverpod` (v2 Notifier) bắt lỗi API an toàn (đặc biệt mã 402 khi hết XU).
   - Xây dựng màn hình `IChingScreen` cho phép lắc gieo quẻ với hiệu ứng rung (HapticFeedback) và AnimationController tạo hiệu ứng thị giác.
   - Cập nhật luồng Navigation (`app_router.dart`) để hiển thị tại Home Screen.
   - Sửa các lỗi linter/deprecation warning (sử dụng `withValues` thay cho `withOpacity`).

3. **Validation**:
   - Backend build thành công (`pnpm build`).
   - Mobile code passing 100% khi chạy `flutter analyze`.

## Kết Quả & Ghi Chú
- Tính năng Kinh Dịch đã được tích hợp hoàn toàn và sẵn sàng test tay thực tế.
- Khấu trừ XU (5 xu/lần) tự động báo về UI nếu không đủ tiền và update lại ví sau khi trừ thành công qua hàm `ref.invalidate(walletBalanceProvider)`.
- Không cần refactor phức tạp ngoài phạm vi, bảo toàn invariants.
