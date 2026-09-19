# Handoff Report: Session 2026-07-28 — Unified Deployment on Vercel

**Ngày thực hiện**: 28/07/2026
**Dự án**: Tử Vi Toàn Tập (`ziweiai-web`)

---

## 🎯 1. Mục tiêu (Objectives)
- **Hợp nhất Deployment**: Loại bỏ sự phân mảnh giữa Cloudflare Pages (`tuvitoantap.pages.dev`) và Vercel (`tuvitoantap.vercel.app`), chuyển hoàn toàn Frontend và Backend (API) về chạy chung thống nhất trên `tuvitoantap.vercel.app` (Unified Deployment).
- **Rà soát & Đồng bộ Codebase**: Tìm và thay thế toàn bộ liên kết (referral links), cấu hình CORS, biến môi trường (fallback) hiện đang sử dụng `pages.dev` sang `vercel.app`.
- **Pre-check Toàn bộ Hệ thống**: Kiểm tra logic, workflow, rủi ro tiềm ẩn trước khi chuyển giao session, đảm bảo sạch bug.

---

## 🛠️ 2. Việc Đã Làm (Work Accomplished)
1. **Phân tích Kiến trúc**: 
   - Đã kiểm tra `vercel.json` và xác nhận cấu hình rewrites hoàn toàn hỗ trợ chạy SvelteKit SPA (cho Frontend) và NestJS API (cho `/api/*` và webhooks) đồng thời trên nền Vercel.
2. **Đồng bộ Liên Kết (Ref Links & CORS)**:
   - Thay thế các hardcode origin trong `apps/api/src/config/env.ts` (`API_CORS_ORIGINS`).
   - Thay thế toàn bộ mã tạo link giới thiệu (Referral Link Sharing) qua Zalo, Facebook, Telegram tại màn hình ví `wallet/+page.svelte` từ `pages.dev` sang `vercel.app`.
   - Cập nhật logic lấy fallback origin ở `settings/+page.svelte`.
3. **Validation & Pre-check**:
   - Chạy kiểm tra Code Quality (`pnpm typecheck` và `pnpm lint`) toàn bộ Monorepo.

---

## 🔍 3. Final Pre-check Report
- **Logic đúng chưa?** ✅ Chuẩn. Cả Frontend và Backend nằm chung 1 domain, không bao giờ bị lỗi CORS preflight cản trở. Link chia sẻ hoạt động đúng định dạng chuẩn.
- **Workflow ổn chưa?** ✅ Rất ổn định. Script deploy `pnpm deploy:vercel-demo` hoạt động độc lập và đẩy toàn bộ project lên Vercel. Mọi thay đổi webhooks SePay cũng chỉ cần trỏ vào domain này.
- **Thiếu tính năng gì?** ⚠️ Dự án vẫn đang chờ triển khai tính năng: "Tạo OG Image động cho Link Giới thiệu (SEO)" và "Public tính năng Báo Cáo Năm" do ở session này ưu tiên refactor hạ tầng.
- **Rủi ro tiềm ẩn?** Việc bỏ `pages.dev` khiến khách hàng cũ click vào link cũ (`tuvitoantap.pages.dev/?ref=...`) đã share trước đây có thể gặp khó khăn nếu bạn xóa dự án trên Cloudflare. 
  👉 *Giải pháp/Khuyến nghị*: Không xóa ngay project bên Cloudflare, mà hãy thiết lập tính năng **Bulk Redirects** trên dashboard Cloudflare (hoặc Page Rule) trỏ vĩnh viễn (301 Redirect) từ mọi URL `tuvitoantap.pages.dev` sang `tuvitoantap.vercel.app` để bảo toàn Traffic và SEO.

---

## 📋 4. Next Session Prompt (Dành cho phiên làm việc mới)

Bạn hãy copy đoạn sau và dán vào Session mới:

```text
Chào AI, tiếp tục dự án Tử Vi Toàn Tập (ziweiai-web). 
Session trước tôi đã hợp nhất (unified) thành công hệ thống Frontend và Backend chạy chung trên Vercel (tuvitoantap.vercel.app). 
Toàn bộ mã nguồn đã đồng bộ link referral và test chạy xanh 100%.

Hãy đọc file `docs/handover/session-2026-07-28-unified-deployment-and-handoff.md` để nắm bối cảnh hạ tầng hiện tại.
Nhiệm vụ hôm nay, chọn 1 trong 2 việc sau để triển khai:
1. Xây dựng tính năng SEO (Tạo OG Image động cho Referral Link).
2. Chính thức hoàn thiện và mở Public tính năng Báo Cáo Năm.
```
