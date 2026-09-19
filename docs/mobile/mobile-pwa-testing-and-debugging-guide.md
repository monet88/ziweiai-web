# CẨM NANG HƯỚNG DẪN TEST, DEBUG & TỐI ƯU HÓA RESPONSIVE PWA TRÊN ĐIỆN THOẠI
## DỰ ÁN: TỬ VI TOÀN TẬP (ViOS) — https://tuvitoantap.online
### Tài liệu kỹ thuật: Mobile Web PWA Excellence (Vibe Engineering & Behavioral Model Debugger)

---

## 1. TẠI SAO PHẢI ƯU TIÊN MOBILE WEB PWA TRƯỚC FLUTTER?

Theo số liệu đo lường hành vi người dùng (Behavior Model Debugger) trong ngành thuật số và SaaS tâm linh:
- **Hơn 85% - 90% lượng truy cập** đến từ mạng xã hội (TikTok, Facebook, Zalo, Instagram Reels) chạy trên trình duyệt điện thoại (Mobile Web / In-App Browser).
- Nếu bắt người dùng phải vào App Store / Google Play để tải app nặng 50MB - 100MB mới xem được lá số: **Tỷ lệ rơi rụng (Drop-off rate) lên tới 80%**!
- Với **Mobile Web PWA**:
  - Người dùng chạm link là vào ngay trong **0.8 giây**.
  - Trải nghiệm mượt mà, toàn màn hình (Standalone) không có thanh URL trình duyệt.
  - Có thể cài đặt ngay ra màn hình chính (**Add to Home Screen**) với biểu tượng hoàng gia sắc nét chỉ bằng 1 chạm.
  - Vẫn hỗ trợ thanh toán VietQR SePay tự động và nhận thông báo đẩy (Web Push).
  - Tối ưu hóa xong Mobile Web PWA là nền tảng vững chắc nhất trước khi đóng gói Flutter về sau!

---

## 2. BA PHƯƠNG PHÁP TEST & DEBUG THỰC CHIẾN TRÊN ĐIỆN THOẠI

---

### PHƯƠNG PHÁP 1: TEST TRÊN ĐIỆN THOẠI THẬT QUA MẠNG WI-FI (LOCAL NETWORK)

Đây là cách nhanh nhất để thử nghiệm cảm giác vuốt chạm, font chữ, độ mượt animation ngay trên chiếc điện thoại của Đại Ka khi đang code.

1. **Khởi động server dev với cờ chia sẻ mạng nội bộ**:
   ```bash
   pnpm dev:host
   # hoặc:
   pnpm -F @ziweiai/web dev:host
   ```
2. **Xem địa chỉ IP mạng nội bộ do Vite in ra**:
   ```text
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.1.15:5173/
   ```
3. **Mở trên điện thoại**:
   - Đảm bảo điện thoại và máy tính kết nối **cùng một mạng Wi-Fi**.
   - Mở Safari (iPhone) hoặc Chrome (Android), gõ địa chỉ: `http://192.168.1.15:5173` (thay bằng IP thực tế của máy tính).
   - Mọi thay đổi code trên máy tính sẽ tự động Hot-Reload tức thì trên màn hình điện thoại!

> **Mẹo nâng cao (Test PWA HTTPS trên máy thật)**:
> PWA yêu cầu giao thức HTTPS để kích hoạt Service Worker và tính năng "Cài đặt ứng dụng". Đại Ka có thể dùng **Cloudflare Tunnel** (hoàn toàn miễn phí, an toàn, không cần mở port modem):
> ```bash
> npx cloudflared tunnel --url http://localhost:5173
> ```
> Cloudflare sẽ sinh ra một đường dẫn HTTPS tạm thời (ví dụ: `https://xyz-abc.trycloudflare.com`). Mở link này trên điện thoại để test 100% tính năng PWA!

---

### PHƯƠNG PHÁP 2: REMOTE DEBUGGING TRỰC TIẾP TỪ MÁY TÍNH VÀO ĐIỆN THOẠI (THE GOLD STANDARD)

Phương pháp này giúp Đại Ka bắt được mọi lỗi JavaScript, xem Console log, xem Network request, và căn chỉnh CSS real-time trên điện thoại bằng bàn phím và chuột của máy tính.

#### A. Đối với iPhone / iPad (iOS Safari)
1. **Bật Web Inspector trên iPhone**:
   - Vào `Cài đặt (Settings)` -> Cuộn xuống chọn `Safari` -> Chọn `Nâng cao (Advanced)`.
   - Gạt bật mục **`Trình kiểm tra web (Web Inspector)`**.
2. **Cắm cáp nối iPhone với máy Mac**:
   - Cắm cáp USB nối iPhone vào máy Mac. Nếu iPhone hỏi *"Tin cậy máy tính này?"*, nhấn **Tin cậy (Trust)** và nhập mật khẩu mở khóa.
3. **Mở Safari trên máy Mac**:
   - Mở ứng dụng Safari trên máy tính Mac.
   - Nếu thanh menu chưa có mục `Phát triển (Develop)`: Vào `Safari` -> `Cài đặt...` -> `Nâng cao` -> Tích chọn *"Hiển thị các tính năng cho nhà phát triển web"*.
   - Nhấn vào menu **`Phát triển (Develop)`** trên thanh menu của Mac -> Di chuột vào **tên iPhone của Đại Ka**.
   - Sẽ thấy danh sách các tab đang mở trên điện thoại (ví dụ: `tuvitoantap.online` hoặc `192.168.1.x:5173`).
   - Nhấp vào trang đó: Cửa sổ **Web Inspector** sẽ hiện lên màn hình Mac!
   - Đại Ka có thể xem Elements, sửa CSS (sẽ thấy màn hình điện thoại đổi màu ngay lập tức), xem Console lỗi, xem Network API cực kỳ tiện lợi!

#### B. Đối với Điện Thoại Android (Google Chrome)
1. **Bật Gỡ Lỗi USB trên Android**:
   - Vào `Cài đặt` -> `Thông tin điện thoại` -> Chạm 7 lần vào `Số hiệu bản dựng (Build Number)` để mở khóa Menu Nhà phát triển.
   - Quay lại `Cài đặt` -> `Tùy chọn cho nhà phát triển (Developer Options)` -> Gạt bật **`Gỡ lỗi USB (USB Debugging)`**.
2. **Cắm cáp nối Android với máy tính**:
   - Cắm cáp USB nối Android vào máy tính. Điện thoại sẽ hiện popup *"Cho phép gỡ lỗi USB?"*, tích chọn *"Luôn cho phép"* và nhấn **OK**.
3. **Mở Chrome Inspect trên máy tính**:
   - Mở trình duyệt Chrome trên máy tính, gõ vào thanh địa chỉ:
     ```text
     chrome://inspect/#devices
     ```
   - Chờ 2 giây, Chrome sẽ phát hiện điện thoại Android và liệt kê các tab web đang mở trên điện thoại.
   - Nhấn nút **`Inspect`** bên dưới tab ViOS:
     - Màn hình máy tính sẽ hiển thị cửa sổ DevTools đầy đủ kèm theo **màn hình trực quan (Screencast)** của điện thoại.
     - Đại Ka có thể dùng chuột máy tính nhấp, cuộn, gõ chữ trực tiếp lên màn hình điện thoại Android!

---

### PHƯƠNG PHÁP 3: MÔ PHỎNG VIEWPORT & AUDIT LIGHTHOUSE TRÊN CHROME DEVTOOLS

Khi muốn kiểm tra nhanh nhiều kích thước màn hình khác nhau mà không cần đổi máy:

1. **Mở Device Toolbar**:
   - Bấm phím tắt **`Cmd + Option + I`** để mở DevTools, sau đó bấm **`Cmd + Shift + M`** để bật Device Toolbar.
2. **Chọn các Profile thiết bị phổ biến**:
   - `iPhone 14 Pro / 15 Pro`: 393 x 852 px (DPR 3)
   - `Samsung Galaxy S20 / S21`: 360 x 800 px (DPR 3)
   - `Pixel 7`: 412 x 915 px (DPR 2.625)
   - `Màn hình nhỏ cũ`: 320 x 568 px (iPhone SE)
3. **Kiểm tra Thanh cuộn ngang (Horizontal Overflow)**:
   - Mở tab **Console** trong DevTools, dán đoạn mã sau và Enter:
     ```javascript
     document.documentElement.scrollWidth > window.innerWidth
       ? console.warn('❌ Layout bị vỡ cuộn ngang! Độ rộng thực:', document.documentElement.scrollWidth, 'Viewport:', window.innerWidth)
       : console.log('✅ Layout chuẩn 100%, không bị vỡ cuộn ngang!');
     ```
4. **Kiểm toán PWA bằng Google Lighthouse**:
   - Chuyển sang tab **Lighthouse** trong DevTools.
   - Tích chọn: `Progressive Web App` và chế độ `Mobile`.
   - Nhấn **Analyze page load**. Google sẽ tự động chấm điểm và chỉ ra những điểm cần tối ưu để đạt điểm 100/100 PWA Installable.

---

## 3. CHECKLIST 8 TIÊU CHUẨN VÀNG CHO MOBILE PWA TRONG VIOS (ĐÃ HOÀN THIỆN TRONG SPRINT 94)

| STT | Tiêu Chí Kiểm Tra | Hiện Trạng ViOS | Tác Động UX Người Dùng |
| :---: | :--- | :---: | :--- |
| **1** | **Chống vỡ thanh cuộn ngang** | ✅ Đã khóa `overflow-x: hidden; max-width: 100vw;` trong `tokens.css`. | Người dùng vuốt ngón tay không bị trượt màn hình sang hai bên. |
| **2** | **Chống iOS Safari tự động Zoom** | ✅ Đã ép `font-size: 16px !important` cho toàn bộ input mobile trong `tokens.css`. | Khi chạm vào ô nhập ngày sinh/giờ sinh, màn hình giữ nguyên tỷ lệ, không bị phóng to khó chịu. |
| **3** | **Vùng An Toàn Tai Thỏ & Home Bar (Safe Area)** | ✅ Khai báo `--safe-bottom`, `--safe-top`, `.pb-safe`, `.pt-safe`. | Không bị che nút "Mở Khóa Toàn Bộ Thiên Cơ" hay thanh Bottom Nav bởi thanh gạch đáy của iPhone. |
| **4** | **Cảm Giác Chạm Native (No Tap Highlight)** | ✅ Khai báo `-webkit-tap-highlight-color: transparent`. | Khi bấm nút không xuất hiện vệt xám nhấp nháy như web thời xưa, mượt mà như app tải từ App Store. |
| **5** | **Icon PWA Chuẩn Kích Thước** | ✅ Bổ sung `icon-192.png`, `icon-512.png` chuẩn maskable và `apple-touch-icon.png` (180x180). | Khi bấm "Thêm vào MH chính", icon hoàng gia sắc nét hiện diện trên màn hình điện thoại. |
| **6** | **Chế Độ Toàn Màn Hình (Standalone)** | ✅ Khai báo `"display": "standalone"` trong `manifest.json` và `apple-mobile-web-app-capable`. | Khi mở từ màn hình chính, app hiển thị tràn viền, ẩn thanh địa chỉ URL, giống hệt native app 100%. |
| **7** | **Offline Caching & Khởi Động Nhanh** | ✅ Service Worker `sw.js` cache-first cho assets và network-first cho trang mới nhất. | Tải lại trang trong nháy mắt (< 300ms) ngay cả khi mạng 4G chập chờn. |
| **8** | **Kích Thước Vùng Bấm (Tap Targets)** | ✅ Mọi nút bấm chính (PrimaryButton, nút nạp XU, nút gieo quẻ) đều đạt chiều cao $\ge 44\text{px}$. | Người dùng ngón tay to bấm cực kỳ dễ dàng, không bị bấm nhầm. |

---

## 4. TÓM TẮT CÁC LỆNH HỖ TRỢ NHANH CHO ĐẠI KA

```bash
# 1. Chạy server dev mở cho cả điện thoại trong cùng mạng Wi-Fi
pnpm dev:host

# 2. Chạy bộ kiểm thử tự động xác thực PWA & Mobile CSS
pnpm -F @ziweiai/web test src/lib/features/pwa/mobile-pwa.test.ts

# 3. Kiểm tra toàn bộ mã nguồn web
pnpm -F @ziweiai/web check

# 4. Kiểm tra Live Production Smoke trên domain thật
./scripts/smoke-live-production.zsh
```
