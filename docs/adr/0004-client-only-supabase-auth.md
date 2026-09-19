# Client-only Supabase authentication

Ứng dụng cần hỗ trợ người dùng trải nghiệm ngay lập tức ở chế độ ẩn danh và dễ dàng liên kết tài khoản sau này mà không làm phức tạp hóa máy chủ. Chúng tôi quyết định ủy quyền toàn bộ việc quản lý phiên đăng nhập cho Supabase Auth trên client (`apps/web`), còn `apps/api` chỉ đóng vai trò xác thực bearer token phi trạng thái thông qua `IdentityGuard`. Quyết định này loại bỏ gánh nặng lưu trữ session trên server, cho phép API mở rộng ngang dễ dàng và giữ quy trình bảo mật đơn giản, minh bạch.
