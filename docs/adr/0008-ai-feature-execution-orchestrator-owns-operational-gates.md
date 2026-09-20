# AI feature execution operational gates belong to the orchestrator

Các tính năng Luận Giải AI có cùng chu trình vận hành gồm kiểm tra Hạn Mức Sử Dụng, trừ XU, gọi provider và chuyển sang bản dự phòng khi provider timeout hoặc unavailable. Chúng tôi quyết định "AiFeatureExecutionOrchestrator" là module sở hữu duy nhất chu trình này; các module nghiệp vụ như Tarot, Lenormand, Xin Xăm và Tiểu Lục Nhâm chỉ giữ feature flag, validation đầu vào, thao tác chiêm đoán, prompt và nội dung fallback đặc thù, thay vì tự kết nối trực tiếp lại với Quotas, Wallet và provider routing.
