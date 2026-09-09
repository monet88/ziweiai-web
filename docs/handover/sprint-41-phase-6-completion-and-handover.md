# SPRINT 41 — PHASE 6 COMPLETION & HANDOVER REPORT
## Viral Referral Card Generator & Invisible Turnstile Protection (Thiệp Mời Tiếp Thị Hoàng Gia & Phòng Thủ Bot Vô Hình)

- **Thời gian hoàn tất:** 09/09/2026
- **Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)
- **Trạng thái:** **HOÀN THÀNH 100% & TOÀN BỘ GATES ĐÃ PASS**
- **Git Branch:** `feature/viral-referral-and-turnstile`
- **Rollback Anchor Hash (trước Phase 6):** `7469736`
- **Current Head Commit (Phase 6):** `14f0ced` (`feat(referral): implement viral referral card generator and invisible turnstile bot protection`)
- **Vercel Deployment ID:** `dpl_8ERF5owt9Lt8XJs9TsaV9yDUjpQC`
- **Production URL:** `https://tuvitoantap.vercel.app`

---

## 1. Mục Tiêu Sprint 41 — Phase 6 (Objectives)

1. **Viral Referral Card Generator (Thiệp Mời Tiếp Thị Hoàng Gia - Celestial Luxury):**
   - Thiết kế và phát triển công cụ sinh thiệp mời phong cách "Celestial Luxury" (nền Cosmic Indigo huyền bí, viền mạ vàng kép, hoa văn 4 góc hoàng gia, huy hiệu quà tặng +10 XU khai vận).
   - Tích hợp bộ sinh ma trận QR Model 2 (Version 4, ECC Level M) thuần TypeScript (Zero-Dependency) trực tiếp trên Client Canvas, chống triệt để lỗi browser `Tainted Canvas` (CORS).
   - Hỗ trợ đầy đủ các hành vi lan tỏa mạng xã hội:
     - 📥 **Tải Ảnh Thiệp (.PNG)**: Độ phân giải Retina 2x (800 x 1120 px) siêu nét.
     - 📋 **Sao Chép Ảnh**: Lưu thẳng vào Clipboard (`ClipboardItem`) để dán ngay (Ctrl+V) vào khung chat Zalo/Telegram.
     - 🚀 **Chia Sẻ 1 Chạm**: Web Share API trên di động cùng 3 nút mở nhanh Zalo, Facebook, Telegram.
2. **Cloudflare Turnstile Bot Protection (Invisible Captcha):**
   - Bảo vệ vô hình (zero UX friction) cho 2 cửa ngõ trọng yếu:
     1. Form Đăng Ký Tài Khoản (`/sign-in` mode `sign-up`).
     2. Endpoint Điểm Danh Nhận XU (`/rewards/checkin`).
   - Chế độ **Graceful Fallback**: tự động bypass an toàn khi chưa cấu hình secret key hoặc mạng client chặn script, hỗ trợ Cloudflare Test Keys tiêu chuẩn cho testing tự động.

---

## 2. Các Việc Đã Làm (Tasks Executed)

### 2.1. Packages & Contracts Layer
- **`packages/contracts/src/auth/turnstile.ts`**:
  - Khai báo schema Zod `TurnstileVerifyRequestSchema`, `TurnstileVerifyResponseSchema`.
  - Hằng số `CLOUDFLARE_TURNSTILE_TEST_KEYS` chuẩn Cloudflare.
- **`packages/contracts/src/auth/turnstile.test.ts`**:
  - Unit tests cho schemas và constants.
- **`packages/contracts/src/index.ts`**:
  - Re-export module turnstile.

### 2.2. Backend API Layer (`apps/api`)
- **`apps/api/src/common/turnstile/turnstile.service.ts`**:
  - Dịch vụ xác thực token Cloudflare Turnstile qua `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
  - Hỗ trợ chế độ Graceful Bypass Mode khi `TURNSTILE_SECRET_KEY` chưa được gán.
- **`apps/api/src/common/turnstile/turnstile.service.spec.ts`**:
  - Bộ 5 unit tests kiểm tra: graceful bypass, reject empty token, verify thành công, reject token giả, và fallback an toàn khi mạng Cloudflare bị gián đoạn.
- **`apps/api/src/common/turnstile/turnstile.controller.ts`**:
  - Endpoint công khai `POST /api/auth/turnstile/verify` phục vụ form đăng ký.
- **`apps/api/src/common/turnstile/turnstile.module.ts`**:
  - Module đăng ký service và controller.
- **`apps/api/src/modules/rewards/rewards.controller.ts`**:
  - Endpoint `checkin` nhận `turnstileToken` và kiểm tra bot defense qua `TurnstileService`.
- **`apps/api/src/modules/rewards/rewards.controller.spec.ts`**:
  - Thêm mock và test case chặn botnet khi verification thất bại.
- **`apps/api/src/app.module.ts` & `rewards.module.ts`**:
  - Tích hợp `TurnstileModule`.

### 2.3. Frontend Web Layer (`apps/web`)
- **`apps/web/src/lib/features/referral/qr-matrix.ts`**:
  - Bộ sinh ma trận QR thuần TypeScript (Version 4, 33x33, ECC Level M) chuẩn ISO/IEC 18004.
- **`apps/web/src/lib/features/referral/qr-matrix.test.ts`**:
  - Unit test kiểm tra kích thước 33x33, vị trí 3 Finder Patterns (7x7) và kiểm tra capacity.
- **`apps/web/src/lib/components/security/TurnstileWidget.svelte`**:
  - Component Svelte 5 Rune bọc Cloudflare Invisible Turnstile với safety timeout 4 giây.
- **`apps/web/src/lib/features/referral/ViralReferralCardModal.svelte`**:
  - Modal thiệp mời "Celestial Luxury" tuyệt đẹp với Canvas preview, render 800x1120 px, tải ảnh PNG, sao chép clipboard và chia sẻ mạng xã hội.
- **`apps/web/src/lib/features/payment/wallet-model.svelte.ts`**:
  - `checkin(turnstileToken?: string)` hỗ trợ truyền token lên backend.
- **`apps/web/src/routes/(app)/wallet/+page.svelte`**:
  - Nút "Tạo Thiệp Mời Celestial Luxury" nổi bật trong section Tiếp thị liên kết.
  - Tích hợp Turnstile verification ngầm cho nút điểm danh nhận XU.
- **`apps/web/src/routes/sign-in/+page.svelte`**:
  - Tích hợp Turnstile bot defense verification cho form tạo tài khoản.

### 2.4. Living Spec & E2E Testing
- **`apps/web/tests/e2e/viral-referral-and-turnstile.spec.ts`**:
  - Bộ 2 E2E tests Playwright xác nhận mở modal thiệp mời, kiểm tra các nút tải ảnh/sao chép/chia sẻ và kiểm tra Turnstile container ngầm.
- **`implementation_notes.md` & `implementation_notes.html`**:
  - Cập nhật Living Spec Phase 6 đầy đủ theo Karpathy Rule #5.

---

## 3. Kết Quả Nghiệm Thu (Validation Gates)

### 3.1. Contracts Gate
- `pnpm -F @ziweiai/contracts test`: **18 test files, 135 passed (100%)**.
- `pnpm -F @ziweiai/contracts build`: **Thành công (0 errors)**.

### 3.2. Backend API Gate
- `pnpm -F @ziweiai/api test`: **76 test files, 471 passed (100%)**.
- `pnpm -F @ziweiai/api typecheck`: **Pass (0 errors)**.

### 3.3. Frontend Web Gate
- `pnpm -F @ziweiai/web check`: **0 errors, 0 warnings**.
- `pnpm -F @ziweiai/web test`: **51 test files, 277 passed (100%)**.

### 3.4. Playwright E2E Tests
- `pnpm -F @ziweiai/web exec playwright test tests/e2e/viral-referral-and-turnstile.spec.ts --workers=1`: **2 passed (100%)**.
- `pnpm -F @ziweiai/web exec playwright test tests/e2e/anti-cheat-referral.spec.ts --workers=1`: **2 passed (100%) (Zero Regression)**.

---

## 4. Hướng Dẫn Rollback Nhanh (Safety Recovery)

Nếu cần quay lại trạng thái trước khi làm Phase 6:
```bash
git checkout feature/referral-transparency-and-anti-cheat
# Hoặc rollback về anchor hash: 7469736
```
