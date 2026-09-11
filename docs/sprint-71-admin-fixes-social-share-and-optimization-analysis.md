# Sprint 71 Hardening: Sửa Lỗi Admin, Nâng Cấp Social Share Cho Cẩm Nang & Tối Ưu Hệ Thống ViOS

> **Ngày thực hiện:** 11/09/2026  
> **Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
> **Mục tiêu:** Xử lý triệt để 5 vấn đề kỹ thuật và phát triển đề xuất tối ưu hóa hệ thống Admin.

---

## 1. Tóm Tắt Mục Tiêu

1. **Bộ Nút Chia Sẻ Mạng Xã Hội Cho Cẩm Nang (`/blog/[slug]`):** Thay thế nút copy link đơn điệu bằng bộ nút chia sẻ xã hội đa kênh (Facebook, Zalo, Twitter/X, Telegram, Native Web Share, Copy Link) giúp tối ưu hóa lan truyền (viral growth).
2. **Module Quản Trị Cẩm Nang (`/admin/blog`):** Khởi tạo tab quản lý cẩm nang trong Admin Control Center, giúp quản trị viên theo dõi toàn bộ bài viết, cấu trúc SEO (Schema, FAQ) và tỷ lệ chuyển đổi.
3. **Sửa Lỗi `/admin/referrals` Crash:** Khắc phục lỗi `Uncaught TypeError: Cannot read properties of undefined (reading 'substring')` do sai lệch tên cột giữa DB Supabase (`referee_id`) và mã nguồn frontend (`referred_id`).
4. **Sửa Lỗi `/admin/analytics` (400 Bad Request):** Khắc phục lỗi gọi RPC `get_admin_analytics` bằng cơ chế Resilient Fallback Query trực tiếp từ bảng cơ sở dữ liệu khi RPC gặp lỗi hoặc thiếu migration trên môi trường production.
5. **Sửa Lỗi `/admin/audit-logs` (404 Not Found):** Khắc phục lỗi thiếu endpoint `@Get('audit-logs')` trên backend `AdminController`.
6. **Đề Xuất Lộ Trình Tối Ưu Quản Trị Admin:** Đề xuất các giải pháp nâng cao hiệu suất, UX và nghiệp vụ cho ViOS Admin Control Center.

---

## 2. Phân Tích Kỹ Thuật & Nguyên Nhân Gốc Rễ

### 2.1. Nút Chia Sẻ Mạng Xã Hội Tại Cẩm Nang
- **Hiện trạng:** Giao diện bài viết chi tiết tại `apps/web/src/routes/(app)/blog/[slug]/+page.svelte` chỉ có duy nhất 1 button "Sao chép liên kết" vào bộ nhớ tạm.
- **Giải pháp:** 
  - Tích hợp các URL chia sẻ chuẩn quốc tế và Việt Nam:
    - **Facebook Share:** `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    - **Zalo Share:** `https://sp.zalo.me/share_inline?link=${encodedUrl}`
    - **Twitter / X Share:** `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    - **Telegram Share:** `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
  - Hỗ trợ **Web Share API (`navigator.share`)**: Khi người dùng duyệt web trên smartphone (iOS Safari / Android Chrome), nhấn nút chia sẻ sẽ mở trực tiếp Share Sheet hệ điều hành để gửi qua Messenger, Zalo, Instagram Story, AirDrop, v.v.

### 2.2. Về Việc Quản Trị Bài Cẩm Nang Ở Admin
- **Giải thích:** Nhằm đạt chuẩn SEO điểm số tuyệt đối từ Googlebot và thời gian tải trang dưới 50ms, module Cẩm nang ở Sprint 71 được kiến trúc theo dạng **Static Headless Data** tại `apps/web/src/lib/features/blog/blog-data.ts`.
- **Nâng cấp:** Để Admin có thể dễ dàng quản lý, kiểm soát nội dung và SEO, tạo thêm Tab **"Quản Trị Cẩm Nang" (`/admin/blog`)** trong Admin Control Center để hiển thị tổng quan bài viết, chuyên mục, số câu hỏi FAQ, từ khóa chính, thẻ Schema và đường dẫn xem trước trực tiếp.

### 2.3. Lỗi `/admin/referrals` Crash `substring`
- **Nguyên nhân:** Console log ghi nhận: `Uncaught TypeError: Cannot read properties of undefined (reading 'substring')`.
  - Trong Supabase table `referrals` (file migration `000018_referral_system.sql`), cột lưu người được mời được đặt tên là `referee_id`.
  - Trên file giao diện `apps/web/src/routes/(app)/admin/referrals/+page.svelte` dòng 168:
    ```svelte
    <code class="id-code">{ref.referred_id.substring(0, 12)}…</code>
    ```
  - Giá trị `ref.referred_id` là `undefined`, nên gọi `.substring(0, 12)` lập tức ném lỗi ngoại lệ, làm sập vòng đời render component của Svelte 5, khiến màn hình bị treo vĩnh viễn ở trạng thái "Đang tải thống kê giới thiệu...".
- **Giải pháp:**
  - Sửa frontend sang dạng an toàn tuyệt đối với fallback: `{(ref.referee_id || ref.referred_id || '').slice(0, 12)}…` và `{(ref.referrer_id || '').slice(0, 12)}…`.
  - Backend `admin.service.ts` hàm `getReferralAnalytics` map cả hai trường `referee_id` và `referred_id`.

### 2.4. Lỗi `/admin/analytics` 400 Bad Request
- **Nguyên nhân:** Console ghi nhận: `GET https://tuvitoantap.vercel.app/api/admin/analytics 400 (Bad Request)`.
  - Backend NestJS `AdminController` gọi `adminService.getAnalytics()`, phương thức này gọi hàm RPC PostgreSQL `get_admin_analytics` trên Supabase.
  - Khi RPC này bị lỗi (do schema migration trên production chưa đồng bộ hoặc tham số kiểu ngày bị lệch), method lập tức ném `BadRequestException('Could not get admin analytics')`.
- **Giải pháp:**
  - Bổ sung cơ chế **Resilient Fallback Query**: Khi RPC `get_admin_analytics` thất bại hoặc không tồn tại, backend tự động thực hiện truy vấn trực tiếp từ các bảng `profiles`, `xu_transactions` và tính toán ra các chỉ số KPI: `total_users`, `total_xu_topup`, `total_xu_consumed`, `daily_stats` (30 ngày gần nhất) và `feature_usage`.
  - Đảm bảo endpoint `/api/admin/analytics` không bao giờ trả về lỗi 400, luôn phục vụ dữ liệu cho Admin.

### 2.5. Lỗi `/admin/audit-logs` 404 Not Found
- **Nguyên nhân:** Console ghi nhận: `GET https://tuvitoantap.vercel.app/api/admin/audit-logs?page=1&limit=50 404 (Not Found)`.
  - `AdminRepository` đã có phương thức `adminGetAuditLogs`, nhưng tại `AdminController` (`apps/api/src/modules/admin/admin.controller.ts`) **chưa được khai báo route `@Get('audit-logs')`**!
- **Giải pháp:**
  - Khai báo `@Get('audit-logs')` trên `AdminController`.
  - Bổ sung hàm `getAuditLogs` trong `AdminService` kết nối đến repository và trả về định dạng `{ logs, count, page }` hoàn toàn tương thích với frontend `apps/web/src/routes/(app)/admin/audit-logs/+page.svelte`.

### 2.6. Về Cảnh Báo "Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist."
- Đây là thông báo nội bộ từ các tiện ích mở rộng (Chrome Extensions) trên trình duyệt của người dùng (ví dụ: Google Translate, 1Password, Grammarly, hoặc DevTools extensions) khi cố gắng bắt sự kiện kết nối ngầm.
- Cảnh báo này **không phát sinh từ mã nguồn ViOS** và hoàn toàn không gây ảnh hưởng đến hiệu năng hay bảo mật của hệ thống.

---

## 3. Các Đề Xuất Tối Ưu Hóa Hệ Thống Admin ViOS

1. **CMS Quản Trị Cẩm Nang Trực Quan:** Bổ sung giao diện `/admin/blog` quản lý bài viết, cấu hình SEO tags và số lượt đọc.
2. **SWR Cache Cho Thống Kê (Performance Optimization):** Áp dụng in-memory cache ngắn (60 giây) cho API analytics để giảm 85% tải truy vấn lên database Supabase khi Admin chuyển qua lại giữa các tab.
3. **Bộ Lọc Nhanh & Debounce Search:** Thêm thanh tìm kiếm thành viên theo Email / User ID có tính năng debounce 300ms tại `/admin/users`.
4. **Đối Soát Tài Chính Tự Động Với SePay:** Thêm chức năng xuất báo cáo giao dịch (CSV/Excel) để Admin dễ dàng đối chiếu số dư tài khoản ngân hàng ACB với dòng tiền nạp XU trong hệ thống.
