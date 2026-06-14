# Product Overview — ziweiai-web

> Hợp đồng sản phẩm. Sửa file này khi hành vi đổi, không sửa SPEC.md.

## Sản phẩm

Web app SvelteKit cho người dùng đã đăng nhập: tạo và xem **lá số Tử Vi** (và 5 hệ thuật
số khác: BaZi, Mai Hoa, Lục Hào, Đại Lục Nhâm, Kỳ Môn) kèm **luận giải AI** theo cung/khía cạnh.

Là client thay thế cho app Expo/RN cũ. Backend (NestJS) + engine tính lá số nằm cùng monorepo
nhưng tách biệt: web không bao giờ chạy logic tính toán, chỉ gọi API và hiển thị.

## Người dùng

Người quan tâm tử vi/chiêm tinh, đăng nhập qua Supabase, lưu và xem lại lá số của mình.

## Ranh giới sản phẩm (in/out)

Trong phạm vi:

- Đăng nhập/đăng ký client-only qua Supabase (session ở localStorage).
- Nhập thông tin sinh → tạo lá số → xem chi tiết → sinh luận giải AI.
- Lịch sử lá số của người dùng.

Ngoài phạm vi (giai đoạn đầu):

- SSR / SEO (app sau đăng nhập, không cần).
- Tính lá số phía client (engine là server-only).
- Server-side cookie auth.

## Route Map

| Route | Mục đích | Auth |
| --- | --- | ---: |
| `/` | redirect theo session | conditional |
| `/login` | đăng nhập/đăng ký | public |
| `/auth/callback` | xử lý Supabase auth callback | public |
| `/dashboard` | app shell chính sau đăng nhập | required |
| `/charts/[chartId]` | chi tiết lá số + luận giải | required |
| `/history` | danh sách lá số đã lưu | required |

Route đăng nhập canonical là **`/login`** (xem `docs/decisions/0006-spa-client-only-architecture.md`).
Kiến trúc route không hardcode Tử Vi là hệ duy nhất; các hệ khác (bazi, liu-hao, western...)
thêm sau mà không phá cấu trúc.

## Hệ quả validation cốt lõi

Mọi màn hình phải không có chữ Hán (test quét `\p{Script=Han}` trên `build/`), và web bundle
chỉ chứa `PUBLIC_*` + `@ziweiai/contracts`. Xem `docs/product/invariants.md`.
