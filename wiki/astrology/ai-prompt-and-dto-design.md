# Thiết kế Prompt AI và Cấu trúc DTO cho Lá số

> Sources: Reference Apps, 2024-03-01
> Raw: [ai-prompt-and-dto-architecture](../../raw/astrology/2026-06-10-ai-prompt-and-dto-architecture.md)

## Overview

Bài viết này tổng hợp kiến trúc hệ thống Prompt AI phân cấp (Hierarchical Prompt Design) và cấu trúc DTO gửi dữ liệu lá số Tử Vi / Bát Tự lên AI được tham khảo từ [taibu](file:///f:/CodeBase/ziweiai/.ref/taibu) và hiện thực tại [packages/contracts](file:///f:/CodeBase/ziweiai/packages/contracts). Thiết kế này giúp tối ưu hóa dung lượng Token, tránh làm tràn ngữ cảnh của mô hình ngôn ngữ lớn (LLM), đồng thời nâng cao độ chính xác của lời luận giải và bảo đảm an toàn thông tin.

## Thiết kế Prompt AI phân cấp (P0/P1/P2)

Để đảm bảo hiệu quả chi phí token và tốc độ phản hồi của LLM, prompt gửi cho AI được chia thành 3 lớp ưu tiên giảm dần:

### 1. Lớp P0 (Bắt buộc - Tối quan trọng)
- **Quy tắc cơ bản**: Ranh giới sử dụng dữ liệu, yêu cầu AI không tự bịa đặt thông tin khi dữ liệu lá số bị thiếu.
- **Vai trò Hệ thống (System Prompt / Persona)**: Định nghĩa nhân cách AI. Ví dụ, đối với Tử Vi:
  - Định nghĩa AI là tông sư Tử Vi Đẩu Số (am hiểu các phái Tam Hợp, Phi Tinh, Tứ Hóa...).
  - Thiết lập khung phân tích: (1) Mệnh cung định tính cách ➔ (2) Tứ Hóa định trục cuộc đời ➔ (3) Đại hạn lưu niên điệp cung định biến cố theo năm ➔ (4) Đưa ra lời khuyên.
  - Định hình phong cách trả lời: Đi thẳng vào kết luận (cát/hung), sau đó giải thích chi tiết, trích dẫn lý thuyết thuật số, ghi rõ mốc thời gian xảy ra biến cố.

### 2. Lớp P1 (Chỉ thị vận hành)
- **Phong cách diễn đạt (Expression Style)**: Tùy chọn cách nói "thẳng thắn" (direct) hoặc "uyển chuyển, nhẹ nhàng" (gentle) tùy theo thiết lập của người dùng.
- **Hợp đồng đầu ra trực quan (Visualization Contract)**: Hướng dẫn AI cách định dạng đầu ra (ví dụ: trả về JSON có cấu trúc để frontend tự vẽ biểu đồ hoặc Bento Grid, thay vì chỉ trả về văn bản thô).

### 3. Lớp P2 (Dữ liệu động)
- **Dữ liệu Lá số**: Văn bản biểu diễn lá số Tử Vi (hoặc JSON).
- **Ngữ cảnh bổ sung**: Các ghi chú sự kiện lịch sử của người dùng (断事笔记) hoặc dữ liệu từ cơ sở kiến thức (Knowledge Base) hỗ trợ giải đoán.

---

## Nguyên tắc An toàn và Đạo đức (Safety Red Lines)

Tất cả các system prompt của các nhân cách AI đều bắt buộc phải đính kèm quy tắc an toàn sau để tránh gây hoang mang cho người dùng:
1. **Không tuyệt đối hóa cát hung**: Nghiêm cấm sử dụng các cụm từ mang tính đe dọa, tiêu cực tuyệt đối (ví dụ: "chắc chắn chết", "chắc chắn ly hôn").
2. **Hướng tới nhân sinh quan tích cực**: Đưa ra giải pháp cải thiện và lời khuyên mang tính xây dựng, định hướng hành vi (xu cát tị hung).
3. **Độ tin cậy dữ liệu**: Nếu thông tin giờ sinh thiếu hoặc mâu thuẫn, AI phải trả lời "điều kiện chưa đủ để kết luận" thay vì cố tình suy đoán vô căn cứ.

---

## Cấu trúc Snapshot DTO (Zod Schema) gửi AI

Tại [chart-snapshot.ts](file:///f:/CodeBase/ziweiai/packages/contracts/src/chart/chart-snapshot.ts), lá số được chuẩn hóa thành cấu trúc JSON chặt chẽ để gửi lên AI hoặc lưu trữ cơ sở dữ liệu:

- **Hệ thống Sao (`starSchema`)**:
  - `nameKey`: Khóa kỹ thuật của sao (ví dụ: `ziwei`, `tianfu`).
  - `group`: Phân nhóm sao (`major` - Chính tinh, `minor` - Trung tinh, `adjective` - Tạp diệu).
  - `brightnessKey`: Trạng thái độ sáng miếu hãm (`miao`, `wang`, `de`, `li`, `ping`, `bu`, `xian`).
  - `mutagen`: Trạng thái Tứ Hóa nếu có (`lu` - Hóa Lộc, `quyen` - Hóa Quyền, `khoa` - Hóa Khoa, `ky` - Hóa Kỵ).
  - `displayName`: Tên hiển thị tiếng Việt tương ứng.

- **Hệ thống Cung vị (`palaceSchema`)**:
  - `nameKey`: Khóa của cung (ví dụ: `soulPalace` - Mệnh cung, `wealthPalace` - Tài Bạch).
  - `index`: Chỉ số cung từ 0 (Dần) đến 11 (Sửu).
  - `heavenlyStemKey` & `earthlyBranchKey`: Can Chi của cung.
  - `isBodyPalace` / `isOriginalPalace`: Cung Thân / Lai nhân cung.
  - `majorStars` / `minorStars` / `adjectiveStars`: Mảng các sao tương ứng đóng tại cung.
  - `decadalRange`: Khoảng tuổi đại hạn (ví dụ: `[22, 31]`).
  - `ages`: Mảng các tuổi tiểu hạn rơi vào cung.

## See Also

- [Cấu trúc Dữ liệu Lá số Tử Vi](astrolabe-data-structure.md)
- [Chuyển đổi Lịch pháp và Tính toán Can Chi](lunar-calendar-conversion.md)
