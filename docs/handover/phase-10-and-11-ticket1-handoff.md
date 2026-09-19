# Handover: Phase 10 & Phase 11 (Ticket 1)

## 1. Mục Tiêu (Goal)
- **Phase 10:** Triển khai thương mại hóa, kiểm chứng luồng nạp XU qua SePay (VietQR) trên Web và In-App Purchase (RevenueCat) trên Mobile, kích hoạt Cost Gate cho các tính năng AI.
- **Phase 11 (Ticket 1):** Rà soát lõi XuanShu Engine (`@ziweiai/astro-engine`), loại bỏ mã nguồn dự phòng (fallback logic) không còn sử dụng để làm sạch codebase.

---

## 2. Việc Đã Làm (Work Done)

### 2.1. Phase 10 — Thương Mại Hóa & Thanh Toán
1. **Sanity Check & Unit Tests:**
   - Cài đặt thêm dependency `@nestjs/testing` cho `apps/api`.
   - Viết bộ Unit Test đầy đủ cho `payment.service.test.ts` kiểm tra luồng parse webhook SePay, xử lý mã cú pháp `TVTT <short_uuid>`, kiểm tra trùng lặp (Idempotency) và gọi RPC `add_xu` vào Supabase.
   - Kết quả: **3/3 tests PASS (100%)**.
2. **Script Giả Lập:**
   - Tạo script `scripts/mock_sepay_webhook.ts` hỗ trợ test giả lập bắn Webhook SePay về API local.
3. **Deploy Demo Vercel:**
   - Thực hiện build và deploy toàn bộ hệ thống lên Vercel Demo bằng lệnh chuẩn `pnpm deploy:vercel-demo`.
   - Production URL hiện tại: `https://tuvitoantap.vercel.app`.
   - Cập nhật tài liệu hướng dẫn cấu hình môi trường (Vercel Secrets & SePay Dashboard) trong `walkthrough.md`.

### 2.2. Phase 11 — Ticket 1: Lõi XuanShu Engine & Cleanup Fallback
1. **Rà Soát Kiến Trúc Engine:**
   - Phát hiện bộ máy XuanShu Engine (`packages/xuanshu-runtime`) đã được refactor thành công sang mã nguồn TypeScript từ Phase 6, tương thích hoàn toàn 100% với môi trường Vercel Edge/Serverless mà không cần biên dịch C++ sang WASM.
2. **Loại Bỏ Dead Fallback Code:**
   - Xoá bỏ hàm `buildFallbackLiuyaoSnapshot`, các mảng hằng số dự phòng (`FALLBACK_BRANCH_KEYS`, `FALLBACK_SIX_SPIRIT_KEYS`, v.v.) và khối `try/catch` fallback trong `packages/astro-engine/src/adapters/liuyao-adapter.ts`.
   - Xoá bỏ hàm kiểm tra `isXuanshuReferenceRuntimeAvailable` và các điều kiện dư thừa tại `qimen-adapter.ts`, `daliuren-adapter.ts`, và `xuanshu-bridge.ts`.
3. **Chạy Lại Verification Gates:**
   - `pnpm -F @ziweiai/astro-engine test`: **PASS 100% (35/35 tests)**.
   - `pnpm lint`: **0 errors, 0 warnings (100% GREEN)**.

---

## 3. Kết Quả (Result)
- Luồng thanh toán và nạp XU đã được nghiệm thu logic trên Local và được Deploy sẵn sàng trên Production/Demo.
- Codebase của `astro-engine` được tối ưu hóa, bớt đi hơn 140 dòng code thừa, không còn logic giả lập quẻ.
- Toàn bộ pipeline test và linting của monorepo duy trì trạng thái xanh 100%.

---

## 4. Kế Hoạch Cho Session Tiếp Theo (Next Steps)

Session tiếp theo sẽ tiếp tục thực hiện các công việc còn lại của Phase 11:
1. **[TICKET-2] Đánh bóng UI/UX: Glassmorphism & Animations**
   - Thiết lập Glassmorphism (`backdrop-blur`), dải màu nền tối huyền bí và viền gradient 1px trên Web (`apps/web`).
   - Tích hợp hiệu ứng chuyển cảnh/micro-animations bằng GSAP cho các thẻ lá số/quẻ.
   - Đồng bộ thiết kế này sang màn hình `ChartDetailScreen` của Mobile App (`apps/mobile`).
2. **[TICKET-3] SEO Chuyên sâu & Dynamic OG Image**
   - Động hóa meta tags `<title>` và `<meta description>` theo lá số.
   - Hoàn thiện endpoint `GET /share/charts/:chartId/og.png` để tạo ảnh xem trước (OG Image) chất lượng cao khi chia sẻ link lên Facebook/Zalo/Telegram.

---

## 5. Prompt Cho Session Mới (Next Session Prompt)

Copy toàn bộ đoạn văn bản bên dưới để dán vào session mới:

```markdown
Chào bạn, chúng ta tiếp tục dự án Tử Vi Toàn Tập ở session mới. 
Xin hãy đọc tài liệu bàn giao mới nhất tại `docs/handover/phase-10-and-11-ticket1-handoff.md` để nắm ngữ cảnh.

Mục tiêu của chúng ta trong session này là thực thi **Phase 11 - Ticket 2: Đánh bóng UI/UX (Glassmorphism & Animations)** cho Web SvelteKit và Mobile Flutter. 
Hãy xem lại kế hoạch trong `implementation_plan.md` và tiến hành các bước thiết kế/cập nhật CSS, GSAP và Flutter UI.
```
