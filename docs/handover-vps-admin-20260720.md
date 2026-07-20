# Handover: Tích hợp Super Admin & Cố định VPS
*Ngày: 20/07/2026*

## 1. Bối cảnh & Mục tiêu
- Hoàn thiện tính năng **Quản trị Super Admin**, cho phép cấp quyền Admin qua biến môi trường (`ADMIN_EMAILS`) và thực hiện nạp xu, xem danh sách user.
- Đồng thời **xử lý sự cố môi trường VPS** (AWS EC2 t3.small) với NestJS API khi gặp các lỗi sập do thiếu dependency (ví dụ: `satori`).

## 2. Công việc đã thực hiện
### 2.1. Backend (NestJS API)
- Tạo mới `SuperAdminGuard` chặn các request nếu email người dùng không khớp `ADMIN_EMAILS` trong `.env`.
- Tạo `AdminModule` và `AdminController` cung cấp hai API chính:
  - `GET /admin/users`: Lấy danh sách toàn bộ người dùng.
  - `POST /admin/users/:userId/xu`: Nạp Xu trực tiếp cho người dùng.
- Tích hợp `SupabasePersistenceGateway` sử dụng `service_role_key` để đọc/ghi trực tiếp vào database bỏ qua RLS của người dùng thông thường.

### 2.2. Frontend (SvelteKit Web)
- Bổ sung `adminListUsers` và `adminTopupXU` vào API Client.
- Xây dựng giao diện `apps/web/src/routes/(app)/admin`:
  - `+page.ts` tải danh sách người dùng.
  - `+page.svelte` hiển thị bảng quản lý và Modal nạp Xu.

### 2.3. Khắc phục lỗi và Deploy VPS
- API Server trên VPS sập với lỗi `Cannot find module 'satori'`. Đã xử lý bằng cách bổ sung và `pnpm install` lại thư viện `satori` và `@resvg/resvg-js`.
- Bổ sung file `.gitignore` nghiêm ngặt hơn: loại bỏ `.agent`, `.claude`, `.env`, các file binary (APK, AAB, MP4) để bảo mật.
- Đồng bộ toàn bộ source code từ Local lên VPS qua rsync và build lại `pm2 restart ziweiai-api`. API đã khởi động thành công và map các route `/admin`.

## 3. Lỗi tồn đọng & Điểm lưu ý (Lý do `Cannot GET /admin`)
- Frontend Vercel sẽ gặp lỗi 404 (hoặc 502) với trang `/admin` nếu Local chưa push code mới nhất lên GitHub (do lỗi thiết lập khóa `Username for 'https://github.com'` ở local).
- Người dùng truy cập trực tiếp `https://ziwei.7app.online/admin` (Domain Backend) thay vì Domain Vercel. Cần sử dụng Frontend Vercel (vd: `https://tuvitoantap.vercel.app/admin`).

## 4. Hướng dẫn Session tiếp theo
Copy prompt sau để khởi chạy Session mới tập trung vào QA, kiểm tra Frontend, hoặc tiếp tục tích hợp Mobile:

```markdown
@workspace Chúng ta vừa hoàn thành việc đẩy tính năng Quản lý Admin (NestJS backend & SvelteKit frontend) và cố định backend API trên VPS (AWS EC2) ở session trước. Hãy đọc `docs/handover-vps-admin-20260720.md` để nắm bối cảnh.

Mục tiêu session này:
1. Đảm bảo tôi push code được lên GitHub và Vercel deploy thành công giao diện /admin.
2. Kiểm tra lại app mobile Tử Vi trên máy A53, fix mọi lỗi layout, logic còn sót lại.
3. (Nếu có) Kiểm tra logic sử dụng Gemini/Deepseek để tối ưu chi phí phân tích hình ảnh (Vision) đối với tài khoản trả phí.
```
