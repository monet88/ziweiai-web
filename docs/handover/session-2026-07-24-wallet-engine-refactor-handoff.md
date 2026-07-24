# Session Handover: WalletEngine Refactor & Live AI XU Deduction Smoke Verification

**Ngày thực hiện**: 2026-07-24  
**Project**: ViOS (Tử Vi & Chiêm Tinh AI)  
**Branch hiện tại**: `main` (commit `e502759`)  
**Live Frontend**: [https://tuvitoantap.pages.dev](https://tuvitoantap.pages.dev)  
**Live Backend API**: [https://tuvitoantap.vercel.app](https://tuvitoantap.vercel.app)  

---

## 1. Tóm Tắt Công Việc Đã Hoàn Thành

1. **Refactor Module `WalletEngine` Backend (`apps/api`)**:
   - **Tập Trung Hóa (Locality)**: Khởi tạo `WalletEngineService` (`apps/api/src/modules/wallet/wallet-engine.service.ts`) làm nguồn sự thật duy nhất cho toàn bộ nghiệp vụ XU (số dư `getBalance`, trừ XU `deductXU`, cộng XU `addXU`, xử lý Webhook deposit SePay VietQR `processSePayDeposit` và RevenueCat `processRevenueCatDeposit`).
   - **Ghi Sổ Cái Đồng Nhất (Ledger Log)**: Mọi thao tác biến động XU đều thực thi qua RPC `log_xu_transaction`, giúp tự động ghi lại lịch sử giao dịch vào bảng `xu_transactions` và cập nhật số dư nguyên tử ở `profiles`.
   - **Tái Sử Dụng Giao Diện (Leverage)**: Cập nhật `PaymentService`, `PaymentModule`, `UsersService`, `AdminService` và `AppModule` để sử dụng `WalletEngineService`.
   - **Unit Testing**: Bổ sung unit tests bao phủ 100% cho `WalletEngineService` (`wallet-engine.service.test.ts`).

2. **Kiểm Trụ Live Smoke các tính năng AI trừ XU**:
   - **Live Health & Features**: Gọi thành công `/api/health` và `/api/features` trên Vercel production API (`tuvitoantap.vercel.app`).
   - **Xác Minh Trừ XU Xem Tướng / Xem Tay**: Kiểm tra `@UseInterceptors(RequireXU(10))` chặn lỗi `402 INSUFFICIENT_XU` khi tài khoản thiếu XU và tự động trừ 10 XU khi đủ điều kiện.
   - **Xác Minh Trừ XU Báo Cáo Năm**: Kiểm tra `AnnualReportService` thực thi trừ 1 XU qua gateway/WalletEngine.

3. **Chạy Suite Playwright Regression Smoke**:
   - Chạy `pnpm -F @ziweiai/web exec playwright test smoke.spec.ts --workers=1` -> **1/1 test passed (25.1s)**.
   - Deploy cập nhật mới nhất lên Vercel Demo API (`pnpm deploy:vercel-demo`).

---

## 2. Kết Quả Kiểm Thử (Validation Gates)

- **Backend Typecheck**: `pnpm -F @ziweiai/api typecheck` → **0 errors**.
- **Svelte Check**: `pnpm -F @ziweiai/web check` → **0 errors (11 warnings)**.
- **Backend Unit Tests**: `pnpm -F @ziweiai/api test` → **71/71 test files passed (439 tests)**.
- **Playwright Regression Suite**: `smoke.spec.ts` → **1/1 passed**.
- **Live Vercel Demo**: `https://tuvitoantap.vercel.app/api/health` → `200 OK`.

---

## 3. Prompt Mẫu Dùng Để Mở Session Tiếp Theo

```markdown
Chào bạn, tiếp tục dự án ViOS tại `/Users/gray/Documents/bydone/tuvinew/ziweiai-web`.

## Handoff Context (Đọc trước)
1. `docs/handover/session-2026-07-24-wallet-engine-refactor-handoff.md` (Tài liệu handover session vừa xong)
2. `docs/handover/session-2026-07-24-vios-sepay-handoff.md`
3. Root `AGENTS.md` + `docs/agents/deploy.md`

## Hiện trạng
- Đã refactor thành công module WalletEngine backend tập trung hóa toàn bộ logic XU & VietQR deposit
- Tất cả unit tests backend (71 files, 439 tests) và Playwright smoke suite đều PASS 100%
- Vercel Backend API đã deploy thành công: https://tuvitoantap.vercel.app
- Live Demo Frontend: https://tuvitoantap.pages.dev
- Local Commit: `e502759` trên branch `main`

## Nhiệm vụ session mới
1. Đánh giá và hỗ trợ đẩy commit local `e502759` lên `origin/main`.
2. Kiểm tra/bổ sung tính năng hoặc cải tiến UI tiếp theo theo định hướng sản phẩm.
```
