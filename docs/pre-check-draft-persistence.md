# Pre-check: Tính năng Draft Form Persistence (Lưu nháp lá số)

## 1. Mục tiêu
Bảo vệ trải nghiệm người dùng trên Mobile khi nhập Form Lập Lá Số. Ngăn chặn việc mất dữ liệu do vuốt nhầm làm đóng Bottom Sheet hoặc vô tình refresh trang.

## 2. Việc đã làm
- Thay đổi cơ chế quản lý state trong `dashboard-model.svelte.ts`.
- Gắn logic `localStorage.setItem` vào hàm `setField` để lưu dữ liệu mỗi khi người dùng thay đổi bất kỳ trường nào (tên, ngày sinh, giờ sinh...).
- Khôi phục dữ liệu từ `localStorage` khi khởi tạo `createDashboardModel` (chỉ trên môi trường client `typeof window !== 'undefined'`).
- Tự động dọn dẹp (xoá nháp bằng `removeItem`) trong callback `onSuccess` khi tạo lá số thành công.
- Loại bỏ `$effect` khỏi factory model để khắc phục lỗi Svelte 5 (`$effect_orphan`) khi chạy Unit Test, giúp model hoàn toàn tách biệt và testable.
- Cập nhật Unit Tests để mock `localStorage` và `@tanstack/svelte-query`, đảm bảo test coverage cho tính năng lưu nháp.
- Chạy toàn bộ chu trình kiểm định: `lint`, `typecheck`, `vitest`, `playwright`.

## 3. Phân tích Pre-check
### Logic đúng chưa?
- **ĐÚNG**. Logic thoả mãn 3 vòng đời của bản nháp: Khởi tạo (load) -> Cập nhật (save) -> Hoàn thành (clear).
- Việc kiểm tra `typeof window !== 'undefined'` bảo vệ ứng dụng khỏi lỗi SSR (Server-Side Rendering) khi `localStorage` không tồn tại.

### Workflow ổn chưa?
- **RẤT ỔN**. Người dùng mở Bottom Sheet -> Nhập liệu -> Đóng Sheet (cố ý hoặc vô ý) -> Mở lại -> Dữ liệu vẫn còn.
- Khi bấm "An Sao" thành công, form tự động bị reset để sẵn sàng cho lần lập lá số tiếp theo. Trải nghiệm liền mạch và an toàn.

### Thiếu tính năng gì?
- **Nút "Clear Form" (Làm mới)**: Mặc dù bản nháp tự xoá khi hoàn thành, nhưng nếu người dùng nhập sai quá nhiều và muốn xoá trắng nhanh toàn bộ form thì họ phải xoá tay từng trường. (Tính năng này có thể thêm sau (Nice-to-have) nhưng không chặn luồng chính).

### Rủi ro tiềm ẩn?
1. **Hydration Mismatch (SSR)**: Vì data load từ `localStorage` trên client, nếu form được render ngay từ server (SSR), có thể gây chớp (flicker) nội dung. Tuy nhiên, form của chúng ta nằm trong Bottom Sheet (mặc định đóng) và UI được khởi tạo sau khi component mount ở phía client, nên rủi ro này đã được triệt tiêu.
2. **Quyền riêng tư (Privacy)**: Dữ liệu nhạy cảm (Tên, Ngày/Giờ sinh) lưu dạng plain text trong `localStorage`. Trên thiết bị cá nhân thì bình thường, nhưng trên máy công cộng có thể bị lộ nếu không xoá. Tuy nhiên, tính năng lưu nháp (auto-fill) là tiêu chuẩn chung của web, rủi ro này ở mức chấp nhận được.

## 4. Kết quả & Đánh giá
**Mọi thứ đã sẵn sàng và an toàn để lên Production.** Code gọn gàng, test đầy đủ, vượt qua mọi công cụ phân tích tĩnh và E2E.
