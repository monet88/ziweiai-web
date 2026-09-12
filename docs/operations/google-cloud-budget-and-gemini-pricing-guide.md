# Hướng Dẫn Thiết Lập Google Cloud Budget Alert, Quota Store Upstash Redis & Phân Tích Kinh Tế Token Gemini 2026

## 1. Phân Tích Chi Phí Token Thực Tế (Gemini 2.5 Flash Model Economics)

### 1.1. Bảng Giá Google Cloud Chính Thức (Tháng 09/2026)
Theo [bảng giá chính thức của Google Gemini API](https://ai.google.dev/gemini-api/docs/pricing) cho dòng mô hình tiêu chuẩn **Gemini 2.5 Flash Standard Tier**:

| Thành phần | Đơn giá / 1M Tokens (USD) | Quy đổi VNĐ (Tỷ giá 1 USD = 25,400 VNĐ) |
| :--- | :--- | :--- |
| **Input Tokens** (Prompt đầu vào) | **$0.30** / 1,000,000 tokens | ~7.62 VNĐ / 1,000 tokens |
| **Output Tokens** (Nội dung sinh ra) | **$2.50** / 1,000,000 tokens | ~63.50 VNĐ / 1,000 tokens |

*(So với tài liệu cũ ước tính $0.075 input / $0.30 output, bảng giá chuẩn 2026 có chi phí output thực tế cao hơn, do đó việc khống chế `maxOutputTokens: 2048` và chặn trần `MAX_PROMPT_INPUT_CHARS: 16000` là cực kỳ then chốt).*

### 1.2. Tính Toán Unit Economics Trên Từng Tính Năng

Giả định tỷ giá: **1 USD = 25,400 VNĐ**.  
Gói nạp cơ bản: **10,000 VNĐ = 20 XU** $\rightarrow$ **1 XU = 500 VNĐ**.

| Tính năng | Phí XU thu của User | Doanh thu quy đổi (VNĐ) | Token Input TB | Token Output TB | Chi phí API Google (VNĐ) | Biên Lợi Nhuận Gộp (%) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vấn An / Chat Khâm Thiên Giám** | 1 XU | 500 VNĐ | 600 | 400 | ~30 VNĐ | **94.0%** |
| **Gieo Quẻ Tarot / Lenormand** | 3 XU | 1,500 VNĐ | 900 | 600 | ~45 VNĐ | **97.0%** |
| **Gieo Quẻ Kinh Dịch / Lục Hào** | 5 XU | 2,500 VNĐ | 1,200 | 800 | ~60 VNĐ | **97.6%** |
| **Xem Tướng Mặt / Chỉ Tay AI** | 10 XU | 5,000 VNĐ | 1,500 + ảnh | 1,000 | ~110 VNĐ | **97.8%** |
| **Báo Cáo Năm Toàn Diện (12 Tháng)** | 15 XU | 7,500 VNĐ | 3,500 | 2,000 | ~154 VNĐ | **97.9%** |
| **Luận Giải Tổng Hợp Tam Môn Phái** | 15 XU | 7,500 VNĐ | 4,000 | 2,048 | ~160 VNĐ | **97.8%** |

**Kết luận kinh tế**: Ngay cả với bảng giá Google Cloud cập nhật mới nhất, mô hình kinh tế XU của ViOS vẫn đảm bảo **biên lợi nhuận gộp trên 94%** ở mọi tính năng, loại bỏ hoàn toàn rủi ro lỗ chi phí API token khi người dùng nạp tiền thật.

---

## 2. Hướng Dẫn Thiết Lập Google Cloud Budget Alert Cho Gemini API Key

Để loại bỏ rủi ro tài chính khi scale hoặc khi bị tấn công đột biến lưu lượng, việc thiết lập Budget Alert trên Google Cloud Console là bắt buộc trước khi kích hoạt bán hàng thương mại.

### Bước 1: Truy cập Google Cloud Billing Console
1. Đăng nhập vào [Google Cloud Console](https://console.cloud.google.com/).
2. Chọn menu điều hướng (Navigation Menu $\equiv$) $\rightarrow$ **Billing** (Thanh toán).
3. Chọn tài khoản Billing Account đang liên kết với Project chứa Gemini API Key.

### Bước 2: Tạo Ngân Sách Mới (Create Budget)
1. Ở thanh menu bên trái, chọn mục **Budgets & alerts** (Ngân sách và cảnh báo).
2. Nhấp vào nút **Create Budget** (+ Tạo ngân sách).
3. Đặt tên ngân sách: `ViOS-Gemini-AI-Monthly-Budget`.
4. **Time range**: Chọn `Monthly` (Hàng tháng).
5. **Projects**: Chọn đúng project đang chạy API Key Gemini của ViOS (hoặc chọn `All projects`).
6. **Services**: Lọc chọn dịch vụ `Generative Language API` (hoặc `All services` để bảo vệ toàn diện).

### Bước 3: Đặt Định Mức Chi Tiêu (Amount)
1. **Budget type**: Chọn `Specified amount` (Số tiền cụ thể).
2. **Target amount**: Đặt mức ngân sách mong muốn (Khuyến nghị khởi điểm: **$30.00 USD / tháng** hoặc **$50.00 USD / tháng** cho giai đoạn beta có thu phí).

### Bước 4: Cấu Hình Ngưỡng Cảnh Báo (Set Alert Thresholds)
Thiết lập 3 mốc cảnh báo theo tỷ lệ phần trăm của ngân sách:
- **50% of budget** (Trigger khi chạm $15): Cảnh báo sớm qua Email để theo dõi tốc độ tăng trưởng người dùng.
- **90% of budget** (Trigger khi chạm $27): Cảnh báo nguy cơ chạm trần, chuẩn bị nâng định mức hoặc tối ưu hóa cache.
- **100% of budget** (Trigger khi chạm $30): Đạt trần ngân sách quy định.

### Bước 5: Kênh Nhận Thông Báo (Notifications)
1. Tích chọn **Email alerts to billing admins and users**.
2. Thêm email của Đại Ka và DevOps phụ trách.
3. *(Tùy chọn nâng cao)*: Liên kết với Cloud Monitoring hoặc Pub/Sub để tự động kích hoạt Cloud Function tắt key hoặc hạ rate limit khi vượt 100%.
4. Nhấn **Finish** (Hoàn tất).

---

## 3. Hướng Dẫn Kích Hoạt Cấu Hình Upstash Redis Quota Store

Hệ thống ViOS đã được lập trình sẵn driver `UpstashRestQuotaCounterStore` cho phép lưu trữ và kiểm soát hạn mức (Quota Rate Limit) đồng bộ trên môi trường Serverless (Vercel) nhiều instance mà không sợ mất bộ nhớ như driver `memory`.

### Bước 1: Tạo Database Trên Upstash
1. Truy cập [Upstash Console](https://console.upstash.com/) và tạo tài khoản miễn phí.
2. Chọn **Create Database** $\rightarrow$ Đặt tên `vios-quota-prod` $\rightarrow$ Chọn Region gần nhất (ví dụ: `ap-southeast-1` Singapore).
3. Sau khi tạo xong, cuộn xuống mục **REST API**.

### Bước 2: Cấu Hình Biến Môi Trường Trên Vercel & `.env.local`
Thêm các biến môi trường sau vào dự án API:

```bash
# Kích hoạt driver Upstash thay cho memory mặc định
QUOTA_STORE_DRIVER=upstash

# URL kết nối REST của Upstash
QUOTA_UPSTASH_REST_URL=https://your-upstash-instance.upstash.io

# Token xác thực REST của Upstash
QUOTA_UPSTASH_REST_TOKEN=AXxxxxxxxYourUpstashTokenxxxxxxxx

# Cơ chế xử lý khi Upstash gặp sự cố mạng (fail-closed để an toàn tài chính, fail-open cho trải nghiệm)
QUOTA_FAIL_MODE=fail-closed
```

### Bước 3: Xác Minh Vận Hành
Khi API khởi động, kiểm tra log sẽ thấy:
```text
[quotas] counter store driver=upstash
```
Mọi thao tác giới hạn lượt tạo lá số, rút quẻ, hay hỏi đáp AI của người dùng vãng lai và thành viên sẽ được lưu trữ bền vững trên Upstash Redis theo chuẩn cửa sổ thời gian (Sliding Window TTL).
