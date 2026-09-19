# SPRINT 41 — PHASE 5 HANDOVER & SPECIFICATION
## Referral Transparency & Anti-Cheat Sybil Defense (Minh Bạch Tiếp Thị Liên Kết & Phòng Thủ Bot Rác)

- **Thời gian lập:** 09/09/2026
- **Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)
- **Trạng thái hiện tại:**
  - **Sprint 41 Phase 4 (Đã hoàn thành & Live 100%):** Báo cáo năm trong lịch sử & Chế độ xem 12 cung thông minh trên mobile (3/3 E2E Playwright Tests Passed, Deploy Production `https://tuvitoantap.vercel.app` thành công).
  - **Sprint 41 Phase 5 (Bắt đầu):** Minh bạch hoá Referral & Phòng thủ chống gian lận (Anti-Cheat Sybil Defense).
- **Git Branch:** `feature/referral-transparency-and-anti-cheat`
- **Rollback Anchor Hash:** `846b629`

---

## 1. Bối Cảnh & Mục Tiêu Cốt Lõi (Context & Goal)

### 1.1. Bối cảnh từ phản ánh thực tế của Đại Ka
1. Khi tài khoản người giới thiệu (`galaxy`) nhận được 10 XU từ link ref (`https://tuvitoantap.vercel.app/share/ref/56153792`), màn hình Ví XU (`/wallet`) chỉ hiển thị dòng chữ chung chung: `"Bạn mới đăng ký & điểm danh | +10 XU"`. Người dùng không biết bạn bè nào đã đăng ký, gây khó khăn cho việc làm marketing viral, affiliate và đo lường hiệu quả giới thiệu.
2. Cơ chế thưởng XU hiện tại (+10 XU cho người mời, +15 XU cho người mới) rất kích thích người dùng, nhưng tiềm ẩn **LỖ HỔNG BẢO MẬT & TÀI CHÍNH CỰC KỲ NGUY HIỂM**:
   - Trang `/sign-in` cho phép đăng ký bằng Email + Password tự do mà chưa có bộ lọc email rác (disposable / temp-mail).
   - Bot có thể tự động đăng ký hàng ngàn tài khoản mail rác ảo (`bot1@tempmail.com`...) và gọi API `POST /rewards/checkin` kèm mã ref để cày hàng chục ngàn XU miễn phí.
   - Kẻ xấu dùng số XU lậu này spam gọi các API AI (OpenRouter, DeepSeek) làm cạn kiệt tài khoản tín dụng AI của dự án và làm phình to, nghẽn database Supabase.

### 1.2. Mục tiêu Sprint 41 — Phase 5
1. **Minh bạch hoá Referral (Affiliate Marketing Dashboard):**
   - Người giới thiệu nhìn thấy rõ ràng bạn bè nào đã đăng ký (email được che mờ bảo mật theo chuẩn GDPR: `g***y@gmail.com`).
   - Thống kê tổng quan ngay trong Ví XU: **Tổng bạn bè đã mời** | **Tổng XU đã nhận**.
2. **Hệ thống Phòng Thủ Chống Gian Lận (Anti-Cheat & Sybil Defense):**
   - **Tầng 1 - Chặn Email Rác:** Tích hợp bộ lọc domain email tạm thời (disposable mail blacklist như `10minutemail`, `tempmail`, `mailinator`...), từ chối đăng ký ngay từ cửa ngõ.
   - **Tầng 2 - Hạn mức thưởng mỗi ngày (Daily Referral Cap):** Đặt trần tối đa XU nhận từ referral mỗi ngày (ví dụ 50 - 100 XU/ngày/tài khoản) để triệt tiêu động cơ viết bot cày 1 đêm 10.000 XU.
   - **Tầng 3 - Captcha Bot Defense:** Tích hợp hoặc chuẩn bị sẵn cấu hình Cloudflare Turnstile cho luồng đăng ký & điểm danh.

---

## 2. Phân Tích Kỹ Thuật Chi Tiết (Codebase Audit via `/behavior-model-debugger`)

### 2.1. Thực trạng Database & Backend
- **Bảng `referrals` (`000018_referral_system.sql`):**
  - Có các cột: `id`, `referrer_id`, `referee_id`, `reward_xu`, `status`, `created_at`, `completed_at`.
  - Bảng `profiles`: Cột `display_name` lưu email người dùng lúc đăng ký (theo trigger `handle_new_user` trong `000020_handle_new_user_referral_code.sql`).
- **Endpoint `GET /rewards/referrals` (`RewardsController` -> `ProfilesRepository.listReferralsByReferrerId`):**
  - Hiện tại chỉ `SELECT * FROM referrals WHERE referrer_id = userId`.
  - **Thiếu sót:** Chưa JOIN với `profiles` để lấy `display_name` của `referee_id`.
- **Hàm RPC `daily_checkin`:**
  - Cộng 5 XU điểm danh ngày + 10 XU cho người được mời lần đầu + 10 XU cho người giới thiệu.
  - **Thiếu sót:** Chưa có giới hạn trần (cap) số lần nhận thưởng referral trong ngày của `referrer_id`.

### 2.2. Thực trạng Frontend Web Client
- **`apps/web/src/routes/(app)/wallet/+page.svelte` (dòng 320-331):**
  - Hardcode: `<span class="ref-desc">Bạn mới đăng ký & điểm danh</span>`.
  - Không có thống kê tổng hợp số bạn bè đã mời thành công.
- **`apps/web/src/routes/sign-in/+page.svelte`:**
  - Nhận bất kỳ chuỗi email nào mà không kiểm tra domain có phải là mail tạm thời/rác hay không.

---

## 3. Bản Kế Hoạch Triển Khai Cho Session Mới (Action Plan)

### Task 1: Backend Referral Attribution & Security Enhancement
- **File cần sửa:**
  - `packages/contracts/src/api/backend-api.ts` (hoặc persistence records): Bổ sung trường `refereeEmailMasked?: string` vào schema trả về của referral history.
  - `apps/api/src/database/repositories/profiles.repository.ts`:
    - Viết query JOIN giữa `referrals` và `profiles` (on `referrals.referee_id = profiles.user_id`) để lấy `display_name`.
    - Viết helper hàm che mờ email an toàn: `galaxypro710@gmail.com` -> `g***0@gmail.com`.
  - `apps/api/src/modules/rewards/rewards.service.ts`:
    - Thêm kiểm tra hạn mức nhận thưởng ref trong ngày (Daily Referral Cap: tối đa 5 lượt thưởng ref/ngày = 50 XU/ngày cho mỗi referrer).

### Task 2: Disposable Email Blocklist (Chống Mail Rác)
- **File cần tạo/sửa:**
  - `packages/contracts` hoặc shared util: Tạo module `isDisposableEmail(email: string): boolean` chứa danh sách các domain mail ảo phổ biến (`10minutemail.com`, `temp-mail.org`, `mailinator.com`, `guerrillamail.com`, `trashmail.com`...).
  - `apps/web/src/routes/sign-in/+page.svelte`: Kiểm tra email trước khi gọi `auth.signUpWithPassword`. Nếu phát hiện mail rác, báo lỗi thân thiện: `"Hệ thống không chấp nhận email tạm thời. Vui lòng sử dụng Gmail hoặc đăng nhập Google 1-Click để nhận XU thưởng an toàn."`
  - `apps/api`: Thêm guard chặn đăng ký/điểm danh nếu phát hiện email rác.

### Task 3: Nâng Cấp Giao Diện Ví XU (`/wallet`) Chuẩn Affiliate Marketing
- **File cần sửa:**
  - `apps/web/src/lib/features/payment/wallet-model.svelte.ts`: Cập nhật schema `referralsQuery` để parse `refereeEmailMasked`.
  - `apps/web/src/routes/(app)/wallet/+page.svelte`:
    - Thêm 2 thẻ KPI nhỏ:
      - 👥 **Bạn bè đã mời**: `{walletModel.referrals.length}` người
      - 💰 **XU đã nhận từ giới thiệu**: `{walletModel.referrals.length * 10}` XU
    - Danh sách lịch sử hiển thị rõ:
      - Ngày giờ (VD: `09/09/2026 10:30`)
      - Tên bạn bè: `Bạn bè (g***0@gmail.com) đã kích hoạt thành công`
      - Số XU: `+10 XU`

### Task 4: Chạy Validation Gates & Live Smoke Verification
- Chạy:
  - `pnpm -F @ziweiai/contracts build`
  - `pnpm -F @ziweiai/api test`
  - `pnpm -F @ziweiai/web test`
  - `pnpm deploy:vercel-demo`
  - Live smoke Playwright kiểm chứng.

---

## 4. Hướng Dẫn Rollback / Khôi Phục Nhanh (Zero-Risk Recovery)

Nếu cần quay lại trạng thái ổn định trước khi làm Sprint 41 Phase 5:
```bash
git checkout main
# Commit an toàn đã test pass 100% và deploy sẵn sàng:
# Hash: 846b629
```
