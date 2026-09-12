# Implementation Notes — Sprint 75: Advanced AI Astrological Synthesis & Enhanced Social Sharing

## 1. Unspecified & Implicit Decisions
- **Synthesis Life Path Calculation**: Sử dụng thuật toán chuẩn Pythagoras tổng các chữ số ngày tháng năm sinh dương lịch, chuẩn hóa về các số 1-9 hoặc master numbers (11, 22, 33).
- **Billing Interceptor Integration**: Sử dụng `@UseInterceptors(RequireXU(15))` trực tiếp tại `SynthesisController.generateSynthesis`. Vì vậy, trong lời gọi `AiFeatureExecutionOrchestrator.executeFeature`, chi phí `cost` được thiết lập là 0 để tránh trừ đúp 2 lần số dư của người dùng.
- **In-Memory Cache**: Để tiết kiệm tài nguyên AI và chi phí token của hệ thống, `SynthesisService` duy trì cache theo `chartId`. Các request sau cho cùng một `chartId` sẽ nhận kết quả với flag `isCached: true` và `GET /synthesis/:chartId` hoàn toàn miễn phí xem lại cho chủ sở hữu lá số.
- **Multi-Ratio Social Exporter**: Thiết lập 3 tỉ lệ chuẩn cho xuất ảnh Poster:
  - Story (9:16) — 1080x1920: tối ưu Instagram Story, TikTok, Facebook Story.
  - Square (1:1) — 1080x1080: tối ưu Facebook Feed, Zalo, Instagram Feed.
  - Portrait (3:4) — 1080x1440: tối ưu Pinterest, Web Showcase.
- **Viral Referral Loop**: Mọi liên kết chia sẻ mạng xã hội (Facebook, Zalo, Telegram, Web Share) đều tự động gắn tham số `?ref=<userId_or_shortCode>` kích hoạt cơ chế nhận thưởng cho cả người mời và người được mời.

## 2. Deviations from Specification
- Không có sự sai lệch nào so với yêu cầu cốt lõi. Cả hai module chính (Luận giải tam môn phái và Studio chia sẻ đa tỉ lệ) đều được triển khai toàn diện và tích hợp trơn tru vào `ChartDetailScreen`.

## 3. Considered Trade-offs
- **Serverless LLM Call vs Client Streaming**: Luận giải Tam Hợp yêu cầu tổng hợp sâu sắc giữa 3 trường phái học thuật cổ truyền và hiện đại nên việc trả về định dạng JSON có cấu trúc nghiêm ngặt (`AstrologicalSynthesisResponse`) thông qua Orchestrator phía backend đảm bảo an toàn, validate được kiểu dữ liệu và kiểm soát lỗi fallback tốt hơn so với stream text thô trên client.
- **HTML Canvas / DOM Rendering vs Server-side SVG**: Sử dụng engine `royal-poster-exporter.ts` với `html2canvas` giúp client render ngay lập tức với font hoàng gia và màu sắc chân thực mà không gây tải nặng cho backend serverless.

## 4. Maintenance Notes
- Khi thay đổi cấu trúc của `ChartSnapshot`, cần đồng bộ trong `synthesis-prompt.builder.ts` (lưu ý truy cập `snapshot.birth.originalInput.date` và các trường `summary`).
- Endpoint `POST /synthesis/generate` yêu cầu người dùng phải đăng nhập và có tối thiểu 15 XU.
