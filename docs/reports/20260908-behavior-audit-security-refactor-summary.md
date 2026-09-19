# Báo Cáo Toàn Diện: Codebase Audit, Security & UX Refactoring

**Dự án:** Tử Vi Toàn Tập (`ziweiai-web`)  
**Ngày thực hiện:** 08/09/2026  
**Thực hiện bởi:** Antigravity AI Pair Programmer  
**Bộ kỹ năng áp dụng:** `/behavior-model-debugger`, `/vibe-engineering-workflow`, `/vibe-git-manager`  
**Trạng thái:** Hoàn tất thành công (100% Quality & Verification Gates Passed)

---

## 1. Mục Tiêu (Executive Summary & Objectives)

Thực hiện rà soát, chẩn đoán mô hình hành vi (behavior audit), vá lỗi bảo mật (security hardening), tối ưu hóa hiệu năng (performance), cải thiện trải nghiệm người dùng (UX) và giải quyết triệt để các vấn đề lỗi phân tích cú pháp/dependencies theo các tiêu chuẩn nghiêm ngặt:

1. **Security & Anti-Abuse:**
   - Bảo vệ tuyệt đối các webhook thanh toán (SePay, RevenueCat) chống giả mạo khi thiếu secret trên production (fail-closed).
   - Ngăn chặn triệt để hành vi lạm dụng nhận thưởng (Ad-Reward XU) liên tục bằng cơ chế giới hạn hàng ngày (daily cap).
2. **Performance & Scalability:**
   - Loại bỏ phép quét O(N) profiles trong bộ nhớ RAM khi xử lý webhook ngân hàng SePay, chuyển sang sử dụng truy vấn dải UUID được đánh chỉ mục B-Tree Primary Key.
3. **Behavioral UX & User Journey:**
   - Khắc phục thiếu sót trong luồng đăng xuất: bổ sung nút "Đăng xuất" rõ ràng tại trang Cài đặt (`/settings`) và dọn dẹp bộ nhớ đệm `queryClient.clear()` để tránh rò rỉ dữ liệu phiên trước.
   - Thêm CTA đăng nhập trực tiếp cho người dùng ẩn danh (anonymous) tại tính năng Xem Tướng (Vision).
4. **Code Quality & Diagnostic Cleansing:**
   - Khắc phục 100% các cảnh báo CSS/Svelte 5 runes (`svelte-check` warning: 0 errors, 0 warnings).
   - Giải quyết triệt để toàn bộ danh sách lỗi trong `apps/mobile` (@[current_problems]).

---

## 2. Xử Lý Sự Cố @[current_problems] (Apps Mobile / Flutter)

### 2.1. Phân Tích Hiện Trạng & Nguyên Nhân Gốc Rễ (Root Cause)
- **Hiện tượng:** IDE ghi nhận hàng loạt lỗi phân tích cú pháp nghiêm trọng trong `apps/mobile`:
  - `Target of URI doesn't exist: 'package:dio/dio.dart'`
  - `Target of URI doesn't exist: 'package:supabase_flutter/supabase_flutter.dart'`
  - `Target of URI doesn't exist: 'package:flutter/material.dart'`
  - Hàng chục lỗi `Undefined class` (`Dio`, `ConsumerState`, `ThemeData`, `LinearGradient`,...).
- **Nguyên nhân gốc rễ:** Monorepo sau khi khởi tạo/đồng bộ chưa được kích hoạt bộ giải phụ thuộc cho Flutter Dart (`flutter pub get`). Do đó, Dart Analysis Server và bộ linter không định vị được cache của Flutter SDK cũng như các package trong `pubspec.lock`.

### 2.2. Giải Pháp & Thực Thi
1. Chạy lệnh cài đặt đồng bộ dependencies chuẩn của Flutter:
   ```bash
   flutter pub get
   ```
2. Thực thi kiểm tra phân tích tĩnh toàn diện trong `apps/mobile`:
   ```bash
   flutter analyze
   ```

### 2.3. Kết Quả Xác Minh
```text
Analyzing mobile...                                             
No issues found! (ran in 2.0s)
```
- **Kết quả:** Triệt tiêu hoàn toàn 100% các lỗi và cảnh báo trong `apps/mobile`. Không còn bất kỳ compile error hay type warning nào.

---

## 3. Các Hạng Mục Đã Kiểm Toán & Refactor (Detailed Actions)

### 3.1. Webhook Security: Fail-Closed Protection
- **Vấn đề phát hiện:** `apiEnv.SEPAY_WEBHOOK_SECRET` và `REVENUECAT_WEBHOOK_SECRET` là các trường tùy chọn (optional). Nếu môi trường production khởi chạy mà chưa cấu hình secret, webhook controller sẽ bỏ qua kiểm tra token, mở đường cho kẻ tấn công gửi fake transactions.
- **Giải pháp:** 
  - Thêm điều kiện kiểm tra nghiêm ngặt tại [`apps/api/src/modules/payment/payment.controller.ts`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/api/src/modules/payment/payment.controller.ts).
  - Nếu đang ở `process.env.NODE_ENV === 'production'`, bất kỳ webhook nào thiếu cấu hình secret đều bị từ chối ngay lập tức với mã lỗi `401 Unauthorized` (`UnauthorizedException`).
  - Ở môi trường development/test, tiếp tục cho phép bypass an toàn để phục vụ CI/CD và mock testing.
- **Kiểm thử bổ sung:** Viết mới unit test `should reject webhook in production when secret is missing` tại [`apps/api/src/modules/payment/payment.controller.test.ts`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/api/src/modules/payment/payment.controller.test.ts).

### 3.2. Chống Gian Lận Xem Quảng Cáo (Ad-Reward Rate Limit)
- **Vấn đề phát hiện:** Endpoint `POST /rewards/ad-view` thưởng ngay 2 XU cho mỗi lượt xem quảng cáo mà không giới hạn số lần mỗi ngày. Kẻ xấu có thể spam script gọi endpoint này để nhận vô hạn XU.
- **Giải pháp:**
  - Bổ sung cơ chế đếm số lần thưởng quảng cáo (`AD_REWARD_DAILY_CAP = 5`) trong ngày hiện tại (`startOfDay` UTC) tại [`apps/api/src/modules/rewards/rewards.service.ts`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/api/src/modules/rewards/rewards.service.ts).
  - Truy vấn kiểm tra bảng `xu_transactions` theo `type = 'ad_reward'` và thời gian phát sinh.
  - Nếu đã đạt 5 lần, trả về `BadRequestException('Đã đạt giới hạn 5 lượt xem quảng cáo nhận XU trong ngày')`.
- **Kiểm thử bổ sung:** Cập nhật unit test trong [`apps/api/src/modules/rewards/rewards.controller.spec.ts`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/api/src/modules/rewards/rewards.controller.spec.ts) bao quát cả 2 trường hợp: nhận thưởng thành công và từ chối khi vượt hạn mức trong ngày.

### 3.3. Tối Ưu Hóa Truy Vấn Khách Hàng Webhook (O(N) -> Indexed Range Scan)
- **Vấn đề phát hiện:** Phương thức `findUserIdByShortId` tại [`apps/api/src/modules/payment/payment.service.ts`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/api/src/modules/payment/payment.service.ts) thực hiện tải tới 1.000 hồ sơ người dùng (`profiles`) lên bộ nhớ server và dùng `.find(p => p.id.replace(/-/g, '').startsWith(cleaned))` trong RAM. Cách làm này gây nghẽn O(N), rủi ro tràn RAM và trễ webhook khi cơ sở dữ liệu phình to.
- **Giải pháp:**
  - Khai thác đặc điểm cấu trúc chuẩn của UUIDv4: 8 ký tự đầu hex (`shortUuid`) chính là 32-bit đầu tiên của khóa chính.
  - Xây dựng truy vấn PostgREST dựa trên dải B-Tree của Primary Key:
    - Min: `${shortUuid}-0000-0000-0000-000000000000`
    - Max: `${shortUuid}-ffff-ffff-ffff-ffffffffffff`
  - Sử dụng `.gte('id', minUuid).lte('id', maxUuid)` để cơ sở dữ liệu PostgreSQL tìm kiếm với độ phức tạp `O(log N)` thông qua chỉ mục Primary Key có sẵn, không làm nặng server API.

### 3.4. Trải Nghiệm Người Dùng (UX Hardening)
- **Nút Đăng xuất tại Cài đặt (`apps/web/src/routes/(app)/settings/+page.svelte`):**
  - Trước đây màn hình Settings chỉ có nút nguy hiểm "Xóa tài khoản vĩnh viễn" mà thiếu nút "Đăng xuất".
  - Đã bổ sung nút "Đăng xuất tài khoản" rõ ràng với cảnh báo xác nhận.
  - Khi đăng xuất hoặc xóa tài khoản, hệ thống gọi `queryClient.clear()` kết hợp `supabase.auth.signOut()` để làm sạch triệt để bộ nhớ đệm TanStack Query, bảo đảm người dùng kế tiếp không thấy rò rỉ thông tin cá nhân.
- **CTA Đăng nhập cho Anonymous User tại Xem Tướng (`apps/web/src/lib/features/vision/VisionScreen.svelte`):**
  - Màn hình Vision trước đây chỉ hiển thị thông báo "Tính năng này chỉ dành cho tài khoản đã đăng nhập" mà không cung cấp lối đi trực tiếp.
  - Đã bổ sung nút điều hướng Call-to-Action "Đăng nhập hoặc tạo tài khoản ngay" dẫn trực tiếp đến `/sign-in`, hoàn thiện hành trình người dùng liền mạch.

### 3.5. Làm Sạch CSS & Chuẩn Hóa Giao Diện (Svelte 5 Runes)
- **Khắc phục CSS Unused Selectors:**
  - [`AnnualReportModal.svelte`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/lib/features/fortune/AnnualReportModal.svelte): Xóa block trùng lặp `.modal-wrapper`, chuẩn hóa cú pháp CSS `background-clip: text;`.
  - [`sign-in/+page.svelte`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/routes/sign-in/+page.svelte): Loại bỏ class `.brand` không được sử dụng.
  - [`settings/+page.svelte`](file:///Users/gray/Documents/bydone/tuvinew/ziweiai-web/apps/web/src/routes/(app)/settings/+page.svelte): Bọc các selector của icon SVG dạng `:global(.section-icon)` theo chuẩn Svelte 5 scoped styles, loại bỏ sạch sẽ 10 cảnh báo unused CSS selector.

---

## 4. Bảng Kết Quả Kiểm Thử Toàn Diện (Validation Gates Matrix)

Tất cả 8 tiêu chí kiểm định kỹ thuật đều đạt trạng thái **PASS** tuyệt đối:

| Cổng kiểm định | Lệnh kiểm tra | Kết quả | Ghi chú chi tiết |
| :--- | :--- | :---: | :--- |
| **Flutter Mobile Analyze** | `flutter analyze` (trong `apps/mobile`) | **PASS** | `No issues found! (ran in 2.0s)` - Đã vá sạch @[current_problems] |
| **ESLint Quality Gate** | `pnpm lint` (`eslint . --max-warnings=0`) | **PASS** | `0 errors, 0 warnings` |
| **SvelteKit Component Check** | `pnpm -F @ziweiai/web check` | **PASS** | `0 errors, 0 warnings` sau khi tối ưu scoped CSS |
| **Monorepo Typecheck** | `pnpm typecheck` | **PASS** | 10/10 packages & apps hợp lệ về mặt TypeScript |
| **Unit & Integration Test** | `pnpm test` | **PASS** | **120 test files passed**, **703/703 tests passed** (100% pass) |
| **Production Build** | `pnpm exec turbo run build --force` | **PASS** | Build thành công 6/6 apps & packages |
| **E2E Browser Smoke Test** | `playwright test smoke.spec.ts --workers=1` | **PASS** | 1 test E2E hoàn tất thành công trên Chromium headless shell |
| **Secret & Hygiene Scan** | `git check-ignore` & regex scanner | **CLEAN** | Tuyệt đối không rò rỉ API key, JWT secret, Service Role key |

---

## 5. Quy Chuẩn Vibe Git Manager & Secret Hygiene

1. **Tuân thủ ranh giới nhạy cảm:**
   - Các file bí mật `.env`, `.env.local`, `.claude`, `.gemini`, `credentials` đều được bảo vệ trong `.gitignore` và không bị stage hay commit.
2. **Kiến trúc Monorepo:**
   - Web (`apps/web`) tuân thủ tuyệt đối quy tắc không import các thư viện server-only (`@ziweiai/astro-engine`, `iztro`, `lunar-javascript`).
   - Mọi luồng dữ liệu đều được xác thực chặt chẽ qua contracts `@ziweiai/contracts`.
3. **Sẵn sàng triển khai:**
   - Toàn bộ thay đổi mã nguồn đã được gọt giũa tối giản (surgical changes), không có dead code, sẵn sàng cho việc đóng gói và deploy demo Vercel (`pnpm deploy:vercel-demo`).
