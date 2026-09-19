# Sprint 68 Handover: Thống Nhất & Loại Bỏ Trùng Lặp /pricing và /wallet

## 1. Bối Cảnh & Vấn Đề
- Người dùng phát hiện sự không đồng nhất giữa `https://tuvitoantap.vercel.app/pricing` và `https://tuvitoantap.vercel.app/wallet`.
- Trước đây:
  - `/pricing` chứa code cũ với 3 gói (10, 50, 100 XU) và form quét QR tĩnh, không có polling SePay.
  - `/wallet` (và `apps/mobile`) dùng 4 gói chuẩn (20, 50, 120, 600 XU) với SePay VietQR động tự cộng XU, điểm danh nhận quà và ma trận chi phí.
  - Nút "+" trên header (`WalletBalance.svelte`) trỏ sang `/pricing` trong khi bấm số dư lại trỏ sang `/wallet`.

## 2. Các Thay Đổi Đã Thực Hiện
1. **Single Source of Truth (`pricing-config.ts`)**:
   - Khởi tạo `apps/web/src/lib/features/payment/pricing-config.ts` chứa định nghĩa 4 gói nạp chuẩn và ma trận chi phí dịch vụ thuật số.
   - Viết trọn bộ 8 unit tests tại `pricing-config.test.ts`.
2. **Nâng Cấp `/wallet/+page.svelte`**:
   - Sử dụng chung config từ `pricing-config.ts`.
   - Hỗ trợ URL query param `?package=` để tự động chọn gói khi người dùng click từ trang bảng giá.
3. **Thiết Kế Lại `/pricing/+page.svelte`**:
   - Chuyển đổi `/pricing` thành trang **Bảng Giá & Ma Trận Chi Phí Dịch Vụ Hoàng Gia (Royal Value & Feature Cost Matrix)**.
   - Hiển thị 4 gói nạp kèm đơn giá/XU, thanh trạng thái Ví XU hiện tại, bảng ma trận chi phí 6 phân hệ (Tử Vi, Tứ Trụ, Tướng Pháp, Kinh Dịch, Tarot, Báo Cáo Năm), cùng 4 cam kết vàng.
   - Nút "Nạp Gói Này" chuyển hướng thông minh sang `/wallet?package=...`.
4. **Chuẩn Hóa Header Navigation (`WalletBalance.svelte`)**:
   - Đổi link nút "+" từ `/pricing` sang `/wallet`.
5. **E2E Test Coverage**:
   - Tạo mới `pricing-wallet-unification.spec.ts` kiểm thử toàn diện luồng xem bảng giá, ma trận chi phí và điều hướng chọn gói sang Ví.

## 3. Verification Gates
- `pnpm -F @ziweiai/web check`: 0 errors, 0 warnings.
- `pnpm -F @ziweiai/web test`: 371/371 passed.
- `pnpm -F @ziweiai/api test`: 520/520 passed.
- `pnpm lint && pnpm typecheck`: 10/10 tasks successful.
- `pnpm exec turbo run build --force`: 6/6 successful.
- `playwright test smoke.spec.ts`: Passed (1.1s).
- `playwright test pricing-wallet-unification.spec.ts`: Passed (2.4s).
