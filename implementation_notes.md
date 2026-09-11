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
- Khi thêm bài viết mới, chỉ cần thêm 1 object vào mảng `BLOG_POSTS` trong `apps/web/src/lib/features/blog/blog-data.ts`. Hệ thống tự động cập nhật danh sách `/blog`, trang chi tiết `/blog/[slug]`, bài viết liên quan và Schema.org tương ứng.
- File ảnh `og-image.png` (1200x630) được phục vụ trực tiếp từ `apps/web/static/og-image.png`.
