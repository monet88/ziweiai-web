# Cấu trúc Dữ liệu Lá số Tử Vi

> Sources: SylarLong, 2023-10-25
> Raw: [iztro-astrolabe-types](../../raw/astrology/2026-06-10-iztro-astrolabe-types.md)

## Overview

Bài viết này tổng hợp cấu trúc dữ liệu cốt lõi của một lá số Tử Vi (Astrolabe) và các cung vị (Palace) dựa trên thiết kế của thư viện [iztro](file:///f:/CodeBase/ziweiai/.ref/iztro). Đây là nền tảng quan trọng giúp xây dựng các hợp đồng dữ liệu (data contracts) dùng chung tại [packages/contracts](file:///f:/CodeBase/ziweiai/packages/contracts) và đồng bộ giữa client-server.

## Cấu trúc Lá số (Astrolabe)

Lá số Tử Vi đại diện cho toàn bộ bản đồ sao và thông tin giờ sinh của một người. Đối tượng `Astrolabe` bao gồm các trường thông tin chính sau:

- **Thông tin cơ bản**:
  - `gender` (Giới tính): Nam hoặc Nữ (hỗ trợ đa ngôn ngữ).
  - `solarDate` (Dương lịch): Chuỗi ngày sinh dạng `YYYY-MM-DD`.
  - `lunarDate` (Âm lịch): Ngày âm lịch tương ứng.
  - `chineseDate` (Can Chi): Ngày sinh biểu diễn dưới dạng Can Chi (ví dụ: Giáp Tý, Bính Dần).
  - `time` (Giờ sinh): Tên giờ sinh (ví dụ: Tý, Sửu).
  - `timeRange` (Khoảng giờ): Khoảng thời gian cụ thể của giờ sinh (ví dụ: `23:00~01:00`).
  - `sign` (Chòm sao phương Tây): Chòm sao hoàng đạo tương ứng.
  - `zodiac` (Con giáp): Sinh tiếu theo năm sinh Âm lịch.
- **Thông tin tọa độ mệnh/thân**:
  - `earthlyBranchOfSoulPalace` (Địa chi cung Mệnh).
  - `earthlyBranchOfBodyPalace` (Địa chi cung Thân).
- **Sao chủ và Ngũ hành**:
  - `soul` (Mệnh chủ): Sao quản lý mệnh dựa trên địa chi cung Mệnh.
  - `body` (Thân chủ): Sao quản lý thân dựa trên địa chi năm sinh.
  - `fiveElementsClass` (Ngũ hành cục): Cục của lá số quyết định vận trình khởi đại hạn (ví dụ: Thủy nhị cục, Mộc tam cục, Kim tứ cục, Thổ ngũ cục, Hỏa lục cục).
- **Danh sách cung vị**:
  - `palaces`: Mảng chứa thông tin chi tiết của 12 cung trên lá số.

## Cấu trúc Cung vị (Palace)

Mỗi cung vị biểu diễn một phương diện cuộc sống của đương số. Cấu trúc `Palace` bao gồm:

- **Thông tin cơ bản của cung**:
  - `index`: Chỉ số cung (từ 0 đến 11, bắt đầu từ cung Dần).
  - `name`: Tên cung vị (Mệnh, Phụ Mẫu, Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc, Thiên Di, Tật Ách, Tài Bạch, Tử Tức, Phu Thê, Huynh Đệ).
  - `isBodyPalace`: Xác định cung vị này có đồng thời là cung Thân hay không.
  - `isOriginalPalace` (Lai nhân cung): Cung vị có Can trùng với Can năm sinh (được dùng nhiều trong Tử Vi Tứ Hóa).
  - `heavenlyStem` & `earthlyBranch`: Thiên Can và Địa Chi của cung đó.
- **Hệ thống sao đóng tại cung**:
  - `majorStars`: Danh sách các Chính tinh (14 chính tinh).
  - `minorStars`: Danh sách các Trung tinh / Phụ tinh quan trọng (Tả Phù, Hữu Bật, Văn Xương, Văn Khúc, Thiên Khôi, Thiên Việt, Lộc Tồn, Thiên Mã, Kình Dương, Đà La, Hỏa Tinh, Linh Tinh, Địa Không, Địa Kiếp).
  - `adjectiveStars`: Các tạp diệu / sao nhỏ khác đóng tại cung.
  - Các bộ sao 12 thần:
    - `changsheng12`: Sao thuộc vòng Tràng Sinh (Tràng Sinh, Mộc Dục, Quan Đới, Lâm Quan, Đế Vượng, Suy, Bệnh, Tử, Mộ, Tuyệt, Thai, Dưỡng).
    - `boshi12`: Sao thuộc vòng Bác Sĩ (Bác Sĩ, Lực Sĩ, Thanh Long, Tiểu Hao, Tướng Quân, Tấu Thư, Phi Liêm, Hỷ Thần, Bệnh Phù, Đại Hao, Phục Binh, Quan Phủ).
    - `jiangqian12`: Sao thuộc vòng Tướng Tinh (giới hạn trong lưu niên).
    - `suiqian12`: Sao thuộc vòng Tuế Tiền (giới hạn trong lưu niên).
- **Hệ thống vận hạn của cung**:
  - `decadal`: Thông tin đại hạn tương ứng của cung đó (độ tuổi bắt đầu và kết thúc đại hạn, ví dụ: `22 - 31`).
  - `ages`: Danh sách các tuổi tiểu hạn tương ứng rơi vào cung này.

## Cấu trúc Vận hạn (Horoscope)

Vận hạn dùng để luận giải biến động cuộc sống theo thời gian. `Horoscope` quản lý các lớp vận hạn lồng nhau:

- **Đại hạn (Decadal)**: Vận trình 10 năm.
- **Tiểu hạn (Age / Turn)**: Vận trình 1 năm theo tuổi của đương số.
- **Lưu niên (Yearly)**: Biến động năm hiện tại theo Địa Chi của năm đó.
- **Lưu nguyệt, Lưu nhật, Lưu thời**: Các biến động chi tiết theo tháng, ngày và giờ cụ thể.

Mỗi cấp vận hạn (`HoroscopeItem`) đều có:
- Cung vị bị tác động (`index`).
- Can Chi của vận hạn đó để khởi Tứ Hóa.
- Các sao lưu động tương ứng rơi vào các cung vị.

## See Also

- [Chuyển đổi Lịch pháp và Tính toán Can Chi](lunar-calendar-conversion.md)
- [Thiết kế Prompt AI và Cấu trúc DTO cho Lá số](ai-prompt-and-dto-design.md)

