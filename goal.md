# Mục Tiêu — Tử Vi Toàn Tập

## Quy Ước Ngôn Ngữ

Tài liệu này dùng tiếng Việt làm ngôn ngữ chính cho mục tiêu sản phẩm, vận hành
và ra quyết định. Các thuật ngữ English chỉ được giữ khi đó là tên công nghệ,
định danh kỹ thuật hoặc cách gọi chuẩn trong hệ sinh thái phát triển, ví dụ:
`Supabase`, `Vercel`, `API`, `AI`, `quota`, `provider`, `serverless`, `credit`
và `payment`.

Mọi trao đổi với chủ dự án, ghi chú PM, báo cáo tiến độ và tài liệu sản phẩm
phải viết bằng tiếng Việt. Chỉ giữ English cho tên riêng kỹ thuật hoặc khi dịch
sang tiếng Việt có thể làm sai nghĩa.

## Mục Tiêu Sản Phẩm

Xây dựng một web app tiếng Việt giúp người dùng lập, lưu, xem lại và hỏi đáp về các hệ thuật số/tử vi trên một nền tảng duy nhất. Sản phẩm cần đủ dễ để người dùng mới có thể thử ngay bằng phiên ẩn danh, và đủ bền để người dùng đăng nhập email/password có thể giữ lịch sử lâu dài.

## Định Vị

Tử Vi Toàn Tập là “không gian làm việc thuật số có AI” cho người dùng Việt:

- Lập lá số và gieo quẻ nhanh trên web.
- Xem lại lịch sử theo tài khoản hoặc phiên sử dụng.
- Nhận luận giải AI dựa trên dữ liệu lá số/quẻ thật, không dựa trên dữ liệu rỗng.
- Mở rộng dần thành bộ công cụ tử vi, bói dịch, tarot, xem tướng, xem tay, hoàng lịch và trợ lý hội thoại.

## Mục Tiêu Bản MVP

1. Người dùng vào web có thể dùng ngay, không bắt buộc tạo tài khoản.
2. Người dùng có thể tạo và xem lại lá số/quẻ trên các hệ chính: Tử Vi, Bát Tự, Mai Hoa, Lục Hào, Đại Lục Nhâm, Kỳ Môn, Mang Phái, Hợp Hôn.
3. Người dùng có thể tạo luận giải AI tổng quan hoặc theo ngữ cảnh lá số/quẻ khi dữ liệu đủ tin cậy.
4. Mỗi lá số/quẻ/luận giải được lưu vào Supabase theo chủ sở hữu tài khoản hoặc phiên ẩn danh.
5. Bản demo công khai chạy ổn định tại `https://tuvitoantap.vercel.app`.

## Mục Tiêu Kinh Doanh

- Kiểm chứng nhu cầu người dùng Việt với một bộ công cụ tử vi + AI tập trung.
- Tạo tài sản có thể tái sử dụng: bộ máy tính lá số, hợp đồng API, mẫu lệnh AI,
  bộ định tuyến nhà cung cấp AI, lịch sử, hạn mức và checklist triển khai.
- Chuẩn bị nền cho thương mại hoá bằng credit/XU, báo cáo trả phí, hội thoại AI
  và các gói chuyên sâu.

## Chỉ Số Thành Công

- Kích hoạt: người dùng mới tạo được lá số/quẻ đầu tiên trong một phiên.
- Độ ổn định: luồng `auth -> create chart/divination -> open detail -> generate AI` không lỗi 5xx trong kiểm tra nhanh demo.
- Chất lượng dữ liệu: luận giải AI chỉ được tạo khi bản ghi tính toán không bị chặn.
- Tín hiệu giữ chân: người dùng quay lại xem lịch sử, hội thoại và chi tiết lá số/quẻ.
- Kiểm soát chi phí: có hạn mức và cổng chặn AI trước khi mở lưu lượng truy cập rộng.

## Phạm Vi Hiện Tại

Đã có:

- Web SvelteKit SPA, backend NestJS, contracts Zod dùng chung.
- Supabase Auth/DB, phiên ẩn danh và đăng nhập email/password.
- Bản demo công khai trên Vercel dùng cùng domain cho `/api`.
- Nhà cung cấp AI DeepSeek và OpenAI-compatible/OpenRouter.
- Lịch sử, chi tiết lá số/quẻ, luận giải, hội thoại, vận hạn và các công cụ mở rộng.
- Hàng rào bảo mật: web không import bộ máy tính toán chỉ dành cho server; env, secret và artifact build đã được ignore.

Chưa coi là sản phẩm thương mại vận hành chính thức đầy đủ:

- Payment/VietQR/ledger/XU chưa hoàn chỉnh.
- Hạn mức và kiểm soát chi phí cần được gia cố trước khi chạy lưu lượng lớn.
- Lục Hào đang có đường dự phòng để demo vẫn ổn khi cầu nối `xuanshu` lỗi; cần gia cố môi trường chạy trước khi coi đây là đường vận hành chính thức chuẩn.
- Khả năng quan sát cần thêm bảng điều khiển lỗi 5xx, cảnh báo chi phí AI, độ
  trễ nhà cung cấp và checklist phát hành tự động.

## Nguyên Tắc Điều Hành

- Ưu tiên demo dùng được và có bằng chứng hơn là mở rộng tính năng chưa kiểm chứng.
- Mọi thay đổi vào luồng lõi phải có test và kiểm tra nhanh trên production nếu đã triển khai.
- Không commit secret, env thật, service key, credential, kết quả build hoặc artifact mobile/media.
- Mọi kết quả AI phải dựa trên dữ liệu lá số/quẻ hợp lệ; bản ghi bị chặn phải
  dừng trước khi gọi nhà cung cấp AI.
