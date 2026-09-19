# Handoff: Deepen Mobile Presentation Layer & Unit Testing

**Date**: 2026-08-01
**Context**: Kế tiếp buổi `/grilling` và quyết định kiến trúc "Deepen the AI Feature Execution Seam" ở Backend, session này tập trung vào Mobile App, cụ thể là refactor tầng Presentation để UI chỉ đóng vai trò hiển thị và đẩy toàn bộ logic vào Provider.

## Mục Tiêu (Goal)
- Đào sâu (deepen) module `TarotScreen` và `NumerologyScreen`, gỡ bỏ "shallow component" pattern (UI xử lý logic tính toán và giữ state bằng `setState`).
- Áp dụng "Hướng A": UI bọc ngoài, logic (State, Exception, Calculator) đẩy vào Riverpod Notifier (`TarotNotifier`, `NumerologyNotifier`).
- Đạt 100% test coverage (Unit Test) cho các Notifier vừa refactor.

## Những Việc Đã Làm (Actions Taken)
1. **Refactor NumerologyScreen & NumerologyProvider**:
   - Gỡ bỏ `setState` lưu `_calculatedResult`.
   - Tạo class `NumerologyState` tổng hợp State cho `NumerologyNotifier`.
   - Di chuyển `NumerologyCalculator.calculate` từ UI vào Notifier.
   - Sửa các lỗi Static Analysis (duplicate field, unused import, non-null assertions).
2. **Setup Testing Environment**:
   - Cài đặt `mocktail` (version 1.0.5) cho dự án Mobile để dễ dàng mock Repositories mà không cần code-gen.
3. **Viết Unit Tests (11 Tests PASS)**:
   - Viết test cho `TarotNotifier` (`apps/mobile/test/features/tarot/providers/tarot_provider_test.dart`), cover đủ 3 luồng: data thành công (có invalidation wallet), 402/403 Payment Error, và các lỗi thông thường.
   - Viết test cho `NumerologyNotifier` (`apps/mobile/test/features/numerology/providers/numerology_provider_test.dart`), cover luồng calculate local, luồng giải mã AI (có invalidation wallet), 402/403 Payment Error.
4. **Validation & Analysis**:
   - `flutter test` thành công toàn bộ.
   - `dart analyze` report "No issues found!".
5. **Commit Code**: Code đã được commit (`refactor: deepen mobile presentation layer and add unit tests`).

## Pre-Check Hoàn Thành
- **Logic đúng chưa?** Đúng. State được kiểm soát chặt chẽ trong Notifier, các lỗi 402/403 được ném ra qua `DioException` để UI bắt thông qua `MonetizationGuard.handlePaidActionError`.
- **Workflow ổn chưa?** Ổn thỏa. Việc tách UI ra khỏi logic giúp luồng dữ liệu một chiều rõ ràng, không còn side-effects kẹt trong Widget tree.
- **Thiếu tính năng gì?** Các luồng hiển thị đã được cover. Chưa có luồng cache offline kết quả vừa xem xong vào local storage (có thể làm ở Phase tối ưu tốc độ sau).
- **Rủi ro tiềm ẩn?** Việc gọi `ref.invalidate(walletBalanceProvider)` khi có thay đổi XU ở Notifier là tiện lợi, nhưng cần lưu ý nếu tần suất gọi API trừ tiền quá nhiều có thể gây giật lag (cần cơ chế optimistic update số XU ở local nếu mở rộng sau này).

## Hướng Dẫn Handoff Cho Session Tới
Theo tư duy của `/ask-matt` (về kỹ thuật Crossing sessions), session này đã khá dài. Sếp hãy mở một phiên hội thoại mới và dán prompt sau vào để tiếp tục công việc trên Main Flow:

```text
Chào AI, chúng ta tiếp nối phiên làm việc trước bằng tài liệu handoff: docs/sessions/session_mobile_presentation_refactor_handoff.md.

Việc refactor và testing cho Tarot và Thần Số Học trên Mobile đã hoàn tất xuất sắc (100% tests pass). Dưới vai trò là PM / CEO, tôi muốn chúng ta đi tiếp vào Main Flow.

Xin hãy đề xuất bước đi tiếp theo bằng cách ưu tiên một trong các hướng:
1. Triển khai tiếp môn thuật số thứ ba: "Gieo Quẻ Kinh Dịch" (I Ching).
2. Xây dựng hoàn chỉnh luồng Monetization (Paywall, Lịch sử nạp) trên Mobile.

Hãy chạy quy trình /grill-with-docs cho tính năng mà bạn đánh giá là ưu tiên cao nhất lúc này.
```
