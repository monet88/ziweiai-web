# Session Handoff: Database Layer & Quotas Refactoring
Date: 2026-07-29

## Bối cảnh (Context)
Session hiện tại đã hoàn tất rực rỡ việc tái cấu trúc WalletEngine (centralize logic Webhook về PaymentService và giữ WalletEngine sạch sẽ để chuyên xử lý XU) cùng việc cải thiện AuthStore để quản lý `roles` tập trung. 
Tất cả 437 bài test của Backend đều xanh (Passed) và Typecheck thành công 100%.

Qua công cụ phân tích kiến trúc (`/improve-codebase-architecture`), chúng ta đã thống nhất 2 mục tiêu tái cấu trúc (deepening opportunities) khẩn cấp tiếp theo cần làm trong session mới.

## Mục tiêu cho Session mới (Goals)
Làm lần lượt theo thứ tự ưu tiên:

1. **Phá bỏ The God Class: `SupabasePersistenceGateway` (Ưu tiên Cao nhất)**
   - **Thực trạng**: File này đang dài gần 1,000 dòng, chứa logic database cho tất tần tật mọi module (Charts, Vision, History, Tarot, Sticks...). Điều này vi phạm nguyên tắc locality, khiến các service phải import toàn bộ Gateway đồ sộ và làm việc viết Test/Mock cực kỳ khổ sở.
   - **Giải pháp**: Áp dụng **Repository Pattern**. Tách `SupabasePersistenceGateway` thành các Repositories nhỏ gọn theo từng domain (ví dụ: `ChartsRepository`, `VisionRepository`, `HistoryRepository`). Chỉ giữ lại các thao tác database thật sự chung (cross-cutting) ở base class.
   - **Kết quả mong đợi**: Mỗi module feature chỉ inject đúng Repository của nó. Test mock ngắn gọn. Kiến trúc Database sâu (deep) và tách bạch (high locality).

2. **Khắc phục Hardcoded Rules: `QuotasService` (Ưu tiên Thứ hai)**
   - **Thực trạng**: Service này đang hardcode luật giới hạn XU trực tiếp cho từng tính năng. Khi muốn thêm tính năng mới, ta phải sửa core service này, vi phạm Open-Closed Principle.
   - **Giải pháp**: Chuyển sang **Strategy Pattern** hoặc **Rules Engine**. Cho phép các module tính năng tự định nghĩa và đăng ký luật Quota của riêng chúng (`IQuotaStrategy`).
   - **Kết quả mong đợi**: `QuotasService` trở thành một cỗ máy (engine) đánh giá luật chung chung, không cần biết tên cụ thể của từng tính năng nữa.

## Việc đã làm ở Session cũ (Done)
- Hoàn tất refactor WalletEngine & AuthStore.
- Báo cáo phân tích kiến trúc đã được xuất ra tại `docs/architecture-review-20260729.html`.
- Toàn bộ Codebase đang ở trạng thái xanh, 0 bugs.

## Gợi ý Kỹ năng (Suggested Skills cho Agent mới)
- `/tdd` hoặc `/implement`: Để tách SupabasePersistenceGateway một cách an toàn, bám sát các API tests hiện có (đảm bảo không test nào bị break).
- `/codebase-design`: Đảm bảo thiết kế seam (ranh giới) của các Repositories đạt chuẩn "Deep Module" (Interface nhỏ, Implementation phức tạp).

---
**Hướng dẫn cho Agent kế tiếp:**
Hãy bắt tay vào "Ưu tiên 1" trước: Đọc kỹ `SupabasePersistenceGateway`, phân tích các cụm method thuộc về nhóm tính năng nào, lập kế hoạch cắt nhỏ nó thành các Domain Repositories, cập nhật DI (Dependency Injection) trên từng module và sửa mock trong các file `.test.ts` tương ứng. Khi mục tiêu 1 đã xanh test, hãy sang mục tiêu 2.
