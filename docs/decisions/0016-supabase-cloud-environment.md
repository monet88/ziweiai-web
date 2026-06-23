# 0016 Chuyển Supabase local sang Supabase Cloud

Date: 2026-06-22

## Status

Accepted

## Context

Toàn bộ dev/test đang chạy trên stack `supabase start` (Docker local): API ở
`http://127.0.0.1:54321`, service-role/anon là JWT demo cố định, `SUPABASE_JWT_SECRET`
là chuỗi demo. Điểm chạm hiện tại:

- `.env` (root, gitignored): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_JWT_SECRET`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`.
- Backend đọc env qua zod (`apps/api/src/config/env.ts`).
- `SupabasePersistenceGateway` dùng service-role key (bypass RLS, cô lập user ở
  application code bằng `.eq('owner_user_id', ...)`).
- `SupabaseAuthService` fetch JWKS từ `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  đã hỗ trợ cả HS256 (shared secret) lẫn ES256/RS256 (asymmetric).
- Web client-only dùng anon key (`apps/web/src/lib/supabase/supabase-client.ts`).
- Migrations đặt trong `apps/api/supabase/migrations/000001..000004` theo naming
  **phi chuẩn** `*.up.sql` / `*.down.sql` + thư mục `rollbacks/`. Repo **không có**
  script áp migration nào — local schema được apply thủ công.

Vấn đề: stack local không bền (mất khi `supabase stop`/reset), không chia sẻ được
giữa máy/CI, và không phản ánh hành vi thật của project hosted (JWT signing keys,
pg_cron, storage). Cần một project Supabase Cloud làm môi trường dev/staging chung.

Project cloud đã tạo: `ziweiai-web` (ref `uaicvwttnajeglxiorpb`, region Oceania/Sydney).

## Decision

Dùng **Supabase Cloud** làm môi trường mặc định cho dev/staging, vận hành qua
**Supabase CLI** (`link` + `db push`), thay cho `supabase start`.

1. **Một project cloud dùng chung** cho dev giai đoạn này (chưa tách prod riêng).
2. **Áp schema bằng CLI forward-only.** Chuyển migrations sang naming chuẩn CLI
   (`<version>_<name>.sql`, bỏ hậu tố `.up`), giữ nguyên nội dung SQL. Các file
   `*.down.sql` / `rollbacks/` chỉ là ghi chú rollback thủ công, không phải cơ chế
   CLI. `supabase db push --linked` đẩy schema; `supabase migration list --linked`
   xác minh.
3. **Giữ nguyên kiến trúc auth.** Web dùng anon/publishable key; backend dùng
   service-role + verify JWKS. Code app gần như không đổi — chỉ env đổi giá trị.
4. **Anonymous sign-in** (decision 0009) phải bật trên project cloud; `config.toml`
   giữ là nguồn cấu hình, đồng bộ qua dashboard/CLI.
5. **Secret không bao giờ commit.** `.env` (gitignored) giữ giá trị thật; `.env.example`
   chỉ chứa placeholder + URL cloud. Service-role/JWT secret là server-only, không
   bao giờ dưới dạng `PUBLIC_*`.

## Alternatives Considered

1. **Tiếp tục `supabase start` local** — không bền, không chia sẻ, lệch hành vi
   hosted (signing keys, pg_cron, storage). Loại làm môi trường chính.
2. **Self-hosted Supabase (Docker compose riêng)** — vận hành nặng, không cần cho
   quy mô hiện tại. Loại.
3. **Áp migration thủ công bằng `psql`** giữ nguyên naming `*.up.sql` — ít đụng repo
   nhất nhưng không có migration history trên cloud, dễ drift, không tận dụng được
   `supabase db push`/`migration list`. Loại; chọn chuẩn hoá naming CLI.
4. **Tách dev/prod ngay** — chưa cần thiết ở giai đoạn này, tăng chi phí quản lý.
   Hoãn (xem Follow-Up).

## Consequences

Positive:

- Schema bền, chia sẻ được, có migration history theo dõi bằng CLI.
- Hành vi sát production (JWT asymmetric, pg_cron cho dọn vision-uploads, storage thật).
- Code app gần như không đổi → rủi ro thấp; chỉ env + naming migration thay đổi.

Tradeoffs:

- Phụ thuộc kết nối mạng tới project cloud cho dev (không còn chạy hoàn toàn offline).
- Phải quản lý secret thật trong `.env` local; tuyệt đối không commit.
- Đổi naming migration kéo theo cập nhật `persistence-migration.test.ts` (đang đọc
  path `000001_*.up.sql`).
- `script env:local-supabase` (đọc `supabase status -o env` của stack local) không
  còn là đường cấu hình chính; giữ lại cho ai vẫn muốn chạy local, đánh dấu rõ.

## Follow-Up

- US-019: thực thi link + db push + bật anonymous sign-in + cập nhật `.env`/`.env.example`
  + chuẩn hoá naming migration + xác minh end-to-end.
- Tách project prod riêng + pipeline deploy khi tiến tới release (backlog).
- Cân nhắc quản lý secret qua trình quản lý bí mật thay vì `.env` thuần khi lên prod.
