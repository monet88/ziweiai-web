# ViOS — Báo Cáo Tổng Hợp Sprint 64 & Kế Hoạch Chuyển Giao Sprint 65

**Thời gian thực hiện**: 11/09/2026  
**Hệ thống**: ViOS — Tử Vi Toàn Tập (`ziweiai-web`)  
**Môi trường**: SvelteKit 5 (Frontend) + NestJS (Backend) + Flutter (Mobile) + Supabase + Vercel Serverless  
**Production URL**: `https://tuvitoantap.vercel.app`  
**Git Commit HEAD**: `f8b6e44` (Branch: `main`)

---

## I. Mục Tiêu Sprint 64

1. **Khắc phục triệt để sự cố đứt gãy SSE Streaming (AI Assistant & Explanation)**:
   - Khi mạng lag, chập chờn hoặc server proxy ngắt kết nối tạm thời, hệ thống không được crash hay xóa mất tin nhắn của người dùng.
   - Cung cấp cơ chế tự động thử lại (Exponential Backoff Auto-Reconnect) trước khi token đầu tiên phát ra.
   - Khi đứt luồng giữa chừng (mid-stream recovery), đồng bộ nội dung đầy đủ từ cơ sở dữ liệu/API backend về giao diện thay vì báo lỗi mất trắng.
2. **Mở rộng Poster Hoàng Gia (Royal Poster Retina Export)**:
   - Sau khi Sprint 63 hoàn thiện xuất Poster Tử Vi hoàng gia độ phân giải cao 780px cố định, Sprint 64 mở rộng tính năng này sang 3 hệ thuật số chính còn lại:
     - **Gieo Quẻ Lục Hào Dịch Số** (`/liuyao` và `/charts/[id]`).
     - **Rút Bài Tarot Huyền Bí** (`/tarot`).
     - **Thần Số Học Pythagoras** (`/numerology`).
   - Đảm bảo toàn bộ Poster có dấu triện đỏ Khâm Thiên Giám, mã bảo chứng bảo mật, hoa văn hoàng cung và hỗ trợ tải trực tiếp ảnh PNG Retina sắc nét.

---

## II. Các Công Việc Đã Triển Khai (Chi Tiết Codebase)

### 1. Phía Web API Client (`apps/web`)
- **File**: `apps/web/src/lib/api-client/conversations.ts`
  - Định nghĩa interface `StreamRetryOptions` (hỗ trợ `maxRetries`, `initialDelayMs`, `backoffFactor`).
  - Cập nhật cả `streamExplanation` và `streamConversationMessage`:
    - Tự động bắt lỗi HTTP 5xx / Network Error trước khi nhận token đầu tiên để thử lại với độ trễ nhân đôi (ví dụ: 600ms -> 1200ms -> 2400ms).
    - Hỗ trợ `AbortSignal` để dừng ngay khi người dùng hủy bỏ, không retry vô cớ.
    - Xây dựng cơ chế **Mid-Stream Recovery**: Nếu luồng stream đã nhận được ít nhất 1 chunk (`receivedAnyChunk = true`) nhưng bị đứt kết nối đột ngột, client sẽ tự động gọi `fetchConversationDetail(conversationId)` để lấy nội dung trọn vẹn đã được lưu trên backend và render hoàn chỉnh cho người dùng.
- **File**: `apps/web/src/lib/api-client/conversations-stream-resilience.test.ts`
  - Viết 3 bộ test tự động kiểm chứng:
    1. Retry thành công khi gặp lỗi 502/503 ban đầu với exponential backoff.
    2. Tôn trọng AbortSignal khi người dùng ngắt.
    3. Tự động phục hồi nội dung qua `fetchConversationDetail` khi stream đứt giữa chừng.

### 2. Phía State Model (`apps/web/src/lib/features/assistant`)
- **File**: `apps/web/src/lib/features/assistant/assistant-model.svelte.ts`
  - Sửa đổi hàm xử lý lỗi `sendMessage`: Nếu stream bị đứt nhưng nội dung câu trả lời đã nhận được một phần (`last.content.trim().length > 0`), tuyệt đối **không xóa tin nhắn** của người dùng và câu trả lời dở dang. Giữ nguyên nội dung, tắt cờ `isStreaming = false` và hiển thị thông báo nhẹ nhàng để người dùng đọc tiếp hoặc hỏi lại.
- **File**: `apps/web/src/lib/features/assistant/assistant-model.svelte.test.ts`
  - Bổ sung test case kiểm tra hành vi không rollback khi stream đứt.

### 3. Phía Poster Export Hoàng Gia (`apps/web/src/lib/features/poster`)
- **File**: `apps/web/src/lib/features/poster/royal-poster-exporter.ts`
  - Bổ sung hàm tiện ích `formatDivinationPosterFileName(system, title)` chuẩn hóa tên file tải về dạng `vi-os-luc-hao-*.png`, `vi-os-tarot-*.png`, `vi-os-than-so-hoc-*.png`.
  - Bổ sung unit test trong `royal-poster-exporter.test.ts`.
- **File Mới**: `apps/web/src/lib/features/poster/RoyalLiuyaoPosterModal.svelte`
  - Modal xuất ảnh Quẻ Lục Hào: Khổ 780px cố định, render Quẻ Gốc & Quẻ Biến, 6 Hào Âm/Dương chi tiết, Hào Động, Lục Thân, Lục Thần, Thế/Ứng, Triện đỏ Khâm Thiên Giám và mã bảo chứng.
- **File Mới**: `apps/web/src/lib/features/poster/RoyalTarotPosterModal.svelte`
  - Modal xuất ảnh Tarot: Khổ 780px cố định, hiển thị trực quan các lá bài đã rút, xoay 180° đối với lá bài Đảo Ngược (Reversed), thông điệp vũ trụ, Triện đỏ và mã bảo chứng.
- **File Mới**: `apps/web/src/lib/features/poster/RoyalNumerologyPosterModal.svelte`
  - Modal xuất ảnh Thần Số Học: Khổ 780px cố định, 4 Con số Cốt Lõi (Đường Đời, Sứ Mệnh, Linh Hồn, Nhân Cách), Kim Tự Tháp 4 Đỉnh Cao Cuộc Đời, Triện đỏ và mã bảo chứng.

### 4. Tích Hợp UI Màn Hình
- **`apps/web/src/lib/features/chart/ChartDetailScreen.svelte`**: Nhận diện snapshot dạng Lục Hào để mở `RoyalLiuyaoPosterModal`.
- **`apps/web/src/lib/features/tarot/TarotScreen.svelte`**: Thêm nút "Xuất Poster" mở `RoyalTarotPosterModal`.
- **`apps/web/src/lib/features/numerology/NumerologyScreen.svelte`**: Thêm nút "Xuất Poster" mở `RoyalNumerologyPosterModal`.

---

## III. Kết Quả Kiểm Chứng & Báo Cáo Chất Lượng (Verification Gates)

Toàn bộ các verification gates bắt buộc của repo đã được thực thi và đạt 100%:
1. **Svelte Check**: `pnpm -F @ziweiai/web check` ➔ **0 errors, 0 warnings** (87 files).
2. **Web Tests**: `pnpm -F @ziweiai/web test` ➔ **334/334 tests passed** (62 files).
3. **API Tests**: `pnpm -F @ziweiai/api test` ➔ **520/520 tests passed** (84 files).
4. **Tổng số Unit Tests Workspace**: **854/854 tests passed** (tăng thêm 7 tests mới cho Sprint 64).
5. **Linting**: `pnpm lint` ➔ **0 errors, 0 warnings** toàn bộ workspace.
6. **Typecheck**: `pnpm typecheck` ➔ **10/10 tasks successful**.
7. **Production Build**: `pnpm exec turbo run build --force` ➔ **6/6 packages built thành công** (15.4s).
8. **E2E Playwright Smoke**: `pnpm -F @ziweiai/web exec playwright test smoke.spec.ts --workers=1` ➔ **1/1 passed** (16.7s).
9. **Flutter Mobile Analysis**: `flutter analyze apps/mobile` ➔ **No issues found** (0 warnings, 0 errors).
10. **Production Deployment**: Deploy thành công lên `https://tuvitoantap.vercel.app`.
11. **Live Smoke Test**:
    - `GET https://tuvitoantap.vercel.app/api/health` ➔ `{"service":"ziweiai-api","status":"ok","version":"0.1.0"}`
    - `GET https://tuvitoantap.vercel.app/api/features` ➔ Toàn bộ 10 phân hệ hoạt động bình thường.

---

## IV. Kiểm Tra Git & Quản Lý Mã Nguồn

- Đã tạo branch: `feature/sprint-64-sse-reconnect-and-divination-export`.
- Đã commit với chuẩn conventional commit: `feat(sprint-64): sse stream resilience with exponential backoff and divination poster exports`.
- Đã merge an toàn vào `main`: `merge(sprint-64): sse stream resilience and divination poster exports`.
- Đã push toàn bộ lên remote:
  - `origin/main` (đồng bộ tại `f8b6e44`)
  - `origin/feature/sprint-64-sse-reconnect-and-divination-export`
- Trạng thái Git working tree: **Sạch sẽ 100%** (`working tree clean`).

---

## V. Kế Hoạch Hành Động Tiếp Theo: Bàn Giao Sang SPRINT 65

### 1. Trạng Thái Hiện Tại
- **Sprint Vừa Hoàn Thành**: **Sprint 64** (SSE Stream Resilience & Divination Poster Export).
- **Sprint Tiếp Theo**: **Sprint 65**.
- **Phase Tổng Thể**: **Phase 12-18 Hardening & Royal Polish** (Giai đoạn hoàn thiện trải nghiệm hoàng cung đa phương thức và độ tin cậy thời gian thực).

### 2. Các Hạng Mục Đề Xuất Cho Sprint 65
1. **Speech-to-Text & Royal Voice Chat (Đàm Đạo Bằng Giọng Nói)**:
   - Tích hợp Web Speech API vào Khâm Thiên Giám (`AssistantPanel.svelte`) cho phép người dùng bấm giữ micro để đặt câu hỏi bằng tiếng Việt thay vì phải gõ văn bản.
2. **Xuất Báo Cáo Luận Giải Toàn Tập Dạng PDF Hoàng Cung (Deluxe PDF Report)**:
   - Ngoài Poster ảnh Retina PNG tóm tắt nhanh, cho phép xuất toàn bộ văn bản luận giải AI + lịch sử hỏi đáp thành file PDF nhiều trang có ngự bút trang nhã, phân trang rõ ràng để lưu trữ hoặc in ấn.
3. **Thanh Đồng Hồ Can Chi Realtime (Imperial Horary Widget)**:
   - Hiển thị thời gian thực theo Can Chi (Giờ, Ngày, Tháng, Năm), Trực, Sao Chiếu Mệnh và Giờ Hoàng Đạo trên Header Bar giúp người dùng biết ngay thời điểm tốt để gieo quẻ hay xuất hành.

---

## VI. Prompt Bàn Giao Khởi Động Session Mới (Copy & Paste)

Đại Ka chỉ cần copy đoạn prompt chuẩn dưới đây để dán vào session mới:

```markdown
Chào em, tiếp tục dự án ViOS — Tử Vi Toàn Tập (ziweiai-web).

Chúng ta đã HOÀN THÀNH 100% SPRINT 64 & DEPLOY PRODUCTION THÀNH CÔNG:
1. SSE Stream Resilience & Auto-Reconnect: Đã hoàn thiện thuật toán Exponential Backoff tự động retry khi mạng chập chờn và Mid-Stream Recovery qua fetchConversationDetail khi stream bị đứt giữa chừng; bảo toàn nguyên vẹn tin nhắn người dùng và câu trả lời dở dang trong assistant-model.
2. Divination Royal Poster Export: Đã hoàn thiện xuất ảnh poster chuẩn hoàng triều ngọc bảo Retina High-DPI 780px cho cả 3 hệ thuật số: Gieo Quẻ Lục Hào, Rút Bài Tarot, và Thần Số Học Pythagoras với triện đỏ Khâm Thiên Giám và mã bảo chứng.
3. Toàn bộ verification gates đều đạt chuẩn 100%:
   - Svelte check: 0 errors, 0 warnings
   - Web tests: 334/334 passed
   - API tests: 520/520 passed (Tổng 854 unit tests)
   - Lint & Typecheck: 0 errors, 10/10 tasks pass
   - Turbo build: 6/6 packages built thành công
   - Playwright smoke test: 1/1 passed
   - Flutter mobile analyze: No issues found
   - Production Live URL (tuvitoantap.vercel.app): Health & Features 200 OK
   - Git working tree sạch 100%, branch main và branch feature/sprint-64-sse-reconnect-and-divination-export đã được push lên GitHub.

BÂY GIỜ CHÚNG TA BẮT ĐẦU SPRINT 65 (Phase: Hardening & Royal Polish).
Mục tiêu Sprint 65:
1. Tạo branch mới `feature/sprint-65-voice-input-and-pdf-report` từ `main`.
2. Speech-to-Text Royal Voice Input: Tích hợp Web Speech API vào Khâm Thiên Giám (AssistantPanel) để người dùng có thể đàm đạo bằng giọng nói tiếng Việt với AI.
3. Royal Dossier PDF Export: Hoàn thiện tính năng xuất toàn bộ bài luận giải AI ra file PDF chuẩn ngự bút hoàng cung đa trang.
4. Chạy đầy đủ verification gates, commit code, deploy Vercel demo và live smoke test.

Tuân thủ nghiêm ngặt Karpathy Guidelines, luôn gọi tôi là "Đại Ka", trả lời bằng tiếng Việt, thuật ngữ chuyên môn dùng English. Hãy lập Implementation Plan chi tiết cho Sprint 65 trước khi code!
```
