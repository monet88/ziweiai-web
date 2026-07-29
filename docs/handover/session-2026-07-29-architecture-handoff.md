# Session Handoff: Architecture Refactoring (WalletEngine & AuthStore)
Date: 2026-07-29

## Bối cảnh (Context)
Session hiện tại đã xử lý xong các tác vụ liên quan đến việc tối ưu UI/UX cho thiết bị di động (Mobile Bottom Nav) và fix lỗi typecheck cho Analytics Schema.

Chạy phân tích kiến trúc (`/improve-codebase-architecture`), chúng ta đã thống nhất 2 điểm nghẽn kiến trúc (friction points) cần được tái cấu trúc (refactor) trong session tới:
1. **WalletEngine & PaymentService (Deepening Opportunity)**: `WalletEngineService` hiện tại đang đảm nhận quá nhiều việc (tính toán XU, parse Webhook SePay/RevenueCat), làm giảm tính locality. `PaymentService` chỉ đóng vai trò truyền dữ liệu thụ động.
2. **AuthStore / Admin Role (Centralization)**: Route guard ở frontend chỉ kiểm tra `isAnonymous`, chưa quản lý phân quyền (Role) rõ ràng, điều này sẽ gây khó khăn nếu thêm phân quyền khác như Moderator.

## Mục tiêu cho Session mới (Goals)
1. **Refactor PaymentService & WalletEngineService**:
   - Chuyển toàn bộ logic phân tích Webhook (parse SePay payload, parse RevenueCat, kiểm tra tính lặp lại - idempotency) từ `WalletEngineService` sang `PaymentService`.
   - `WalletEngineService` chỉ đóng vai trò nhận request `addXU` và `deductXU` siêu sạch để tương tác với Supabase RPC.
2. **Centralize Admin Role trong AuthStore**:
   - Cập nhật class `AuthStore` ở frontend (dùng Svelte 5 runes) để tự động resolve và giữ trạng thái `isAdmin` hoặc mảng `roles`.
   - Nâng cấp `admin/+layout.ts` để kiểm tra role chuẩn xác qua Store mới thay vì chỉ dựa vào tính ẩn danh.

## Việc đã làm ở Session cũ (Done)
- Đã khắc phục Mobile UI bugs, ẩn top header cũ, tích hợp Bottom Nav.
- Đã fix Zod Schema lỗi mismatch ở dashboard.
- Đã vượt qua toàn bộ Playwright (smoke test) & typecheck.
- Đã deploy public lên Vercel.
- Đã sinh bản báo cáo `/improve-codebase-architecture` và thống nhất hướng giải quyết.

## Kết quả hiện tại (Results)
Codebase đang ở trạng thái xanh (green/passing) và hoàn toàn sạch sẽ, là thời điểm hoàn hảo nhất để sang một phiên làm việc mới, tiến hành refactor kiến trúc chuyên sâu mà không bị vướng bận bugs cũ.

---
**Hướng dẫn tiếp theo (Next Steps):**
Đưa Handoff Prompt cho Agent ở session tiếp theo để bắt đầu implement 2 mục tiêu phía trên.
