# Handover: Hậu Refactor UsersService

## Bối cảnh (Context)
- Chúng ta vừa hoàn thành việc refactor `UsersService.getWalletBalance` để loại bỏ sự rò rỉ SQL query (SQL leak).
- Thay vì sử dụng trực tiếp Supabase Client, chúng ta đã đưa logic truy vấn xuống `SupabasePersistenceGateway.findProfileByUserId(userId: string)`.
- Hàm mapper mới `toProfileRecord` đã được bổ sung vào `persistence-mappers.ts`.
- `ProfileRecord` Schema đã được cập nhật thêm trường `xuBalance`.
- Mọi bài kiểm thử (407 Unit Tests) và biên dịch TypeScript tĩnh đều Pass 100%. Code đã được commit.

## Trạng thái hiện tại
- **Mã nguồn:** Kiến trúc Database seam ở thư mục `apps/api/src/database` và `apps/api/src/modules/users` đã sạch sẽ hơn theo mô hình Deep Module.
- **Báo cáo chi tiết:** Có thể đọc thêm tại `docs/handovers/refactor_users_service_report.md`.

## Định hướng Session tiếp theo
- Dựa vào tài liệu đánh giá kiến trúc trước đó (`docs/handovers/session_architecture_review_users_service.md`), triển khai tiếp các Candidate khác nếu còn.
- Hoặc tiếp tục phát triển các tính năng (feature) mới về thanh toán/ví, cải tiến UI/UX ở nền tảng App Mobile/Web tuỳ theo yêu cầu của dự án (Tham khảo file TODO hoặc backlog).
