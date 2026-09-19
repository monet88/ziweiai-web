# Handover: AI Assistant & SSE Streaming (Mobile App)

**Thời gian hoàn thành**: 19/07/2026
**Mục tiêu Session**: Tích hợp tính năng AI Assistant giải đoán (chat bot) vào ứng dụng Flutter (Mobile App), đặc biệt là xây dựng cơ chế parser Server-Sent Events (SSE) thủ công để hỗ trợ luồng stream text mượt mà giống như trên Web.

---

## 1. Việc đã làm (Công việc chi tiết)

### 1.1 Khởi tạo Models & Repository
- **File**: `lib/features/assistant/data/models/conversation_models.dart` & `lib/features/assistant/data/repositories/conversations_repository.dart`
- **Nội dung**: 
  - Tạo các DTO (`CreateConversationMessageRequest`, `ConversationEvent`, v.v.) sử dụng chung format với Backend API (`/api/conversations`).
  - Viết logic gọi POST API `/conversations` để khởi tạo hội thoại gắn với một lá số/quẻ (`chartSnapshotId`).

### 1.2 Viết Stream Parser (SSE Transformer)
- **File**: `lib/core/api/sse_transformer.dart`
- **Nội dung**:
  - Vì package `Dio` không mặc định hỗ trợ bóc tách chunks SSE theo cấu trúc `\n\n`, đã viết một custom `StreamTransformer` để lắng nghe bytes từ `ResponseBody.stream`.
  - Handle triệt để các trường hợp: chunk bị cắt nửa, các frames `keepalive` (ping) trống từ Vercel, và chỉ extract payload phía sau tiền tố `data: `.

### 1.3 Quản lý State (Riverpod)
- **File**: `lib/features/assistant/presentation/assistant_provider.dart`
- **Nội dung**:
  - Dùng standard `Notifier` của Riverpod 3 thay thế cho `StateNotifierProvider` (đã bị loại bỏ trong v3).
  - Khởi tạo provider `assistantProvider` có hàm `.init(chartSnapshotId)` để mount state mỗi lần user mở Panel của một lá số mới.
  - Áp dụng kỹ thuật Optimistic Update: chèn trước placeholder rỗng cho tin nhắn AI, sau đó map Stream từ Repository cập nhật liên tục vào phần text đang stream.
  - Bắt lỗi HTTP trong `catch`, có cơ chế rollback (xóa tin nhắn dở dang) nếu có sự cố kết nối.

### 1.4 Thiết kế UI Giao diện
- **File**: `lib/features/assistant/presentation/assistant_panel.dart` & `lib/features/charts/presentation/chart_detail_screen.dart`
- **Nội dung**:
  - Thêm `FloatingActionButton` "Hỏi AI" trên `ChartDetailScreen`.
  - Bấm vào mở BottomSheet với layout Chat UI: hiển thị lịch sử trao đổi, hỗ trợ `ListView` cho danh sách tin, và một thanh TextField bên dưới cùng.
  - Hỗ trợ các nút Quick Prompts (Tình duyên, Sự nghiệp, Vận hạn...).

### 1.5 Validation & Hardening
- Chạy toàn bộ `flutter analyze`: **0 errors**.
- Viết Unit Test: `test/features/assistant/data/sse_transformer_test.dart` -> **100% Passed**. Đảm bảo parser SSE hoạt động chuẩn xác với mọi loại input giả lập.
- Catch toàn bộ lỗi `DioException` (kể cả mã lỗi 402 Hết XU), tự động báo Snackbar lỗi ra ngoài UI.

---

## 2. Pre-check Tổng Thể & Rủi Ro Tiềm Ẩn (Risks)

### Logic & Workflow
- **Logic**: Đã hoạt động chính xác. App sẽ gửi `providerPreference: auto`, nhận trả về các event stream.
- **Workflow**: Mở lá số -> Mở Panel -> Bấm Quick Prompt hoặc Gõ -> Đợi AI trả lời -> Xong. (Workflow tương đương 100% Web App).
- **Trạng thái**: DONE. Sẵn sàng tích hợp luồng Authentication & Monetization.

### Rủi ro tiềm ẩn
1. **Thiếu Auto-scroll trong Chat**: Hiện tại UI chỉ là `ListView.builder`. Nếu đoạn text quá dài, nó không tự cuộn xuống dòng cuối cùng trong lúc stream. Cần cài đặt `ScrollController` và animation scrollToBottom ở các chặng sau nếu muốn UX polish tốt hơn.
2. **Quản lý Auth Token (Supabase)**: Code đã setup `ApiClient` tự đính kèm `Bearer token` nếu user đã login. Tuy nhiên, luồng Login UI trên Mobile vẫn chưa hoàn chỉnh (đang được đánh dấu là TODO trong chặng 1). Phải test luồng Anonymous vs Signed-in cẩn thận trước khi release.
3. **Markdown Rendering**: Ứng dụng Web đang parse markdown từ AI (chữ in đậm, bullet points). Trên Mobile, hiện tại ta chỉ nhét raw string vào widget `Text`. Text sẽ hiển thị raw markdown (ví dụ: `**Nội dung**`). Ở các chặng sau, nên cài thêm package `flutter_markdown` để hiển thị đẹp hơn.

---

## 3. Đề xuất Handoff (Prompt cho Session mới)

Chặng AI Streaming cơ bản đã hoàn tất. Bạn có thể chép đoạn Prompt dưới đây cho Session tiếp theo (hoặc paste trực tiếp cho một agent mới) để bắt tay vào phần kế tiếp:

```text
Tiếp tục dự án Tử Vi Toàn Tập (Mobile App Flutter). Ở session trước, chúng ta đã hoàn thành tính năng AI Explanation (với cơ chế SSE Streaming). 
Mục tiêu session này:
1. Fix nốt UX cơ bản cho Chat (Tích hợp package flutter_markdown để render text AI trả về, và tự động cuộn scroll xuống cuối khi có text mới).
2. Tích hợp Auth UI trên Mobile (Login / Register / Anonymous login với Supabase) để đồng bộ hoàn toàn tài khoản người dùng như trên Web.
3. Bắt đầu làm tính năng Monetization (Ví XU) trên Mobile, chuẩn bị layout để mua in-app.
Hãy đọc docs/handovers/session_ai_sse_mobile.md và file task.md trước khi bắt tay vào code!
```
