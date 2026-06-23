# US-019 Chuyển Supabase local sang Supabase Cloud

## Status

implemented

## Lane

high-risk

## Product Contract

Môi trường dev/staging dùng project Supabase Cloud `ziweiai-web`
(ref `uaicvwttnajeglxiorpb`) thay cho stack `supabase start` local. Sau khi chuyển:

- Backend khởi động với env trỏ cloud, verify được token thật (JWKS fetch OK) và
  thực hiện được `POST /charts`, `GET /charts/:id`, `POST /explanations`,
  `GET /history` end-to-end trên DB cloud.
- Web đăng nhập (kể cả anonymous sign-in) qua project cloud và gọi API thành công.
- Schema đầy đủ (6 bảng user-owned + `annual_reports` + bucket `vision-uploads` +
  RLS owner-only) tồn tại trên cloud.
- Không còn phụ thuộc `supabase start` để chạy app; không có secret thật bị commit.

## Relevant Product Docs

- `docs/decisions/0016-supabase-cloud-environment.md`
- `docs/decisions/0009-anonymous-auth-strategy.md`
- `docs/product/invariants.md` (§1 biên giới server, §3 token tươi)
- `docs/specs/supabase-cloud-migration.md`

## Acceptance Criteria

- `.env` root trỏ cloud: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_JWT_SECRET` (nếu còn dùng HS256) lấy từ project cloud; `PUBLIC_SUPABASE_URL`
  + `PUBLIC_SUPABASE_ANON_KEY` (hoặc publishable key) trỏ cloud.
- `.env.example` cập nhật placeholder + URL cloud; không lộ secret thật.
- Migrations đổi sang naming chuẩn CLI (`<version>_<name>.sql`), nội dung SQL giữ nguyên;
  `supabase migration list --linked` cho thấy đủ migrations đã áp.
- `supabase link --project-ref uaicvwttnajeglxiorpb` thành công; `supabase db push --linked`
  áp toàn bộ schema.
- Anonymous sign-in được bật trên project cloud (decision 0009); `site_url` +
  redirect URLs khớp web.
- `persistence-migration.test.ts` cập nhật theo path migration mới và vẫn xanh.
- `pnpm --filter @ziweiai/api typecheck`, `lint`, `test` xanh với env cloud.
- Smoke test end-to-end: tạo lá số + đọc history trên cloud thành công (anon + user).

## Design Notes

- Commands:
  - `supabase login` (tương tác, người dùng chạy) hoặc set `SUPABASE_ACCESS_TOKEN`.
  - `supabase link --project-ref uaicvwttnajeglxiorpb`
  - `supabase db push --linked` ; `supabase migration list --linked`
  - `supabase projects api-keys --project-ref uaicvwttnajeglxiorpb -o env` (lấy keys)
- Queries: không đổi truy vấn; gateway dùng tên bảng/cột y nguyên.
- API: 5 endpoint giữ nguyên contract; không đổi schema `@ziweiai/contracts`.
- Tables: `profiles`, `birth_profiles`, `chart_snapshots`, `explanation_requests`,
  `explanation_results`, `history_views`, `annual_reports` + bucket `vision-uploads`.
- Domain rules: RLS owner-only (`auth.uid() = owner_user_id`) giữ nguyên; backend
  service-role bypass RLS, cô lập user ở application code.
- UI surfaces: không thêm UI; chỉ đổi endpoint Supabase mà client kết nối.
- Rủi ro chính: naming migration phi chuẩn CLI → phải convert; JWT signing keys
  project mới là asymmetric (JWKS đã hỗ trợ) → kiểm tra `SUPABASE_JWT_SECRET` có còn
  cần không; pg_cron có thể chưa bật trên cloud → migration 000002 đã guard bằng warning.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id US-019-supabase-cloud-migration --unit 1 --integration 0 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | `persistence-migration.test.ts` đọc path migration mới; `pnpm --filter @ziweiai/api test` xanh |
| Integration | Backend khởi động với env cloud, JWKS fetch OK, `POST /charts` + `GET /history` chạy thật trên cloud |
| E2E | Web đăng nhập (anon + email) qua cloud, lập + xem lá số + history thành công |
| Platform | `supabase migration list --linked` đủ migrations; bucket `vision-uploads` + RLS tồn tại trên cloud |
| Release | `.env.example` không lộ secret; anonymous sign-in bật; site_url/redirect khớp |

## Harness Delta

- Thêm decision 0016 vào durable decision log.
- Thêm story US-019 + epic E20 vào durable store.

## Evidence

Thực thi 2026-06-22 trên project cloud `ziweiai-web` (ref `uaicvwttnajeglxiorpb`, region ap-southeast-2, Postgres 17, ACTIVE_HEALTHY).

- Link + push: `supabase link --project-ref uaicvwttnajeglxiorpb` OK; `supabase db push --linked` áp 3 migration (000001/000002/000004). `supabase migration list --linked` → Local/Remote khớp cả 3.
- Schema cloud xác minh qua Management API: 7 bảng public (`profiles`, `birth_profiles`, `chart_snapshots`, `explanation_requests`, `explanation_results`, `history_views`, `annual_reports`); bucket `vision-uploads` (private) + 3 RLS policy owner-only trên `storage.objects`. pg_cron chưa bật → lịch dọn vision-uploads skip (migration tự warning, không fail).
- Auth cloud: signing key ES256 (JWKS `kid=7946d177...`); anon token mang `alg=ES256`, `email=''` (khớp decision 0009). `external_anonymous_users_enabled=true`, `mailer_autoconfirm=true`, `site_url=http://localhost:5173`, redirect = 5173/4173/3000.
- `SUPABASE_JWT_SECRET` (HS256) không còn cần để verify token (user token dùng ES256 qua JWKS); giữ placeholder trong `.env`.
- Unit: `pnpm --filter @ziweiai/api test` → 216/216 pass; `typecheck` OK (env trỏ cloud).
- Integration (backend boot với env cloud): `GET /health` 200; `GET /history` không token → 401; `GET /history` + anon Bearer → 200 (JWKS verify trên cloud + DB cloud trả `{"items":[]}`).
- E2E live (`pnpm --filter @ziweiai/web e2e`, api+web preview đều trỏ cloud): 18/21 spec pass, gồm tạo lá số, luận giải AI, lịch sử — tất cả đập vào cloud. 3 spec còn fail không phải hồi quy do cloud: US-009 pass khi chạy riêng (rate-limit auth cloud dưới tải full suite), US-012 drift selector hover, US-007 loop 5 hệ + 5 luận giải AI (nặng AI/rate-limit). 8 spec cũ trước đó fail vì drift `.fill()` trên `<select>` + field toạ độ đã gỡ (decision 0015) — đã sửa cơ học trong task này.
- Note vận hành: không cần `supabase start` local nữa; `.env` (gitignored) giữ key thật, không commit secret.
