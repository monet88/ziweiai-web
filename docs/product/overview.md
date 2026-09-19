# Product Overview — ziweiai-web

> Hợp đồng sản phẩm. Sửa file này khi hành vi đổi; `spec.md` là đặc tả tổng quan,
> không thay thế product docs chi tiết.

## Sản phẩm

Web app SvelteKit cho người dùng ẩn danh hoặc đã đăng nhập: tạo và xem **lá số
Tử Vi** cùng nhiều hệ thuật số khác, lưu lịch sử theo Supabase user/session và
sinh luận giải AI theo cung/khía cạnh.

Bàn 12 cung Tử Vi còn phản ánh **lát cắt thời gian = hôm nay**: mỗi ô tự tô màu + chip
flow-info cho 4 tầng vận hạn (đại vận / lưu niên / lưu nguyệt / lưu nhật), tính server-side
qua `POST /charts/:id/horoscope` (decision `0011`). Web chỉ hiển thị, không tự tính.

Bàn 12 cung Tử Vi còn phản ánh **lát cắt thời gian = hôm nay**: mỗi ô tự tô màu + chip
flow-info cho 4 tầng vận hạn (đại vận / lưu niên / lưu nguyệt / lưu nhật), tính server-side
qua `POST /charts/:id/horoscope` (decision `0011`). Web chỉ hiển thị, không tự tính.

Là client thay thế cho app Expo/RN cũ. Backend (NestJS) + engine tính lá số nằm cùng monorepo
nhưng tách biệt: web không bao giờ chạy logic tính toán, chỉ gọi API và hiển thị.

## Người dùng

Người quan tâm tử vi/chiêm tinh. Khách mới được cấp Supabase anonymous session
để dùng ngay; người dùng email/password dùng `/sign-in` để giữ hồ sơ lâu dài.

## Ranh giới sản phẩm (in/out)

Trong phạm vi:

- Anonymous auth + đăng nhập/đăng ký client-only qua Supabase (session ở localStorage).
- Nhập thông tin sinh → tạo lá số → xem chi tiết → sinh luận giải AI.
- Lịch sử lá số của người dùng.
- Vận hạn ngày/tháng/năm, trợ lý hội thoại, các công cụ mở rộng: Tarot, MBTI,
  Hợp Hôn, Mang Phái, Face/Palm, Lenormand, Giải mộng, Xin xăm, Hoàng lịch.

Ngoài phạm vi (giai đoạn đầu):

- SSR / SEO (app sau đăng nhập, không cần).
- Tính lá số phía client (engine là server-only).
- Server-side cookie auth.
- Ví XU, ledger, VietQR/payment production.

## Route Map

| Route | Mục đích | Auth |
| --- | --- | ---: |
| `/` | dashboard + birth form + tool hub | anonymous/session |
| `/sign-in` | đăng nhập/đăng ký email/password | public |
| `/charts/[chartId]` | chi tiết lá số + vận hạn + luận giải + trợ lý | owner session |
| `/history` | danh sách lá số/luận giải đã lưu | member session |
| `/bazi`, `/meihua`, `/liuyao`, `/daliuren`, `/qimen`, `/mangpai` | form hệ lá số riêng | anonymous/session |
| `/tarot`, `/mbti`, `/hepan`, `/face`, `/palm`, `/lenormand`, `/dream`, `/stick`, `/almanac` | công cụ mở rộng | tùy tool; backend gate bằng Bearer/feature/quota |

Route đăng nhập canonical hiện tại là **`/sign-in`**. Kiến trúc route không
hardcode Tử Vi là hệ duy nhất; các hệ khác có wrapper riêng và dùng chung API
contract khi phù hợp.

## Hệ quả validation cốt lõi

Mọi màn hình phải không có chữ Hán (test quét `\p{Script=Han}` trên `build/`), và web bundle
chỉ chứa `PUBLIC_*` + `@ziweiai/contracts`. Xem `docs/product/invariants.md`.
