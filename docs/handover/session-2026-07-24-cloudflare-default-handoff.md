# Handover Session: Cloudflare Pages Mặc Định & Fix Contrast Dark Theme

**Ngày thực hiện**: 2026-07-24  
**Project**: ZiweiAI / Tử Vi Toàn Tập  
**Branch hiện tại**: `main` (commit `f24b396`)

---

## 1. Tóm Tắt Hiện Trạng & Đã Triển Khai

1. **Chuyển Cloudflare Pages Làm Mặc Định (Default Deployment)**:
   - **Tên dự án Cloudflare Pages**: `tuvitoantap`
   - **URL Mặc định**: [https://tuvitoantap.pages.dev](https://tuvitoantap.pages.dev)
   - **Vercel Fallback**: [https://tuvitoantap.vercel.app](https://tuvitoantap.vercel.app)
   - **Quy tắc SPA Routing**: Cấu hình file `apps/web/static/_redirects` (`/* /index.html 200`).
   - **Wrangler Deployment**: Sử dụng credentials trong `.env.local` (`CLOUDFLARE_WORKER_API` + `CLOUDFLARE_ACCOUNT_ID="ac634c95b84b2c72e3ce2c221374b52b"`).

2. **Khắc Phục Lỗi Tương Phản Giao Diện (Dark Theme Contrast Fix)**:
   - **Nguyên nhân lỗi cũ**: File `tokens.css` trước đó chưa định nghĩa các CSS Custom Property cho `[data-theme="dark"]`, dẫn tới khi kích hoạt Dark mode, chữ màu sáng hiển thị trên nền kem sáng của `.dashboard-page`.
   - **Đã sửa**: 
     - Bổ sung bộ biến `[data-theme="dark"]` đầy đủ trong `tokens.css` (đảm bảo độ tương phản chữ sáng `#f3f4f6` trên nền tối `#0f1117`).
     - Thêm quy tắc gradient tối `:global([data-theme="dark"]) .dashboard-page` trong `+page.svelte`.

3. **Tính Năng Đã Tích Hợp**:
   - Nút đổi Theme Light/Dark (☀️/🌙) trên Navigation Topbar.
   - Thẻ Ví XU & Điểm danh (`/wallet`) + Banner thông báo cho tài khoản ẩn danh.
   - Thẻ Link Ref / Affiliate trong trang Cài đặt (`/settings`).
   - Phân loại tài khoản vãng lai `Vãng lai (Anon)` trên trang Admin (`/admin`).

---

## 2. Lệnh Cần Chạy Để Deploy Ở Session Mới (nếu cần)

```bash
# 1. Build hợp đồng và web app
pnpm --filter @ziweiai/contracts build
pnpm --filter @ziweiai/web build

# 2. Deploy Cloudflare Pages mặc định (Main Production)
export CLOUDFLARE_API_TOKEN="cfut_2qSgJSqpFLwOk8ZA11JWzbO4hhv2uP75MmxxKNbB1810e384"
export CLOUDFLARE_ACCOUNT_ID="ac634c95b84b2c72e3ce2c221374b52b"
npx wrangler pages deploy apps/web/build --project-name=tuvitoantap --branch=main --commit-dirty=true

# 3. Push code lên GitHub
git push origin main
```

---

## 3. Prompt Mẫu Mở Session Mới Dành Cho Người Dùng

> "Chào bạn, tiếp tục dự án Tử Vi Toàn Tập tại `/Users/gray/Documents/bydone/tuvinew/ziweiai-web`. 
> Đã hoàn tất cấu hình Cloudflare Pages mặc định (`https://tuvitoantap.pages.dev`) và khắc phục xong độ tương phản Dark theme. 
> Đọc tài liệu handover `docs/handover/session-2026-07-24-cloudflare-default-handoff.md` và `AGENTS.md` rồi tiếp tục phát triển tính năng Báo cáo Vận hạn Năm (Annual Report US-016) trên branch mới `feat/us-016-annual-report`."
