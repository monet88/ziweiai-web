# Chuyển đổi Lịch pháp và Tính toán Can Chi

> Sources: 6tail, 2022-01-15
> Raw: [lunar-javascript-calendar-api](../../raw/astrology/2026-06-10-lunar-javascript-calendar-api.md)

## Overview

Bài viết này hướng dẫn cách sử dụng thư viện [lunar-javascript](file:///f:/CodeBase/ziweiai/.ref/lunar-javascript) để thực hiện chuyển đổi giữa Dương lịch và Âm lịch, đồng thời tính toán chính xác Can Chi (Thiên Can - Địa Chi) của Năm, Tháng, Ngày và Giờ sinh phục vụ lập lá số Tử Vi và Bát Tự.

## Chuyển đổi Âm - Dương Lịch

Thư viện cung cấp hai lớp chính là `Solar` (Dương lịch) và `Lunar` (Âm lịch) để thực hiện chuyển đổi qua lại:

### 1. Dương lịch sang Âm lịch
Để chuyển đổi ngày Dương lịch sang Âm lịch, ta khởi tạo đối tượng `Solar` và gọi phương thức `getLunar()`:
```javascript
const { Solar } = require('lunar-javascript');

// Khởi tạo ngày Dương lịch: năm 1986, tháng 5, ngày 29
const solar = Solar.fromYmd(1986, 5, 29);
const lunar = solar.getLunar();

console.log(lunar.getYear());    // Năm âm lịch: 1986
console.log(lunar.getMonth());   // Tháng âm lịch: 4
console.log(lunar.getDay());     // Ngày âm lịch: 21
console.log(lunar.isLeap());     // Có phải tháng nhuận hay không: false
```

### 2. Âm lịch sang Dương lịch (Xử lý tháng nhuận)
Khi khởi tạo đối tượng `Lunar`, nếu tháng là tháng nhuận, giá trị tháng sẽ mang **dấu âm** (ví dụ: `-4` biểu thị tháng 4 nhuận):
```javascript
const { Lunar } = require('lunar-javascript');

// Khởi tạo ngày Âm lịch: 21 tháng 4 nhuận năm 1986
const lunarLeap = Lunar.fromYmdHms(1986, -4, 21, 12, 0, 0);
const solar = lunarLeap.getSolar();

console.log(solar.toYmdHms());   // Kết quả Dương lịch tương ứng
```

## Các phương pháp tính Can Chi và Phân chia Tiết Khí

Tử Vi và Bát Tự có các quy ước khác nhau về thời điểm bắt đầu một năm mới hoặc một tháng mới (theo mùng 1 Tết Âm lịch hay theo Tiết Khí). `lunar-javascript` hỗ trợ đầy đủ các trường phái này:

### 1. Can Chi của Năm (Year Gan-Zhi)
Có 3 phương pháp phổ biến để xác định Can Chi của năm sinh:
- **Theo mùng 1 Tết Âm lịch**: `lunar.getYearInGanZhi()` (phù hợp với các hệ phái Tử Vi truyền thống).
- **Theo ngày Lập Xuân (Li Chun)**: `lunar.getYearInGanZhiByLiChun()` (phù hợp với Bát Tự / Tứ Trụ).
- **Theo thời điểm Lập Xuân chính xác**: `lunar.getYearInGanZhiExact()` (tính chính xác đến giờ phút giây của tiết Lập Xuân).

*Lưu ý*: Phương thức tính con giáp (Sheng Xiao) tương ứng cũng có 3 hàm: `getYearShengXiao()`, `getYearShengXiaoByLiChun()`, và `getYearShengXiaoExact()`.

### 2. Can Chi của Tháng (Month Gan-Zhi)
- **Theo tháng âm lịch**: `lunar.getMonthInGanZhi()` (Ví dụ: từ mùng 1 đến hết tháng Chạp).
- **Theo tiết khí chính xác**: `lunar.getMonthInGanZhiExact()` (Tháng mới bắt đầu từ thời điểm bước vào Tiết Khí của tháng đó, thường dùng trong Bát Tự để tính toán chính xác lệnh tháng).

### 3. Can Chi của Ngày (Day Gan-Zhi)
- `lunar.getDayInGanZhiExact()`: Tính Can Chi ngày theo dương lịch thông thường.
- `lunar.getDayInGanZhiExact2()`: Có hỗ trợ chia tách giờ Tý đầu ngày và giờ Tý cuối ngày (Giờ Tý muộn).

### 4. Can Chi của Giờ (Hour Gan-Zhi)
Sử dụng đối tượng Bát Tự (`EightChar`) để lấy thông tin Can Chi giờ sinh chính xác:
```javascript
const eightChar = lunar.getEightChar();
const hourGanZhi = eightChar.getTime(); // Ví dụ: "癸酉"
const hourGan = eightChar.getTimeGan(); // "癸"
const hourZhi = eightChar.getTimeZhi(); // "酉"
```

## See Also

- [Cấu trúc Dữ liệu Lá số Tử Vi](astrolabe-data-structure.md)
- [Thiết kế Prompt AI và Cấu trúc DTO cho Lá số](ai-prompt-and-dto-design.md)

