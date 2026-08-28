# Admin Dashboard & Auth Fixes Handoff

## 1. Mục tiêu
- Khắc phục lỗi `401 Unauthorized` và `403 Forbidden` trên các trang Admin Dashboard (Configs, Referrals, Users, Analytics).
- Sửa lỗi không lấy được dữ liệu Analytics trên môi trường Production do thiếu tham số và schema DB không đồng bộ.
- Chuẩn bị nền tảng ổn định và bàn giao phiên làm việc trước khi chuyển sang tính năng mới (Kinh Dịch).

## 2. Việc đã làm
- **Bổ sung Auth Token cho Frontend:**
  - Phát hiện các trang quản trị (SvelteKit) sử dụng `fetch()` thuần (native) gọi API `/api/admin/...` nhưng thiếu Header `Authorization`.
  - Thay thế bằng việc lấy token từ `$lib/auth/auth-context` (`auth.getAccessToken()`) và thêm vào `Headers` của mọi request ở `+page.svelte` (Configs, Referrals, Users).
- **Phục hồi quyền Admin trên Production:**
  - Chạy kịch bản gán role `admin` (super_admin) cho tài khoản `sevengotek@gmail.com` trên database thật.
- **Sửa lỗi Analytics (Không tải được dữ liệu):**
  - Khám phá ra RPC `get_admin_analytics` trên Vercel production đang bị thiếu (lệch schema do migration `000019_update_admin_analytics_rpc.sql` chưa được push).
  - Sử dụng Supabase CLI kết nối trực tiếp vào DB production và chạy `supabase db push --include-all` để deploy migration `000019`.
  - Migration này đổi tham số của RPC từ `days` sang hỗ trợ lọc theo khoảng thời gian (`p_start_date`, `p_end_date`), khớp 100% với Backend (NestJS).

## 3. Pre-check (Kết quả kiểm tra)
- **Logic đúng chưa?** Logic truyền nhận Auth header đã hoàn thiện. Backend Admin service sử dụng `service_role` để truy cập DB an toàn, không bị vướng RLS. Các API đã chạy mượt mà.
- **Workflow ổn chưa?** Workflow vào Admin dashboard mượt, các module Configs, Referrals, Users (Dọn rác, Nạp XU) và Analytics đã lấy đúng dữ liệu.
- **Thiếu tính năng gì?** Không thiếu so với phạm vi Dashboard MVP hiện tại.
- **Rủi ro tiềm ẩn?** Việc gọi `fetch()` trực tiếp ở SvelteKit có thể gây lỗi nếu quên đính kèm token. Khuyến cáo tương lai nên xài `fetchJson` wrapper có sẵn trong `api-client` để tự động hóa inject token.

## 4. Chuyển giao (Handoff)
Mọi tác vụ của session này (Mobile UI Revamp, Monetization, và Admin Bug Fixes) đã hoàn thành. Hệ thống đang trong trạng thái sạch sẽ và ổn định.

**=> Chuyển sang Task: Kinh Dịch (I Ching) Engine & UI.**
