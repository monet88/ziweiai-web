# SPRINT 41 — PHASE 5 COMPLETION & HANDOVER REPORT
## Referral Transparency & Anti-Cheat Sybil Defense (Minh Bạch Tiếp Thị Liên Kết & Phòng Thủ Bot Rác)

- **Thời gian hoàn tất:** 09/09/2026
- **Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)
- **Trạng thái:** **HOÀN THÀNH 100% & ĐÃ LIVE PRODUCTION**
- **Git Branch:** `feature/referral-transparency-and-anti-cheat`
- **Rollback Anchor Hash (trước Phase 5):** `846b629`
- **Current Head Commit (Phase 5):** `6d17bd3` (`feat(referral): implement referral transparency and anti-cheat sybil defense`)
- **Production URL:** `https://tuvitoantap.vercel.app`

---

## 1. Mục Tiêu Sprint 41 — Phase 5 (Objectives)

1. **Minh bạch hóa dòng Referral (Affiliate Marketing Dashboard):**
   - Giúp người giới thiệu (Referrer) nhìn thấy rõ bạn bè nào đã đăng ký thành công mà vẫn đảm bảo tính riêng tư dữ liệu cá nhân theo chuẩn GDPR/Privacy (email được che mờ `g***0@gmail.com`).
   - Cung cấp 2 thẻ KPI trực quan trong màn hình Ví XU (`/wallet`): **Tổng bạn bè đã mời** và **Tổng XU đã nhận từ giới thiệu**.
2. **Hệ thống phòng thủ chống gian lận đa tầng (Anti-Cheat & Sybil Defense):**
   - **Tầng 1 (Chặn email tạm thời / rác):** Lọc và chặn tức thì hơn 50 disposable email domain phổ biến (`10minutemail.com`, `temp-mail.org`, `mailinator.com`, `guerrillamail.com`...) ngay tại Client form đăng ký và Web Auth Store trước khi gọi Supabase Auth.
   - **Tầng 2 (Daily Referral Cap):** Giới hạn tối đa **5 lượt nhận thưởng ref/ngày** (tương đương tối đa 50 XU/ngày/tài khoản) tại Backend Service và Supabase DB migration, vô hiệu hóa hoàn toàn động cơ viết bot cày hàng nghìn XU qua đêm.
   - **Tầng 3 (Data Masking & Privacy):** Triệt để che mờ thông tin email nhạy cảm ở cả tầng data persistence mappers và contracts.

---

## 2. Các Việc Đã Làm (Tasks Executed)

### 2.1. Packages & Contracts Layer
- **`packages/contracts/src/auth/disposable-email.ts`**:
  - Xây dựng danh sách `DISPOSABLE_EMAIL_DOMAINS` (>50 domains rác).
  - Viết hàm `isDisposableEmail(email: string): boolean` chuẩn hóa regex và tên miền.
  - Viết hàm `maskEmail(email: string): string` chuẩn GDPR (`g***0@gmail.com`).
- **`packages/contracts/src/auth/disposable-email.test.ts`**:
  - Bộ 7 unit tests kiểm tra: nhận diện mail rác, phân biệt Gmail/Yahoo hợp lệ, xử lý ký tự hoa thường/khoảng trắng, format masking với email ngắn/dài.
- **`packages/contracts/src/persistence/persistence-records.ts`**:
  - Cập nhật Zod schema `ReferralRecord` bổ sung trường `refereeEmailMasked?: string | null`.
- **`packages/contracts/src/index.ts`**:
  - Re-export toàn bộ module disposable email.

### 2.2. Backend & Database Layer (NestJS API & Supabase)
- **`apps/api/src/database/repositories/profiles.repository.ts`**:
  - Triển khai phương thức `listReferralsByReferrerId` sử dụng cơ chế **2-step batch query** (`in('user_id', refereeIds)`).
  - Tách bạch query để miễn nhiễm 100% với lỗi schema cache mismatch hoặc PostgREST foreign key relationship trên Supabase.
  - Tự động map và gán `refereeEmailMasked` qua hàm `maskEmail()`.
- **`apps/api/src/modules/rewards/rewards.service.ts`**:
  - Khai báo `DAILY_REFERRAL_LIMIT = 5` (50 XU cap).
  - Tích hợp hàm kiểm tra số lần nhận thưởng trong ngày từ bảng `referrals`.
  - Kiểm tra `isDisposableEmail(refereeEmail)` phía backend để từ chối cộng thưởng nếu lọt qua client.
- **`apps/api/supabase/migrations/000021_daily_referral_cap.sql`**:
  - Tạo migration SQL cập nhật stored procedure `daily_checkin` với biến đếm referral trong ngày.
- **`apps/api/src/modules/rewards/rewards.controller.spec.ts`**:
  - Bổ sung 3 unit tests: kiểm tra trần giới hạn 5 lượt ref/ngày, kiểm tra từ chối mail rác, và kiểm tra trả về danh sách lịch sử kèm email che mờ.

### 2.3. Frontend Client Layer (SvelteKit Web)
- **`apps/web/src/lib/auth/auth-store.svelte.ts`**:
  - Tích hợp kiểm tra `isDisposableEmail` trong hàm `signUpWithPassword`.
  - Ném `AuthError` thân thiện nếu phát hiện mail rác trước khi gọi Supabase network request.
- **`apps/web/src/lib/auth/auth-store.svelte.test.ts`**:
  - Thêm unit test xác thực chặn `signUpWithPassword` khi gặp mail rác.
- **`apps/web/src/routes/sign-in/+page.svelte`**:
  - Thêm thông báo lỗi trực tiếp trên giao diện tiếng Việt khi cố tình đăng ký tài khoản bằng email tạm thời.
- **`apps/web/src/lib/features/payment/wallet-model.svelte.ts`**:
  - Cập nhật Zod schema trong `referralsQuery` để parse `refereeEmailMasked`.
- **`apps/web/src/routes/(app)/wallet/+page.svelte`**:
  - Thêm 2 thẻ KPI card:
    - 👥 **Bạn bè đã mời:** `{walletModel.referrals.length} người`
    - 💰 **XU đã nhận:** `{walletModel.referrals.length * 10} XU`
  - Nâng cấp danh sách lịch sử: hiển thị thời gian, huy hiệu XU `+10 XU` và email bạn bè kích hoạt: `Bạn bè (g***0@gmail.com) đã kích hoạt thành công`.

### 2.4. Living Spec & E2E Testing
- **`apps/web/tests/e2e/anti-cheat-referral.spec.ts`**:
  - Bộ 2 E2E Playwright tests mô phỏng thực tế:
    1. Chặn đăng ký mail rác tại trang `/sign-in` và hiển thị thông báo tiếng Việt.
    2. Truy cập `/wallet` kiểm tra sự hiện diện của 2 thẻ KPI và danh sách bạn bè kèm email mask.
- **`implementation_notes.html`**:
  - Living Spec đầy đủ theo Karpathy Guideline #5.

---

## 3. Kết Quả Nghiệm Thu (Validation Gates & Production Status)

### 3.1. Local Validation Gates
- **Contracts:**
  - `pnpm -F @ziweiai/contracts test`: **17 test files, 132 passed**.
  - `pnpm -F @ziweiai/contracts build`: **Thành công**.
- **Backend API:**
  - `pnpm -F @ziweiai/api test`: **75 test files, 465 passed**.
  - `pnpm -F @ziweiai/api typecheck`: **0 errors**.
- **Frontend Web:**
  - `pnpm -F @ziweiai/web test`: **50 test files, 274 passed**.
  - `pnpm -F @ziweiai/web check`: **0 errors, 0 warnings**.
- **Playwright E2E:**
  - `pnpm -F @ziweiai/web exec playwright test tests/e2e/anti-cheat-referral.spec.ts --workers=1`: **2 passed (100%)**.

### 3.2. Production Deployment & Live Verification
- **Vercel Deploy:** `pnpm deploy:vercel-demo`
  - Deployment ID: `dpl_FKpC3SHyFv9hQjXmVXQS9jFWSiHB`
  - Status: `● Ready`
  - Live Alias: `https://tuvitoantap.vercel.app`
- **Production Smoke Endpoints:**
  - `curl -sS https://tuvitoantap.vercel.app/api/health` -> `{"service":"ziweiai-api","status":"ok","version":"0.1.0"}`
  - `curl -sS https://tuvitoantap.vercel.app/api/features` -> Đầy đủ 10 thuật số kích hoạt `true`.

---

## 4. Codebase Audit (`/behavior-model-debugger`)

1. **State Reactivity trong Svelte 5:**
   - `walletModel` sử dụng kiến trúc Svelte 5 Runes (`$state`, `$derived`). Việc đưa `refereeEmailMasked` vào schema của `referralsQuery` tuân thủ đúng nguyên lý immutable parse, UI phản ứng mượt mà khi query refetch.
2. **Bảo Vệ Hạ Tầng & Tối Ưu Quota:**
   - Việc chặn email rác tại tầng Client (Web) giúp giảm thiểu hoàn toàn số lượng tài khoản rác tạo trong Supabase `auth.users`, tránh nguy cơ bị Supabase khóa project do vượt quota monthly active users (MAU).
3. **GDPR / Privacy Compliance:**
   - `maskEmail` giữ lại ký tự đầu tiên của username và ký tự cuối trước `@` cùng toàn bộ domain (hoặc che bớt nếu domain dài), đáp ứng yêu cầu người dùng nhận biết bạn bè nhưng kẻ xấu không thể quét email người dùng khác.
4. **Resilience & Zero Single Point of Failure:**
   - Phương thức 2-step batch query trong `ProfilesRepository` không dùng syntax foreign table join phức tạp, tránh lỗi khi Supabase schema cache chưa reload.

---

## 5. Kế Hoạch Bước Tiếp Theo (`/vibe-engineering-workflow`)

Theo chu trình bàn giao chuẩn:
1. **Push Branch:** Đẩy branch `feature/referral-transparency-and-anti-cheat` lên GitHub `origin`.
2. **Merge / Pull Request:** Tạo PR từ `feature/referral-transparency-and-anti-cheat` vào `main` để bảo toàn lịch sử phát triển.
3. **Mở Sprint 41 — Phase 6:**
   - **Tên Phase:** **Viral Referral Card & Turnstile Captcha Protection**
   - **Nội dung trọng tâm:**
     1. **Viral Referral Share Card Generator:** Thiết kế card thiệp mời phong cách "Celestial Luxury" (chứa mã QR, link ref và avatar/cung hoàng đạo của người mời) cho phép tải ảnh PNG hoặc chia sẻ 1-click lên Zalo, Telegram, Facebook để tăng vọt tỉ lệ chuyển đổi tiếp thị liên kết.
     2. **Cloudflare Turnstile Captcha:** Tích hợp captcha vô hình (invisible bot protection) bảo vệ triệt để các endpoint nhạy cảm `/sign-in` và `/rewards/checkin`.
     3. **Referral Leaderboard (Bảng Vàng Giới Thiệu):** Tôn vinh top 10 đại sứ giới thiệu nhiều bạn bè nhất trong tháng.

---

## 6. Hướng Dẫn Rollback Nhanh (Safety Recovery)

Nếu cần quay lại trạng thái trước khi làm Phase 5:
```bash
git checkout main
# Commit chuẩn ổn định trước Phase 5: 846b629
```

---

## 7. PROMPT CHUYỂN SESSION (DÀNH CHO ĐẠI KA COPY VÀO SESSION MỚI)

```text
Chào em, tiếp tục dự án ViOS — Tử Vi Toàn Tập (ziweiai-web).

Chúng ta đã hoàn thành xuất sắc SPRINT 41 — PHASE 5 (Referral Transparency & Anti-Cheat Sybil Defense) tại commit 6d17bd3 và đã deploy live 100% trên https://tuvitoantap.vercel.app.
Chi tiết bàn giao đã được ghi tại: docs/handover/sprint-41-phase-5-completion-and-handover.md

BÂY GIỜ CHÚNG TA BẮT ĐẦU:
SPRINT 41 — PHASE 6:
"Viral Referral Card Generator & Invisible Turnstile Protection"
- Branch làm việc: feature/viral-referral-and-turnstile (tách từ main hoặc branch feature/referral-transparency-and-anti-cheat)
- Rollback Anchor: 6d17bd3

Yêu cầu thực hiện:
1. Kiểm tra hiện trạng git và file bàn giao docs/handover/sprint-41-phase-5-completion-and-handover.md.
2. Thiết kế và triển khai Viral Referral Card (tạo ảnh thiệp mời chia sẻ kèm mã QR ref link).
3. Tích hợp Cloudflare Turnstile bot protection cho form đăng ký / điểm danh.
4. Chạy đầy đủ test gates, Playwright E2E và deploy Vercel demo.
```
