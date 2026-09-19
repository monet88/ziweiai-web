# Báo Cáo Code Review & Architecture (Phase 1)

**Ngày thực hiện:** 2026-07-30
**Công cụ phân tích:** AI-Powered Review (`/code-reviewer`), 2-Axis Review (`/code-review`), Codebase Architecture (`/codebase-design`).

---

## 1. Code Review (Standards & Spec)

### 1.1. Standards (Tiêu chuẩn & Best Practices)
- **A11y (Khả năng truy cập):** `BottomSheet.svelte` đã có `role="dialog"` và `aria-modal="true"`. Tuy nhiên, đang thiếu cơ chế **Focus Trap** (giữ tiêu điểm phím Tab bên trong modal khi mở) và phím `Escape` để đóng (Keyboard Navigation).
- **Ngữ nghĩa HTML:** `BottomNavigation.svelte` đang dùng thẻ `<nav>` nhưng chưa có `aria-label="Điều hướng chính"`, có thể gây bối rối cho trình đọc màn hình (Screen Readers).
- **Responsive Layout:** Cả Bottom Sheet và Bottom Nav đều đã áp dụng `env(safe-area-inset-bottom)` tốt cho iOS.

### 1.2. Spec (Yêu cầu tính năng)
- Tính năng hiển thị mượt mà với `svelte/transition` và fallback trên điện thoại đã đạt yêu cầu (Hướng A - Mượt mà).
- **Scope Creep:** Không có scope creep, mọi tính năng được cài đặt tinh gọn đúng mục tiêu của Spec.

---

## 2. Architecture Review (Kiến trúc Codebase)

Dựa trên ngôn ngữ thiết kế Deep Modules (`/codebase-design` & `/improve-codebase-architecture`):

### Vấn đề: Giao diện BottomNavigation hiển thị toàn cục (Shallow UI Logic)
- **Tình trạng:** Hiện tại `BottomNavigation` được gọi trực tiếp ở `apps/web/src/routes/(app)/+layout.svelte`. Nghĩa là tab bar này sẽ luôn xuất hiện trên MỌI trang nằm trong route `(app)`.
- **Friction (Điểm nghẽn):** Theo UI/UX di động, các trang chi tiết sâu (ví dụ: Trang Chi Tiết Lá Số `/charts/[id]`) cần ẩn Bottom Nav để tối ưu không gian hiển thị, đồng thời sử dụng Header với nút Back. Việc hardcode trong `+layout.svelte` làm cho module này thiếu khả năng cấu hình (Lack of **Leverage**).
- **Giải pháp (Deepening Opportunity):**
  - Giới thiệu một UI state store hoặc truyền page metadata (thông qua `$page.data` từ file `+page.ts`) để quyết định xem có hiển thị `BottomNavigation` hay không.
  - Tách logic hiển thị Layout thành một module sâu hơn, quản lý chung `BottomNavigation`, `TopHeader`, và `SafeArea`.

### Vấn đề: BottomSheet hiện tại chưa thể tái sử dụng dữ liệu động
- **Tình trạng:** `BottomSheet` là component giao diện tĩnh. Việc sử dụng nó bắt buộc phải mount/unmount component và state cục bộ trong mỗi page.
- **Friction (Điểm nghẽn):** Khi ta triển khai Form Lập Lá Số, ta sẽ muốn gọi Bottom Sheet này ở nhiều nơi (VD: Trang chủ, Lịch sử, Menu).
- **Giải pháp (Deepening Opportunity):**
  - Áp dụng pattern Global Modal/Sheet (tương tự `GlobalAuthModal` hiện có). Tạo một `sheetStore` để kiểm soát trạng thái Đóng/Mở và Component bên trong Sheet từ bất cứ đâu. (Tăng **Locality** & **Leverage**).

---
*Tài liệu này sẽ được dùng để cải tiến các Phase tiếp theo của lộ trình Mobile-First.*
