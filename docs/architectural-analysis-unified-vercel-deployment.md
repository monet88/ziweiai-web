# Báo cáo Phân tích Kiến trúc Deploy: Quy về Vercel (Unified Deployment)

**Ngày thực hiện**: 28/07/2026
**Dự án**: Tử Vi Toàn Tập (`ziweiai-web`)

---

## 🎯 1. Mục tiêu (Objectives)
- **Kiểm tra và xác minh kiến trúc deploy hiện tại**: Phân tích xem có thực sự dự án đang bị phân mảnh Frontend trên Cloudflare Pages (`tuvitoantap.pages.dev`) và Backend API trên Vercel (`tuvitoantap.vercel.app`) gây khó khăn trong quản lý hay không.
- **Đánh giá khả năng hợp nhất (Consolidation)**: Đưa toàn bộ hệ thống (cả Frontend và Backend) quy về một nền tảng duy nhất là Vercel (`tuvitoantap.vercel.app`) để tinh gọn việc bảo trì, phát triển và cấu hình Webhook.

---

## 🛠️ 2. Phân tích & Việc đã làm (Work Accomplished)
- Đã đọc cấu hình `vercel.json` ở thư mục gốc để kiểm tra cơ chế định tuyến (routing).
- Đã kiểm tra kịch bản build `vercel-build` trong `package.json`.
- Tham chiếu chéo với các tài liệu deploy cũ (`docs/agents/deploy.md`).

**Phát hiện (Findings)**:
Hệ thống **thực chất đã được cấu hình sẵn để chạy đồng thời cả Frontend và Backend trên cùng một deployment của Vercel**. Sự nhầm lẫn đến từ việc các phiên làm việc trước có setup thêm Cloudflare Pages làm phương án dự phòng (backup/mirror), dẫn tới việc có 2 domain tồn tại song song.

Bằng chứng tại file `vercel.json`:
- `outputDirectory: "apps/web/build"`: Vercel đang phục vụ tĩnh (static hosting) toàn bộ Frontend SvelteKit.
- `rewrites`:
  - `{"source": "/api/:path*", "destination": "/api/[...path]"}`: Mọi request vào `/api/` (và webhook) sẽ được Vercel tự động bẻ lái vào Serverless Function chứa NestJS API.
  - `{"source": "/:path*", "destination": "/index.html"}`: Mọi request còn lại được xử lý bởi SvelteKit SPA (Frontend).

---

## 📊 3. Kết Quả (Result)
- **Xác nhận 100% khả năng quy về một mối**: Bạn hoàn toàn dùng domain `https://tuvitoantap.vercel.app` làm trung tâm cho tất cả mọi thứ (User App, Admin Dashboard, và API Webhooks).
- **Thiết lập Webhook SePay**: URL để nhập vào SePay hoàn toàn có thể là `https://tuvitoantap.vercel.app/webhooks/sepay`. Trình điều khiển (Router) của Vercel sẽ tự động điều phối request này vào đúng Backend.
- **Lợi ích đạt được**:
  - Không còn lo lỗi CORS phức tạp giữa 2 domain.
  - Quản lý biến môi trường (Environment Variables) duy nhất tại Dashboard Vercel.
  - Deploy một lần là lên cả Frontend lẫn Backend (`pnpm deploy:vercel-demo`).
- **Khuyến nghị**: Ngừng bảo trì/sử dụng nhánh Cloudflare Pages (`tuvitoantap.pages.dev`) và loại bỏ nó khỏi tư duy phát triển hệ thống từ nay về sau.
