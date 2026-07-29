# Refactor Kiến Trúc: WalletEngine & AuthStore
**Ngày:** 2026-07-29

## 1. Phân Tích & Mục Tiêu
Qua quá trình phân tích `WalletEngineService` và `AuthStore` dựa trên tệp handoff từ session trước, chúng ta xác định 2 "friction points" (điểm nghẽn kiến trúc):
- **Deepen WalletEngine**: `WalletEngineService` bị dồn quá nhiều trách nhiệm (God-class), vừa là sổ cái (ledger), vừa đảm nhiệm việc parse webhook và payload cho SePay và RevenueCat.
- **Centralize Admin Role**: Route bảo mật `/admin` kiểm tra quyền sơ sài (chỉ dựa vào `isAnonymous`), và không có một "nguồn sự thật" (Single Source of Truth) trong Store để các components truy vấn quyền quản trị.

**Mục tiêu:**
- Refactor `PaymentService` để gánh logic parse Webhook, giữ `WalletEngineService` siêu sạch (chỉ gọi RPC thêm/trừ XU).
- Cập nhật `AuthStore` và `admin/+layout.ts` để kiểm tra trực tiếp `role === 'admin'`.

## 2. Công Việc Đã Thực Hiện (Implementations)
### Backend
- **Sửa `WalletEngineService`**: Xóa bỏ các method `processSePayDeposit` và `processRevenueCatDeposit`.
- **Sửa `PaymentService`**: 
  - Inject `SUPABASE_CLIENT` để tra cứu user từ UUID rút gọn (TVTT code) và đảm bảo tính lặp lại (idempotency check) trên bảng `transactions`.
  - Di chuyển toàn bộ logic parse webhook của SePay và RevenueCat sang đây.
  - Sau khi validate, gọi hàm `this.walletEngine.addXU` để cộng XU cho user.

### Frontend
- **Sửa `AuthStore` (`auth-store.svelte.ts`)**: 
  - Khai báo helper `isAdminUser` để soi thuộc tính `user.app_metadata.role === 'admin'`.
  - Thêm getter `isAdmin` vào trong class `AuthStore` để hỗ trợ truy vấn quyền nhanh chóng bằng `$state` (runes).
- **Sửa Guard `admin/+layout.ts`**:
  - Bỏ biến `isAnonymous`, sử dụng hàm `isAdminUser(user)` để validate session.
  - Điều hướng chặt chẽ: Nếu chưa có access_token thì redirect về `/sign-in`. Nếu có token nhưng không phải admin thì chặn và đẩy về trang chủ `/`.

## 3. Kết Quả & Testing
- Đã chạy `pnpm -F @ziweiai/api typecheck` và `pnpm -F @ziweiai/web check`. Cả hai ứng dụng đều **vượt qua 100% không có lỗi TypeScript**. Kiến trúc mới giữ vững sự sạch sẽ, không breaking changes.
- Cải thiện đáng kể luồng đọc code và bảo mật ở trang Admin.
