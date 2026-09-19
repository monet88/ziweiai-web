# Wayfinder Project Roadmap — Tử Vi Toàn Tập (2026-07-24)

> Document được tạo tự động theo quy trình `/ask-matt` & `/wayfinder` để định hướng triển khai, tối ưu hóa và thương mại hóa toàn diện dự án Tử Vi Toàn Tập tại `/Users/gray/Documents/bydone/tuvinew/ziweiai-web`.

---

## 1. Tổng Quan & Định Hướng /Ask-Matt

Theo sơ đồ `/ask-matt`, khi một dự án có quy mô mở rộng nhiều tính năng, liên quan đến trải nghiệm người dùng (UI/UX, Light/Dark theme), mô hình kinh doanh (Vip/Premium, VietQR/SePay, Affiliate), quản trị (Admin Dashboard, Anonymous Users) và kiểm thử chất lượng (Backtest/Smoke test cho 15+ hệ thuật số), việc triển khai cần trải qua luồng **Wayfinder** — tạo bản đồ công việc (Shared Map of Decision Tickets) để giải quyết lần lượt từng mốc quyết định và tính năng.

---

## 2. Mục Tiêu Dự Án (Destination)

Xây dựng và vận hành hệ thống **Tử Vi Toàn Tập** hoạt động ổn định 100%, bảo mật, tối ưu UX/UI với phong cách Notion Paper-Calm (hỗ trợ Light/Dark theme), thương mại hóa mượt mà qua VietQR/SePay, hệ thống thưởng Affiliate & Điểm danh daily, cùng bộ 15 hệ thuật số mở rộng đã được kiểm thử (Backtest & Playwright Smoke Test).

---

## 3. Việc Đã Làm & Hiện Trạng Hệ Thống (Decisions So Far & Current State)

| Hạng mục | Trạng thái | Chi tiết kỹ thuật |
|---|---|---|
| **API Unit Tests** | **PASS 100%** | 430/430 unit tests xanh ngắt (phủ toàn bộ Services, Controllers, Prompt Builders, Scoring Algos). |
| **Web Svelte Check** | **PASS (0 errors, 0 warnings)** | Không có lỗi TypeScript hay svelte-check warning nào trên `apps/web`. |
| **Playwright Smoke Test** | **PASS 100%** | 7/7 core E2E tests hoàn thành trong 14.2s. |
| **SePay Payment Webhook & Realtime Toast** | **DONE** | Webhook `@Public()` nhận tiền VietQR -> RPC `add_xu` -> Supabase Realtime đẩy Toast chúc mừng số dư tăng. |
| **Admin Manual Reconciliation** | **DONE** | Route `/admin/transactions` cho phép Admin tra cứu và gán XU thủ công khi khách gõ sai cú pháp `TVTT <shortUuid>`. |
| **Annual Report (US-016)** | **DONE** | API `POST /charts/:id/annual-report` tổng hợp lưu niên + 12 lưu nguyệt, cache DB `annual_reports`, timeout 60s, UI Modal chuẩn a11y. |
| **15+ Hệ thuật số mở rộng** | **DONE (Active)** | Đã tích hợp API Controllers & Prompt Builders; cờ `EXTENDED_SYSTEM_*_ENABLED` mặc định `true` (Fail-OPEN). |
| **Hệ thống Mã Giới Thiệu (Referral)** | **DONE** | Thưởng +15 XU cho Referee & +10 XU cho Referrer khi điểm danh lần đầu. |

---

## 4. Phân Tích Chuyên Sâu Các Thắc Mắc & Rủi Ro (Analysis & Findings)

### 4.1. Bảng Admin có nhiều User `N/A`
- **Nguyên nhân**: Hệ thống dùng Supabase Anonymous Auth (`signInAnonymously()`) để cho phép người dùng vãng lai vào ứng dụng tạo lá số ngay lập tức mà không bắt buộc đăng ký. Các user này có `email = NULL` và `full_name = NULL` nên hiển thị `N/A`.
- **Giải pháp**:
  - Không xóa tài khoản vì họ có thể đang chứa dữ liệu lá số tạm.
  - Cập nhật UI Admin hiển thị nhãn **`Tài khoản vãng lai`** thay vì `N/A` và bổ sung bộ lọc *"Chỉ hiển thị User có Email"*.

### 4.2. Khái niệm Tính Năng Premium (Vip)
- Cờ `is_premium` trong `profiles` được cấp cho tài khoản VIP.
- **Đặc quyền**: Miễn phí sinh bài luận AI & Báo cáo năm (bypass gate 1 XU), hạn mức tạo lá số/báo cáo cao hơn và không bị Rate-limit công khai.

### 4.3. Theme Light / Dark
- **Hiện tại**: Dự án sử dụng hệ thống token Notion Paper-Calm (`tokens.css`) với nền kem sáng `#f5f2ed` / `#ffffff` làm mặc định. Màn hình lá số dùng `theme-mystical` (Tone tối).
- **Yêu cầu mới**: Thêm nút chuyển đổi Light/Dark Theme trên thanh điều hướng toàn trang, giữ mặc định là Light Theme.

### 4.4. Trạng thái API Điểm Danh `POST /api/rewards/checkin`
- Backend code `RewardsController` và `RewardsService` **ĐÃ ACTIVE**.
- Thông báo `Cannot POST /api/rewards/checkin` xảy ra khi người dùng chưa có Session Auth (chưa đăng nhập hoặc token hết hạn) làm Supabase Auth Guard ném lỗi HTTP 401.
- Giải pháp: Đảm bảo giao diện Wallet cập nhật nút Đăng nhập khi Session hết hạn và điều hướng mượt mà.

### 4.5. Cơ chế Backtest & Smoke Test cho 15 Hệ Thuật Số
- **Unit Test**: Chạy `pnpm -F @ziweiai/api test` (430 tests) để kiểm tra logic tính toán, scoring và AI prompt builder.
- **Playwright E2E Test**: Bộ 49 file test E2E trong `apps/web/tests/e2e/` (như `us-017b-mbti.spec.ts`, `us-017e-face.spec.ts`, `us-037-lenormand-live.spec.ts`...) chạy trình duyệt tự động để kiểm thử toàn bộ trải nghiệm từ giao diện tới API.

---

## 5. Bản Đồ Công Việc Triển Khai (Wayfinder Shared Map of Decision Tickets)

### Ticket 1 (UI/UX): Light/Dark Theme Switcher & Wallet Page Navigation Polish
- **Mục tiêu**: Thêm nút toggle Light/Dark Theme trên Navbar (mặc định Light), thêm nút "Quay về trang chủ" trên `/wallet`.
- **Loại**: Task (HITL/AFK).
- **Files đụng**: `apps/web/src/lib/components/ui/AppScaffold.svelte`, `apps/web/src/routes/(app)/wallet/+page.svelte`.
- **Validation**: `pnpm -F @ziweiai/web check`.

### Ticket 2 (Admin): Phân Loại & Bổ Sung Filter User Vãng Lai Trên Admin Dashboard
- **Mục tiêu**: Thay thế nhãn `N/A` thành `Tài khoản vãng lai (Anon)`, bổ sung bộ lọc "Đã đăng ký email" / "Tất cả".
- **Loại**: Task (AFK).
- **Files đụng**: `apps/web/src/routes/(app)/admin/+page.svelte`.
- **Validation**: `pnpm -F @ziweiai/web check`.

### Ticket 3 (DevOps/Deploy): Cấu Hình Biến Môi Trường Vercel Dashboard
- **Mục tiêu**: Thiết lập `ADMIN_EMAILS` và `SEPAY_WEBHOOK_SECRET` trên Vercel Production.
- **Loại**: Task (HITL).
- **Lệnh thực hiện**: `npx vercel env add ADMIN_EMAILS production`, `npx vercel env add SEPAY_WEBHOOK_SECRET production`.
- **Validation**: `npx vercel env ls`.

### Ticket 4 (QA/Verification): Chạy Toàn Bộ Test Suite & Live Smoke Test
- **Mục tiêu**: Chạy Playwright E2E suite cho 15+ hệ thuật số và kiểm tra độ ổn định sau triển khai.
- **Loại**: Research / Task (AFK).
- **Lệnh thực hiện**: `pnpm -F @ziweiai/web exec playwright test --workers=1`.
- **Validation**: 100% tests PASS.

---

## 6. Kết Quả Kỳ Vọng (Expected Outcomes)

1. Giao diện trang chủ và toàn hệ thống hỗ trợ nút chuyển đổi Light/Dark theme sinh động, mặc định là Light theme.
2. Bảng Admin rõ ràng, phân biệt rõ User thật (có Email) và Tài khoản vãng lai.
3. Trang Wallet bổ sung nút điều hướng quay về Trang chủ, luồng nhận 5 XU điểm danh daily mượt mà.
4. Biến môi trường Vercel Prod được cấu hình đầy đủ an toàn.
5. Toàn bộ 15 hệ thuật số mở rộng được xác nhận xanh 100% qua bộ test suite Playwright.
