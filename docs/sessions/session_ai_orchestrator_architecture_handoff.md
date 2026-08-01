# Handoff: Tái Cấu Trúc Kiến Trúc AI Feature Execution

## Mục Tiêu (Goal)
- **Tình trạng hiện tại:** Các tính năng trả phí gọi AI (như Tarot, Numerology) đang lặp lại toàn bộ quy trình boilerplate: Kiểm tra Quota -> Kiểm tra/Trừ XU (Wallet) -> Gọi ProviderRouter -> Xử lý lỗi Fallback. Điều này tạo ra "shallow modules", khiến logic kinh doanh bị trộn lẫn với logic hạ tầng thanh toán/AI, rủi ro cao nếu có thay đổi về quy trình trừ tiền.
- **Mục tiêu phiên tới:** Khởi tạo một lớp **`AiFeatureExecutionOrchestrator`** (seam sâu) để gom toàn bộ quy trình trên lại. Các Domain Services (`DrawsTarotService`, `NumerologyService`) chỉ cần đóng gói prompt và callback fallback, phó thác việc tính toán chi phí, trừ tiền, giới hạn gọi API cho Orchestrator này.

## Quyết định của CEO/PM
Với tư cách là CEO/PM, tôi chọn giải pháp **Deepen the AI Feature Execution Seam**.
**Lý do:**
1. **Đòn bẩy (Leverage) cao nhất:** Việc tập trung logic trừ tiền (Wallet) và Quota vào một nơi duy nhất bảo vệ doanh thu cốt lõi của ứng dụng. Nếu sau này ta muốn thêm tính năng hoàn tiền khi AI lỗi, ta chỉ sửa ở một chỗ.
2. **Tính cục bộ (Locality) tuyệt vời:** Backend services sẽ trở thành các module siêu mỏng (thin layers) tập trung đúng vào chuyên môn (như sinh lá bài, tính toán con số), tách bạch hoàn toàn với hạ tầng AI và Payment.

## Công Việc Cần Làm (Next Session)
1. **Bước 1:** Khởi tạo `AiFeatureExecutionOrchestrator` (nằm trong `providers/ai` hoặc một shared module). Lớp này nhận vào các tham số: `FeatureKey`, `PromptPayload`, `Cost` và một hàm `FallbackGenerator`.
2. **Bước 2:** Di chuyển logic `assertPremiumEntitlement`, `assertCanCreate...`, và khối try/catch gọi AI từ `DrawsTarotService` vào Orchestrator.
3. **Bước 3:** Sửa đổi `DrawsTarotService` để sử dụng Orchestrator.
4. **Bước 4:** Sửa đổi `NumerologyService` để sử dụng Orchestrator.
5. **Bước 5:** Chạy tất cả test và gate (`pnpm -F @ziweiai/api build`, `pnpm test`) để đảm bảo không gãy luồng kinh doanh.

## Kết quả của Session Này
- Phân tích mã nguồn dựa trên commit history (`/improve-codebase-architecture`).
- Tạo thành công báo cáo HTML so sánh 3 ứng viên tái cấu trúc.
- Chốt phương án tốt nhất, thiết kế bản nháp kiến trúc mới.
- Lưu lại bối cảnh để tiếp tục triển khai vào phiên làm việc sau.
