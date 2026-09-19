# Decoupled AI provider routing via LlmExchange seam

Hệ thống cần cung cấp các bản luận giải chuyên sâu từ nhiều họ mô hình AI khác nhau (Gemini, DeepSeek, OpenAI-compatible) với các cấu hình hạn mức và thời gian phản hồi riêng biệt. Chúng tôi quyết định cô lập việc giao tiếp với mô hình AI đằng sau ranh giới `LlmExchange` và `LlmChatAdapter` kết hợp bộ định tuyến `ExplanationProviderRouter`. Quyết định này giúp dễ dàng thay thế, bổ sung nhà cung cấp mô hình mà không làm rò rỉ chi tiết kỹ thuật của SDK hoặc cấu trúc prompt vào logic nghiệp vụ của ứng dụng.
