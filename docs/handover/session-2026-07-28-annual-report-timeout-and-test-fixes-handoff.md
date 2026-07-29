# Handoff Báo cáo cập nhật hệ thống - Ngày 2026-07-28

## 1. Bối cảnh & Mục tiêu
Phiên làm việc này được tạo ra để giải quyết 2 critical bugs trên production liên quan đến trải nghiệm tạo Báo cáo năm (Annual Report) và dọn dẹp các khoản nợ kỹ thuật (technical debt / broken tests) còn sót lại do thay đổi từ phiên làm việc trước:
- **Bug 1:** Chức năng "Tạo báo cáo năm" dù đang khoá Beta nhưng khi ấn vào lại hiện bảng yêu cầu Nạp XU (trigger Paywall), khiến người dùng dù còn XU vẫn bị bắt nạp.
- **Bug 2:** Lỗi `504 Gateway Timeout` khi tạo báo cáo năm do LLM xử lý lâu bị Vercel chém kết nối.
- **Bug 3:** Lệnh test `pnpm -F @ziweiai/api test` báo đỏ nhiều tests liên quan đến hàm trừ XU do quên cập nhật tham số trong file test.

## 2. Các công việc đã thực hiện

### 2.1. Khắc phục lỗi Paywall khi Báo cáo năm khoá Beta
- Đã chỉnh sửa `ai-entitlement.guard.ts`: Thay vì ném lỗi `402 PAYMENT_REQUIRED`, giờ đây khi tính năng `AI_ANNUAL_REPORT_ENABLED` bị tắt, API sẽ ném lỗi `403 FORBIDDEN`.
- Lỗi 403 sẽ ngăn frontend tự động kích hoạt cửa sổ Nạp XU, mà thay vào đó sẽ bắt và hiển thị đoạn text thông báo chuẩn xác ngay dưới nút: *"Báo cáo năm AI tạm khoá ở giai đoạn beta. Vui lòng quay lại sau."*
- Đã cập nhật file test `annual-report.service.test.ts` để mong đợi đúng HTTP 403.

### 2.2. Xử lý triệt để Vercel 504 Gateway Timeout
- Bổ sung explicit directive `export const maxDuration = 60;` tại router chính của API `apps/web/api/[...path].ts` để ép Vercel kéo dài timeout lên tối đa (60s cho Hobby Plan).
- Đẩy hằng số `AI_PROVIDER_TIMEOUT_MS` từ `35000` (35s) lên `55000` (55s) trong `apps/api/src/config/env.ts` để cho phép AI Provider (DeepSeek) tận dụng tối đa băng thông và thời gian xử lý các bài giải dài của Báo cáo năm.

### 2.3. Khắc phục toàn bộ Bug Test & Nợ Kỹ thuật
- Rà soát nguyên nhân: Ở session trước, hàm `deductXU` của `SupabasePersistenceGateway` đã được inject vào các Service (Lenormand, Tarot, Sticks, Almanac, Dreams) nhưng bị bỏ sót ở các Test File, khiến test bị crash.
- Thực hiện fix: Bổ sung mock parameter cho `persistenceGateway` trong `beforeEach` tại 5 file test:
  - `almanac.service.test.ts`
  - `draws-lenormand.service.test.ts`
  - `draws-sticks.service.test.ts`
  - `draws-tarot.service.test.ts`
  - `dreams.service.test.ts`
- Fix lỗi bắt `PAYMENT_REQUIRED` thành `INSUFFICIENT_FUNDS` cho khớp với flow trừ tiền thực tế (khi hàm deductXU trả về false).

## 3. Kết quả đánh giá hệ thống (Validation Gates)
Toàn bộ gate đã vượt qua thành công:
1. `pnpm lint && pnpm typecheck`: Không lỗi (10/10 module types verified).
2. `pnpm -F @ziweiai/api test`: 100% tests PASS (439 / 439 passing, 71 suites).
3. Playwright E2E (`smoke.spec.ts`): Luồng Đăng nhập -> Dashboard PASS mượt mà trong 28.7s.

---

## 4. Prompt đề xuất cho Session tiếp theo

Hãy copy toàn bộ prompt dưới đây để dán vào session mới:

```text
Chào AI, hãy tiếp tục làm việc với dự án Tử Vi Toàn Tập (ziweiai-web).

Ở session vừa rồi (2026-07-28), chúng ta đã dọn dẹp sạch sẽ 3 hạng mục:
1. Sửa lỗi 402 kích hoạt Paywall khi tạo Báo Cáo Năm (đã chuyển thành 403 Forbidden chặn mượt mà).
2. Fix 504 Gateway Timeout trên Vercel Serverless Function bằng cách thiết lập maxDuration = 60 và AI_PROVIDER_TIMEOUT_MS = 55000.
3. Fix toàn bộ các bộ API Test hỏng do bị thiếu object injection SupabasePersistenceGateway. (439 tests currently passing).

Hãy đọc tóm tắt công việc tại: `docs/handover/session-2026-07-28-annual-report-timeout-and-test-fixes-handoff.md`.
Sau đó cho tôi biết dự án đã sẵn sàng chưa, và chúng ta nên tiến hành tính năng/task gì tiếp theo để hoàn thiện product workflow (Ví dụ: tính năng liên kết VNPAY, mở public báo cáo năm, v.v.)?
```
