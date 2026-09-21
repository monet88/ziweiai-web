# Chu Văn Vương quẻ dịch sử dụng bộ dẫn xuất tất định và tích hợp qua bộ điều phối AI thống nhất

Chiêm đoán Chu Văn Vương (64 quẻ Kinh Dịch truyền thống Chu Văn Vương thần quái) cần cung cấp kết quả quẻ, thoán từ và quái tượng chuẩn xác trước khi giải mã qua trí tuệ nhân tạo. Chúng tôi quyết định:
1. Logic ánh xạ và tính toán 64 quẻ Chu Văn Vương được đặt tất định trong `@ziweiai/astro-engine` (hoặc `@ziweiai/contracts`), bảo đảm không có chữ Hán trong văn bản giao diện (tuân thủ bất biến ngôn ngữ tiếng Việt thuần túy).
2. Chu trình trừ XU, kiểm tra hạn mức và gọi AI giải quẻ sử dụng chung `AiFeatureExecutionOrchestrator` ở máy chủ (như Tarot, Lenormand, Xin Xăm), không dựng thêm router quota/wallet riêng lẻ.
3. Giao diện máy khách sử dụng `createCastingRitualLifecycle` để tái sử dụng trạng thái gieo quẻ, lật quẻ và phản hồi tức thì.
