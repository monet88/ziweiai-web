# AI Vision & Billing Interceptor Handoff

## Tóm tắt những việc đã làm (Session 1)
- **Referral System**: Hoàn thiện tính năng giới thiệu nhận XU (cập nhật DB RPC `daily_checkin` hỗ trợ mã giới thiệu, cập nhật UI Web Client tại màn Ví XU).
- **Billing Interceptor**: Refactor triệt để cơ chế trừ XU. Chuyển logic trừ tiền khỏi tầng Service (`VisionAnalysisService`, `ChartsService`) lên thẳng tầng HTTP Controller bằng Decorator `@RequireXU(10)`. Hệ thống sẽ chặn ngay lập tức với mã lỗi `402 Payment Required` nếu không đủ tiền, loại bỏ hoàn toàn "Domain Leak".
- **AI Vision (Tarot)**: Bổ sung loại hình `tarot` vào hợp đồng dữ liệu, thiết lập endpoint `@Post('api/vision/tarot')` hỗ trợ nhận file ảnh từ client. Xây dựng prompt chuyên nghiệp `TAROT_PERSONA` tích hợp với Gemini 1.5 Flash.
- **Unit Tests**: Tất cả test bị hỏng do việc cấu trúc lại mã đã được fix. Dự án Backend đã chạy pass 100% khi typecheck và unit test.

## Tình trạng hiện tại
Hệ thống Backend (API + Contracts + Database) đã vững chắc và hoàn toàn sẵn sàng phục vụ tính năng "Xem bói qua ảnh" (Face/Palm/Tarot) với cơ chế trừ XU an toàn. Tuy nhiên, chưa có bất kỳ giao diện nào (Web/Mobile) để End-user tương tác và sử dụng tính năng này.

## Kế hoạch cho Session tiếp theo
**Mục tiêu chính:** Xây dựng giao diện (UI) Web Client bằng SvelteKit để người dùng thao tác upload ảnh và đọc kết quả phân tích.

**Chi tiết cần làm:**
1. **Giao diện Upload**: Tạo Component hỗ trợ Kéo/Thả, Chọn File (hoặc sử dụng Camera của điện thoại trên trình duyệt web). Hiển thị Preview ảnh trước khi submit.
2. **Luồng API & Loading State**: Gọi endpoint `/api/vision/<kind>`. Hiển thị Loading UI chỉn chu (rất quan trọng do độ trễ gọi AI Vision có thể lên đến 5-15s).
3. **Graceful Error Handling (402)**: Khi API trả về `402 Payment Required`, bật Modal/Dialog thông báo thân thiện và điều hướng người dùng nạp XU.
4. **Hiển thị Kết quả**: Render Markdown đẹp mắt và tích hợp vào mục Lịch Sử để xem lại sau.
