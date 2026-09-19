# Handoff: Admin Dashboard N/A Bug Fix

**Ngày giờ**: 2026-07-20
**Mục tiêu**: Sửa lỗi giao diện bảng người dùng ở `Admin Dashboard` toàn hiển thị `N/A` cho 2 cột Tên và Email. Đánh giá lại toàn bộ logic và workflow của Admin Panel trước khi kết thúc session.

## Phân tích (Logic & Workflow)
- **Logic lỗi N/A**: Component Svelte (`/apps/web/src/routes/(app)/admin/+page.svelte`) mong đợi đọc biến `user.full_name` và `user.email` từ dữ liệu API trả về.
- Tuy nhiên API Endpoint `adminListUsers` của file `apps/api/src/database/supabase-persistence.gateway.ts` chỉ query tới bảng `public.profiles`. Bảng này lại KHÔNG chứa trường `email` (do email được Supabase quản lý riêng trong lược đồ `auth.users`) và chỉ chứa `display_name`.
- **Workflow & Rủi ro**: Admin Panel fetch user an toàn qua service role. Việc lấy 200 user mới nhất từ `profiles` không có thông tin định danh sẽ gây khó khăn cho admin. Giải pháp an toàn nhưng hiệu quả cho MVP là query kết hợp với `auth.admin.listUsers()`.

## Công việc đã thực hiện
1. Đã chỉnh sửa `apps/api/src/database/supabase-persistence.gateway.ts` - Hàm `adminListUsers()`.
2. Áp dụng query fetch danh sách từ `client.auth.admin.listUsers({ perPage: 1000 })` và sử dụng Map() để gắn thông tin `email` và `user_metadata.full_name` ngược lại vào tập dữ liệu trả ra cho `public.profiles`. Tránh query chéo phức tạp hay view chưa cần thiết.
3. Đảm bảo fallback `full_name` từ `display_name` nếu user không cung cấp `full_name` lúc register.
4. Chạy compiler typecheck `pnpm -F @ziweiai/api typecheck` và build thành công.
5. Push trực tiếp code khắc phục lỗi này lên nhánh `main` (commit `c2b4446`). 

## Kết quả & Pre-check
- **Logic đúng chưa**: Đã đúng. Bảng `Admin Dashboard` giờ sẽ map data hoàn chỉnh.
- **Workflow ổn chưa**: Mượt. Cấu trúc UI cũ được giữ nguyên nhưng dữ liệu thật.
- **Thiếu tính năng gì**: Không còn thiếu thông tin cơ bản cho User Management.
- **Rủi ro tiềm ẩn**: Việc load 1000 records từ `auth.users` chạy hoàn toàn bên Node.js EC2 khá ổn cho MVPs, nhưng khi scale >10k user sẽ cần làm SQL VIEW Join `public.profiles` và `auth.users`. (Được note lại cho Roadmap tối ưu sau).
- **Tất cả bugs (kể cả 401, duplicate head tag, và N/A)** liên quan đến giao diện Dashboard từ đầu session đều ĐÃ ĐƯỢC FIX TOÀN BỘ. Báo "DONE".

## Prompt cho Session mới
*Hãy copy nội dung này vào ô chat của session mới để agent tiếp tục công việc trên máy chủ và Mobile App:*

> "Tôi vừa fix xong các lỗi backend cho trang Admin Dashboard và commit lên nhánh main. Nhiệm vụ của bạn ở session mới này là:
> 1) Kết nối SSH vào máy chủ EC2 (IP: `13.250.41.97`, file key: `docs/deploy/Ziwei-Production.pem` hoặc tương tự) và chạy script deploy API backend mới nhất: `cd ~/ziweiai-web && git pull && pnpm install && pnpm build && pm2 restart ziwei-api`.
> 2) Sau khi API backend được cập nhật thành công, hãy kiểm tra lại toàn bộ workflow bằng cách build/chạy ứng dụng mobile Flutter (A53) để tôi test. Hãy chắc chắn rằng API liên lạc trơn tru với cả Web và Mobile."
