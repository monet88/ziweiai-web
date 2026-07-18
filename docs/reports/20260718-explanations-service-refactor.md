# Báo Cáo Cấu Trúc Lại (Refactor) ExplanationsService

**Ngày thực hiện:** 2026-07-18
**Người thực hiện:** Antigravity Agent & CEO/PM

## 1. Mục Tiêu (Goals)

- **Kiến trúc:** Phân tách "God Class" `ExplanationsService` (vốn đang ôm đồm quá nhiều trách nhiệm từ kiểm tra quota, kiểm tra tính hợp lệ của snapshot, xử lý race condition, cho đến việc gọi AI) thành các Service nhỏ gọn, đơn nhiệm (Single Responsibility Principle).
- **An toàn & Mở rộng:** Tạo ra một kiến trúc vững chắc hơn để sau này dễ dàng tích hợp thêm các loại hình luận giải khác (như bài Tarot, Tử vi phương Tây) mà không lo phá hỏng tính logic chống "Race Condition" rất phức tạp hiện tại.
- **Bảo mật & Quản lý:** Đồng bộ và gom nhóm môi trường (Vercel và GitHub) về cùng một tổ chức `galaxypro710-stack`, làm sạch các file `.env` rác, đảm bảo Gitignore hoạt động hiệu quả.

## 2. Công Việc Đã Thực Hiện (Work Done)

### 2.1. Quản lý Môi Trường & Mã Nguồn
- **GitHub Transfer:** Chuyển quyền sở hữu repository từ tài khoản `ainear` sang tổ chức `galaxypro710-stack/ziweiai-web` thành công.
- **Dọn dẹp `.env`:** Gom các file môi trường không rõ ràng/không dùng đến vào thư mục `temp-envs/` để giảm rủi ro bảo mật và tránh nhầm lẫn.
- **Gitignore Audit:** Xác nhận nghiêm ngặt rằng Git không theo dõi (track) các file nhạy cảm như `.env`, credentials, và các thư mục agent (`.agents`, `.claude`, `.gemini`).

### 2.2. "Phẫu Thuật" `ExplanationsService`
Thay vì để mọi logic kẹt trong một file duy nhất hơn 500 dòng, chúng tôi đã tách logic ra thành 3 domain services độc lập:

1. **`ExplanationValidatorService`**:
   - Chịu trách nhiệm kiểm tra tính hợp lệ của `chartSnapshot`.
   - Kiểm tra cung (`palaceScope`) có hợp lệ hay không.
   
2. **`ExplanationBillingService`**:
   - Tách bạch hoàn toàn logic thanh toán/quota.
   - Kiểm tra hạn mức (`Daily Quota`), số dư `XU`.
   - Chịu trách nhiệm trừ tiền (deduct) *trước* khi yêu cầu AI được gửi đi, chặn đứng việc gọi spam vượt quota.

3. **`ExplanationRaceControllerService`**:
   - Gánh vác phần kỹ thuật khó nhất: xử lý đồng thời (Concurrency) và Race Condition.
   - Bảo vệ hệ thống khỏi việc gọi AI trùng lặp bằng cách quản lý nguyên tử (atomic) `in-flight request` (P1/P2 races).
   - Kiểm tra và tái sử dụng các kết quả đang được tạo dở hoặc đã bị stale.

4. **`ExplanationsService` (Orchestrator)**:
   - Được viết lại hoàn toàn thành một "Nhạc trưởng".
   - Nhiệm vụ duy nhất giờ đây là điều phối luồng chạy (Workflow): `Validate -> Bill -> Resolve Race -> Call AI -> Bill Complete`. Mã nguồn giảm xuống còn khoảng 100 dòng rất sạch và dễ đọc.

### 2.3. Cập nhật Testing & Dependency Injection
- Cập nhật file `explanations.module.ts` để khai báo (provide) các service mới.
- Cập nhật toàn bộ Mocking và Test Suites trong `explanations.service.test.ts` để tiêm (inject) chính xác các class mới vào môi trường test.

## 3. Kết Quả (Results)

- **Testing Pass 100%:** Toàn bộ 414 test cases của `apps/api` đã pass hoàn toàn (Zero regressions).
- **Typecheck Pass 100%:** Không phát hiện bất kỳ lỗi TypeScript nào trong codebase.
- **Deployment:** Mã nguồn đã được commit an toàn (không lộ keys) với message `refactor(api): split ExplanationsService into focused domain services` và đẩy thành công lên nhánh `main` của repo `galaxypro710-stack/ziweiai-web`.
- **Sẵn sàng cho Phase 4:** Đã phân tích trạng thái của Phase 4 (Observability). Codebase đã có sẵn `@sentry/node`, `@sentry/sveltekit`, và `langfuse-node`, nhưng Vercel Production hiện vẫn đang thiếu Environment Variables. Đây sẽ là nhiệm vụ khởi động cho Session tiếp theo.

---
*Tài liệu này đóng vai trò như một biên bản nghiệm thu kỹ thuật cho quá trình tái cấu trúc luồng AI Explanations của Tử Vi Toàn Tập.*
