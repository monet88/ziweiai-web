# Sprint 72: Nâng Cấp Vận Hành Admin Control Center & Mở Rộng Đối Soát Tài Chính

> **Ngày thực hiện:** 11/09/2026  
> **Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
> **Mục tiêu:** Tối ưu hóa toàn diện Admin Operations, bổ sung đối soát dòng tiền SePay / XU, Debounce Search, giải quyết 2 thắc mắc lớn về định danh người giới thiệu và quản trị cẩm nang.

---

## 1. Tóm Tắt Kết Quả Sprint 72

1. **Định Danh Người Dùng Tại `/admin/referrals`**:
   - Backend `AdminService.getReferralAnalytics()` tự động thu thập danh sách `user_id`, tra cứu `display_name` từ bảng `profiles` và `email` từ `auth.users`.
   - Bảng Vinh Danh (Leaderboard) và Lịch Sử Giới Thiệu hiển thị rõ ràng: Tên hiển thị, Email người giới thiệu và người được mời, kèm mã UUID thu gọn bên dưới để Admin biết chính xác ai đang hoạt động.
2. **Widget Giám Sát Tình Trạng SePay Webhook 24h (`/admin/transactions`)**:
   - Thẻ HUD giám sát thời gian thực: Tín hiệu Webhook (`Online / Healthy`) kèm hiệu ứng pulsing xanh, số lượng giao dịch trong 24 giờ qua, số giao dịch đã khớp vs chưa khớp (chờ đối soát), tổng dòng tiền VNĐ và XU phát sinh trong 24h, mốc thời gian nhận giao dịch gần nhất.
3. **Nút Xuất File Báo Cáo CSV (Excel) Chuẩn UTF-8 BOM**:
   - Tại `/admin/transactions` (Giao dịch SePay): Xuất chi tiết mã giao dịch, mã SePay, User ID nhận, số tiền (VNĐ), XU quy đổi, thời gian tạo, trạng thái gán tài khoản.
   - Tại `/admin/analytics` (Biến động XU & Người dùng): Xuất bảng dòng tiền 30 ngày (Ngày, Đăng ký mới, XU nạp, XU tiêu thụ) và bảng phân phối tiêu thụ theo tính năng AI.
   - Toàn bộ file CSV xuất ra đều được gắn Byte Order Mark (`\uFEFF`), mở trực tiếp trên Microsoft Excel máy tính Windows/Mac mà không bao giờ bị lỗi font tiếng Việt có dấu.
4. **Thanh Tìm Kiếm Debounce Search Tại `/admin/users`**:
   - Tự động kích hoạt tìm kiếm sau 350ms khi Admin ngừng gõ (không cần bấm Enter hay nhấn nút Tìm).
   - Tích hợp nút Xóa nhanh (Clear) và spinner chỉ báo trạng thái đang tìm kiếm.
5. **Bộ Công Cụ Quản Trị Cẩm Nang Bài Viết (`/admin/blog`)**:
   - Bổ sung nút **"Viết Bài Mới"** trên thanh công cụ.
   - Bổ sung Modal Soạn Thảo / Chỉnh Sửa trực quan (nhập tiêu đề, phụ đề, chuyên mục, slug, tác giả, thời gian đọc, từ khóa SEO, tóm tắt, FAQ Schema).
   - Bổ sung cụm nút Thao Tác (Xem trước / Sửa / Xóa) cho từng dòng bài viết.

---

## 2. Danh Sách Tệp Tin Đã Chỉnh Sửa

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

## 3. Kết Quả Kiểm Thử (Validation Gates - 100% Pass)

- **API Unit Tests:** `pnpm -F @ziweiai/api test` -> **84/84 test suites passed** (523/523 tests pass).
- **Web Type Check:** `pnpm -F @ziweiai/web check` -> **0 errors, 0 warnings**.
- **Web Unit Tests:** `pnpm -F @ziweiai/web test` -> **69/69 test suites passed** (378/378 tests pass).
- **Monorepo Typecheck:** `pnpm typecheck` -> **10/10 tasks successful**.
- **Web Production Build:** `pnpm -F @ziweiai/web build` -> **Hoàn thành xuất sắc không lỗi**.
