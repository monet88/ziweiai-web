# Spec: Chuyển Supabase local sang Supabase Cloud

Liên quan: decision `0016-supabase-cloud-environment`, story `US-019-supabase-cloud-migration`.

## Objective

Chuyển môi trường dev/staging của `ziweiai-web` từ stack `supabase start` (Docker
local) sang project Supabase Cloud `ziweiai-web` (ref `uaicvwttnajeglxiorpb`,
region Oceania/Sydney), vận hành schema bằng Supabase CLI (`link` + `db push`).

Người dùng (developer của repo) chạy app trỏ thẳng vào cloud: schema bền, chia sẻ
được giữa máy/CI, hành vi sát production (JWT asymmetric, pg_cron, storage thật).

Thành công = backend + web chạy end-to-end trên cloud (kể cả anonymous sign-in),
schema đầy đủ trên cloud, không còn phụ thuộc `supabase start`, không secret bị commit.

## Tech Stack

- Supabase CLI `2.107.0` (đã cài, `supabase.ps1` qua npm global).
- Supabase JS `^2.84.0` (backend gateway + web client) — không đổi.
- NestJS 11 backend, SvelteKit 2 web — không đổi code logic.
- Postgres 17 (khớp `major_version` trong `config.toml`).

## Commands

Tiền đề auth: Supabase CLI lưu access token trong Windows Credential Manager theo
phiên đăng nhập tương tác. Shell agent không đọc được token đó → dùng một trong hai:
đặt `SUPABASE_ACCESS_TOKEN` (Personal Access Token) cho từng lệnh, hoặc người dùng
tự chạy các lệnh cloud.

```bash
# Auth (1 trong 2)
supabase login                                  # tương tác, người dùng chạy
$env:SUPABASE_ACCESS_TOKEN = "<personal-access-token>"   # agent dùng env cho từng lệnh

# Liên kết + lấy keys
supabase link --project-ref uaicvwttnajeglxiorpb
supabase projects api-keys --project-ref uaicvwttnajeglxiorpb -o env

# Áp schema + xác minh
supabase db push --linked
supabase migration list --linked

# Validate repo (chạy ở root, env trỏ cloud)
pnpm --filter @ziweiai/api typecheck
pnpm --filter @ziweiai/api lint
pnpm --filter @ziweiai/api test
pnpm --filter @ziweiai/web build
```

## Project Structure

```text
.env                         # root, gitignored — giá trị thật trỏ cloud
.env.example                 # placeholder + URL cloud, KHÔNG secret
apps/api/supabase/
  config.toml                # cấu hình project (auth, anonymous sign-in, site_url)
  migrations/                # đổi sang naming chuẩn CLI: <version>_<name>.sql
  seed.sql                   # seed (hiện rỗng)
apps/api/src/config/env.ts   # zod schema đọc SUPABASE_URL/SERVICE_ROLE/JWT_SECRET
apps/api/src/database/supabase-persistence.gateway.ts   # service-role client
apps/api/src/modules/auth/supabase-auth.service.ts      # JWKS verify
apps/web/src/lib/supabase/supabase-client.ts            # anon client
apps/web/src/lib/env.ts                                 # PUBLIC_* validation
```

## Code Style

Giữ nguyên convention hiện tại. Migration mới (nếu cần) tạo bằng CLI, không tự đặt tên:

```bash
supabase migration new <descriptive_name>     # CLI sinh <timestamp>_<name>.sql
```

RLS theo đúng pattern repo (owner-only, kết hợp role + ownership predicate):

```sql
create policy "table_owner_select" on public.table_name
  for select to authenticated
  using ( (select auth.uid()) = owner_user_id );
```

## Testing Strategy

- Unit: Vitest (`pnpm --filter @ziweiai/api test`). Cập nhật `persistence-migration.test.ts`
  để đọc path migration mới sau khi đổi naming.
- Integration: khởi động backend với env cloud, gọi `POST /charts` + `GET /history`
  với Bearer token thật (anon + user); xác nhận JWKS fetch OK.
- E2E: web đăng nhập qua cloud (`apps/web/tests/e2e`), lập + xem lá số + history.
- Platform: `supabase migration list --linked` đủ migrations; kiểm tra bucket
  `vision-uploads` + RLS tồn tại trên cloud (qua dashboard hoặc `supabase db advisors`).

## Boundaries

- Always: giữ secret server-only ngoài `PUBLIC_*`; chạy validation trước khi báo xong;
  dùng `supabase migration new` để sinh tên migration; bật RLS trên mọi bảng public.
- Ask first: thao tác chạm cloud không thể đảo (db push lần đầu, đổi auth config trên
  dashboard, tách project prod); thêm dependency; đổi schema bảng.
- Never: commit service-role/JWT secret hay anon key thật vào file được track; đặt
  secret server dưới dạng `PUBLIC_*`; nới lỏng RLS/ownership; dùng `apply_migration`
  để iterate schema (ghi history mỗi lần gọi — xem SKILL supabase).

## Success Criteria

- `pnpm --filter @ziweiai/api test` + `typecheck` + `lint` xanh với env trỏ cloud.
- Backend khởi động, verify token thật từ cloud (JWKS OK), chạy được 5 endpoint trên DB cloud.
- Web đăng nhập (anon + email) qua cloud và gọi API thành công.
- Schema 7 bảng + bucket `vision-uploads` + RLS owner-only tồn tại trên cloud;
  `supabase migration list --linked` khớp danh sách migration repo.
- Không còn phụ thuộc `supabase start`; không có secret thật bị commit (`.env` gitignored).

## Open Questions

1. **Loại JWT signing key của project cloud**: project mới mặc định dùng asymmetric
   signing keys (ES256/RS256 qua JWKS — `SupabaseAuthService` đã hỗ trợ). Cần xác nhận
   `SUPABASE_JWT_SECRET` (HS256 shared secret) còn cần nữa không, hay chỉ giữ cho tương
   thích. → Xác minh sau khi `link` bằng `supabase projects api-keys`.
2. **anon key vs publishable key**: project mới khuyến nghị publishable key cho client.
   Quyết định dùng key nào cho `PUBLIC_SUPABASE_ANON_KEY` sau khi đọc keys thật.
3. **Cấu hình auth (anonymous, site_url, redirect)**: push qua `config.toml` hay set
   trên dashboard? Mặc định: chỉnh `config.toml` cho khớp + bật trên dashboard.
4. **pg_cron trên cloud**: migration 000002 lịch dọn vision-uploads cần pg_cron; nếu
   chưa bật, migration tự warning (không fail). Quyết định có bật pg_cron hay không.

## Plan (Phase 2)

1. Auth: người dùng `supabase login` hoặc cấp Personal Access Token.
2. `supabase link --project-ref uaicvwttnajeglxiorpb`; lấy keys qua `projects api-keys`.
3. Chuẩn hoá naming migrations sang `<version>_<name>.sql` (giữ nội dung SQL); cập nhật
   `persistence-migration.test.ts`.
4. `supabase db push --linked`; xác minh `migration list --linked`.
5. Bật anonymous sign-in + site_url/redirect trên cloud; đồng bộ `config.toml`.
6. Cập nhật `.env` (giá trị thật, gitignored) + `.env.example` (placeholder + URL cloud).
7. Đánh dấu lại `env:local-supabase` (đường local-only, không còn mặc định).
8. Chạy validation: typecheck/lint/test + smoke end-to-end (anon + user).

## Tasks (Phase 3)

- [ ] Link project + lấy keys. Verify: `supabase projects api-keys` trả URL/anon/service.
- [ ] Convert naming migrations + cập nhật test. Verify: `pnpm --filter @ziweiai/api test`.
- [ ] `db push --linked`. Verify: `supabase migration list --linked` đủ migrations.
- [ ] Bật anonymous sign-in + site_url. Verify: web anon sign-in qua cloud OK.
- [ ] Cập nhật `.env` + `.env.example`. Verify: backend khởi động, JWKS OK.
- [ ] Smoke end-to-end. Verify: `POST /charts` + `GET /history` trên cloud (anon + user).
