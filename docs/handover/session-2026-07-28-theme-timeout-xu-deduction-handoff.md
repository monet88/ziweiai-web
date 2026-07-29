# Handoff Report: Session 2026-07-28 — Theme Engine Refactor, AI Timeout Fix, XU Deduction & Production Closeout

**Ngày thực hiện**: 28/07/2026  
**Dự án**: Tử Vi Toàn Tập (`ziweiai-web`)  
**Domain Live**:  
- Frontend (Cloudflare Pages): `https://tuvitoantap.pages.dev`  
- Backend (Vercel API): `https://tuvitoantap.vercel.app`  

---

## 🎯 1. Mục tiêu (Objectives)

Session này tập trung xử lý toàn bộ các vấn đề P0/P1 phát sinh trên bản live demo:
1. **Khắc phục lỗi Theme Light/Dark bị xung đột (`/charts/[chartId]`)**: Khi ở Light Mode bấm chuyển theme hoặc xem lá số vẫn bị phủ nền đen tối thui.
2. **Khắc phục lỗi AI Explanation `504 Gateway Timeout`**: Xử lý việc gọi luận giải AI bị ngắt giữa chừng với báo lỗi "DeepSeek phản hồi quá thời gian chờ".
3. **Sửa đường dẫn 404 Referral Rewards**: Lỗi gọi trùng path `GET /api/api/rewards/referrals`.
4. **Khắc phục lỗi 402 Payment Required khi tài khoản có dư XU**: Bổ sung trừ XU đúng 3 XU cho các dịch vụ bói toán/gieo quẻ (Lenormand, Dream, Almanac).
5. **Tối ưu UI Wallet (`/wallet`)**: Chuyển các khối thông tin ví XU từ màu tối hardcode sang thích ứng mượt mà theo giao diện Sáng/Tối.
6. **Deploy Production & Kiểm thử toàn diện Gate**: Chạy đủ build gate, Playwright smoke test và deploy live.

---

## 🔍 2. Phân Tích & Nguyên Nhân Cốt Lõi (Root Causes)

### A. Lỗi Theme Light/Dark bị ghim đen ở trang Lá số (`/charts/[chartId]`)
- **Nguyên nhân**: Trong file [tokens.css](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/lib/theme/tokens.css), tồn tại một selector CSS cũ:
  ```css
  [data-theme="dark"],
  .theme-mystical {
    --color-bg-primary: #0c0b12;
    --color-bg-surface: rgb(255 255 255 / 0.06);
    --color-text-primary: #f5f1e8;
    ...
  }
  ```
  Khi người dùng vào trang lá số, `AppScaffold` gán class `.theme-mystical`. Selector trên gộp `.theme-mystical` chung với `[data-theme="dark"]`, dẫn tới **toàn bộ biến màu nền trang bị ép về màu tối đen bất kể `data-theme` đang là `light` hay `dark`**.

### B. Lỗi AI Explanation `504 Gateway Timeout`
- **Nguyên nhân**: `AI_PROVIDER_TIMEOUT_MS` ở file môi trường backend bị đặt ở mốc `15000` (15 giây). Mốc này quá ngắn đối với model DeepSeek khi sinh bài luận giải chi tiết Tử Vi (thường mất 16-25s trong giờ cao điểm), khiến backend ngắt kết nối AbortSignal sớm và NestJS trả về HTTP 504.

### C. Lỗi 404 Referral Rewards
- **Nguyên nhân**: Helper `buildUrl` ở web client nối chuỗi `/api` vào đường dẫn đã có sẵn `/api/rewards/referrals`, tạo thành `/api/api/rewards/referrals`.

### D. Lỗi 402 Payment Required khi gieo quẻ
- **Nguyên nhân**: Hàm `assertPremiumEntitlement` ở `DrawsLenormandService`, `DreamsService`, và `AlmanacService` chỉ kiểm tra số dư XU của user mà chưa gọi `deductXU(userId, 3)`.

---

## 🛠️ 3. Việc Đã Làm (Work Accomplished)

### 1. Refactor Theme Engine & UI Tokens
- **tokens.css**: Gỡ bỏ hoàn toàn selector độc hại `[data-theme="dark"], .theme-mystical`. Tách biệt rõ ràng 2 khối token: `:root` (Light mode) và `[data-theme="dark"]` (Dark mode). Bổ sung bộ biến màu dạ quang `--star-brightness-*` và `--star-mutagen-*` cho chế độ tối.
- **app.html**: Thêm script inline trong `<head>` để nạp `data-theme` từ `localStorage` ngay trước khi DOM render, triệt tiêu hiện tượng nháy màu (anti-flash).
- **ThemeToggle.svelte**: Chuẩn hoá icon hiển thị: Light Mode hiện icon **Moon 🌙**, Dark Mode hiện icon **Sun ☀️**.
- **PalaceCell.svelte**: Cập nhật viền & nền ô đang chọn (`selected`) và tam phương tứ chính (`in-aspect`) tương phản sắc nét ở cả 2 chế độ Sáng/Tối.
- **AIExplanationLoader.svelte**: Chuyển các lớp nền hardcode sang `var(--color-bg-surface)` và `var(--color-border-hairline)`.

### 2. Tăng Timeout AI Provider lên 35s
- Cập nhật `.env.local`: `AI_PROVIDER_TIMEOUT_MS=35000`.
- Cập nhật [apps/api/src/config/env.ts](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/api/src/config/env.ts): Nâng mặc định timeout từ 15s lên 35s (an toàn dưới mốc `maxDuration: 60` của Vercel).

### 3. Cập Nhật Logic Trừ XU Dịch Vụ Bói Toán
- Đã inject `SupabasePersistenceGateway` vào `DrawsLenormandModule`, `DreamsModule`, và `AlmanacModule`.
- Gọi `deductXU(userId, 3)` trong `assertPremiumEntitlement` để đảm bảo tài khoản thực hiện gieo quẻ bị trừ đúng 3 XU và trả kết quả thành công.

### 4. Sửa Lỗi Path 404 & UI Wallet
- Sửa helper gọi API referral rewards để trả về đúng `GET /api/rewards/referrals`.
- Refactor [wallet/+page.svelte](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/routes/(app)/wallet/+page.svelte) sử dụng token thích ứng theme.

---

## 📊 4. Kết Quả & Validation Gates

1. **Monorepo Build Gate**:
   ```bash
   pnpm -F @ziweiai/contracts build && pnpm -F @ziweiai/api build && pnpm -F @ziweiai/web build
   ```
   => **PASSED 100% (Clean build)**.

2. **Playwright E2E Smoke Test**:
   ```bash
   pnpm -F @ziweiai/web exec playwright test smoke.spec.ts --workers=1
   ```
   => **PASSED 1/1 test (30.9s)**.

3. **Deploy Live**:
   - Vercel Backend: `https://tuvitoantap.vercel.app` (Status OK).
   - Cloudflare Pages Frontend: `https://tuvitoantap.pages.dev` (Status OK).

---

## 📋 5. Ready Prompt cho Session Mới (Next Session Prompt)

Bạn có thể sao chép đoạn prompt dưới đây để dán vào session mới:

```text
Chào AI, hãy tiếp tục làm việc trên repo Tử Vi Toàn Tập (ziweiai-web).
Ở session trước (2026-07-28), toàn bộ các lỗi P0 về Theme Light/Dark, AI 504 Timeout, trừ 3 XU gieo quẻ và 404 Referral đã được hoàn tất và deploy live tại:
- Frontend: https://tuvitoantap.pages.dev
- Backend: https://tuvitoantap.vercel.app

Hãy kiểm tra lại status hiện tại của dự án hoặc đọc file `docs/handover/session-2026-07-28-theme-timeout-xu-deduction-handoff.md`, sau đó chờ chỉ thị công việc tiếp theo từ tôi.
```
