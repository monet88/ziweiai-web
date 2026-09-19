# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Người tìm kiếm định hướng sống & thấu hiểu bản thân**: Người trẻ, người đi làm mong muốn khám phá tiềm năng bản thân, gỡ rối quyết định trong sự nghiệp, công danh, tình duyên và quản trị tâm lý thông qua lăng kính chiêm tinh học hiện đại, có cơ sở và điềm đạm.
- **Người nghiên cứu & yêu thích thuật số/mệnh lý**: Độc giả có hiểu biết về phương Đông (Tử Vi, Bát Tự, Kỳ Môn, Lục Hào, Mai Hoa, Đại Lục Nhâm, Manh Phái) và phương Tây (Tarot, Lenormand, MBTI), cần một công cụ lập bàn số chuẩn xác, hiển thị đầy đủ liên kết tam phương tứ chính/vận hạn và hỗ trợ luận giải chuyên sâu bằng AI.
- **Người dùng thường nhật**: Tìm kiếm sự an tâm và lời khuyên kịp thời qua việc xem hoàng lịch, gieo quẻ sự vụ tức thời hoặc giải mộng khi gặp băn khoăn.

## Product Purpose

ZiweiAI kiến tạo một không gian số tĩnh tại, tôn nghiêm và chuẩn xác, kết hợp giữa thuật toán thiên văn / lịch pháp cổ truyền trên máy chủ và trí tuệ nhân tạo đối thoại đa lượt để giải mã vận mệnh, soi sáng hiện tại và gợi mở hướng đi tương lai. Thành công của sản phẩm là mang lại sự an yên, thấu suốt và sáng suốt cho người dùng, tuyệt đối nói không với mê tín dị đoan hay hù dọa số phận.

## Positioning

- **Thuật toán chuẩn xác & minh bạch**: Động cơ tính toán độc lập, nghiêm ngặt trên máy chủ (ephemeris thiên văn, tiết khí chuẩn xác), loại bỏ hoàn toàn việc sinh dữ liệu lá số giả lập.
- **100% Thuần Việt (Zero Hanzi)**: Toàn bộ thuật ngữ chiêm tinh được bản địa hóa sang tiếng Việt chuẩn mực, có cơ chế fail-fast chặn đứng chữ Hán ở tầng kiểm thử, tạo nên trải nghiệm tiếp cận tự nhiên cho mọi người Việt.
- **Trí tuệ nhân tạo đĩnh đạc & nhân văn**: AI đóng vai trò nhà tư vấn thông tuệ, đồng cảm và khách quan; luận giải sâu sắc từng biến số nhưng luôn nhấn mạnh ý chí tự do và năng lực kiến tạo cuộc đời của người dùng.
- **Không gian tĩnh tại (Paper-Calm)**: Thẩm mỹ lấy cảm hứng từ tài liệu thanh lịch (Notion / Luvsa), tạo cảm giác trang nghiêm và an yên như một chốn suy ngẫm cá nhân, tương phản hoàn toàn với các website/ứng dụng bói toán thương mại ồn ào.

## Operating Context

- **Nghi Thức An Quẻ (Casting Ritual)**: Các thao tác tương tác có ý thức như gieo đồng xu Lục Hào, bấm quẻ Mai Hoa, xáo và bốc bài Tarot/Lenormand, lắc ống xăm, hoặc truyền ảnh tướng diện/chỉ tay.
- **Bàn Số Bản Mệnh (Chart Canvas)**: Giao diện đồ hình 12 cung Tử Vi, cửu cung Kỳ Môn, tứ trụ Bát Tự với các chỉ dẫn trực quan về đại vận, lưu niên, sao hóa và đường nối cung tam hợp/xung chiếu.
- **Ngăn Luận Giải & Phiên Đối Thoại (Explanation Drawer & Conversation)**: Trải nghiệm đọc bản đúc kết AI và đối thoại nhiều lượt tiếp theo để giải đáp cặn kẽ các khía cạnh công việc, sức khỏe, tài chính, gia đạo.
- **Nhật Ký Chiêm Đoán (Divination History)**: Không gian lưu trữ có trật tự các phiên lập lá số và gieo quẻ đã thực hiện.
- **Cơ chế ẩn danh & ví XU**: Trải nghiệm ngay lập tức qua định danh ẩn danh (Anonymous Identity) trước khi liên kết tài khoản Supabase; quản lý chi phí minh bạch qua hạn mức và thanh toán VietQR.

## Capabilities and Constraints

- **Năng lực thuật số đa hệ thống**:
  - Đông phương: Tử Vi Đẩu Số (an sao, tứ hóa, đại vận, lưu niên/nguyệt/nhật), Bát Tự (Tứ Trụ), Kỳ Môn Độn Giáp, Lục Hào, Mai Hoa Dịch Số, Đại Lục Nhâm, Manh Phái, Hợp Hôn, Hoàng Lịch, Xin Xăm, Giải Mộng, Tướng Diện, Chỉ Tay.
  - Tây phương & Tâm lý: Tarot (78 lá), Lenormand (36 lá), MBTI Chiêm Tinh.
- **Biên giới bảo mật kiến trúc (Hard Invariant)**: `apps/web` chỉ được phép import `@ziweiai/contracts`. Nghiêm cấm import `@ziweiai/core`, `@ziweiai/astro-engine` hoặc các thư viện engine gốc vào client bundle.
- **Ràng buộc ngôn ngữ (Hard Invariant)**: Frontend tuyệt đối không chứa ký tự chữ Hán (`\p{Script=Han}`). Toàn bộ nhãn UI, dữ liệu xuất bản và thông điệp AI phải là tiếng Việt chuẩn.
- **Kiến trúc kỹ thuật**: SvelteKit 2 SPA tĩnh (`@sveltejs/adapter-static`), Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`), Scoped CSS + CSS Custom Properties theo `tokens.css` (không dùng Tailwind).
- **Xác thực & Trạng thái**: Supabase Auth vận hành phía client; NestJS API xác thực stateless qua Bearer token.
- **AI Gateway**: Phân luồng linh hoạt giữa các mô hình AI (OpenAI-compatible, DeepSeek, Gemini) qua seam `LlmExchange` và cơ chế fallback tự động.

## Brand Commitments

- **Tên thương hiệu**: ZiweiAI.
- **Văn phong (Voice)**: Điềm đạm, đĩnh đạc, trí tuệ, thấu cảm, giàu tính triết lý và thực tiễn; từ chối từ ngữ mê tín, phán quyết định mệnh cực đoan hay gián nhãn may rủi cạn cợt.
- **Ngôn ngữ hình thức**: Tối giản, thanh khiết, sử dụng canvas kem ấm (`#f5f2ed`), mặt thẻ trắng (`#ffffff`), mực gần-đen (`#111111`), phông chữ serif Playfair Display phối hợp cùng sans Space Grotesk, đường viền hairline thanh mảnh (`#e7e7e7`).

## Evidence on Hand

- **Mã nguồn và kiến trúc**: Động cơ thuật số (`packages/astro-engine`, `packages/core`, `packages/xuanshu-runtime`), NestJS API (`apps/api`), web frontend SvelteKit (`apps/web`), ứng dụng di động Flutter (`apps/mobile`).
- **Hợp đồng dữ liệu**: Gói `@ziweiai/contracts` chuẩn hóa Zod schemas cho toàn bộ request/response DTOs.
- **Tài liệu kiểm thử & hình ảnh chứng thực**: Thư mục `docs/deploy/test-evidence/` chứa ảnh chụp màn hình kiểm thử thực tế của toàn bộ các phân hệ chức năng.
- **Tài liệu quyết định**: Hệ thống ADRs (`docs/adr/0001` đến `0006`) và tài liệu kiến trúc ngữ cảnh (`CONTEXT-MAP.md`, `CONTEXT.md`).

## Product Principles

1. **Thuật Số Chuẩn Xác (Authentic Computation)**: Mọi lá số, quẻ dịch và bảng tính thiên văn phải được tính toán trung thực, chính xác theo nguyên tắc lịch pháp cổ truyền, không dùng dữ liệu ngẫu nhiên giả mạo.
2. **Thuần Việt & Minh Bạch (Pure Vietnamese & Clarity)**: Bản địa hóa hoàn toàn sang tiếng Việt trong sáng, loại bỏ chữ Hán và rào cản từ ngữ khó hiểu để đem lại sự sáng tỏ cho người xem.
3. **Điềm Đạm & Nhân Văn (Dignified & Human-Centric AI)**: Trí tuệ nhân tạo là người đồng hành soi sáng, không phán xét, luôn tôn trọng ý chí tự do và khuyến khích hành động xây dựng của con người.
4. **Tĩnh Tại Như Trang Giấy (Paper-Calm Sanctuary)**: Trải nghiệm thị giác thanh tịnh, tối giản, tôn trọng sự tập trung và khoảng lặng suy ngẫm của người dùng.
5. **Tiện Lợi & Bảo Mật (Seamless & Private)**: Sẵn sàng phục vụ ngay lập tức với cơ chế ẩn danh, bảo vệ tối đa dữ liệu riêng tư và lịch sử tâm tư của người dùng.

## Accessibility & Inclusion

- Tương phản văn bản đạt chuẩn WCAG AA trên nền kem ấm và thẻ trắng.
- Toàn bộ các thao tác gieo quẻ và điều khiển giao diện đều hỗ trợ bàn phím.
- Thiết kế thích ứng mượt mà trên cả thiết bị di động và máy tính để bàn.
