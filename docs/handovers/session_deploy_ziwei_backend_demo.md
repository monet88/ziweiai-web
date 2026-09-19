# Handoff Report: Deploy Ziwei Backend Demo (Session)

**Ngày thực hiện:** 20/07/2026
**Mục tiêu chính:** Triển khai Backend API Demo của dự án "Tử Vi Toàn Tập" lên server `newtop` với subdomain `ziwei.7app.online` thông qua kết nối an toàn (Tailscale & Cloudflare Tunnel), đồng thời tuyệt đối không làm ảnh hưởng đến các service khác đang chạy trên `newtop`.

## Các công việc đã thực hiện

### 1. Chuẩn bị và bảo mật
- Kiểm tra lại toàn bộ `.gitignore` của repo để đảm bảo không đẩy lên các key nhạy cảm (Supabase Service Key, JWT, Firebase, Vercel token...).
- Git exclude các file rác và artifacts theo rule của `AGENTS.md`.
- Đóng gói (zip) mã nguồn API chỉ với các phần cần thiết.

### 2. Thiết lập luồng mạng và SSH
- Xác định IP LAN `192.168.1.8` bị từ chối kết nối SSH (do firewall hoặc fail2ban).
- Chuyển sang kết nối qua **Tailscale** (`newtop-vpn` - IP `100.116.75.1`). 
- Phát hiện Tailscale bị tắt hoặc timeout xác thực SSH -> Xử lý thông qua lệnh mở Tailscale và yêu cầu user xác thực thiết bị trực tiếp từ URL của Tailscale.
- Kết nối SSH thành công và truyền file an toàn.

### 3. Cài đặt và Build API trên `newtop`
- Giải nén mã nguồn vào thư mục `~/deployments/ziweiai-demo`.
- Copy cấu hình `.env.local` hiện tại vào `.env`.
- Thay đổi `API_PORT` trong `.env` từ `3000` thành `3005` để **tránh hoàn toàn xung đột** với các service khác (như `zalocrm` đang dùng port 3000).
- Build ứng dụng NestJS bằng Turborepo.
- Khởi chạy process bằng `pm2` với tên `ziwei-demo-api` và giám sát log ổn định. (Không có lỗi EADDRINUSE sau khi đổi port).

### 4. Thiết lập Cloudflare Tunnel & DNS
- Dùng `CLOUDFLARE_GLOBAL_API` từ `.zshrc` trên máy local (M1) viết một script Node.js tương tác thẳng tới Cloudflare Zero Trust API.
- Đăng ký một tunnel ẩn danh mới mang tên `ziwei-demo` và lấy Token.
- Tạo một bản ghi CNAME cho domain `ziwei.7app.online` dẫn thẳng vào tunnel trên.
- Khởi chạy một docker container `cloudflare/cloudflared` (tên `ziwei-demo-cloudflared`) trên `newtop` dưới quyền `--network host` để proxy HTTPS traffic trực tiếp vào `http://localhost:3005`.

## Kết quả và Tình trạng hệ thống (Pre-check)
- **Logic / Workflow:** API Demo hoạt động độc lập và hoàn hảo, phản hồi `status: ok` tại `https://ziwei.7app.online/health`.
- **An toàn hệ thống:** Các service khác trên `newtop` (`n8n`, `zalocrm`, `9router`, `moneyprinter`, `sevenbrain-*`) đều **an toàn, không bị khởi động lại và không bị tranh chấp port**.
- **Tính năng còn thiếu / Rủi ro tiềm ẩn:** 
  - File `.env` trên newtop hiện là clone của `.env.local` ở máy M1 (Dùng database có thể là local Supabase hoặc Gala mới). Khi Gala (Supabase project mới) đi vào hoạt động chính thức, cần cập nhật lại `SUPABASE_URL` và `SUPABASE_KEY` trong file `.env` trên `newtop` và restart `pm2`.
  - Quota của `ziweiai-api` hiện giới hạn trong máy demo, cần xem xét thêm cron job clear logs của PM2 nếu chạy lâu dài.

## Kế hoạch cho Session tiếp theo (Handoff Prompt)
Dựa theo file `galatuvi` bạn vừa khởi tạo với các thông tin của project Supabase mới:

> **Prompt cho Agent ở Session tới:**
> "Trong session trước, tôi đã triển khai thành công API Demo của Tử Vi Toàn Tập lên server `newtop` (domain `ziwei.7app.online`). Tôi cũng vừa thiết lập xong một project Supabase mới tên là Gala (thông tin trong file `galatuvi`).
> 
> Nhiệm vụ của bạn trong session này là:
> 1. Tích hợp database của Supabase mới (Gala) vào project (chạy migrations, apply seed data).
> 2. Đấu nối cấu hình Backend và Frontend sang Database Gala này thay vì Database cũ.
> 3. SSH vào `newtop`, cập nhật file `.env` của API sang thông tin Gala mới và khởi động lại PM2.
> 4. Test hoàn chỉnh workflow end-to-end trên Web/App với Supabase mới."
