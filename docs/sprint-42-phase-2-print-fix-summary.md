# Báo Cáo Sửa Lỗi In Trắng Bản Sớ Luận Giải & Hồ Sơ Hoàng Gia (Sprint 42 Phase 2)

- **Thời gian hoàn thành**: 09/09/2026
- **Branch**: `feature/sprint-42-deluxe-pdf-dossier`
- **Commit**: `c06c504`
- **Deployment ID Vercel**: `dpl_9ZGCcKcU1ph1KZ7vuahYaffPihMo`
- **Live Demo Domain**: `https://tuvitoantap.vercel.app`
- **URL Test**: `https://tuvitoantap.vercel.app/charts/2b496e92-ea1d-4d6f-a156-ce56ada6d5e5`

---

## 1. Nguyên Nhân Gốc (Root Cause)
1. **Lỗi In Sớ Luận Giải AI ("In sớ / Lưu PDF")**:
   - Khối lá số 12 cung (`.board-section`) cao ~800px không bị ẩn khi in, để lại mảng trắng khổng lồ chiếm trọn trang 1, đẩy bài luận giải xuống đáy trang 1.
   - Thẻ tổ tiên `.screen` có `overflow-x: hidden; min-height: 100dvh;`. Trình duyệt Chrome/WebKit coi đây là single-page viewport và cắt đứt phân trang (Pagination Clip), chỉ in duy nhất 1 trang đầu.
   - Màu chữ của bài luận là màu xám nhạt `#d1d5db` và các tiêu đề dùng `-webkit-text-fill-color: transparent`, biến mất trên nền giấy trắng khi không in kèm background graphics.
2. **Lỗi In Hồ Sơ Hoàng Gia ("In / Lưu PDF")**:
   - Rule `:global(body > *:not(.dossier-overlay)) { display: none !important; }` đã ẩn `div.app-content-wrapper` (thẻ cha bọc toàn bộ app SvelteKit), khiến modal hồ sơ bị ẩn theo 100%.
   - Trong Book Mode, specificity của `.mode-book .dossier-page:not(.is-active)` làm ẩn 18 trang còn lại.

---

## 2. Giải Pháp Triệt Để Đã Áp Dụng
1. **Hồ Sơ Hoàng Gia (`DeluxePdfDossierModal.svelte`)**:
   - Gắn class `printing-deluxe-dossier` vào `document.body` khi in.
   - Xóa bỏ rule ẩn sai selector.
   - Mở khóa toàn bộ `overflow` và `height` trên các container tổ tiên.
   - Ép hiển thị trọn vẹn **19 trang A4 vector** kể cả khi đang ở chế độ Sách (`mode-book`).
   - Khổ giấy in `@page { size: A4 portrait; margin: 0; }`.
2. **Bản Sớ Luận Giải (`ExplanationToolbar.svelte` & `ChartDetailScreen.svelte` & `MarkdownView.svelte`)**:
   - Gắn class `printing-explanation-scroll` vào `document.body` khi in sớ.
   - Ẩn hoàn toàn bàn lá số 12 cung và các nút bấm giao diện web.
   - Thêm **Header Bản Sớ Trang Trọng** ở đầu sớ in với đầy đủ thông tin đương số, ngày giờ sinh Âm Dương lịch, Mệnh, Cục, dòng triện bảo chứng ViOS.
   - Định dạng màu chữ in: đen tuyền `#111827`, tiêu đề đồng son `#78350f`, trích dẫn và bảng biểu trang nhã, ngắt trang thông minh qua nhiều trang A4 mà không bị đứt chữ.
3. **Container Hệ Thống (`AppScaffold.svelte`)**:
   - Thêm `@media print` mở khóa toàn bộ `overflow-x: hidden` và `min-height: 100dvh`.

---

## 3. Kết Quả Kiểm Tra (Verification)
- Svelte diagnostics: 0 errors, 0 warnings.
- Eslint: 0 errors, 0 warnings.
- Typecheck: 10/10 tasks successful.
- Vitest: 53/53 test files passed (283/283 tests passed 100%).
- Monorepo Tests: 9/9 turbo tasks successful.
- Vercel Production Deploy: Thành công và đã trỏ alias về `https://tuvitoantap.vercel.app`.
