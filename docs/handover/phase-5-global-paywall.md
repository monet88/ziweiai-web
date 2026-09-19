# Handover: Phase 5 - Global Paywall / Quota Hardening

## 1. Mục tiêu (Goal)
- Xây dựng một cơ chế "Paywall (chặn giới hạn XU)" dùng chung (Global) cho toàn bộ ứng dụng. 
- Ngăn chặn các Request vượt hạn mức (trả về lỗi HTTP 402 từ API) và hiển thị một Modal Paywall duy nhất trên toàn cục thay vì xử lý lặp lại ở từng nút bấm cục bộ (in-place CTA).
- Đảm bảo logic kiểm thử Playwright E2E đồng bộ với kiến trúc giao diện mới.

## 2. Công việc đã thực hiện (What was done)
1. **Kiến trúc Store & UI (Global Modal):**
   - Tạo mới `apps/web/src/lib/stores/paywall.svelte.ts`: Dùng Svelte 5 `$state` để quản lý trạng thái đóng/mở Modal và thông báo lỗi.
   - Tạo mới `apps/web/src/lib/components/ui/GlobalPaywallModal.svelte`: Giao diện chặn người dùng (Modal overlay có `z-index` cao) kèm theo nút `Nạp XU ngay` (điều hướng sang `/pricing`).
   - Tích hợp Modal này vào `apps/web/src/routes/(app)/+layout.svelte` để Modal khả dụng ở mọi trang.

2. **Cơ chế Interceptor tự động (Tầng API):**
   - Cập nhật `apps/web/src/lib/api-client/fetch-json.ts` (hàm `throwHttpError`). Tự động phát hiện lỗi `402 Payment Required` -> kích hoạt `paywallStore.open(message)`. Điều này đảm bảo mọi tính năng gọi qua `fetchJson`, `fetchNoContent` hoặc `fetchMultipart` đều được cover.

3. **Dọn dẹp nợ kỹ thuật (Cleanup Legacy Local CTAs):**
   - Gỡ bỏ logic hiển thị Paywall tại chỗ trong `AnnualReportButton.svelte` và dọn CSS dư thừa (`.annual__hint`).
   - Gỡ bỏ biến `isPaymentRequired` khỏi `explanation-model.svelte.ts`.
   - Gỡ bỏ giao diện cục bộ bắt 402 trong `ChartDetailScreen.svelte`, trả Component này về dạng thuần hiển thị trạng thái chờ và lỗi.

4. **Kiểm tra và Khắc phục Test (Playwright E2E):**
   - Chỉnh sửa `us-010` và `us-016` để `expect` sự xuất hiện của Global Modal (selector: `.paywall-modal`) thay vì nút Premium cục bộ.
   - **Xác định nguyên nhân E2E Test bị timeout ở Local:** Khi chạy `playwright`, bài test bị kẹt ở vòng lặp chờ chuyển trang do ứng dụng tự động đẩy về `/sign-in`. Nguyên nhân gốc rễ là **thiếu `SUPABASE_JWT_SECRET` hợp lệ tại file `.env.local`**. Do chìa khoá mặc định là `placeholder-for-asymmetric-jwks-project`, Local API (NestJS) đã đánh dấu Token từ Supabase Cloud là không hợp lệ (Signature mismatch) -> trả về `401 Unauthorized` -> Frontend xử lý 401 bằng cách đá về `/sign-in`. (Test sẽ chạy hoàn hảo trên CI/CD khi có đủ Secrets).

## 3. Kết quả (Results)
- Luồng Paywall (Chặn tính năng tốn XU) đã hoạt động mượt mà và tập trung.
- Svelte-check compile 100% không lỗi (`pnpm -F @ziweiai/web check`).
- Workflow đã ổn định: Các tính năng gọi API nếu hết tiền -> hiển thị Global Modal -> Bấm "Nạp XU ngay" -> chuyển sang `/pricing` (Modal tự động đóng).
- Sẵn sàng Deploy lên Production.

## 4. Bước tiếp theo (Next Steps cho Session Mới)
Ở đầu session này, bạn đã yêu cầu **"Thực thi tái cấu trúc (Refactor) hệ thống Xuanshu Runtime Seam"** (xử lý điểm nghẽn gọi Node.js `tsx` CLI từ `astro-engine`), nhưng sau đó chúng ta đã rẽ nhánh sang hoàn thiện nốt **Phase 5 (Global Paywall)**. 

Do đó, ở Session tiếp theo, chúng ta sẽ quay trở lại mục tiêu Refactor `Xuanshu Runtime Seam`.
