# QA Report: Architecture Refactoring (Wallet & Auth)

**Date**: 2026-07-29
**Scope**: WalletEngineService, PaymentService, AuthStore roles

## 1. Mục Tiêu Kiểm Tra (QA Goals)
- Đảm bảo logic thanh toán, webhook, và role authorization hoạt động đúng sau khi refactor.
- Đảm bảo typecheck và lint hoàn toàn pass.
- Đánh giá kiến trúc hiện tại xem còn rủi ro tiềm ẩn hay code smell nào không.

## 2. Việc Đã Làm (Tasks Performed)
1. **Lint & Typecheck**: Chạy `pnpm lint && pnpm typecheck` trên toàn repo.
2. **Fix Minor Bugs**: Phát hiện 2 lỗi lint nhỏ (unused imports) sinh ra do quá trình dọn dẹp code trước đó.
   - Xóa `BadRequestException` khỏi `wallet-engine.service.ts`.
   - Xóa `supabase` import khỏi `admin/analytics/+page.ts`.
3. **Scan Codebase Architecture**: Dùng skill `/improve-codebase-architecture` để tìm các lỗ hổng kiến trúc và cơ hội refactor (deepening opportunities).

## 3. Kết Quả (Results)
- Mọi logic test đều pass (`437/437`).
- Typecheck và Lint hiện đã pass `100%`.
- Không còn bất kỳ unused variable nào. Quá trình route guard với role mới hoạt động trơn tru.

## 4. Phương Án Phát Triển & Tối Ưu (Ask-Matt Analysis)
Dựa theo hệ tư tưởng của Matt, chúng ta có các phương án tiếp theo:
- **Tối ưu kiến trúc (Architecture)**: Dùng skill `/improve-codebase-architecture` để tìm ra các "shallow modules". Đã phát hiện ra `WalletEngineService` hiện vẫn khá nông (shallow) vì các service tính năng (Almanac, Tarot, Dreams, v.v.) vẫn đang gọi thẳng hàm `deductXU` của `SupabasePersistenceGateway` thay vì đi qua `WalletEngineService`. 
- **Testing**: Nếu tiến hành thay thế toàn bộ `deductXU`, chúng ta sẽ dùng `/tdd` để test-first việc inject `WalletEngineService` vào từng module.
- **QA / E2E**: Chạy Playwright smoke test (`pnpm -F @ziweiai/web exec playwright test smoke.spec.ts`) để đảm bảo quá trình trừ XU ở UI không bị ảnh hưởng.

Tất cả đề xuất kiến trúc đã được xuất ra file báo cáo HTML độc lập.
