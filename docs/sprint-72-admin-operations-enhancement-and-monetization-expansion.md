# Sprint 72: Nâng Cấp Vận Hành Admin Control Center & Mở Rộng Đối Soát Tài Chính

> **Ngày thực hiện:** 11/09/2026  
> **Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
> **Trạng thái:** ✅ **100% HOÀN THÀNH — ĐÃ COMMIT & DEPLOY PRODUCTION VERCEL**  
> **Production URL:** [https://tuvitoantap.vercel.app](https://tuvitoantap.vercel.app)  
> **Git Commit:** `6d3f8d1` (nhánh `main`)

---

## 1. Mục Tiêu Sprint 72

1. **Định danh người dùng giới thiệu (`/admin/referrals`):** Xử lý triệt để việc chỉ hiển thị mã UUID thô không thể nhận diện danh tính.
2. **Nâng cấp đối soát tài chính:** Bổ sung chức năng xuất báo cáo CSV/Excel chuẩn UTF-8 (BOM) cho Giao dịch SePay (`/admin/transactions`) và Thống kê nạp/tiêu XU (`/admin/analytics`).
3. **Tối ưu trải nghiệm tìm kiếm (`/admin/users`):** Thêm thanh tìm kiếm Debounce 350ms tự động kích hoạt kèm nút Clear nhanh (X).
4. **Widget Giám Sát SePay Webhook 24h:** Giám sát thời gian thực tín hiệu webhook, số giao dịch, tỷ lệ khớp tài khoản và doanh thu phát sinh trong 24 giờ qua.
5. **Bộ công cụ Quản Trị Cẩm Nang (`/admin/blog`):** Khởi tạo nút "Viết Bài Mới", Modal soạn thảo/chỉnh sửa nội dung & SEO FAQ Schema, và cụm nút Thao tác (Xem / Sửa / Xóa).

---

## 2. Việc Đã Làm & Chi Tiết Kỹ Thuật

### 2.1. Backend API (`apps/api`)
- Nâng cấp `AdminService.getReferralAnalytics()` tại `apps/api/src/modules/admin/admin.service.ts`:
  - Thu thập toàn bộ `user_id` từ `topReferrers` và `recentReferrals`.
  - Thực hiện batch query lấy `display_name` từ bảng `profiles` và `email` từ `auth.admin.listUsers()`.
  - Trả về cấu trúc phong phú: `referrer_email`, `referrer_name`, `referee_email`, `referee_name`, `displayName`, `email`.

### 2.2. Frontend Web (`apps/web`)
- **`/admin/referrals` (`referrals/+page.svelte`):**
  - Hiển thị nổi bật Tên người dùng và Email trên Bảng Vinh Danh và Lịch Sử Gần Đây. Kèm mã UUID thu gọn bên dưới để Admin đối soát kỹ thuật.
- **`/admin/transactions` (`transactions/+page.svelte`):**
  - Thêm thẻ HUD giám sát Webhook SePay 24h với đèn tín hiệu xanh pulsing, thống kê giao dịch 24h qua, giao dịch chờ đối soát và dòng tiền 24h.
  - Bổ sung nút **"Xuất File CSV"** sử dụng tiền tố UTF-8 Byte Order Mark (`\uFEFF`) giúp mở trực tiếp trên Microsoft Excel không bị lỗi font tiếng Việt.
- **`/admin/analytics` (`analytics/+page.svelte`):**
  - Bổ sung nút **"Xuất CSV"** tải về báo cáo biến động dòng tiền 30 ngày và phân phối tiêu thụ theo từng tính năng AI.
- **`/admin/users` (`users/+page.svelte`):**
  - Thêm Debounce Search **350ms** tự động gọi API khi người dùng dừng gõ, bổ sung nút Clear (X) và spinner xoay báo trạng thái.
- **`/admin/blog` (`blog/+page.svelte`):**
  - Thêm nút **"Viết Bài Mới"**, Modal Soạn Thảo (tiêu đề, phụ đề, chuyên mục, slug, tác giả, thời gian đọc, từ khóa, tóm tắt, FAQ Schema) và cụm nút Thao Tác (Xem / Sửa / Xóa) cho từng bài viết.

---

## 3. Danh Sách Tệp Tin Đã Chỉnh Sửa

| STT | Tệp tin | Hành động | Nội dung thay đổi |
|---|---|---|---|
| 1 | `apps/api/src/modules/admin/admin.service.ts` | MODIFY | Nâng cấp `getReferralAnalytics` tra cứu và đính kèm `email`, `display_name` cho referrer và referee |
| 2 | `apps/web/src/routes/(app)/admin/referrals/+page.svelte` | MODIFY | Cập nhật giao diện bảng xếp hạng và lịch sử giới thiệu hiển thị Email/Tên người dùng |
| 3 | `apps/web/src/routes/(app)/admin/transactions/+page.svelte` | MODIFY | Thêm Widget Giám Sát SePay Webhook 24h và Nút Xuất File CSV giao dịch |
| 4 | `apps/web/src/routes/(app)/admin/analytics/+page.svelte` | MODIFY | Thêm Nút Xuất File CSV thống kê dòng tiền 30 ngày & tính năng AI |
| 5 | `apps/web/src/routes/(app)/admin/users/+page.svelte` | MODIFY | Thêm Debounce Search 350ms, nút Clear tìm kiếm và spinner trạng thái |
| 6 | `apps/web/src/routes/(app)/admin/blog/+page.svelte` | MODIFY | Thêm nút Viết Bài Mới, Modal Soạn Thảo, và cụm nút Xem/Sửa/Xóa |
| 7 | `implementation_notes.md` | MODIFY | Cập nhật mục 6 về kiến trúc và quyết định kỹ thuật Sprint 72 |

---

## 4. Phân Tích Kỹ Thuật: Cảnh Báo "Cannot read properties of undefined (reading 'startTime')"

- **Hiện tượng:** Mở Google Chrome F12 Console thấy xuất hiện:
  ```text
  VM6559:2 Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
      at et.reportAllChanges (<anonymous>:2:19429)
      at n.timeout (<anonymous>:2:5652)
      at requestIdleCallback
  ```
- **Phân tích nguồn gốc:**
  1. File phát sinh là `VMxxxx:2` (Virtual Machine Script) do Chrome DevTools hoặc Chrome Extensions tự động chèn vào context của trang web, hoàn toàn không nằm trong codebase của ViOS.
  2. Hàm `reportAllChanges` là hàm đo đạc Core Web Vitals (LCP, INP) nội bộ của thư viện Google `web-vitals` chạy trong bảng Live Metrics của Chrome DevTools.
  3. Khi chuyển route trong ứng dụng SPA SvelteKit, bộ đệm Performance Entry của trình duyệt bị reset hoặc trả về danh sách rỗng, mã của DevTools thiếu kiểm tra null check trước khi đọc `.startTime`.
- **Kết luận:** **Hoàn toàn vô hại (100% Safe)**. Người dùng bình thường không mở DevTools sẽ không bao giờ bị kích hoạt script này. Toàn bộ logic ứng dụng, thanh toán và dữ liệu của ViOS vẫn hoạt động tuyệt đối an toàn.

---

## 5. Kết Quả Kiểm Thử (Validation Gates - 100% Pass)

- **API Unit Tests:** `pnpm -F @ziweiai/api test` -> **84/84 test suites passed** (523/523 tests pass 100%).
- **Web Type Check:** `pnpm -F @ziweiai/web check` -> **0 errors, 0 warnings**.
- **Web Unit Tests:** `pnpm -F @ziweiai/web test` -> **69/69 test suites passed** (378/378 tests pass 100%).
- **Monorepo Typecheck:** `pnpm typecheck` -> **10/10 packages passed**.
- **Web Production Build:** `pnpm -F @ziweiai/web build` -> **Build thành công không lỗi**.
- **Live Smoke Test:** `curl https://tuvitoantap.vercel.app/api/health` -> `{"service":"ziweiai-api","status":"ok"}`.

---

## 6. Tài Liệu Bàn Giao & Lộ Trình Sprint 73 (Handover Specification)

- **Giai đoạn hiện tại:** Đã hoàn thành 100% **Sprint 72 (Admin Operations Enhancement & Monetization Expansion)**.
- **Sprint tiếp theo:** **SPRINT 73 — DEEP CODEBASE AUDIT, SECURITY HARDENING & BEHAVIOR MODEL OPTIMIZATION**.
- **Mục tiêu trọng tâm Sprint 73:**
  1. Sử dụng kỹ năng `behavior-model-debugger` và `security-auditor` rà soát toàn bộ codebase (NestJS API + SvelteKit Frontend).
  2. Kiểm tra các lỗ hổng bảo mật: Rate limiting, SQL/NoSQL Injection, XSS trong rich text/markdown, phân quyền Role-Based Access Control (RBAC) trên các endpoints `/admin/*`.
  3. Tối ưu hóa bộ nhớ (Memory Leaks) và dọn dẹp các biến/imports thừa (Dead Code Elimination).
  4. Nâng cấp cơ chế retry/fallback cho các AI Providers (Gemini Flash, DeepSeek).
