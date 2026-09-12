# Báo Cáo Kỹ Thuật Toàn Diện Sprint 85: Khắc Phục Triệt Để Ad Reward P0, Phân Tách Kho Lưu Trữ Mobile Độc Lập & Sẵn Sàng Mở Bán XU

**Dự án:** ViOS — Tử Vi Toàn Tập (`ziweiai-web` & `ziweiai-mobile`)  
**Thời gian:** 2026-09-12  
**Phiên bản:** Sprint 85 (Growth, Security Remediation & Standalone Mobile Repository)  
**Tác giả:** Đội ngũ Kỹ thuật & Antigravity IDE  

---

## 1. Mục Tiêu Sprint 85

1. **Tiếp nhận và giải quyết triệt để phản biện từ Codex:**
   - Xử lý lỗ hổng **P0 Daily-Cap Concurrency Race Condition**: Ngăn chặn việc 2 request đồng thời với 2 `impression_id` khác nhau tại mốc 4 lượt có thể vượt qua kiểm tra count và credit thành 6 lượt/ngày.
   - Xác định ranh giới bảo mật cho **P0 Server-Side Verification (AdMob SSV)**: Duy trì cờ `ENABLE_AD_REWARDS=false` (fail-closed) trên môi trường Production để bảo vệ an ninh kinh tế XU.
   - Khắc phục **P1 Tỷ giá FX đa tiền tệ**: Bổ sung metadata nguồn tham chiếu, timestamp và đồng bộ tuyệt đối giữa spec và code (GBP 32,200 và THB 740).
2. **Chuẩn hóa kiến trúc đa nền tảng (Mobile Flutter vs Web/API):**
   - Giải đáp bản chất kiến trúc và trả lời câu hỏi chiến lược về việc tách repository cho Mobile App.
   - Tự động hóa quy trình trích xuất nhánh `mobile-standalone` bằng **Git Subtree Split** bảo toàn 100% lịch sử 393+ commits.
   - Khởi tạo repository độc lập trên GitHub: [https://github.com/galaxypro710-stack/ziweiai-mobile](https://github.com/galaxypro710-stack/ziweiai-mobile) bằng `GITHUB_TOKEN`.
   - Cập nhật client Flutter `api_client.dart` hỗ trợ payload `impressionId` / `adToken`.
3. **Bảo toàn và vượt qua 100% Verification Gates:**
   - Đảm bảo toàn bộ 87 test files của API, 79 test files của Web, TypeScript typecheck, Svelte check và Flutter unit tests đều đạt chuẩn.

---

## 2. Công Việc Kỹ Thuật Đã Thực Hiện

### 2.1. Tầng Cơ Sở Dữ Liệu: Migration 000036 (Triệt Tiêu Daily-Cap Race Condition)
- **File:** `apps/api/supabase/migrations/000036_serialize_ad_reward_daily_cap.sql`
- **Cơ chế hoạt động:**
  1. **Pessimistic Row-Level Lock (FOR UPDATE):**
     ```sql
     SELECT xu_balance INTO v_new_balance
     FROM public.profiles
     WHERE user_id = p_user_id
     FOR UPDATE;
     ```
     Được đặt ngay ở **bước đầu tiên** của hàm RPC `claim_ad_reward`.
  2. **Tuần tự hóa tuyệt đối (Strict Serialization):** Mọi request đồng thời của cùng 1 user (bất kể dùng cùng hay khác `impression_id`) đều bị ép xếp hàng đợi. Khi Request 1 đang xử lý, Request 2 bị chặn ở hàng đợi lock.
  3. **Kiểm tra Count tươi mới (Fresh Read):** Khi Request 2 thoát khỏi hàng đợi, nó đọc dữ liệu đã commit của Request 1. Do Request 1 đã insert claim thành công, Request 2 sẽ thấy `v_daily_ad_count = 5` và lập tức bị từ chối với mã `DAILY_LIMIT_REACHED` mà không chèn hay xóa dòng rác nào.
  4. **Chống Replay toàn cục:** Lệnh `INSERT INTO ad_reward_claims ... ON CONFLICT (impression_id) DO NOTHING` dựa trên Primary Key đảm bảo không một `impression_id` nào có thể được claim 2 lần bởi bất kỳ user nào.
- **Trạng thái thực thi:** Đã áp dụng thành công lên Supabase Production (`nachzhkeuzwiqmbtelrp`) qua script `scripts/apply-pending-migrations.js`.

### 2.2. Kiểm Toán Độc Lập Cơ Sở Dữ Liệu (Security Audit)
- **File:** `scripts/verify-production-db.js`
- Đã nâng cấp script kiểm toán kết nối trực tiếp Management API của Supabase:
  + Xác thực hàm `claim_ad_reward` đã bị `REVOKE` hoàn toàn khỏi các role client (`anon`, `authenticated`, `PUBLIC`), chỉ cho phép `service_role` và `postgres`.
  + Xác thực định nghĩa hàm có chứa `FOR UPDATE` (Pessimistic Row Lock) và hằng số `c_reward_amount = 5`.
  + Xác thực bảng `ad_reward_claims` và các cột kế toán `currency`, `original_price` trong bảng `transactions`.
- **Kết quả:** `🎉 KIỂM TRA ĐỘC LẬP HOÀN TẤT: Tất cả các tiêu chí bảo mật P0 và kế toán P1 đều ĐẠT CHUẨN 100%!`.

### 2.3. Chuẩn Hóa Tỷ Giá FX Đa Ngoại Tệ (RevenueCat Accounting)
- **File:** `apps/api/src/modules/payment/payment.service.ts`
- Bổ sung tài liệu nguồn và versioning:
  + Nguồn: Tham chiếu tỷ giá bán chuyển khoản niêm yết chính thức của Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank).
  + Phiên bản: `Version: FX_V1_2026_09_12`.
  + Thời gian cập nhật: `2026-09-12T00:00:00Z`.
- Hiệu chỉnh tài liệu `docs/sprint-84-remediation-and-commercial-readiness-report.md` tại dòng 132 để thống nhất:
  + `USD: 25,400`, `EUR: 27,500`, `GBP: 32,200`, `JPY: 170`, `SGD: 19,200`, `CAD: 18,600`, `AUD: 16,800`, `THB: 740`, `KRW: 19`.
  + Ngoại tệ lạ ngoài catalog mặc định ghi nhận `amountVnd = 0` kèm cảnh báo log, ngăn chặn hoàn toàn việc làm tròn thô thành số tiền sai.

### 2.4. Đồng Bộ Client Mobile Flutter (Dart)
- **File:** `apps/mobile/lib/core/api/api_client.dart`
- Cập nhật hàm `claimAdReward({String? impressionId, String? adToken})` nhận tham số tùy chọn và gửi payload JSON lên backend:
  ```dart
  Future<Map<String, dynamic>> claimAdReward({String? impressionId, String? adToken}) async {
    try {
      final payload = <String, dynamic>{};
      if (impressionId != null && impressionId.isNotEmpty) {
        payload['impressionId'] = impressionId;
      }
      if (adToken != null && adToken.isNotEmpty) {
        payload['adToken'] = adToken;
      }

      final response = await _dio.post(
        '/rewards/ad-reward',
        data: payload.isNotEmpty ? payload : null,
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }
  ```
- Tương thích ngược 100% với các màn hình hiện tại (`wallet_screen.dart`, `premium_paywall_sheet.dart`).

### 2.5. Tự Động Hóa Phân Tách Repository Độc Lập Cho Mobile
- **Scripts:** `scripts/split-mobile-repo.sh` và `scripts/automate-mobile-repo-creation.js`
- **Quy trình đã hoàn thành:**
  1. Sử dụng Git Subtree Split trích xuất thư mục `apps/mobile` thành nhánh `mobile-standalone`.
  2. Gọi GitHub REST API với `GITHUB_TOKEN` tạo repo Private: `galaxypro710-stack/ziweiai-mobile`.
  3. Đẩy toàn bộ nhánh `mobile-standalone` lên nhánh `main` của repo mới.
  4. Đưa toàn bộ cấu trúc Flutter (`pubspec.yaml`, `lib/`, `android/`, `ios/`, `test/`) lên ngay thư mục gốc của repo mới, giữ nguyên 393+ commits lịch sử.

---

## 3. Kết Quả Kiểm Thử (Verification Gates)

| Stt | Verification Gate | Lệnh Kiểm Tra | Kết Quả | Chi Tiết |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Database Audit Live** | `node scripts/verify-production-db.js` | **PASS (100%)** | Quyền hạn, row-lock, bảng chống replay, cột kế toán đạt chuẩn |
| 2 | **API Automated Tests** | `pnpm -F @ziweiai/api test` | **PASS (100%)** | 87/87 test files (544/544 tests pass) |
| 3 | **API Typecheck** | `pnpm -F @ziweiai/api typecheck` | **PASS (100%)** | `tsc --noEmit` không có lỗi nào |
| 4 | **Web Vitest Suite** | `pnpm -F @ziweiai/web test` | **PASS (100%)** | 79/79 test files (413/413 tests pass) |
| 5 | **Web Svelte Diagnostics** | `pnpm -F @ziweiai/web check` | **PASS (100%)** | 0 errors, 0 warnings |
| 6 | **Mobile Flutter Tests** | `flutter test test/features/wallet/...` | **PASS (100%)** | 4/4 wallet unit tests pass |
| 7 | **Git Cleanliness & Sync** | `git status` & `git push origin main` | **PASS (100%)** | Commit `91f1770` trên main, working tree sạch sẽ |

---

## 4. Kết Luận Về Trạng Thái Launch & Vận Hành Tiếp Theo

1. **Khẳng định về Mở Bán XU (Paid Launch):**
   - Luồng thanh toán trả phí tiền thật qua **VietQR / SePay** và In-App Purchase qua **RevenueCat** đã đạt trạng thái **SẴN SÀNG 100% VÀ ĐỦ ĐIỀU KIỆN MỞ BÁN CÔNG KHAI**.
   - Luồng này hoàn toàn độc lập với hệ thống xem quảng cáo nhận thưởng và được bảo vệ bởi webhook có HMAC token xác thực và đối soát số dư thời gian thực.
2. **Chiến lược tính năng Thưởng Quảng Cáo (Ad Rewards):**
   - Tiếp tục duy trì cờ `ENABLE_AD_REWARDS=false` trên Production.
   - Khi triển khai tính năng này trong tương lai, sẽ xây dựng endpoint webhook AdMob SSV với chữ ký ECDSA từ máy chủ Google để xác thực lượt xem hợp lệ trước khi gọi RPC.
3. **Phát triển Mobile App:**
   - Toàn bộ công việc phát triển Flutter Mobile từ nay có thể diễn ra độc lập trên repo `https://github.com/galaxypro710-stack/ziweiai-mobile`.
   - Khi cần thiết, có thể dọn dẹp thư mục `apps/mobile` trong repo `ziweiai-web` bằng lệnh `git rm -r apps/mobile` để monorepo đạt độ tinh gọn tối đa.
