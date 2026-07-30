# Tóm tắt Công việc Phase 2: Form Lập Lá Số trong Bottom Sheet

## Mục tiêu
Đưa Form Lập Lá Số (BirthForm) vào một Global Bottom Sheet nhằm tối ưu hoá trải nghiệm Mobile-First, giải phóng không gian cho Homepage (Dashboard) và tạo cảm giác ứng dụng Native (như iOS).

## Các công việc đã thực hiện
1. **Quản lý State toàn cục (`sheetStore`)**
   - Tạo `apps/web/src/lib/stores/sheet.svelte.ts` bằng Svelte 5 `$state` để lưu trữ trạng thái hiển thị (`isOpen`), component động (`component`), và `props` đi kèm.
   - Sử dụng kĩ thuật setTimeout `300ms` khi close để đảm bảo animation đóng hoàn tất trước khi huỷ nội dung, tránh giật lag UI.

2. **Xây dựng `GlobalBottomSheet` Component**
   - Tạo `apps/web/src/lib/components/ui/GlobalBottomSheet.svelte`.
   - Ứng dụng `svelte/transition` (`slide` và `fade`) để tạo cảm giác trượt mượt mà.
   - Bổ sung các tính năng Accessibility: Focus trap (tabindex="-1"), đóng khi nhấn `Escape`, đóng khi click vào backdrop.

3. **Cập nhật App Shell và Homepage**
   - Thêm `<GlobalBottomSheet />` vào `+layout.svelte` để có thể hiển thị sheet ở bất kỳ trang nào.
   - Thay thế việc render `<BirthForm>` trực tiếp trên `+page.svelte` bằng một nút `PrimaryButton`. Nút này sẽ gọi `sheetStore.open(...)` và truyền vào `BirthForm` cùng `model` từ dashboard.
   - Việc tách `BirthForm` ra khỏi DOM khi không cần thiết giúp giảm tải cho lần tải trang ban đầu.

4. **Quản lý đóng mở thông minh**
   - Cập nhật `dashboard-model.svelte.ts`: Bổ sung lời gọi `sheetStore.close()` khi mutation tạo lá số thành công, đảm bảo Bottom Sheet tự đóng và chuyển hướng sang trang kết quả mượt mà.

5. **Xử lý Cảnh báo Accessibility (a11y)**
   - Khắc phục lỗi thiếu `tabindex` ở các thẻ mang `role="dialog"` trong `GlobalBottomSheet.svelte` và `BottomSheet.svelte`.

## Kết quả và Kiểm chứng
- Lệnh `pnpm -F @ziweiai/web check` trả về 0 errors. Form đã có thể mở dưới dạng Bottom Sheet.
- Các biến môi trường bảo mật đã được ghi nhận trong `CONTEXT.md` (yêu cầu không lưu credentials `.env.local` lên git).

## Kế hoạch tiếp theo
- Chuẩn bị test trực tiếp trên Mobile thông qua Vercel. (Cần đảm bảo `VERCEL_GALAXY` token có sẵn trong shell khi chạy lệnh deploy).
- Code Review kỹ lưỡng hoặc chạy Playwright Smoke Tests để đảm bảo logic tạo biểu đồ không có vấn đề phụ (side-effects).
