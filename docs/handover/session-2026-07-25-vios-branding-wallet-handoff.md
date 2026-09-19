# Handoff Document — ViOS Branding Audit & Wallet Redesign

> **Session Date:** 25/07/2026  
> **Topic:** Rà soát thương hiệu ViOS, Redesign trang Ví XU (`/wallet`), Báo cáo nghiệm thu  
> **Status:** Completed & Fully Verified (Web 248 tests pass, API 439 tests pass, 0 type errors)

---

## 1. Tóm Tắt Công Việc Đã Hoàn Thành (Summary of Work Completed)

1. **Branding Audit & Integration**:
   - Thay thế toàn bộ chữ thương hiệu cũ `ziweiai` ở topbar chính (`apps/web/src/routes/(app)/+page.svelte`) bằng logo chuẩn `<ViOSLogo size="sm" showTagline={false} />`.
   - Cập nhật CSS `.brand-link` căn chỉnh tối ưu.

2. **Wallet Page Redesign (`/wallet`)**:
   - **Hero Overview Card**: Hiển thị số dư XU nổi bật, loại tài khoản (Email Member vs Anonymous), và widget điểm danh 5 XU hàng ngày.
   - **Cảnh báo Tài khoản Vãng lai**: Banner nhắc nhở liên kết Email để tránh mất số dư XU.
   - **Khung Gói Nạp XU**: 4 gói XU (20 XU, 50 XU, 120 XU, 600 XU) có badge `+20% XU` và `Bán chạy`.
   - **Bảng Tra Cứu Chi Phí XU**: Hiển thị rõ giá từng tính năng (AI 5 XU, Xem Tướng 10 XU, Quẻ Dịch 3 XU, Tử Vi 0 XU).
   - **Chia Sẻ Giới Thiệu 1-Click**: Nút chia sẻ trực tiếp sang Zalo, Facebook, Telegram và Copy Link.
   - **Khung VietQR SePay Sticky**: Mã QR SePay viền phát sáng gold ambient, bảng thông tin CK có nút copy từng dòng & nút "Sao chép tất cả thông tin CK".

3. **Verification & Testing**:
   - `pnpm -F @ziweiai/web check` ➔ 0 errors.
   - `pnpm -F @ziweiai/web test` ➔ 43 test files / 248 tests passed.
   - `pnpm -F @ziweiai/api typecheck` ➔ 0 errors.
   - `pnpm -F @ziweiai/api test` ➔ 71 test files / 439 tests passed.

4. **Tài Liệu Đã Tạo**:
   - `implementation_notes.html` (Living Spec)
   - `docs/wallet-vios-branding-audit-report.md` (Báo cáo Pre-check)
   - `docs/handover/session-2026-07-25-vios-branding-wallet-handoff.md` (Handoff này)

---

## 2. Trạng Thái Codebase (Current State)

- Các file đã chỉnh sửa / tạo mới trong session:
  - `apps/web/src/routes/(app)/+page.svelte`
  - `apps/web/src/routes/(app)/wallet/+page.svelte`
  - `implementation_notes.html`
  - `docs/wallet-vios-branding-audit-report.md`
  - `docs/handover/session-2026-07-25-vios-branding-wallet-handoff.md`

- Toàn bộ code đang ở trạng thái sạch, xanh (passing build/test), không có lỗi dở dang.

---

## 3. Gợi Ý Hướng Phát Triển Cho Session Tiếp Theo (Next Steps)

1. **Deploy & Live Smoke Check**:
   - Chạy lệnh deploy demo: `pnpm deploy:vercel-demo`
   - Smoke test trên link production demo (`https://tuvitoantap.vercel.app/wallet`).
2. **Playwright E2E Test**:
   - Chạy gate Playwright smoke test: `pnpm -F @ziweiai/web exec playwright test smoke.spec.ts`

---

## 4. Prompt Mẫu Cho Session Mới (Starter Prompt for New Session)

Dưới đây là prompt sẵn sàng copy-paste để khởi động session tiếp theo:

```text
Hãy đọc file handoff tại docs/handover/session-2026-07-25-vios-branding-wallet-handoff.md để nắm bối cảnh. 
Phiên trước đã hoàn thành rà soát thương hiệu ViOS và redesign xong trang Ví XU (/wallet) đạt 100% test pass. 
Bây giờ tôi muốn tiếp tục [ĐIỀN YÊU CẦU MỚI CỦA BẠN TẠI ĐÂY, VD: chạy deploy demo Vercel / làm tiếp tính năng X].
```
