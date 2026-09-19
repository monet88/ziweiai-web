# SPRINT 86 HOÀN THÀNH & TÀI LIỆU BÀN GIAO SPRINT 87 (HANDOFF / HANDOVER)

> **Dự án**: ViOS — Tử Vi Toàn Tập (`ziweiai-web` & `ziweiai-mobile`)  
> **Giai đoạn hiện tại**: **KẾT THÚC SPRINT 86 ➔ CHUYỂN GIAO SPRINT 87**  
> **Người thực hiện**: Antigravity Pair Programmer (dành riêng cho **Đại Ka**)  
> **Thời điểm**: 12/09/2026

---

## I. MỤC TIÊU SPRINT 86 (OBJECTIVES)

1. **Khép kín tính năng AdMob SSV (Server-Side Verification)**:
   - Xây dựng cryptographic verification engine dùng thuật toán ECDSA SHA-256 đối soát public keys trực tiếp từ Google Servers.
   - Kết nối với RPC `claim_ad_reward` bảo vệ bằng cơ chế Pessimistic Row Lock (`FOR UPDATE`) chống tấn công nạp trùng / race condition vượt Daily Cap.
   - Duy trì cờ an toàn fail-closed `ENABLE_AD_REWARDS=false` trên Production.
2. **Đối soát giao dịch SePay VietQR thực tế**:
   - Chạy script đối soát 3 giao dịch đầu tiên (tổng 160.000 VNĐ) trên Supabase Production (`nachzhkeuzwiqmbtelrp`).
3. **Củng cố & Hoàn thiện Super Admin Dashboard (`/admin`)**:
   - Bổ sung các endpoints còn thiếu trong `AdminController`: `@Post('users/:userId/ban')`, `@Post('users/:userId/unban')`, và `@Post('configs/:key')`.
   - Khắc phục triệt để các lỗi type/linter trong bộ test `admin.controller.test.ts`.
4. **Kiểm toán chất lượng toàn diện (Strict Codebase Audit)**:
   - Đạt tỷ lệ pass 100% cho toàn bộ 966 bài kiểm thử tự động, build sạch monorepo, push đồng bộ mã nguồn lên Git.

---

## II. CÔNG VIỆC ĐÃ HOÀN THÀNH TRONG SPRINT 86 (WORK COMPLETED)

### 1. Backend API (`apps/api`)
- **Tạo mới `AdMobVerifierService`**:
  - Tự động fetch và cache danh sách Google AdMob Public Keys.
  - Parse ECDSA SHA-256 signature từ ASN.1 DER format để verify query params.
  - Viết 4 bài test unit kiểm thử thành công các trường hợp hợp lệ, giả mạo chữ ký và key id không tồn tại.
- **Bổ sung API Admin**:
  - Khép kín luồng Khóa / Mở khóa tài khoản: `@Post('users/:userId/ban')` và `@Post('users/:userId/unban')` trong `AdminController`, ghi nhận email Super Admin vào audit log.
  - Bổ sung `@Post('configs/:key')` hỗ trợ client SvelteKit cập nhật cấu hình linh hoạt.
- **Sửa lỗi TypeScript Linter**:
  - Sửa `jest.Mocked` thành type tương thích Vitest.
  - Chuẩn hóa interface `AuthenticatedUser` (loại bỏ `isAnonymous` dư thừa).

### 2. Web App Frontend (`apps/web`)
- Rà soát giao diện `/admin`: Overview, Users & XU Balance, Transactions (SePay), Feature Flags, Analytics, Blog, Audit Logs.
- Kiểm tra cơ chế bảo mật 2 lớp:
  - Client Guard: `isAdminUser(user)` kiểm tra `app_metadata.role = ['admin']`.
  - Backend Guard: `SuperAdminGuard` kiểm tra email trong bảng `public.admin_roles` có quyền `SUPER_ADMIN`.
- Đảm bảo tài khoản `sevengotek@gmail.com` của Đại Ka hoạt động đầy đủ quyền quản trị cao nhất.

### 3. Đối Soát & Nghiệp Vụ Thanh Toán SePay
- Thực thi `scripts/reconcile-sepay-transactions.js` trên Supabase Production:
  - Giao dịch 1: 10.000 VNĐ ➔ 10 XU
  - Giao dịch 2: 50.000 VNĐ ➔ 50 XU
  - Giao dịch 3: 100.000 VNĐ ➔ 120 XU (Bao gồm +20 XU thưởng)
  - Khớp thành công 100% với tài khoản test trên Production.

### 4. iOS Xcode Build Demo
- Nâng cấp iOS Deployment Target lên 15.0 trong `Podfile` và `project.pbxproj`.
- Khắc phục lỗi CocoaPods HTTP/2 bằng `git config http.version HTTP/1.1`.
- Sinh lại `Podfile.lock` (40 Pods) và build thành công `Runner.app` cho iOS Simulator.

---

## III. KẾT QUẢ KIỂM THỬ XÁC MINH (VERIFICATION PROOFS)

| Hệ Thống | Bài Kiểm Thử | Số Lượng / Kết Quả | Trạng Thái |
| :--- | :--- | :--- | :--- |
| **apps/api** | Vitest Unit & Integration Tests | **88 files / 553 tests passed** | ✅ 100% PASS |
| **apps/api** | TypeScript Typecheck (`tsc --noEmit`) | **0 errors, 0 warnings** | ✅ 100% PASS |
| **apps/web** | Svelte Check (`svelte-check`) | **0 errors, 0 warnings** | ✅ 100% PASS |
| **apps/web** | Vitest Component & Feature Tests | **79 files / 413 tests passed** | ✅ 100% PASS |
| **Monorepo** | Turbo Build (`turbo run build`) | **6/6 tasks successful** | ✅ 100% PASS |
| **Tổng Hệ Thống** | **Tổng số bài test toàn dự án** | **966 / 966 tests passed** | 🏆 HOÀN HẢO |

### Vibe-Git-Manager Sync:
- Các commit đã đẩy lên nhánh `main` của repo `galaxypro710-stack/ziweiai-web`:
  - `ebcf96f`: `fix(admin): implement ban/unban user endpoints and config update by key`
  - `13e046c`: `docs: add implementation notes for Sprint 86 Web & Admin hardening`
  - `5f9b09b`: `fix(admin): resolve type errors in admin controller test and document sprint 86 audit`
- Cây thư mục Git sạch sẽ 100% (`git status --short` trống).
- Production Live Vercel: `https://tuvitoantap.vercel.app/api/health` ➔ `{"status":"ok"}`.

---

## IV. BÀN GIAO SPRINT 87 (ROADMAP & FOCUS)

Mục tiêu tối thượng của **Sprint 87** là chuyển toàn bộ hỏa lực sang **Hoàn thiện giao diện & trải nghiệm người dùng trên Mobile App (iOS iPhone 17 Pro)**:

1. **Fix lỗi Font chữ phân tách dấu tiếng Việt (`LÁ SỐ ´`)**:
   - Nguyên nhân: GoogleFonts tải font động Cinzel/Playfair không hỗ trợ đầy đủ bộ ký tự tổ hợp tiếng Việt trên iOS.
   - Giải pháp: Tải font TTF chuẩn Unicode (Be Vietnam Pro / Playfair Display có sẵn precomposed Vietnamese diacritics) đưa vào `assets/fonts/` và khai báo trong `pubspec.yaml`.
2. **Fix lỗi `RenderFlex overflowed` trên iPhone 17 Pro**:
   - Tối ưu hóa các thẻ tin tức, header trang chủ và thanh trạng thái bằng `Flexible`, `Expanded`, và `SingleChildScrollView`.
3. **Fix lỗi sập hiển thị lưới 12 Cung Tử Vi (Palace Grid)**:
   - Điều chỉnh ràng buộc kích thước (Constraints) trên màn hình chi tiết lá số để lưới 12 Cung hiển thị sắc nét trên cả iOS và Android.
4. **Kiểm thử trải nghiệm Ví XU & Nạp tiền trên Mobile**:
   - Thẩm định modal nạp VietQR SePay và luồng đồng bộ số dư thời gian thực trên app điện thoại.
