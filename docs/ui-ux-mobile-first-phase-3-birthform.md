# Tóm tắt Thiết kế UI/UX Mobile-First: Phase 3 (BirthForm Layout)

## 1. Mục tiêu (Objective)
Đại tu giao diện form Lập lá số (BirthForm) để nằm gọn và đẹp mắt bên trong Bottom Sheet, tuân thủ nguyên tắc Premium Mobile-First theo yêu cầu. Giao diện cần phản ánh rõ nét hơi hướng "Huyền bí (Mystical)", sử dụng các thuộc tính glassmorphism để tạo chiều sâu và tối ưu hóa trải nghiệm chạm trên điện thoại.

## 2. Việc đã làm (Implementation Details)

### 2.1 Sửa lỗi Backend Dependency (Phát hiện từ pre-check Playwright)
- **Vấn đề:** Các API module `DrawsTarotModule`, `DreamsModule`, `FortuneModule` bị thiếu module dependency `WalletModule` dẫn tới lỗi `UnknownDependenciesException` khi inject `WalletEngineService`. 
- **Giải pháp:** Đã import bổ sung `WalletModule` vào danh sách `imports` của các module kể trên. 
- **Kiểm thử:** Chạy lệnh build và re-run Playwright, đảm bảo backend khởi chạy thành công.

### 2.2 Sửa Playwright E2E Test (Kéo theo từ Phase 2)
- **Vấn đề:** Spec `smoke.spec.ts` bị hỏng bước kiểm tra `#birth-day` do field này đã bị giấu vào trong Bottom Sheet, không còn render ngay lập tức ở dashboard.
- **Giải pháp:** Bổ sung bước trigger click vào nút "Lập lá số mới" `page.getByRole('button', { name: 'Lập lá số mới' })` để mở Bottom Sheet trước khi kiểm tra sự tồn tại của form.

### 2.3 Refactor UI BirthForm.svelte
- **Layout & Sections:** Bọc các trường nhập liệu thành các cụm thông tin có nghĩa (Hệ thuật số, Ngày tháng năm sinh, Thông tin bổ sung) bằng class `.form-section`.
- **Glassmorphism Theme:** Bổ sung class `surface-glass`, `p-4`, và `rounded-xl` để tạo hiệu ứng thẻ nổi bồng bềnh mang đậm chất Luvsa Premium, kết hợp hoàn hảo với màn nền tối (dark mode) của hệ thống.
- **Sticky Submit Button:** Cải tiến nút "Lập lá số" trở thành một vùng sticky `.submit-wrapper` có gradient mờ lót dưới đáy để người dùng dễ thao tác bằng ngón tay cái mà không sợ bị trượt hoặc che khuất (Touch-friendly).
- **Typography:** Các tiêu đề section (`.section-title`) được dùng font caption in hoa, tăng tính phân cấp thông tin rõ ràng và sang trọng.

## 3. Kết quả (Results)
- Form `BirthForm` hiện đại, chia khối logic mạch lạc.
- Khi mở Bottom Sheet ở thiết bị di động, các thẻ thủy tinh (glassmorphism) nổi bật giúp tập trung ánh nhìn, tạo cảm giác cao cấp. 
- Hệ thống hoàn toàn vượt qua Playwright E2E testing (Đăng nhập, mở bottom sheet, load dashboard) và không còn lỗi Dependency ở backend NestJS.

## 4. Đề xuất & Review (Code Review & Architecture)
- **Review:** Tính năng hoàn toàn khả thi cho mobile và giữ nguyên tính tương tác bất biến của runes (Svelte 5). Class CSS tận dụng lại các tokens sẵn có (ví dụ `--glass-bg`).
- **Next step / Architecture:** Tiếp nối Phase 4, ta có thể triển khai hệ thống lưu giữ Draft Form (tạm lưu các field vào localStorage nếu user vô tình đóng Bottom Sheet) nhằm tránh mất dữ liệu nhập. Tạm thời, MVP UI hiện tại đã đủ tốt để nghiệm thu.
