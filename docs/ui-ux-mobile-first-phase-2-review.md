# Phase 2: Mobile-First UX - Global Bottom Sheet & Code Review

## 1. Mục tiêu (Goals)
- Đưa tính năng Lập Lá Số (BirthForm) vào một Bottom Sheet nhằm tối ưu không gian trên Mobile, tạo cảm giác app native (Premium Feel).
- Xây dựng kiến trúc Global Bottom Sheet để có thể tái sử dụng cho các form, menu, hoặc modal khác trong toàn bộ ứng dụng mà không cần lặp lại code UI.
- Tuân thủ nghiêm ngặt nguyên tắc của Svelte 5 (sử dụng `$state`, không rò rỉ reactivity) và các chuẩn về a11y.

## 2. Việc đã làm (Implementation)
- **Tạo Singleton Store (`sheetStore.svelte.ts`)**: Sử dụng class với Svelte 5 `$state` để lưu trạng thái `isOpen` và `content` (bao gồm Svelte Component và Props).
- **Tạo Component (`GlobalBottomSheet.svelte`)**: Component UI được mount một lần duy nhất tại `routes/(app)/+layout.svelte`. Component này phản ứng với `sheetStore` để hiển thị overlay và nội dung được truyền vào.
- **Tích hợp `BirthForm`**: Thay vì render trực tiếp trên trang `/`, form lập lá số giờ đây được mở thông qua nút trigger gọi `sheetStore.open(BirthForm, props)`.
- **Đóng tự động**: Tích hợp luồng đóng (close) vào `dashboard-model.svelte.ts` sau khi submit thành công và redirect.
- **Fix lỗi Lint/A11y**: Đã sửa các cảnh báo svelte-check liên quan đến `role="dialog"`, `aria-modal="true"`, và xoá các cảnh báo unused variables, đảm bảo mã nguồn sạch 100% đối với phần code vừa viết.
- **Viết Unit Test**: Thêm test cho `sheet.svelte.test.ts` để đảm bảo logic mở/đóng store hoạt động chính xác bằng Vitest.
- **Test E2E**: Chạy bộ Playwright test (smoke.spec.ts) để verify.

## 3. Kết quả (Outcomes)
- UI/UX gọn gàng hơn trên giao diện Mobile, trải nghiệm nhập form Lập Lá Số mượt mà qua Bottom Sheet.
- Tính mở rộng của Codebase tăng lên (Leverage): Việc gọi Bottom Sheet ở bất cứ nơi đâu chỉ tốn 1 dòng code `sheetStore.open(...)`.
- Các bước test, lint, typecheck cho phần này đã xanh.

---

## 4. Code Review & Architecture Analysis (Dựa trên `/code-review` & `/improve-codebase-architecture`)

### 4.1. The Standards & Spec Axis
- **Spec Pass**: Đáp ứng đúng yêu cầu chuyển form xuống Bottom Sheet theo chuẩn Mobile-First. Không có scope creep, mọi file liên quan đều chỉ phục vụ mục tiêu duy nhất.
- **Standards Pass**: Sử dụng class-based store của Svelte 5 (`$state`) thay vì writable store cũ. Lỗi a11y và missing keys đã được dọn dẹp gọn gàng.

### 4.2. Codebase Architecture Insights (Deepening Opportunities)
Dưới góc độ `/improve-codebase-architecture`, kiến trúc `GlobalBottomSheet` đã biến một module nông (Shallow) thành một interface có đòn bẩy cao (Leverage). Tuy nhiên, còn 2 khía cạnh cần lưu tâm để hoàn thiện "Premium Mobile Feel":

1. **Hardware Back Button / Swipe to Go Back (Mobile UX)**
   - **Problem (Friction)**: Hiện tại, Bottom Sheet được quản lý hoàn toàn bằng trạng thái trong bộ nhớ (`sheetStore`). Trên Mobile (đặc biệt là Android), người dùng có thói quen bấm nút "Back" trên phần cứng hoặc vuốt cạnh viền để đóng Bottom Sheet. Với cách hiện tại, hành động Back sẽ kích hoạt history back của trình duyệt, đẩy người dùng về trang trước thay vì đóng Bottom Sheet.
   - **Solution (Deepening)**: Đồng bộ `sheetStore.isOpen` với URL hash (ví dụ: `#sheet=birth-form`) hoặc đẩy một history state giả khi mở sheet. Bằng cách này, thao tác Back của người dùng sẽ được bắt (popstate) và chỉ làm nhiệm vụ đóng sheet thay vì rời khỏi trang hiện tại.
   - **Recommendation Strength**: **Strong** (Bắt buộc phải có để đạt Premium Native Feel chuẩn mực).

2. **Route Navigation Interrupts**
   - **Problem**: Nếu người dùng bấm vào một Link chuyển trang bên trong Bottom Sheet (ví dụ: chuyển đến trang Lịch Sử) và `GlobalBottomSheet` không được gắn hook `afterNavigate`, Bottom Sheet sẽ tiếp tục mở đè lên trang mới (do nó nằm ngoài cùng ở `+layout.svelte`).
   - **Solution**: Bổ sung event listener hoặc dùng `afterNavigate` của SvelteKit bên trong `GlobalBottomSheet.svelte` để gọi `sheetStore.close()` mỗi khi chuyển Route.
   - **Recommendation Strength**: **Worth Exploring** (Dễ làm và triệt tiêu lỗi UI tiềm ẩn).

### 5. Kết luận & Bước tiếp theo
Phần khung giao diện và chức năng cốt lõi của Bottom Sheet đã hoàn tất. 
**Hành động tiếp theo (Khuyến nghị):**
- Theo dõi kết quả deploy Vercel và E2E tests.
- Xử lý UX Route/Back button như đã nếu trên (tuỳ vào độ ưu tiên hiện tại).
