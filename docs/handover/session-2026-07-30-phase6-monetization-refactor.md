# Session Handoff: Phase 6 - Monetization Refactor & Global State
**Date:** 2026-07-30
**Status:** Ready to Implement

## 1. Bối cảnh (Context)
Trong phiên làm việc trước, chúng ta đã phát triển thành công tính năng **Monetization Banner** cảnh báo người dùng nạp XU khi số dư dưới 15. Kế hoạch này đã chạy tốt và test E2E PASSED. 
Tuy nhiên, qua quá trình rà soát bằng luồng `/improve-codebase-architecture` và `/code-review`, chúng ta đã phát hiện ra 2 điểm cần cải tiến (Deepening Opportunities) và quyết định sẽ thực hiện chúng trong phiên này để đảm bảo mã nguồn hoàn hảo trước khi đi tiếp.

## 2. Mục tiêu của Session này (Goals)
1. **Khắc phục Edge Case Banner (`isError`):** Sửa lỗi hiển thị sai banner cảnh báo khi API bị lỗi mạng (isError = true). Banner không được xuất hiện nếu không lấy được dữ liệu.
2. **Refactor `WalletModel` thành Global State:** Chuyển `WalletModel` từ cục bộ (gọi `createWalletModel` riêng lẻ) thành một Store toàn cục sử dụng Svelte Context API. Điều này giúp mọi nơi trong app (Dashboard, Sidebar, Header) đều có thể truy cập `wallet.balance` dễ dàng mà không bị phân mảnh lifecycle.

## 3. Kế hoạch Triển khai (Implementation Plan)

### Bước 1: Tạo Wallet Context
- Tạo file mới `apps/web/src/lib/features/payment/wallet-context.ts`.
- Export `setWalletStore(auth)` (chỉ gọi 1 lần ở `+layout.svelte`) và `getWalletStore()` (dùng ở các component con).

### Bước 2: Khởi tạo ở Global Layout
- Sửa `apps/web/src/routes/(app)/+layout.svelte`.
- Gọi `const wallet = setWalletStore(auth)`.
- Gắn Svelte lifecycle `onMount` (hoặc `$effect` của Svelte 5) để `wallet.subscribe()` và cleanup `wallet.unsubscribe()` khi unmount. Việc này quản lý kết nối Realtime tập trung tại 1 chỗ.

### Bước 3: Cập nhật các Component con
- **`apps/web/src/lib/features/history/HistoryList.svelte`:** 
  - Thay thế `createWalletModel` bằng `getWalletStore()`.
  - Gỡ bỏ `onMount` vì Layout đã lo việc subscribe.
  - Sửa lại điều kiện banner: `{#if !auth.isAnonymous && !wallet.isLoading && !wallet.isError && wallet.balance !== null && wallet.balance < 15}`.
- **`apps/web/src/routes/(app)/wallet/+page.svelte`:**
  - Thay thế `createWalletModel` bằng `getWalletStore()`.
  - Gỡ bỏ Svelte lifecycle thừa nếu có.

## 4. Acceptance Criteria (Điều kiện Hoàn thành)
Sau khi lập trình xong mỗi tính năng, yêu cầu AI chạy:
1. **Pre-check analyze:** `pnpm -F @ziweiai/web check` -> Phải trả về 0 Errors.
2. **Viết/Cập nhật Test:** Kiểm tra lại file `apps/web/tests/e2e/monetization-banner.spec.ts` xem các test mock Supabase có còn pass sau khi đổi sang Global State hay không.
3. **Pre-test Playwright:** Chạy `pnpm -F @ziweiai/web exec playwright test tests/e2e/monetization-banner.spec.ts --workers=1` -> Phải PASSED.

---
**Hướng dẫn Dành cho Session Mới:**
Để bắt đầu, hãy đọc file này và tiến hành tuần tự từng bước trong phần 3 (Kế hoạch Triển khai). Đảm bảo chạy check và test sau khi hoàn thành.
