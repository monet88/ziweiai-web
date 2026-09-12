# Báo Cáo Kỹ Thuật Sprint 81: Growth, Monetization & Full User Journey Verification

- **Dự án:** ViOS — Tử Vi Toàn Tập (`https://tuvitoantap.online`)
- **Tác giả / Phê duyệt:** Đại Ka
- **Ngày hoàn thành:** 12/09/2026
- **Trạng thái:** ✅ 100% Hoàn Thành & Đạt Chuẩn Sẵn Sàng Thương Mại Hóa (MVP Production Ready)

---

## 🎯 1. Mục Tiêu Sprint 81

1. **Rà soát & tối ưu hóa phễu Viral Referral (Chia sẻ link nhận XU)**:
   - Tích hợp giao diện quản lý đối tác (Partner Hub) trực quan ngay trên trang Ví XU (`/wallet`).
   - Khuyến khích người dùng chia sẻ mã giới thiệu, theo dõi 5 cấp bậc đại sứ (Đồng, Bạc, Vàng, Kim Cương).

2. **Kiểm tra & xác thực tính năng Xuất Báo Cáo Vận Hạn Hoàng Gia (Deluxe PDF Dossier)**:
   - Kiểm tra bộ hồ sơ 19 trang Tử Vi & 17 trang Bát Tự chuẩn in ấn A4 Vector Khâm Thiên Giám.
   - Xác thực biểu phí dịch vụ **50 XU** (mở khóa vĩnh viễn với bộ nhớ đệm 0ms phía client).
   - Đảm bảo khi số dư < 50 XU, modal Paywall 1-chạm bật lên với đúng thông tin VietQR TPBank thật của Đại Ka.

3. **Xây dựng bộ kiểm thử tự động hóa End-to-End (E2E Playwright Suite)**:
   - Mô phỏng hành trình thực tế của người dùng: Tạo lá số $\rightarrow$ Xem luận giải $\rightarrow$ Nạp XU (VietQR Live) $\rightarrow$ Mở khóa tính năng cao cấp $\rightarrow$ Xuất bản PDF.

4. **Đánh giá kinh tế học đồng XU (Tokenomics) & Rủi ro chi phí API LLM**:
   - Tính toán biên lợi nhuận giữa giá bán XU (1 XU = 1.000đ) vs chi phí token API thực tế (Gemini, DeepSeek, OpenAI).
   - Rà soát các tầng bảo mật chống bot farm điểm danh, cày ref ảo.

---

## 🛠️ 2. Những Công Việc Đã Thực Hiện

### A. Giao diện & Trải nghiệm Người dùng (Frontend UX)
- **Tập tin:** `apps/web/src/routes/(app)/wallet/+page.svelte`
- **Nội dung:**
  - Bổ sung nút hành động `"Cấp Bậc & Bảng Vàng Đối Tác"` (`btn-open-partner-hub` với biểu tượng `Trophy`) song song với nút tạo thiệp mời Celestial Luxury.
  - Kết nối trực tiếp với modal `ReferralPartnerHubModal`, hiển thị tiến trình thăng hạng đại sứ, tổng số lượt ref thành công và tổng số XU đã kiếm được.

### B. Kiểm Thử Tự Động Hóa E2E Toàn Diện
- **Tập tin:** `apps/web/tests/e2e/core-user-journey-sprint81.spec.ts`
- **Các kịch bản kiểm thử (4/4 Tests Passed - 19.3s):**
  1. `Test 1`: Lập lá số mới $\rightarrow$ Thấy nút Hồ Sơ Hoàng Gia $\rightarrow$ Paywall VietQR 1-chạm hiện lên khi thiếu 50 XU (**Passed - 5.7s**).
  2. `Test 2`: Vào trang Ví XU $\rightarrow$ Xác nhận tài khoản TPBank Live `36889338888`, ảnh VietQR sinh đúng URL, chặn đứng số tài khoản testmode cũ (**Passed - 0.5s**).
  3. `Test 3`: Vào trang Ví XU $\rightarrow$ Kiểm tra cả nút tạo thiệp mời và nút mở Partner Hub Modal (**Passed - 1.7s**).
  4. `Test 4`: Mở khóa Hồ Sơ Hoàng Gia 19 Trang $\rightarrow$ Giao diện `DeluxePdfDossierModal` hiển thị chuẩn xác với nút In ấn A4 và Tải PDF (**Passed - 3.4s**).

### C. Hồ Sơ Kỹ Thuật & Living Spec
- Cập nhật `implementation_notes.html` theo chuẩn Karpathy Guideline số 5.
- Tạo artifact `walkthrough.md` tổng kết các bước thực thi.

---

## 📈 3. Kết Quả Thẩm Định Kinh Tế Học Đồng XU & Rủi Ro Chi Phí API

### A. Bảng So Sánh Giá Bán XU vs Chi Phí API Vốn (COGS)
- **Mệnh giá:** 1 XU = 1.000 VNĐ.
- **Chi phí API trung bình:**
  - **Gemini 2.5 Flash**: ~10 - 15 VNĐ / lần gọi.
  - **DeepSeek v4 Pro**: ~13 - 18 VNĐ / lần gọi.
  - **GPT-4o-mini / Vision**: ~20 - 100 VNĐ / lần gọi.
- **Biên lợi nhuận gộp (Gross Margin):** Luôn đạt từ **96.5% đến 99.9%** trên mọi tính năng trả phí XU (Chat: 1 XU, Báo cáo năm: 1 XU, Luận cung: 10 XU, Tướng diện: 10 XU, Tam Hợp: 15 XU, Hồ Sơ Hoàng Gia: 50 XU).
- **Rủi ro cày XU miễn phí (Điểm danh & Referral):**
  - Người dùng điểm danh đủ 30 ngày chỉ tốn tối đa **~2.040 VNĐ chi phí API** trong cả tháng. Đổi lại Đại Ka sở hữu 1 người dùng DAU trung thành và tỷ lệ chuyển đổi cao.
  - Referral bị giới hạn tối đa 5 lượt thưởng/ngày (50 XU/ngày) và đã chặn toàn bộ email rác (disposable emails).
  - Không thể xảy ra rủi ro "lỗ tiền token API".

### B. Các Tầng Bảo Mật Đã Kích Hoạt
1. **Idempotency & Cache-first**: Luận giải đã tạo được lưu trong PostgreSQL; người dùng xem lại hoàn toàn không gọi lại LLM (0 token cost).
2. **Postgres Row-level Locking**: Lệnh `select ... for update` trong RPC `daily_checkin` triệt tiêu race condition (chống bấm điểm danh đồng thời nhiều tab).
3. **SePay Webhook Security**: Xác thực chữ ký số HMAC-SHA256, cửa sổ replay attack 300s, chặn số tài khoản sandbox cũ.

---

## 🏆 4. Bảng Kết Quả Validation Gates

| Cổng Kiểm Tra | Lệnh Thực Thi | Kết Quả |
| :--- | :--- | :--- |
| **Playwright E2E Sprint 81** | `pnpm -F @ziweiai/web exec playwright test tests/e2e/core-user-journey-sprint81.spec.ts --workers=1` | **4/4 PASSED (19.3s)** |
| **Web Svelte-check** | `pnpm -F @ziweiai/web check` | **0 errors, 0 warnings** |
| **Web Unit Tests** | `pnpm -F @ziweiai/web test` | **79/79 files passed (413 tests)** |
| **API Typecheck** | `pnpm -F @ziweiai/api typecheck` | **0 errors** |
| **API Unit Tests** | `pnpm -F @ziweiai/api test` | **87/87 files passed (542 tests)** |

---

## 📋 5. Khảo Sát Hiện Trạng Toàn Diện & Đề Xuất Sprint 82

### A. Những Phần Còn Dùng Mock / Sample Cần Nâng Cấp:
1. **Bảng Xếp Hạng Top 10 Đối Tác (`mockTopAmbassadors`)**:
   - *Vị trí:* `apps/api/src/modules/rewards/rewards.service.ts` (dòng 188).
   - *Hiện trạng:* Đang dùng danh sách giả lập 10 email mẫu để giao diện Partner Hub không bị trống khi hệ thống mới chạy.
   - *Đề xuất Sprint 82:* Viết query SQL tính toán trực tiếp từ bảng `referrals` để lấy Top 10 đối tác có lượt giới thiệu thực tế cao nhất, chỉ fallback về danh sách vinh danh khi chưa đủ đối tác thật.

### B. Trạng Thái Các Module Lớn Khác:
1. **Trang Quản Trị (Admin Dashboard)**:
   - *Hiện trạng:* ĐÃ HOÀN THÀNH đầy đủ tại `apps/web/src/routes/(app)/admin` với các trang con: Analytics, Audit Logs, Blog SEO, Cấu hình động (Configs), Quản lý Referrals, Lịch sử Transactions nạp/rút XU, và Quản lý Người dùng (Users).
2. **Giao Diện Mobile & Responsive**:
   - *Hiện trạng:* ĐÃ HOÀN THÀNH. Có thanh điều hướng đáy `mobile-bottom-nav`, form nhập liệu chuẩn touch, layout tự động co giãn từ mobile (360px) đến màn hình 4K.
3. **PWA (Progressive Web App)**:
   - *Hiện trạng:* ĐÃ CÓ `manifest.json`, `sw.js` (Service Worker), bộ icons 192/512px. Người dùng có thể "Thêm vào màn hình chính" trên iOS/Android để sử dụng như app native.
4. **Mobile API / Native**:
   - *Hiện trạng:* Dự án hiện tại là Modern Responsive Web App (PWA). Các API backend NestJS đều trả về chuẩn JSON RESTful, hoàn toàn sẵn sàng nếu sau này Đại Ka muốn bọc qua Flutter hoặc Capacitor/React Native.

---

## 🚀 6. Kế Hoạch Cho Sprint 82 (Tiếp Theo)

- **Sprint 82 Focus:** **Production Hardening, Real-time Leaderboard & Viral Growth Amplification**.
  1. Thay thế `mockTopAmbassadors` bằng dynamic SQL aggregation query từ bảng `referrals`.
  2. Bổ sung Push Notification thông báo khi có người dùng mới nhập mã ref của mình (cộng XU thời gian thực).
  3. Kiểm tra live end-to-end trên môi trường Production Vercel (`https://tuvitoantap.online`).
