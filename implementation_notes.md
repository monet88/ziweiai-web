# Ghi Chú Kỹ Thuật Triển Khai Sprint 71 (Implementation Notes)
**Sprint 71: Viral Growth & SEO Freemium — ViOS Tử Vi Toàn Tập**
*Thời gian thực hiện: Tháng 09/2026*

---

## 1. Các Quyết Định Thiết Kế (Unspecified & Implicit Decisions)
1. **Thiết Kế Banner Open Graph 1200x630 Chuẩn Hoàng Triều**:
   - Sử dụng banner nghệ thuật phong cách Imperial Gold & Cosmic Obsidian kết hợp Bát Quái, Tinh Bàn Thiên Văn và chữ "TỬ VI TOÀN TẬP — HỆ ĐIỀU HÀNH MỆNH LÝ HOÀNG GIA".
   - Xuất bản đồng thời định dạng `og-image.png` và `og-image.jpg` chuẩn kích thước Facebook/Zalo 1200 x 630px tại thư mục `apps/web/static/`.
   - Sinh bổ sung `favicon.png` (128x128px) từ `icon-192.svg` để khắc phục triệt để lỗi thiếu favicon vật lý trong `static/`.
2. **Cấu Hình Thẻ Meta Tĩnh Trong `app.html`**:
   - Do SvelteKit sử dụng `@sveltejs/adapter-static` với fallback `index.html`, việc đặt trọn bộ Open Graph và Twitter Cards trực tiếp trong `apps/web/src/app.html` đảm bảo 100% các web crawler của Facebook (`facebookexternalhit`), Zalo (`zalo`), Telegram (`telegrambot`), Twitter (`twitterbot`) khi cào HTML gốc sẽ đọc được ngay lập tức tiêu đề, mô tả và thumbnail mà không cần thực thi JavaScript.
3. **Trực Quan Hóa Huy Hiệu Freemium [MIỄN PHÍ 100%] và [50 XU]**:
   - Tách biệt rõ ràng 2 trường phái dịch vụ trên trang chủ:
     - **Miễn phí 100% (Phễu bùng nổ)**: Tử Vi Đẩu Số, Bát Tự Tứ Trụ, Thần Số Học, Kinh Dịch Lục Hào, Mai Hoa Dịch Số, Xin Xăm Quán Âm, Giải Mộng, Lịch Vạn Niên, Tarot 78 Lá. Sử dụng class `.badge-free` với màu xanh ngọc bích Emerald `#10b981` kèm hiệu ứng glow nhẹ.
     - **Dịch vụ chuyên sâu (Định vị giá trị & kích thích điểm danh)**: Hợp Hôn So Mệnh [VIP 50 XU], Kỳ Môn Độn Giáp [VIP 50 XU], Đại Lục Nhâm [VIP 50 XU], AI Vision Scan [50 XU], Biometrics Scan [50 XU], Photo Oracle [20 XU]. Sử dụng class `.badge-xu` với màu vàng kim Celestial Gold `#fbbf24`.
4. **Module Cẩm Nang Mệnh Lý Chuẩn SEO (`/blog` & `/blog/[slug]`)**:
   - Khởi tạo 4 bài viết học thuật uy tín chuẩn SEO cho 4 trụ cột: Tử Vi, Bát Tự, Kinh Dịch, Nhân Tướng.
   - Mỗi bài viết tích hợp sẵn Schema.org JSON-LD `Article`, `BreadcrumbList`, và `FAQPage`.
   - Giữa và cuối bài viết tích hợp **Conversion CTA Card** dẫn người đọc trực tiếp vào công cụ lập lá số tương ứng.
   - Thêm `pathname.startsWith('/blog')` vào whitelist public routes trong `(app)/+layout.svelte` để tránh bị chặn đăng nhập khi người đọc từ Googlebot hoặc mạng xã hội click vào.

---

## 2. Các Độ Lệch So Với Đặc Tả Ban Đầu (Deviations from Specification)
- **Bổ sung `favicon.png`**: Phát hiện trong `app.html` có link tới `%sveltekit.assets%/favicon.png` nhưng file vật lý không tồn tại trong thư mục `static/` (chỉ có file SVG). Đã chủ động render và bổ sung `favicon.png` chuẩn 128x128px.
- **Top Navbar & Footer Navigation**: Bổ sung liên kết "Cẩm Nang" vào cả Top Navigation Bar và Footer trang chủ để tăng cường internal linking cho SEO Googlebot.

---

## 3. Các Đánh Đổi Kỹ Thuật Đã Cân Nhắc (Considered Trade-offs)
- **Tĩnh hóa nội dung Blog (In-memory structured dataset) thay vì CMS bên ngoài**:
  - *Phương án chọn*: Lưu trữ bài viết dạng TypeScript objects với đầy đủ metadata và semantic HTML trong `apps/web/src/lib/features/blog/blog-data.ts`.
  - *Lý do*: Tốc độ tải trang siêu tốc (0ms latency), không phụ thuộc database query bên ngoài, tương thích hoàn hảo với kiến trúc SPA/SSG của SvelteKit và không tốn chi phí hạ tầng hay quota Supabase.
  - *Đánh đổi*: Muốn thêm bài viết mới cần commit code. (Hoàn toàn phù hợp với giai đoạn mở rộng ban đầu, có thể nâng cấp lên Headless CMS hoặc Markdown loader trong tương lai khi số lượng bài viết vượt quá 50 bài).

---

## 4. Ghi Chú Bảo Trì (Maintenance Notes)
- Khi thêm bài viết mới, chỉ cần thêm 1 object vào mảng `BLOG_POSTS` trong `apps/web/src/lib/features/blog/blog-data.ts`. Hệ thống tự động cập nhật danh sách `/blog`, trang chi tiết `/blog/[slug]`, bài viết liên quan, trang quản trị `/admin/blog` và Schema.org tương ứng.
- File ảnh `og-image.png` (1200x630) được phục vụ trực tiếp từ `apps/web/static/og-image.png`.

---

## 5. Sprint 71 Hardening: Sửa Lỗi Admin & Nâng Cấp Social Share
1. **Nâng cấp Social Share Đa Kênh Cho Cẩm Nang**:
   - Tích hợp các nút chia sẻ mạng xã hội trực tiếp: Facebook Share Dialog, Zalo Share Inline, Twitter / X Tweet Intent, Telegram Share URL.
   - Hỗ trợ Web Share API (`navigator.share`) trên mobile native để mở khay chia sẻ hệ thống (Instagram Story, Messenger, WhatsApp, v.v.).
   - Thêm Social Viral Share Box ở cuối bài viết để kích thích độc giả chia sẻ.
2. **Sửa Lỗi Crash Tại `/admin/referrals`**:
   - Đồng bộ tên cột `referee_id` từ Supabase với frontend, thêm toán tử an toàn `(ref.referee_id || ref.referred_id || '').slice(0, 12)` loại bỏ hoàn toàn lỗi `Cannot read properties of undefined (reading 'substring')`.
3. **Resilient Fallback Cho `/admin/analytics`**:
   - Khi RPC PostgreSQL `get_admin_analytics` gặp lỗi hoặc chưa đồng bộ schema trên production, backend tự động chuyển sang fallback queries trực tiếp từ `profiles` và `xu_transactions` tính toán đầy đủ các chỉ số KPI, đảm bảo API luôn phản hồi 200 OK.
4. **Bổ Sung Route `/admin/audit-logs`**:
   - Khai báo endpoint `@Get('audit-logs')` trên `AdminController` và kết nối với `AdminService.getAuditLogs`, giải quyết dứt điểm lỗi 404 Not Found.
5. **Module Quản Trị Cẩm Nang (`/admin/blog`)**:
   - Bổ sung tab "Cẩm Nang" vào thanh điều hướng Admin, cho phép quản trị viên tra cứu bài viết, xem cấu trúc SEO và mở link xem trước trực tiếp.

---

## 6. Sprint 72: Nâng Cấp Vận Hành Admin & Mở Rộng Đối Soát Tài Chính
1. **Định Danh Người Dùng Tại Báo Cáo Giới Thiệu (`/admin/referrals`)**:
   - Nâng cấp `AdminService.getReferralAnalytics()` tự động gom danh sách `user_id`, tra cứu `display_name` từ bảng `profiles` và `email` từ `auth.users`.
   - Bảng Vinh Danh (Leaderboard) và Lịch Sử Gần Đây hiển thị rõ ràng: Tên hiển thị, Email người giới thiệu và người được mời, loại bỏ tình trạng hiển thị chuỗi UUID thô không thể nhận diện.
2. **Widget Giám Sát SePay Webhook 24h Tại `/admin/transactions`**:
   - Bổ sung card HUD thông minh: Trạng thái Webhook (`Online / Healthy`), số giao dịch 24h qua, tỷ lệ khớp tài khoản, số giao dịch chờ đối soát, tổng doanh thu VNĐ và XU phát sinh trong 24 giờ cùng thời gian giao dịch cuối cùng.
3. **Nút Xuất File Báo Cáo CSV (Excel) Chuẩn UTF-8 BOM**:
   - Tại `/admin/transactions`: Xuất toàn bộ giao dịch SePay (ID, Mã SePay, User ID, Số tiền, XU, Thời gian, Trạng thái gán).
   - Tại `/admin/analytics`: Xuất bảng dòng tiền biến động 30 ngày và thống kê tiêu thụ theo từng tính năng AI.
   - Sử dụng tiền tố `\uFEFF` (Byte Order Mark) để mở file trực tiếp trên Microsoft Excel tiếng Việt không bị lỗi font.
4. **Debounce Search Người Dùng Tại `/admin/users`**:
   - Tích hợp bộ đếm thời gian 350ms tự động kích hoạt tìm kiếm khi người dùng gõ vào ô tìm kiếm theo Email, Tên hoặc User ID.
   - Thêm nút xóa nhanh (Clear) và spinner báo trạng thái đang tìm kiếm.
5. **Bộ Công Cụ Quản Trị Cẩm Nang Bài Viết (`/admin/blog`)**:
   - Bổ sung nút **"Viết Bài Mới"** kèm Modal Form Soạn Thảo (tiêu đề, phụ đề, chuyên mục, slug, tác giả, thời gian đọc, từ khóa SEO, câu hỏi FAQ chuẩn Schema).
   - Bổ sung cụm nút Thao tác (Xem trước / Sửa / Xóa) trên từng dòng bài viết với cơ chế cập nhật trực tiếp state và thông báo toast.

---

## 7. Sprint 73: Deep Codebase Audit, Security Hardening & AI Resilience
1. **Kiểm Soát Phân Quyền (RBAC) & Bảo Vệ Endpoints Admin**:
   - Toàn bộ `AdminController` được bảo vệ cấp class bởi `ModeratorGuard`.
   - Các mutation endpoints nhạy cảm (`topup`, `topupUserXu`, `cleanup-anon`, `configs`, `reconcile`) được thắt chặt thêm bởi `SuperAdminGuard`.
   - Bổ sung thông tin actor `currentUser.email` vào hàm nạp tiền `topupUser` để lưu audit log chính xác.
2. **Sửa Lỗi Rate-Limit Xác Thực Người Dùng (`DynamicThrottlerGuard`)**:
   - Phát hiện và khắc phục lỗi `request.user` vs `request.authenticatedUser` (do `SupabaseAuthGuard` lưu vào `request.authenticatedUser`).
   - Sinh key tracker `usr_${user.userId || user.id}` giúp áp dụng đúng quota cho người dùng đã đăng nhập.
3. **Phòng Chống Lỗ Hổng CSV/Formula Injection**:
   - Tạo module tiện ích `sanitizeCsvCell(val)` chuẩn OWASP: tự động bọc chuỗi trong dấu nháy kép `""`, nhân đôi dấu `""` bên trong và thêm tiền tố nháy đơn `'` nếu ô dữ liệu bắt đầu bằng các ký tự công thức (`=`, `+`, `-`, `@`, `\t`, `\r`).
   - Áp dụng triệt để cho toàn bộ các nút xuất CSV trong `/admin/transactions` và `/admin/analytics`.
4. **Khắc Phục Memory Leaks & Trùng Lặp Realtime Channels**:
   - Tối ưu hóa `WalletIndicator.svelte` và `WalletBalance.svelte`: Chuyển sang dùng store dùng chung `getWalletStore()` từ Context thay vì khởi tạo instance riêng lẻ gây tràn kết nối Supabase WebSocket.
   - Thêm cờ `{ once: true }` và hook `onDestroy()` dọn dẹp class in ấn trong `ExplanationToolbar.svelte`.
5. **Tăng Cường Độ Tin Cậy Của AI Hạ Tầng (AI Provider Resilience)**:
   - Khắc phục `getProviderChain`: Duy trì danh sách fallback đầy đủ `[preferred, ...remaining]` cho mọi cấu hình provider preference thay vì chỉ trả về 1 provider duy nhất.
   - Tự động retry 1 lần (delay 400ms) trong `llm-exchange.ts` khi gặp sự cố mạng tạm thời hoặc rớt socket.
6. **Chuẩn Hóa Mã Nguồn (100% Lint Clean)**:
   - Dọn sạch toàn bộ imports/types mồ côi (dead code) trong các trang blog và admin.
   - Bổ sung khóa định danh `key` cho tất cả các vòng lặp `{#each}`.
   - Đạt 0 lỗi, 0 cảnh báo trên `pnpm lint`.
