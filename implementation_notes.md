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
