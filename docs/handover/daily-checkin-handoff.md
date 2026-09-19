# Handoff Report: Daily Check-in & Rewards System

## 1. Mục tiêu (Objective)
Tối ưu hóa khả năng tương tác và duy trì người dùng (User Retention) sau khi paywall được áp dụng. Việc tích hợp cổng thanh toán (SePay & RevenueCat) đã hoàn tất ở session trước, vì vậy session này tập trung vào phát triển tính năng **Điểm danh hàng ngày nhận XU miễn phí (Daily Check-in)** để duy trì vòng lặp thói quen người dùng quay lại ứng dụng (habit-loop), tạo cơ hội chuyển đổi sang gói trả phí.

## 2. Các công việc đã làm (Work Done)

### Database (Supabase)
- Thêm cột `last_checkin_date` (loại `date`) vào bảng `profiles` thông qua migration `000017_daily_checkin.sql`.
- Viết RPC function `daily_checkin(user_id uuid)` để cộng XU và lưu lại mốc thời gian điểm danh một cách an toàn.
  - Sử dụng cơ chế khóa dòng `FOR UPDATE` của Postgres để triệt tiêu race conditions (double-spend/double-checkin).
  - Sử dụng múi giờ Việt Nam `(now() at time zone 'Asia/Ho_Chi_Minh')::date` để so sánh và chốt mốc thời gian ngày hiện tại, tránh lỗi đồng hồ người dùng thay đổi timezone trên client để hack.
- Đã đồng bộ thành công các migrations mới nhất lên Supabase Database Production.

### Backend (NestJS API)
- Tạo module `RewardsModule`, `RewardsController` và `RewardsService` tại endpoint `POST /rewards/checkin`.
- Endpoint được bảo vệ nghiêm ngặt bằng `SupabaseAuthGuard` nhằm đảm bảo chỉ các session đăng nhập hợp lệ mới có thể điểm danh.

### Frontend Web (SvelteKit)
- Cập nhật `wallet-model.svelte.ts` để tối ưu hóa việc fetch đồng thời số dư và ngày check-in gần nhất của người dùng.
- Thêm method `checkin()` tích hợp API và tính toán Client-side logic để xác định trạng thái `canCheckin` theo múi giờ Việt Nam.
- Thiết kế UI "Quà Tặng Hàng Ngày" (Daily Check-in) tại route `/wallet`:
  - Phong cách Glassmorphism đồng nhất với design system cao cấp hiện tại.
  - Tự động thay đổi trạng thái nút điểm danh ("Nhận 5 XU", "Đang xử lý...", "Đã nhận hôm nay").

---

## 3. Kết quả kiểm tra (Verification & Test Results)

### Kiểm thử hệ thống
- Đã chạy toàn bộ **652 tests** (`turbo run test`) trên toàn bộ monorepo (bao gồm NestJS API & SvelteKit Web). Tất cả bài kiểm tra đều **Pass 100%**, không xảy ra regression.
- Đã build thành công locally cho cả API và Web để đảm bảo không lỗi TypeScript.

### Deploy Production
- Đã deploy bản build hoàn chỉnh lên production Vercel tại: https://tuvitoantap.vercel.app.
- Đã kiểm tra qua endpoint health check `/api/health` và nhận phản hồi `status: ok` chính xác.

---

## 4. Rủi ro & Khuyến nghị bảo mật (Risks & Hardening)
- **Timezone Drift**: RPC server-side chốt cứng múi giờ `'Asia/Ho_Chi_Minh'` để so sánh ngày nên người dùng thay đổi ngày giờ máy khách sẽ không thể hack điểm danh.
- **Race Condition**: Đã sử dụng `SELECT ... FOR UPDATE` trên dòng profile của user nên các request song song liên tiếp sẽ bị khóa tuần tự, không thể cộng trùng XU.
- **Bắt buộc có Auth**: Người dùng ẩn danh (Anonymous) không được phép điểm danh nhằm tránh việc tạo account ảo hàng loạt để farm XU. Nút điểm danh sẽ yêu cầu đăng nhập email/Google.

---

## 5. Nội dung đề xuất cho Session tiếp theo (Handoff Prompt)
*Hãy copy đoạn prompt dưới đây và gửi vào session mới để tiếp tục phát triển:*

```text
Chào AI, tôi muốn tiếp tục phát triển dự án Tử Vi Toàn Tập.
Bối cảnh session trước: Chúng ta đã hoàn thiện toàn bộ cổng thanh toán SePay, ví XU, cùng tính năng Điểm danh hàng ngày nhận XU miễn phí (Daily Check-in) và deploy lên Vercel + Supabase production an toàn (xem docs/handover/daily-checkin-handoff.md).

Mục tiêu session mới:
1. Triển khai Hệ thống Giới thiệu / Nhận XU (Referral & Affiliate System) để thu hút người dùng mới lan tỏa tự nhiên (Viral loop).
   - Mỗi user có 1 referral code riêng.
   - Khi người dùng mới đăng ký qua link ref và điểm danh lần đầu, cả người giới thiệu và người được giới thiệu sẽ được cộng XU thưởng (ví dụ: 10 XU).
2. Xây dựng trang quản lý tài khoản cơ bản trên UI Web hoặc Mobile để người dùng dễ xem lịch sử giới thiệu.

Hãy thực hiện Scout, Plan (Implementation Plan) trước khi viết code theo đúng quy trình.
```
