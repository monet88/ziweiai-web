# Implementation Notes: Sprint 86 Web & Admin Dashboard Hardening

## 1. Unspecified & Implicit Decisions
- **Admin Ban/Unban API Routing:** Client `apps/web/src/lib/api-client/admin.ts` kỳ vọng endpoint `POST /admin/users/:userId/ban` và `POST /admin/users/:userId/unban`. Do backend trước đó chỉ có method trong repository `adminBanUser` mà chưa có controller route, chúng tôi đã tạo trực tiếp 2 endpoints này trên `AdminController` có bảo vệ bằng `SuperAdminGuard` và ghi nhận `actorEmail` vào audit logs.
- **Config Key-Value REST Flexibility:** Bổ sung `POST /admin/configs/:key` song song với `POST /admin/configs` để đáp ứng cả 2 phong cách request từ frontend, ngăn chặn mọi rủi ro lỗi 404/405 khi admin thao tác cấu hình cờ tính năng hoặc giá XU.

## 2. Deviations from Specification
- Không có sự sai lệch tiêu cực nào. Mọi thay đổi đều trực tiếp khép kín các API contract còn khuyết thiếu giữa Web và Backend API.

## 3. Considered Trade-offs
- **Fail-Closed cho Ad Rewards:** Cờ `ENABLE_AD_REWARDS=false` tiếp tục được duy trì trên Production để bảo vệ 100% ngân quỹ cho đến khi Google AdMob review xong app trên store.

## 4. Maintenance Notes
- Khi phân quyền tài khoản Super Admin, sử dụng bảng `admin_roles` trên Supabase (email hiện tại: `sevengotek@gmail.com`).
- Toàn bộ 966 unit & integration tests trong monorepo đều pass 100% trước mỗi lần deploy.

---

# Implementation Notes: Sprint 90 — Unknown Birth Time Strategy & Conversion Funnel

## 1. Unspecified & Implicit Decisions
- **Decision on "Unknown Birth Time" Strategy:** Selected **Option C (Comprehensive Educational & Conversion Funnel)** over hard-blocking (Option A) or automated random hour synthesis (Option B).
  - *Astrological Truth:* Tử Vi Đẩu Số cannot construct Cung Mệnh/Thân, Cục, 14 Main Stars without a birth hour. Bát Tự lacks Trụ Giờ (con cái, hậu vận sau 50 tuổi).
  - *Engineering Safety:* The engine strictly enforces `blocksExactReading: true` to prevent AI hallucinations.
  - *UX Funnel:* Users are warned upfront on `BirthForm.svelte` with an informative banner and a 1-click **12 Canh Giờ Estimator Modal** (`BirthTimeEstimatorModal.svelte`), which maps double-hours to folk daily routines (sáng sớm, trưa, tối...). If an uncalculated chart is opened, `BlockedBirthTimeGuidance.svelte` provides 3 clear pathways: (1) Re-create with estimated hour, (2) Switch to Numerology (`/numerology`), or (3) Cast I Ching / Tarot (`/meihua` / `/tarot`).

## 2. Deviations from Specification
- None. Solved both form validation notice clarity and post-creation guidance without breaking any backend contract.

## 3. Considered Trade-offs
- **Fake Hour Synthesis vs User Trust:** Rejected generating a pseudo-hour automatically behind the user's back. Doing so would violate the integrity of Khâm Thiên Giám and generate fake AI readings that would damage brand reputation.
- **Conversion Optimization:** Instead of a dead-end error card, users are smoothly redirected to birth-time-independent systems (Thần Số Học, Mai Hoa, Lục Hào, Tarot) or assisted in estimating their double-hour.

## 4. Maintenance Notes
- Component `BlockedBirthTimeGuidance.svelte` handles all chart systems and renders seamlessly across Desktop and Mobile.
- URL query parameters `?estimatedHour=X&estimatedMinute=Y` automatically pre-fill and toggle the birth time switch on the dashboard.

