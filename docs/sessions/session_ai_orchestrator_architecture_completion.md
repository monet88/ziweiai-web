# Hoàn thành: Tái Cấu Trúc Kiến Trúc AI Feature Execution

## Mục Tiêu (Goal)
Khởi tạo một lớp **`AiFeatureExecutionOrchestrator`** (seam sâu) để gom toàn bộ quy trình: Kiểm tra Quota, Trừ XU (Wallet) và Xử lý lỗi Fallback. Đưa các Domain Services (`DrawsTarotService`, `NumerologyService`) trở thành các thin layer đóng gói prompt và callback fallback, phó thác việc tính toán chi phí, trừ tiền, giới hạn gọi API cho Orchestrator này.

## Phân Tích Logic & Workflow 
1. **AiFeatureExecutionOrchestrator**:
   - Nằm tại `apps/api/src/providers/ai/ai-feature-execution.orchestrator.ts`.
   - Cung cấp interface `AiFeatureExecutionOptions` yêu cầu cấu hình rõ ràng cho từng tính năng: số lượng XU (`cost`), thông báo lỗi khi không đủ tiền, cấu hình quota limit (`quotaFeatureKey`), và thông báo khi vượt quota.
   - Inject `QuotasService`, `WalletEngineService`, và `ExplanationProviderRouter`.
   - **Xử lý Auth (Identity/Anon)**: Truyền đúng biến `isAnonymous` và `userId` để đảm bảo cơ chế quota ẩn danh tiếp tục hoạt động trơn tru.

2. **Refactor DrawsTarotService**:
   - Đã gỡ bỏ toàn bộ code dư thừa (boilerplate) về kiểm tra Wallet và Quota.
   - Vẫn giữ nguyên logic nghiệp vụ (domain logic) kiểm tra flag `apiEnv.EXTENDED_SYSTEM_TAROT_ENABLED` và kiểm tra `question` rỗng.
   - Bọc fallback an toàn qua `generateFallback` (với nội dung trả về template Tarot tĩnh) khi AI sập.
   
3. **Refactor NumerologyService**:
   - Thực hiện tách tương tự với cấu hình giá 10 XU, truyền vào Prompt về Thần Số Học Pythagoras.
   
4. **Dọn dẹp Modules & Tests**:
   - `AiProvidersModule` được cập nhật để cung cấp orchestrator. 
   - `QuotasModule` và `WalletModule` được rút gọn khỏi `DrawsTarotModule` và `NumerologyModule`.
   - File test `draws-tarot.service.test.ts` đã được chỉnh sửa để instantiate Orchestrator thay vì mock các service con, đảm bảo coverage 100% không suy giảm.

## Rủi ro Tiềm Ẩn (Đã rà soát & khắc phục)
- **Truyền sai `isAnonymous`**: Token ẩn danh có thể có `email: ""`. Đã sử dụng check `!user.email` truyền vào orchestrator, đảm bảo an toàn như cũ.
- **Circular Dependency**: Đặt file orchestrator tại `providers/ai` và cập nhật imports đúng phân lớp, tránh vòng lặp module.
- **Fail Tests Do Đổi Constructor**: Thay vì đập bỏ các test liên quan đến quota/wallet trong service, tôi đã khởi tạo thực tế orchestrator ngay trong bài test để bảo lưu cấu trúc kiểm thử nguyên bản của hệ thống.

## Kết Quả
- Chạy thành công toàn bộ `pnpm -F @ziweiai/api build`.
- Pass 429/429 tests (Gate Passed).
- Codebase đã được decoupling triệt để: mảng Business (Tarot, Numerology) tách bạch hoàn toàn mảng Infrastructure (Wallet, Quota, AI Providers).
