# Session: Planning & Developing I Ching Feature (Kinh Dịch)

**Date:** 01/08/2026
**Branch:** `feat/iching-feature`
**Status:** In Progress (Planning Phase)

## 🎯 Mục Tiêu (Goal)
Khởi tạo và thiết kế tính năng Kinh Dịch (I Ching) cho ứng dụng ZiweiAI. Đảm bảo trải nghiệm (UX) cao cấp, định hình cấu trúc dữ liệu chính xác và tích hợp thanh toán (XU) khi gọi AI luận giải.

## 🛠 Việc Đã Làm (Work Done)
1. **Pre-check & QA:**
   - Thực hiện kiểm tra lỗi toàn bộ codebase (lint, typecheck, test) trước khi bắt đầu tính năng mới.
   - Sửa 4 lỗi lint (unused variables) trong `draws-tarot.service.ts`, `numerology.service.ts`, `BirthForm.svelte`, và `HistoryList.svelte`.
   - Kết quả: Đã fix 100% bugs, các lệnh `pnpm lint`, `pnpm typecheck`, `pnpm test` đều thành công (0 errors).

2. **Khởi tạo môi trường phát triển (Branching):**
   - Tạo nhánh mới `feat/iching-feature` để đảm bảo an toàn phát triển, dễ dàng backup và rollback.
   - Cập nhật file `CONTEXT.md` lưu lại trạng thái đã dọn dẹp và chuẩn bị phát triển Kinh Dịch.

3. **Thiết kế Trải nghiệm Người dùng (UX Design):**
   - Chốt phương án UX cốt lõi: Gieo xu mô phỏng 6 lần (Animation / Haptic Feedback). Đây là luồng (flow) mặc định nhằm tạo cảm giác "Premium", nghi thức (ritualistic) trước khi sử dụng hệ thống AI phân tích trả phí.
   - Luồng fallback: Có thể xem xét thêm luồng Mai Hoa (chạm nhanh) nếu cần, nhưng 2D/Animation gieo xu là trọng tâm chính.

## 📊 Cấu Trúc Dữ Liệu & Rủi Ro Tiềm Ẩn (Analysis & Risks)
**1. Cấu trúc Quẻ Kinh Dịch:**
   - Cần mô phỏng việc sinh ngẫu nhiên Âm/Dương (Tài/Xỉu) trong 6 lần để tạo 6 Hào (từ sơ hào đến thượng hào).
   - Từ 6 Hào suy ra **Quẻ Chủ** (Hiện tại) và **Quẻ Biến** (Tương lai), đồng thời xác định **Hào Động** (nếu có hào Lão Âm/Lão Dương).
   - Cần một bộ data (static dictionary/mapping) lưu trữ tên và ý nghĩa ngắn gọn của 64 Quẻ và 384 Hào để làm Data Provider hoặc đưa vào AI Grounding Context.

**2. Rủi ro tiềm ẩn (Risks):**
   - UX Animation: Việc làm hiệu ứng gieo xu trên Flutter có thể gây nặng máy, rớt frame nếu làm quá phức tạp. *Khắc phục: Dùng 2D assets chất lượng cao (Sprite/Rive) lặp lại đơn giản nhưng phối hợp mượt mà với Haptic feedback (độ rung) và âm thanh.*
   - Khối lượng dữ liệu: Cung cấp quá nhiều văn bản cổ (Hán Việt) cho AI có thể khiến AI phản hồi sai lệch hoặc khó hiểu. *Khắc phục: Grounding dữ liệu theo ngôn ngữ hiện đại, giản lược bớt Hán Nôm rườm rà. Chỉ đưa cho AI Quẻ Chủ, Hào Động và Quẻ Biến trọng tâm.*
   - Xử lý Thanh Toán (Monetization): Người dùng thoát app giữa chừng trước khi AI trả kết quả. *Khắc phục: Tái sử dụng `AiFeatureExecutionOrchestrator` đã decoupling từ tính năng Tarot.*

## ➡️ Next Steps
1. Xác nhận Bản Kế Hoạch Triển Khai (Implementation Plan) do AI đệ trình.
2. Code backend: `contracts` (schema), `modules/iching` (API, random logic, grounding).
3. Code frontend: Mobile UI (Riverpod Notifier, Animation).
