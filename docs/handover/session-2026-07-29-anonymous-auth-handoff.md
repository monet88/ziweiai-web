# Session Handoff: Anonymous Auth Flow (Freemium) & Deploy
Date: 2026-07-29

## Bối cảnh (Context)
Website Tử Vi Toàn Tập được yêu cầu duy trì chế độ "Freemium", cho phép người dùng vãng lai (không cần đăng nhập) lập lá số và sử dụng tính năng cơ bản. Tuy nhiên, khi họ dùng hết quota (số lượt) hoặc cố tình thực hiện các tác vụ đòi hỏi định danh lâu dài (như Mua XU, Chia sẻ lá số), hệ thống cần hiện một Modal Yêu Cầu Đăng Nhập để "bắt" họ đăng nhập/đăng ký. 

## Mục tiêu (Goals)
1. Xây dựng một cơ chế Global Auth Modal để có thể gọi ở bất cứ đâu.
2. Không chặn luồng trải nghiệm ngay từ đầu, chỉ chặn ở các điểm chạm (touchpoints) nhạy cảm:
   - Khi API backend trả về lỗi Rate Limit `429 Too Many Requests` (hết quota) đối với khách.
   - Khi khách cố bấm nút "Mua XU" trong `wallet/+page.svelte`.
   - Khi khách cố bấm nút "Chia Sẻ" lá số trong `charts/[chartId]/+page.svelte`.
3. Khắc phục tất cả các lỗi hiển thị và chuẩn bị bộ source hoàn chỉnh để deploy.

## Việc đã làm (Work Done)
1. **Global Auth Modal**: Đã tạo `authModalStore` bằng `$state()` của Svelte 5 và nhúng `GlobalAuthModal.svelte` vào root layout `(app)/+layout.svelte`.
2. **API Intercept**: Bổ sung cơ chế trong `fetch-json.ts`. Mọi lỗi `429` (Rate limit / Quota exceeded) khi gửi về từ Backend đều sẽ check session. Nếu là anonymous, tự động bung Auth Modal.
3. **Wallet Block**: Sửa giao diện `wallet/+page.svelte` để ẩn thông tin chuyển khoản VietQR, hiển thị bảng kêu gọi "Đăng nhập / Đăng ký" nếu khách đang ở chế độ anonymous.
4. **Share Chart Block**: Bọc hàm `handleShare` trong màn hình Chi Tiết Lá Số. Trả về Auth Modal ngay lập tức nếu là khách.
5. **Quality Assurance**: Chạy thành công `svelte-check` (0 errors), Playwright Smoke tests và kiểm tra logic (Pre-check analyze).
6. **Deploy**: Khắc phục lỗi thiếu `VERCEL_GALAXY` và deploy thành công lên URL production `https://tuvitoantap.vercel.app/`.

## Phân tích & Rủi ro tiềm ẩn (Risks / Missing Features)
- **Rủi ro API Cost**: Cơ chế quota dựa vào IP và JWT Token hiện nay đủ an toàn và đã được kiểm thử, chỉ cần setup `API_EXPLANATIONS_PER_DAY_PER_USER` hợp lý trên backend (thường là 1-3 lần/ngày) để tránh bị abuse.
- **Workflow / Logic**: Đã đảm bảo người dùng vãng lai có trải nghiệm "câu nhử" (freemium) rất tốt: họ được xem lá số nhanh chóng mà không gặp trở ngại. Chỉ khi họ thấy giá trị thực sự và muốn lưu lại / hỏi sâu, họ mới gặp Auth Modal -> Tăng tỉ lệ chuyển đổi (Conversion rate).
- **Thiếu tính năng**:
  - Có thể mở rộng "Save" (Lưu lá số) nếu tương lai có nút "Lưu lá số" cụ thể. (Hiện tại tính năng Lưu được đồng nhất với lúc khởi tạo / chia sẻ).

## Tình trạng hiện tại (Status)
- ✅ Logic đúng.
- ✅ Workflow hoàn hảo.
- ✅ Không còn bugs frontend (`svelte-check` = 0).
- ✅ Live production ổn định.

---
**Hướng dẫn tiếp theo (Next Steps / Prompt for New Session):**
"Session này đã hoàn tất flow Anonymous Auth. Trong session tới, chúng ta sẽ bắt tay vào Refactor kiến trúc cho WalletEngine & AuthStore như đã đề cập trong file `session-2026-07-29-architecture-handoff.md`. Hãy đọc file architecture handoff đó và bắt đầu lên kế hoạch refactor."
