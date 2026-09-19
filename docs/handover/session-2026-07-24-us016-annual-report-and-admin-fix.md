# Session Handover: US-016 Báo Cáo Vận Hạn Năm & Admin Route Guard

**Ngày thực hiện**: 2026-07-24  
**Project**: ZiweiAI / Tử Vi Toàn Tập  
**Branch**: `feat/us-016-annual-report`  

---

## 1. Mục Tiêu (Goals)

1. **Khắc phục lỗi Google OAuth Redirect**: Xử lý hiện tượng khi đăng nhập Google trên `https://tuvitoantap.pages.dev` bị redirect về `http://localhost:3000`.
2. **Chặn triệt để truy cập `/admin` trái phép**: Ngăn tài khoản ẩn danh (Anonymous Session) hoặc khách chưa đăng nhập xem khung giao diện Admin rỗng.
3. **Phát triển & hoàn thiện US-016 (Báo cáo Vận hạn Năm)**: Tích hợp đầy đủ Vận ngày, Vận tháng và Báo cáo năm LLM Markdown tiếng Việt.
4. **Deploy bản mới nhất**: Biên dịch và deploy đồng bộ lên Cloudflare Pages (`https://tuvitoantap.pages.dev`) và Vercel (`https://tuvitoantap.vercel.app`).

---

## 2. Việc Đã Làm (Work Done)

### A. Chẩn Đoán & Khắc Phục Google OAuth Redirect
- **Phân tích nguyên nhân**: Client gửi `redirectTo: https://tuvitoantap.pages.dev/`, nhưng Supabase Auth Dashboard chưa đăng ký URL này trong **Redirect URLs**, dẫn tới cơ chế bảo mật OAuth tự động fallback về **Site URL** (`http://localhost:3000`).
- **Checklist cấu hình Supabase Dashboard**:
  - Site URL: `https://tuvitoantap.pages.dev`
  - Redirect URLs: `https://tuvitoantap.pages.dev/*`, `https://tuvitoantap.pages.dev/**`, `https://tuvitoantap.vercel.app/*`.

### B. Bảo Vệ Tuyệt Đối Route Admin (`/admin/*`)
- **Tạo Admin Layout Guard** (`apps/web/src/routes/(app)/admin/+layout.ts`): Chặn các phiên ẩn danh (Anonymous) hoặc chưa đăng nhập ngay từ vòng ngoài, tự động redirect 303 sang `/sign-in`.
- **Xử lý 401/403 ở các subpage**: Cập nhật `+page.ts` tại `/admin`, `/admin/analytics`, `/admin/audit-logs`, `/admin/configs`, `/admin/transactions` để nếu người dùng không có quyền Admin sẽ bị chuyển hướng 303 về Trang chủ (`/`).

### C. Tính Năng Báo Cáo Vận Hạn Năm (US-016)
- **Vận ngày & Vận tháng**: Thuần đọc, 0 token AI, render template tiếng Việt.
- **Báo cáo năm**:
  - Ghép lưu niên + 12 lưu nguyệt, tổng hợp LLM Markdown tiếng Việt (không rò chữ Hán).
  - Gate 2 cờ (`AI_EXPLANATION_FREE_FOR_ALL` + `AI_ANNUAL_REPORT_ENABLED`) + Quota 2 lượt/ngày/user.
  - Persistent DB cache `annual_reports(chart_id, year)` ngăn tái sinh tốn token.
- **UI Components**: Tích hợp `DailyFortuneCard.svelte`, `MonthlyFortuneCard.svelte`, `AnnualReportButton.svelte`, `AnnualReportModal.svelte` vào `ChartDetailScreen.svelte`.

---

## 3. Kết Quả & Validation Gates (Results)

- **Typecheck**: `pnpm typecheck` → 10/10 packages successful.
- **Svelte Check**: `svelte-check` → 0 errors, 0 warnings.
- **Web Unit Tests**: `pnpm -F @ziweiai/web test` → 43/43 test files passed (251 tests).
- **API Unit Tests**: `pnpm -F @ziweiai/api test` → 70/70 test files passed (430 tests).
- **Build**: `@ziweiai/contracts`, `@ziweiai/api`, `@ziweiai/web` biên dịch thành công 100%.

---

## 4. Lệnh Deploy Bản Mới Nhất

```bash
# 1. Commit code
git add .
git commit -m "feat(us-016): complete annual fortune report & admin route protection"

# 2. Deploy Cloudflare Pages (Main Production UI)
export CLOUDFLARE_API_TOKEN="cfut_2qSgJSqpFLwOk8ZA11JWzbO4hhv2uP75MmxxKNbB1810e384"
export CLOUDFLARE_ACCOUNT_ID="ac634c95b84b2c72e3ce2c221374b52b"
npx wrangler pages deploy apps/web/build --project-name=tuvitoantap --branch=main --commit-dirty=true

# 3. Deploy Vercel (API & Fallback UI)
pnpm deploy:vercel-demo
```
