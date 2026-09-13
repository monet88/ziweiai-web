# Implementation Notes: Monetization UX & Timeline Contrast Refinements

## 1. Unspecified & Implicit Decisions
- **Tích hợp Wallet Store theo ngữ cảnh**: Sử dụng `getWalletStore()` trong `AnnualReportButton.svelte` và bọc trong try/catch phòng trường hợp component được mount độc lập ngoài layout context mà không gây crash giao diện.
- **Tự động refresh số dư sau giao dịch AI**: Thêm effect theo dõi `explanation.hasResult` và callback `mutation.onSuccess` của Annual Report để tự động gọi `wallet.refresh()`, đảm bảo số dư hiển thị tức thời mà không cần reload trang.
- **Quy tắc phối màu Light Theme**: Màu vàng ngọc hoàng gia trên Dark mode (`#fbbf24`, `#fef08a`) được ánh xạ sang hổ phách đậm (`#92400e`, `#b45309`) trên Light mode để thỏa mãn độ tương phản WCAG AAA (> 7:1) trên nền trắng `#ffffff` và kem `#fffbeb`.

## 2. Deviations from Specification
- Không thay đổi backend billing logic (`FEATURE_PRICING.ANNUAL_REPORT = 15`, `FEATURE_PRICING.DEEP_EXPLANATION = 10`), giữ nguyên sự đồng bộ 100% giữa API contracts và Web client.
- Bổ sung conversion hooks (`+ Nạp thêm X XU`) trực tiếp tại các khối tính năng, giúp người dùng thiếu XU có thể nạp ngay lập tức thay vì chờ đến khi bị chặn bởi Paywall modal.

## 3. Considered Trade-offs
- **Hiển thị giá trên text nút vs modal xác nhận riêng**: Lựa chọn hiển thị trực tiếp giá `(15 XU)` và `(10 XU)` ngay trên nút bấm và badge. Điều này giảm bớt 1 bước click thừa (frictionless) đồng thời minh bạch giá trị dịch vụ ngay từ cái nhìn đầu tiên.

## 4. Maintenance Notes
- Các file sửa đổi:
  - `apps/web/src/lib/features/timeline/DestinyTimelineCard.svelte`
  - `apps/web/src/lib/features/fortune/AnnualReportButton.svelte`
  - `apps/web/src/lib/features/chart/ChartDetailScreen.svelte`
- Kiểm thử: Đã pass toàn bộ 414 unit tests, `svelte-check: 0 errors`, `pnpm lint: 0 warnings`, production build thành công.
